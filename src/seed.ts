import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    // Create subscription types
    console.log('Creating subscription types...');

    const freeType = await prisma.subscriptionType.upsert({
      where: { name: 'free' },
      update: {},
      create: {
        name: 'free',
        abilities: ['rider_view', 'rider_comment'],
        maxRidersAllowed: 1
      }
    });
    console.log('✓ Free subscription type created');

    const basicType = await prisma.subscriptionType.upsert({
      where: { name: 'basic' },
      update: {},
      create: {
        name: 'basic',
        abilities: ['rider_view', 'rider_comment', 'rider_edit', 'project_create'],
        maxRidersAllowed: 10,
        stripeProductId: process.env.STRIPE_BASIC_PRODUCT_ID || null,
        stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || null
      }
    });
    console.log('✓ Basic subscription type created');

    const proType = await prisma.subscriptionType.upsert({
      where: { name: 'pro' },
      update: {},
      create: {
        name: 'pro',
        abilities: ['rider_view', 'rider_comment', 'rider_edit', 'project_create', 'export_pdf', 'collaboration'],
        maxRidersAllowed: 50,
        stripeProductId: process.env.STRIPE_PRO_PRODUCT_ID || null,
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null
      }
    });
    console.log('✓ Pro subscription type created');

    const enterpriseType = await prisma.subscriptionType.upsert({
      where: { name: 'enterprise' },
      update: {},
      create: {
        name: 'enterprise',
        abilities: ['rider_view', 'rider_comment', 'rider_edit', 'project_create', 'export_pdf', 'collaboration', 'priority_support'],
        maxRidersAllowed: 0, // Unlimited
        stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID || null,
        stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null
      }
    });
    console.log('✓ Enterprise subscription type created');

    // Create default admin user
    console.log('\nCreating default admin user...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cfs.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          passwordHash,
          status: 'active',
          contactPhone: null
        }
      });

      // Assign pro subscription to admin
      await prisma.subscription.create({
        data: {
          userId: admin.id,
          subscriptionTypeId: proType.id,
          status: 'active'
        }
      });

      console.log(`✓ Admin user created (${adminEmail})`);
      console.log(`  Password: ${adminPassword}`);
    } else {
      console.log(`✓ Admin user already exists (${adminEmail})`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDefault credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\nSubscription types created:');
    console.log(`- Free (1 rider)`);
    console.log(`- Basic (10 riders)`);
    console.log(`- Pro (50 riders)`);
    console.log(`- Enterprise (unlimited riders)`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

