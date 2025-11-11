import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { checkRiderPermission } from '../services/permission.service';

const prisma = new PrismaClient();

export const listComments = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // rider id
    const riderId = parseInt(id);

    if (!id || isNaN(riderId)) {
      return sendError(res, 'INVALID_ID', 'Invalid rider ID', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        permissions: true
      }
    });

    if (!rider) {
      return sendError(res, 'RIDER_NOT_FOUND', 'Rider not found', 404);
    }

    // Check if user has permission to view comments
    const hasPermission = await checkRiderPermission(rider, req.user!.email, ['comment', 'edit']);
    
    if (!hasPermission && rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    const comments = await prisma.riderComment.findMany({
      where: { riderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return sendSuccess(res, comments);
  } catch (error: any) {
    console.error('List comments error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch comments', 500);
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // rider id
    const riderId = parseInt(id);
    const { title, content, status, positionXY } = req.body;

    if (!id || isNaN(riderId)) {
      return sendError(res, 'INVALID_ID', 'Invalid rider ID', 400);
    }

    if (!content) {
      return sendError(res, 'VALIDATION_ERROR', 'Comment content is required', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        permissions: true
      }
    });

    if (!rider) {
      return sendError(res, 'RIDER_NOT_FOUND', 'Rider not found', 404);
    }

    // Check if user has permission to comment
    const hasPermission = await checkRiderPermission(rider, req.user!.email, ['comment', 'edit']);
    
    if (!hasPermission && rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'You do not have permission to comment on this rider', 403);
    }

    const comment = await prisma.riderComment.create({
      data: {
        riderId,
        userId: req.user!.id,
        title,
        content,
        status,
        positionXY
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.userLog.create({
      data: {
        userId: req.user!.id,
        title: 'Comment Added',
        description: `Added comment on rider: ${rider.name}`
      }
    });

    return sendSuccess(res, comment, 201);
  } catch (error: any) {
    console.error('Create comment error:', error);
    return sendError(res, 'CREATE_FAILED', 'Failed to create comment', 500);
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id, cid } = req.params;
    const riderId = parseInt(id);
    const commentId = parseInt(cid);
    const { title, content, status, positionXY } = req.body;

    if (!id || isNaN(riderId) || !cid || isNaN(commentId)) {
      return sendError(res, 'INVALID_ID', 'Invalid ID', 400);
    }

    const comment = await prisma.riderComment.findUnique({
      where: { id: commentId },
      include: {
        rider: true
      }
    });

    if (!comment) {
      return sendError(res, 'COMMENT_NOT_FOUND', 'Comment not found', 404);
    }

    // Only comment author or rider owner can update
    if (comment.userId !== req.user!.id && comment.rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (positionXY !== undefined) updateData.positionXY = positionXY;

    const updated = await prisma.riderComment.update({
      where: { id: commentId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('Update comment error:', error);
    return sendError(res, 'UPDATE_FAILED', 'Failed to update comment', 500);
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id, cid } = req.params;
    const riderId = parseInt(id);
    const commentId = parseInt(cid);

    if (!id || isNaN(riderId) || !cid || isNaN(commentId)) {
      return sendError(res, 'INVALID_ID', 'Invalid ID', 400);
    }

    const comment = await prisma.riderComment.findUnique({
      where: { id: commentId },
      include: {
        rider: true
      }
    });

    if (!comment) {
      return sendError(res, 'COMMENT_NOT_FOUND', 'Comment not found', 404);
    }

    // Only comment author or rider owner can delete
    if (comment.userId !== req.user!.id && comment.rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    await prisma.riderComment.delete({
      where: { id: commentId }
    });

    return sendSuccess(res, { message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return sendError(res, 'DELETE_FAILED', 'Failed to delete comment', 500);
  }
};

