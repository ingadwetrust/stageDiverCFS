import { Router } from 'express';
import {
  listSubscriptionTypes,
  getMySubscription,
  createCheckout,
  listTransactions,
  getTransaction
} from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/types', listSubscriptionTypes);

router.use(authenticate);

router.get('/my-subscription', getMySubscription);
router.post('/checkout', createCheckout);
router.get('/transactions', listTransactions);
router.get('/transactions/:id', getTransaction);

export default router;

