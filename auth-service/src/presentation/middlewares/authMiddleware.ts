import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../business/config/tokenJwt";
import { AppError } from "../../business/config/appError";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Accès non autorisé. Token manquant.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    res.locals.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};
