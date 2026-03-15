import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../../business/config/appError';

export const roleMiddleware = (...roles: Role[]) => {
    return (_req: Request, res: Response, next: NextFunction) => {
        const user = res.locals.user;

        if (!user) {
            return next(new AppError("Accès non autorisé.", 401));
        }

        if (!roles.includes(user.role)) {
            return next(new AppError("Vous n'avez pas les droits nécessaires.", 403));
        }

        next();
    };
};