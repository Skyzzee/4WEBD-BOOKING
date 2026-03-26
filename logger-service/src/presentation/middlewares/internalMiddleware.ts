import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../business/config/appError';

// Middleware pour sécuriser les routes internes et donc permet de s'assurer qu'elles 
// ne peuvent être appelées directement par les utilisateurs
export const internalMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    const apiKey = req.headers['internal-api-key'];

    if (apiKey !== process.env.INTERNAL_API_KEY) {
        return next(new AppError("Accès non autorisé.", 401));
    }

    next();
};