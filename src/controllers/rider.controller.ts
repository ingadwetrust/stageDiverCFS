import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { checkRiderPermission } from '../services/permission.service';

const prisma = new PrismaClient();

export const listRiders = async (req: AuthRequest, res: Response) => {
  try {
    const { project_id } = req.query;
    
    const where: any = {
      ownerId: req.user!.id
    };

    if (project_id) {
      where.projectId = parseInt(project_id as string);
    }

    const riders = await prisma.rider.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        permissions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, riders);
  } catch (error: any) {
    console.error('List riders error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch riders', 500);
  }
};

export const getRider = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = parseInt(id);

    if (!id || isNaN(riderId)) {
      return sendError(res, 'INVALID_ID', 'Invalid rider ID', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        project: true,
        permissions: true,
        comments: {
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
        }
      }
    });

    if (!rider) {
      return sendError(res, 'RIDER_NOT_FOUND', 'Rider not found', 404);
    }

    // Check if user has permission to view
    const hasPermission = await checkRiderPermission(rider, req.user!.email, ['comment', 'edit']);
    
    if (!hasPermission && rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    return sendSuccess(res, rider);
  } catch (error: any) {
    console.error('Get rider error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch rider', 500);
  }
};

export const createRider = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, data, projectId } = req.body;

    if (!name) {
      return sendError(res, 'VALIDATION_ERROR', 'Rider name is required', 400);
    }

    // Check subscription limit
    const subscription = req.user!.subscription;
    if (!subscription) {
      return sendError(res, 'SUBSCRIPTION_REQUIRED', 'Active subscription required', 403);
    }

    const maxRiders = subscription.subscriptionType.maxRidersAllowed;
    
    if (maxRiders !== 0) {
      const riderCount = await prisma.rider.count({
        where: { ownerId: req.user!.id }
      });

      if (riderCount >= maxRiders) {
        return sendError(
          res,
          'RIDER_LIMIT_EXCEEDED',
          `Rider limit exceeded. Your plan allows ${maxRiders} rider(s).`,
          403
        );
      }
    }

    // If projectId provided, verify ownership
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project || project.userId !== req.user!.id) {
        return sendError(res, 'INVALID_PROJECT', 'Invalid project or access denied', 400);
      }
    }

    const rider = await prisma.rider.create({
      data: {
        name,
        description,
        data,
        ownerId: req.user!.id,
        projectId: projectId || null
      },
      include: {
        project: true,
        permissions: true
      }
    });

    // Log activity
    await prisma.userLog.create({
      data: {
        userId: req.user!.id,
        title: 'Rider Created',
        description: `Created rider: ${name}`
      }
    });

    return sendSuccess(res, rider, 201);
  } catch (error: any) {
    console.error('Create rider error:', error);
    return sendError(res, 'CREATE_FAILED', 'Failed to create rider', 500);
  }
};

export const updateRider = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = parseInt(id);
    const { name, description, data, projectId } = req.body;

    if (!id || isNaN(riderId)) {
      return sendError(res, 'INVALID_ID', 'Invalid rider ID', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        project: true,
        permissions: true
      }
    });

    if (!rider) {
      return sendError(res, 'RIDER_NOT_FOUND', 'Rider not found', 404);
    }

    // Check if user has edit permission
    const hasPermission = await checkRiderPermission(rider, req.user!.email, ['edit']);
    
    if (!hasPermission && rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (data !== undefined) updateData.data = data;
    if (projectId !== undefined) {
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        });
        if (!project || project.userId !== req.user!.id) {
          return sendError(res, 'INVALID_PROJECT', 'Invalid project or access denied', 400);
        }
      }
      updateData.projectId = projectId;
    }

    const updated = await prisma.rider.update({
      where: { id: riderId },
      data: updateData,
      include: {
        project: true,
        permissions: true
      }
    });

    // Log activity
    await prisma.userLog.create({
      data: {
        userId: req.user!.id,
        title: 'Rider Updated',
        description: `Updated rider: ${updated.name}`
      }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('Update rider error:', error);
    return sendError(res, 'UPDATE_FAILED', 'Failed to update rider', 500);
  }
};

export const deleteRider = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = parseInt(id);

    if (!id || isNaN(riderId)) {
      return sendError(res, 'INVALID_ID', 'Invalid rider ID', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return sendError(res, 'RIDER_NOT_FOUND', 'Rider not found', 404);
    }

    if (rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Only owner can delete rider', 403);
    }

    await prisma.rider.delete({
      where: { id: riderId }
    });

    // Log activity
    await prisma.userLog.create({
      data: {
        userId: req.user!.id,
        title: 'Rider Deleted',
        description: `Deleted rider: ${rider.name}`
      }
    });

    return sendSuccess(res, { message: 'Rider deleted successfully' });
  } catch (error: any) {
    console.error('Delete rider error:', error);
    return sendError(res, 'DELETE_FAILED', 'Failed to delete rider', 500);
  }
};

// Rider Permissions
export const addRiderPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = parseInt(id);
    const { email, permission } = req.body;

    if (!id || isNaN(riderId)) {
      return sendError(res, 'INVALID_ID', 'Invalid rider ID', 400);
    }

    if (!email || !permission) {
      return sendError(res, 'VALIDATION_ERROR', 'Email and permission are required', 400);
    }

    if (!['comment', 'edit'].includes(permission)) {
      return sendError(res, 'INVALID_PERMISSION', 'Permission must be comment or edit', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return sendError(res, 'RIDER_NOT_FOUND', 'Rider not found', 404);
    }

    if (rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Only owner can manage permissions', 403);
    }

    const riderPermission = await prisma.riderPermission.create({
      data: {
        riderId,
        email,
        permission
      }
    });

    return sendSuccess(res, riderPermission, 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return sendError(res, 'PERMISSION_EXISTS', 'Permission already exists for this email', 400);
    }
    console.error('Add rider permission error:', error);
    return sendError(res, 'CREATE_FAILED', 'Failed to add permission', 500);
  }
};

export const updateRiderPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { id, pid } = req.params;
    const riderId = parseInt(id);
    const permissionId = parseInt(pid);
    const { permission } = req.body;

    if (!id || isNaN(riderId) || !pid || isNaN(permissionId)) {
      return sendError(res, 'INVALID_ID', 'Invalid ID', 400);
    }

    if (!['comment', 'edit'].includes(permission)) {
      return sendError(res, 'INVALID_PERMISSION', 'Permission must be comment or edit', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return sendError(res, 'RIDER_NOT_FOUND', 'Rider not found', 404);
    }

    if (rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Only owner can manage permissions', 403);
    }

    const updated = await prisma.riderPermission.update({
      where: { id: permissionId },
      data: { permission }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('Update rider permission error:', error);
    return sendError(res, 'UPDATE_FAILED', 'Failed to update permission', 500);
  }
};

export const deleteRiderPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { id, pid } = req.params;
    const riderId = parseInt(id);
    const permissionId = parseInt(pid);

    if (!id || isNaN(riderId) || !pid || isNaN(permissionId)) {
      return sendError(res, 'INVALID_ID', 'Invalid ID', 400);
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return sendError(res, 'RIDER_NOT_FOUND', 'Rider not found', 404);
    }

    if (rider.ownerId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Only owner can manage permissions', 403);
    }

    await prisma.riderPermission.delete({
      where: { id: permissionId }
    });

    return sendSuccess(res, { message: 'Permission deleted successfully' });
  } catch (error: any) {
    console.error('Delete rider permission error:', error);
    return sendError(res, 'DELETE_FAILED', 'Failed to delete permission', 500);
  }
};

