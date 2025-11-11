import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { syncFromBDS } from '../services/bds-sync.service';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.post('/refresh', authenticate, async (req: Request, res: Response) => {
  try {
    // Admin-only endpoint - you could add role check here
    await syncFromBDS();
    return sendSuccess(res, { message: 'BDS sync completed successfully' });
  } catch (error: any) {
    console.error('Sync error:', error);
    return sendError(res, 'SYNC_FAILED', 'BDS sync failed', 500);
  }
});

export default router;

