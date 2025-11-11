import { Router } from 'express';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectPermission,
  updateProjectPermission,
  deleteProjectPermission
} from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Permissions
router.post('/:id/permissions', addProjectPermission);
router.put('/:id/permissions/:pid', updateProjectPermission);
router.delete('/:id/permissions/:pid', deleteProjectPermission);

export default router;

