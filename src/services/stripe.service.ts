import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const prisma = new PrismaClient();

export const createCheckoutSession = async (
  customerEmail: string,
  priceId: string,
  userId: number,
  subscriptionTypeId: number
) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3001'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3001'}/cancel`,
      metadata: {
        userId: userId.toString(),
        subscriptionTypeId: subscriptionTypeId.toString()
      }
    });

    // Create pending transaction
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { subscriptionDate: 'desc' }
    });

    if (subscription) {
      await prisma.transaction.create({
        data: {
          subscriptionId: subscription.id,
          status: 'pending',
          amount: 0, // Will be updated by webhook
          transactionCode: session.id
        }
      });
    }

    return session;
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }
};

export const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  try {
    const userId = parseInt(session.metadata?.userId || '0');
    const subscriptionTypeId = parseInt(session.metadata?.subscriptionTypeId || '0');

    if (!userId || !subscriptionTypeId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // Get or create customer ID
    const customerId = session.customer as string;

    // Deactivate old subscriptions
    await prisma.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'expired' }
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        subscriptionTypeId,
        status: 'active',
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: customerId
      }
    });

    // Update transaction to paid
    const transaction = await prisma.transaction.findFirst({
      where: {
        transactionCode: session.id,
        status: 'pending'
      }
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'paid',
          amount: (session.amount_total || 0) / 100,
          invoice: session.invoice as string || null
        }
      });
    } else {
      // Create new transaction
      await prisma.transaction.create({
        data: {
          subscriptionId: subscription.id,
          status: 'paid',
          amount: (session.amount_total || 0) / 100,
          transactionCode: session.id,
          invoice: session.invoice as string || null
        }
      });
    }

    // Log activity
    await prisma.userLog.create({
      data: {
        userId,
        title: 'Subscription Activated',
        description: 'New subscription activated successfully'
      }
    });

    console.log(`Subscription created for user ${userId}`);
  } catch (error: any) {
    console.error('Error handling checkout completed:', error);
  }
};

export const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  try {
    const subscriptionId = invoice.subscription as string;
    
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (!subscription) {
      console.error('Subscription not found for invoice');
      return;
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        subscriptionId: subscription.id,
        status: 'paid',
        amount: (invoice.amount_paid || 0) / 100,
        transactionCode: invoice.payment_intent as string,
        invoice: invoice.hosted_invoice_url || null
      }
    });

    // Ensure subscription is active
    if (subscription.status !== 'active') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'active' }
      });
    }

    console.log(`Payment recorded for subscription ${subscription.id}`);
  } catch (error: any) {
    console.error('Error handling invoice payment:', error);
  }
};

export const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  try {
    const subscriptionId = invoice.subscription as string;
    
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (!subscription) {
      console.error('Subscription not found for failed invoice');
      return;
    }

    // Create failed transaction record
    await prisma.transaction.create({
      data: {
        subscriptionId: subscription.id,
        status: 'failed',
        amount: (invoice.amount_due || 0) / 100,
        transactionCode: invoice.payment_intent as string || 'failed',
        invoice: invoice.hosted_invoice_url || null
      }
    });

    // Suspend subscription after failed payment
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'paused' }
    });

    // Log activity
    await prisma.userLog.create({
      data: {
        userId: subscription.userId,
        title: 'Payment Failed',
        description: 'Subscription payment failed - subscription paused'
      }
    });

    console.log(`Payment failed for subscription ${subscription.id}`);
  } catch (error: any) {
    console.error('Error handling invoice payment failure:', error);
  }
};

export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
};

