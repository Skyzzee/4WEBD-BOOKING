import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../business/config/appError';
import { Role } from '../../business/types/enums/role';

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