import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser, AppRole } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as Partial<AuthenticatedUser>;
    return payload as AuthenticatedUser;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

export function requireRole(roles: AppRole | AppRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const allowed = Array.isArray(roles) ? roles : [roles];
    const hasAccess = allowed.includes(req.user.role);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: allowed,
        current: req.user.role,
      });
      return;
    }

    next();
  };
}

export function asyncHandler(fn: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}
