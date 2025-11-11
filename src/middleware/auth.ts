import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sendError } from '../utils/response';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    subscription?: any;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'UNAUTHORIZED', 'No token provided', 401);
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
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

    if (!user || user.status !== 'active') {
      return sendError(res, 'UNAUTHORIZED', 'User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: user.subscriptions[0] || null
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'UNAUTHORIZED', 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'UNAUTHORIZED', 'Token expired', 401);
    }
    return sendError(res, 'UNAUTHORIZED', 'Authentication failed', 401);
  }
};

export const requireSubscription = (abilities: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.subscription) {
      return sendError(res, 'SUBSCRIPTION_REQUIRED', 'Active subscription required', 403);
    }

    const userAbilities = req.user.subscription.subscriptionType.abilities as string[];
    const hasAbility = abilities.some(ability => userAbilities.includes(ability));

    if (!hasAbility) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    next();
  };
};

