import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomRequest, AuthPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const generateToken = (payload: AuthPayload, expiresIn = '24h'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 401,
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 401,
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 401,
    });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        code: 401,
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 403,
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin', 'system');
export const requireSupervisor = requireRole('admin', 'system', 'supervisor');
