import { prisma } from "../data/prismaClient";
import { AppError } from "./config/appError";
import { CreateLogDto } from "./types/createLogDto";
import { LogFilters } from "./types/logFiltersDto";

const buildFilters = (filters: LogFilters, extra?: object) => ({
  ...extra,
  ...(filters.level && { level: filters.level }),
  ...((filters.from || filters.to) && {
    createdAt: {
      ...(filters.from && { gte: filters.from }),
      ...(filters.to && { lte: filters.to }),
    },
  }),
});

export const createLog = async (dto: CreateLogDto) => {
  return await prisma.log.create({
    data: {
      level: dto.level,
      serviceName: dto.serviceName,
      message: dto.message,
      userId: dto.userId,
    },
  });
};

export const getLogs = async (filters: LogFilters) => {
  return await prisma.log.findMany({
    where: buildFilters(filters),
    orderBy: { createdAt: "desc" },
  });
};

export const getLogById = async (id: string) => {
  const log = await prisma.log.findUnique({ where: { id } });
  if (!log) throw new AppError("Log non trouvé.", 404);
  return log;
};

export const getLogsByUserId = async (userId: string, filters: LogFilters) => {
  return await prisma.log.findMany({
    where: buildFilters(filters, { userId }),
    orderBy: { createdAt: "desc" },
  });
};

export const getLogsByServiceName = async (
  serviceName: string,
  filters: LogFilters,
) => {
  return await prisma.log.findMany({
    where: buildFilters(filters, { serviceName }),
    orderBy: { createdAt: "desc" },
  });
};
