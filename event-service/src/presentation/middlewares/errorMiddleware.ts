import { Request, Response, NextFunction } from "express";
import { AppError } from "../../business/config/appError";
import { logger } from "../../business/utils/logger";

export const errorMiddleware = async (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId =
    typeof res.locals.user?.id === "string" ? res.locals.user.id : undefined;

  const requestContext = `${req.method} ${req.originalUrl}`;

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      await logger.error(
        `AppError ${error.statusCode} on ${requestContext}: ${error.message}`,
        { userId },
      );
    } else {
      await logger.warn(
        `AppError ${error.statusCode} on ${requestContext}: ${error.message}`,
        { userId },
      );
    }

    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  const errorMessage =
    error instanceof Error ? error.message : "Unknown internal error";

  await logger.error(`Unhandled error on ${requestContext}: ${errorMessage}`, {
    userId,
  });

  res.status(500).json({ message: "Erreur interne du serveur." });
  return;
};
