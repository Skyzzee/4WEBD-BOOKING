import { prisma } from "../data/prismaClient";
import { AppError } from "./config/appError";
import { CreateUserDto } from "./types/createUserDto";
import { UpdateUserDto } from "./types/updateUserDto";
import { logger } from "./utils/logger";

export const createUser = async (dto: CreateUserDto) => {
  const existing = await prisma.user.findUnique({
    where: { authId: dto.authId },
  });

  if (existing) {
    throw new AppError("Un profil existe déjà pour cet utilisateur.", 409);
  }

  const user = await prisma.user.create({
    data: {
      authId: dto.authId,
      firstName: dto.firstName,
      lastName: dto.lastName,
    },
  });

  await logger.info(`User profile created successfully: ${dto.authId}`, {
    userId: dto.authId,
  });

  return user;
};

export const getAllUsers = async () => {
  const users = await prisma.user.findMany();

  await logger.info(`User profiles retrieved successfully: ${users.length}`);

  return users;
};

export const getUserByAuthId = async (authId: string) => {
  const user = await prisma.user.findUnique({
    where: { authId },
  });

  if (!user) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  await logger.info(`User profile retrieved successfully: ${authId}`, {
    userId: authId,
  });

  return user;
};

export const updateUser = async (authId: string, dto: UpdateUserDto) => {
  const user = await prisma.user.findUnique({
    where: { authId },
  });

  if (!user || user.deletedAt) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  const updatedUser = await prisma.user.update({
    where: { authId },
    data: {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
    },
  });

  await logger.info(`User profile updated successfully: ${authId}`, {
    userId: authId,
  });

  return updatedUser;
};

export const deleteUser = async (authId: string) => {
  const user = await prisma.user.findUnique({
    where: { authId },
  });

  if (!user) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  if (user.deletedAt) {
    throw new AppError("Cet utilisateur a déjà été supprimé.", 409);
  }

  await prisma.user.update({
    where: { authId },
    data: { deletedAt: new Date() },
  });

  await logger.info(`User profile deleted successfully: ${authId}`, {
    userId: authId,
  });
};
