import { Request, Response, NextFunction } from "express";
import { LogLevel } from "@prisma/client";
import { AppError } from "../../business/config/appError";
import { createLog } from "../../business/loggerService";
import { ServiceName } from "../../business/types/enums/serviceName";

export const errorMiddleware = async (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  const userId =
    typeof res.locals.user?.id === "string" ? res.locals.user.id : undefined;

  const requestContext = `${req.method} ${req.originalUrl}`;

  try {
    if (error instanceof AppError) {
      await createLog({
        level: error.statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN,
        serviceName: ServiceName.LOGGER_SERVICE,
        message: `AppError ${error.statusCode} on ${requestContext}: ${error.message}`,
        userId,
      });

      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown internal error";

    await createLog({
      level: LogLevel.ERROR,
      serviceName: ServiceName.LOGGER_SERVICE,
      message: `Unhandled error on ${requestContext}: ${errorMessage}`,
      userId,
    });

    res.status(500).json({ message: "Erreur interne du serveur." });
    return;
  } catch (loggingError) {
    console.error(
      "[LOGGER_SERVICE] Failed to persist error log.",
      loggingError,
    );
    console.error("[LOGGER_SERVICE] Original error:", error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: "Erreur interne du serveur." });
    return;
  }
};
