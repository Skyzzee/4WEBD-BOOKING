import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../business/config/appError';

export const errorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(`Unhandled error:`, error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
};