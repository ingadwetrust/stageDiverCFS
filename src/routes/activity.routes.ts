import { Router } from 'express';
import {
  listActivities,
  listFavorites,
  createFavorite,
  deleteFavorite
} from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/activities', listActivities);
router.get('/favorites', listFavorites);
router.post('/favorites', createFavorite);
router.delete('/favorites/:id', deleteFavorite);

export default router;

