import { Router } from 'express';
import {
  listComments,
  createComment,
  updateComment,
  deleteComment
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/:id/comments', listComments);
router.post('/:id/comments', createComment);
router.put('/:id/comments/:cid', updateComment);
router.delete('/:id/comments/:cid', deleteComment);

export default router;

