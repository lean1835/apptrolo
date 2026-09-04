import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/environment';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';
import UserModel from '@modules/auth/auth.model';

declare global {
  namespace Express {
    interface Request {
      users?: any;
    }
  }
}


interface CachedUserSession {
  user: any;
  cachedAt: number;
}

const userSessionCache = new Map<string, CachedUserSession>();
const CACHE_TTL_MS = 60 * 1000; // 60 giây

export const clearUserCache = (phone?: string) => {
  if (phone) {
    userSessionCache.delete(phone);
  } else {
    userSessionCache.clear();
  }
};

export const authenticationMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Không có quyền truy cập, vui lòng đăng nhập');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const phone = decoded.sub || decoded.phone;
      
      if (!phone) {
        throw new ApiError(401, 'Phiên đăng nhập không hợp lệ');
      }

      const now = Date.now();
      const cached = userSessionCache.get(phone);
      let user: any = null;

      if (cached && (now - cached.cachedAt < CACHE_TTL_MS)) {
        user = cached.user;
      } else {
        user = await UserModel.findOne({ phone })
          .populate({ path: 'lodge', select: '_id name' })
          .lean();
        
        if (!user) {
          throw new ApiError(401, 'Tài khoản không tồn tại trong hệ thống');
        }

        userSessionCache.set(phone, { user, cachedAt: now });
      }

      // Attach user to request object
      req.users = user;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(new ApiError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'));
      }
      return next(new ApiError(401, 'Token xác thực không hợp lệ'));
    }
  }
);
