import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const listActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    const limitNum = parseInt(limit as string);

    const activities = await prisma.userLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { date: 'desc' },
      take: limitNum > 100 ? 100 : limitNum
    });

    return sendSuccess(res, activities);
  } catch (error: any) {
    console.error('List activities error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch activities', 500);
  }
};

export const listFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await prisma.favoriteItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { id: 'desc' }
    });

    return sendSuccess(res, favorites);
  } catch (error: any) {
    console.error('List favorites error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch favorites', 500);
  }
};

export const createFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { name, data } = req.body;

    if (!name || !data) {
      return sendError(res, 'VALIDATION_ERROR', 'Name and data are required', 400);
    }

    const favorite = await prisma.favoriteItem.create({
      data: {
        userId: req.user!.id,
        name,
        data
      }
    });

    return sendSuccess(res, favorite, 201);
  } catch (error: any) {
    console.error('Create favorite error:', error);
    return sendError(res, 'CREATE_FAILED', 'Failed to create favorite', 500);
  }
};

export const deleteFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const favoriteId = parseInt(id);

    if (!id || isNaN(favoriteId)) {
      return sendError(res, 'INVALID_ID', 'Invalid favorite ID', 400);
    }

    const favorite = await prisma.favoriteItem.findUnique({
      where: { id: favoriteId }
    });

    if (!favorite) {
      return sendError(res, 'NOT_FOUND', 'Favorite not found', 404);
    }

    if (favorite.userId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    await prisma.favoriteItem.delete({
      where: { id: favoriteId }
    });

    return sendSuccess(res, { message: 'Favorite deleted successfully' });
  } catch (error: any) {
    console.error('Delete favorite error:', error);
    return sendError(res, 'DELETE_FAILED', 'Failed to delete favorite', 500);
  }
};

