import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { createCheckoutSession } from '../services/stripe.service';

const prisma = new PrismaClient();

export const listSubscriptionTypes = async (req: AuthRequest, res: Response) => {
  try {
    const types = await prisma.subscriptionType.findMany({
      select: {
        id: true,
        name: true,
        abilities: true,
        maxRidersAllowed: true,
        stripePriceId: true
      }
    });

    return sendSuccess(res, types);
  } catch (error: any) {
    console.error('List subscription types error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch subscription types', 500);
  }
};

export const getMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user!.id,
        status: 'active'
      },
      include: {
        subscriptionType: true
      },
      orderBy: {
        subscriptionDate: 'desc'
      }
    });

    if (!subscription) {
      return sendError(res, 'NO_SUBSCRIPTION', 'No active subscription found', 404);
    }

    return sendSuccess(res, subscription);
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch subscription', 500);
  }
};

export const createCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { subscriptionTypeId } = req.body;

    if (!subscriptionTypeId) {
      return sendError(res, 'VALIDATION_ERROR', 'Subscription type ID is required', 400);
    }

    const subscriptionType = await prisma.subscriptionType.findUnique({
      where: { id: subscriptionTypeId }
    });

    if (!subscriptionType) {
      return sendError(res, 'NOT_FOUND', 'Subscription type not found', 404);
    }

    if (!subscriptionType.stripePriceId) {
      return sendError(res, 'STRIPE_ERROR', 'This subscription type is not available for purchase', 400);
    }

    const session = await createCheckoutSession(
      req.user!.email,
      subscriptionType.stripePriceId,
      req.user!.id,
      subscriptionTypeId
    );

    return sendSuccess(res, { sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return sendError(res, 'CHECKOUT_FAILED', error.message || 'Failed to create checkout session', 500);
  }
};

export const listTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        subscription: {
          userId: req.user!.id
        }
      },
      include: {
        subscription: {
          include: {
            subscriptionType: true
          }
        }
      },
      orderBy: {
        transactionDate: 'desc'
      }
    });

    return sendSuccess(res, transactions);
  } catch (error: any) {
    console.error('List transactions error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch transactions', 500);
  }
};

export const getTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transactionId = parseInt(id);

    if (!id || isNaN(transactionId)) {
      return sendError(res, 'INVALID_ID', 'Invalid transaction ID', 400);
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        subscription: {
          include: {
            subscriptionType: true
          }
        }
      }
    });

    if (!transaction) {
      return sendError(res, 'NOT_FOUND', 'Transaction not found', 404);
    }

    // Verify transaction belongs to user
    if (transaction.subscription.userId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    return sendSuccess(res, transaction);
  } catch (error: any) {
    console.error('Get transaction error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch transaction', 500);
  }
};

