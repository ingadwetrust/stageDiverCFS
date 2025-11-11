import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, contactPhone } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'VALIDATION_ERROR', 'Name, email, and password are required', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'USER_EXISTS', 'User with this email already exists', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        contactPhone: contactPhone || null,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        contactPhone: true,
        status: true,
        createdAt: true
      }
    });

    // Assign free subscription by default
    const freeSubscription = await prisma.subscriptionType.findFirst({
      where: { name: 'free' }
    });

    if (freeSubscription) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          subscriptionTypeId: freeSubscription.id,
          status: 'active'
        }
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { token }
    });

    return sendSuccess(res, { token, user }, 201);
  } catch (error: any) {
    console.error('Registration error:', error);
    return sendError(res, 'REGISTRATION_FAILED', 'Registration failed', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'VALIDATION_ERROR', 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: { status: 'active' },
          include: {
            subscriptionType: true
          },
          orderBy: { subscriptionDate: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      return sendError(res, 'ACCOUNT_SUSPENDED', 'Account is suspended or deleted', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { token }
    });

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      contactPhone: user.contactPhone,
      status: user.status,
      subscription: user.subscriptions[0] || null
    };

    return sendSuccess(res, { token, user: userData });
  } catch (error: any) {
    console.error('Login error:', error);
    return sendError(res, 'LOGIN_FAILED', 'Login failed', 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        contactPhone: true,
        status: true,
        createdAt: true,
        subscriptions: {
          where: { status: 'active' },
          include: {
            subscriptionType: true
          },
          orderBy: { subscriptionDate: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    return sendSuccess(res, {
      ...user,
      subscription: user.subscriptions[0] || null
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    return sendError(res, 'FETCH_FAILED', 'Failed to fetch user data', 500);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { token: null }
    });

    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return sendError(res, 'LOGOUT_FAILED', 'Logout failed', 500);
  }
};

