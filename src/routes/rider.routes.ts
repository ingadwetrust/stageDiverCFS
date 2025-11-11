import { Router } from 'express';
import {
  listRiders,
  getRider,
  createRider,
  updateRider,
  deleteRider,
  addRiderPermission,
  updateRiderPermission,
  deleteRiderPermission
} from '../controllers/rider.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listRiders);
router.get('/:id', getRider);
router.post('/', createRider);
router.put('/:id', updateRider);
router.delete('/:id', deleteRider);

// Permissions
router.post('/:id/permissions', addRiderPermission);
router.put('/:id/permissions/:pid', updateRiderPermission);
router.delete('/:id/permissions/:pid', deleteRiderPermission);

export default router;

