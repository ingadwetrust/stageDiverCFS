import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const listProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      include: {
        permissions: true,
        riders: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, projects);
  } catch (error: any) {
    console.error('List projects error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch projects', 500);
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    if (!id || isNaN(projectId)) {
      return sendError(res, 'INVALID_ID', 'Invalid project ID', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        permissions: true,
        riders: true
      }
    });

    if (!project) {
      return sendError(res, 'PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.userId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    return sendSuccess(res, project);
  } catch (error: any) {
    console.error('Get project error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch project', 500);
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return sendError(res, 'VALIDATION_ERROR', 'Project name is required', 400);
    }

    const project = await prisma.project.create({
      data: {
        name,
        userId: req.user!.id
      },
      include: {
        permissions: true
      }
    });

    return sendSuccess(res, project, 201);
  } catch (error: any) {
    console.error('Create project error:', error);
    return sendError(res, 'CREATE_FAILED', 'Failed to create project', 500);
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);
    const { name } = req.body;

    if (!id || isNaN(projectId)) {
      return sendError(res, 'INVALID_ID', 'Invalid project ID', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return sendError(res, 'PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.userId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { name },
      include: {
        permissions: true
      }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('Update project error:', error);
    return sendError(res, 'UPDATE_FAILED', 'Failed to update project', 500);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    if (!id || isNaN(projectId)) {
      return sendError(res, 'INVALID_ID', 'Invalid project ID', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return sendError(res, 'PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.userId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    return sendSuccess(res, { message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return sendError(res, 'DELETE_FAILED', 'Failed to delete project', 500);
  }
};

// Project Permissions
export const addProjectPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);
    const { email, permission } = req.body;

    if (!id || isNaN(projectId)) {
      return sendError(res, 'INVALID_ID', 'Invalid project ID', 400);
    }

    if (!email || !permission) {
      return sendError(res, 'VALIDATION_ERROR', 'Email and permission are required', 400);
    }

    if (!['read', 'comment', 'edit'].includes(permission)) {
      return sendError(res, 'INVALID_PERMISSION', 'Permission must be read, comment, or edit', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return sendError(res, 'PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.userId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    const projectPermission = await prisma.projectPermission.create({
      data: {
        projectId,
        email,
        permission
      }
    });

    return sendSuccess(res, projectPermission, 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return sendError(res, 'PERMISSION_EXISTS', 'Permission already exists for this email', 400);
    }
    console.error('Add project permission error:', error);
    return sendError(res, 'CREATE_FAILED', 'Failed to add permission', 500);
  }
};

export const updateProjectPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { id, pid } = req.params;
    const projectId = parseInt(id);
    const permissionId = parseInt(pid);
    const { permission } = req.body;

    if (!id || isNaN(projectId) || !pid || isNaN(permissionId)) {
      return sendError(res, 'INVALID_ID', 'Invalid ID', 400);
    }

    if (!['read', 'comment', 'edit'].includes(permission)) {
      return sendError(res, 'INVALID_PERMISSION', 'Permission must be read, comment, or edit', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return sendError(res, 'PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.userId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    const updated = await prisma.projectPermission.update({
      where: { id: permissionId },
      data: { permission }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('Update project permission error:', error);
    return sendError(res, 'UPDATE_FAILED', 'Failed to update permission', 500);
  }
};

export const deleteProjectPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { id, pid } = req.params;
    const projectId = parseInt(id);
    const permissionId = parseInt(pid);

    if (!id || isNaN(projectId) || !pid || isNaN(permissionId)) {
      return sendError(res, 'INVALID_ID', 'Invalid ID', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return sendError(res, 'PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.userId !== req.user!.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    await prisma.projectPermission.delete({
      where: { id: permissionId }
    });

    return sendSuccess(res, { message: 'Permission deleted successfully' });
  } catch (error: any) {
    console.error('Delete project permission error:', error);
    return sendError(res, 'DELETE_FAILED', 'Failed to delete permission', 500);
  }
};

