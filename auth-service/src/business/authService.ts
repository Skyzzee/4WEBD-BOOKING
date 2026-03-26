import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "../data/prismaClient";
import { publishNotification } from "./publisher/notificationPublisher";
import { AppError } from "./config/appError";
import { generateToken, verifyToken } from "./config/tokenJwt";
import { logger } from "./utils/logger";
import { LoginRequestDto } from "./types/login/loginRequestDto";
import { LoginResponseDto } from "./types/login/loginResponseDto";
import { RegisterRequestDto } from "./types/register/registerRequestDto";
import { RegisterResponseDto } from "./types/register/registerResponseDto";
import { AccessTokenDto } from "./types/tokens/accessTokenDto";
import {
  VerificationTokenDto,
  VerificationTokenType,
} from "./types/tokens/verificationTokenDto";
import { UserInfosDto } from "./types/userInfosDto";
import { UserProfileDto } from "./types/userProfileDto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3000";

export const register = async (
  dto: RegisterRequestDto,
): Promise<RegisterResponseDto> => {
  const email = dto.email.trim().toLowerCase();
  const firstName = dto.firstName.trim();
  const lastName = dto.lastName.trim();
  const password = dto.password;
  const confirmPassword = dto.confirmPassword;

  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError("Email invalide.", 400);
  }

  if (!password || !PASSWORD_REGEX.test(password)) {
    throw new AppError(
      "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 chiffre.",
      400,
    );
  }

  if (password !== confirmPassword) {
    throw new AppError("Les mots de passe ne correspondent pas.", 400);
  }

  if (!firstName || !lastName) {
    throw new AppError("Le prénom et le nom sont obligatoires.", 400);
  }

  const existingEmailUser = await prisma.authUser.findUnique({
    where: { email },
  });

  if (existingEmailUser) {
    throw new AppError("Cet email est déjà utilisé.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.authUser.create({
    data: {
      email,
      passwordHash,
      role: Role.USER,
      isActive: false,
    },
  });

  const userServiceResponse = await fetch(`${USER_SERVICE_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "internal-api-key": process.env.INTERNAL_API_KEY || "",
    },
    body: JSON.stringify({
      authId: user.id,
      firstName,
      lastName,
    }),
  });

  if (!userServiceResponse.ok) {
    await prisma.authUser.delete({
      where: { id: user.id },
    });

    throw new AppError(
      "Erreur lors de la création du profil utilisateur.",
      500,
    );
  }

  const verificationToken = generateToken({
    userId: user.id,
    email: user.email,
    type: VerificationTokenType.EMAIL_CONFIRMATION,
  } as VerificationTokenDto);

  try {
    await publishNotification({
      template: "VERIFY_EMAIL",
      to: email,
      data: {
        firstName,
        verificationToken,
      },
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish VERIFY_EMAIL notification for ${email}`,
      { userId: user.id },
    );
  }

  const registerResponse: RegisterResponseDto = {
    id: user.id,
    email: user.email,
  };

  await logger.info(`User registered successfully: ${email}`, {
    userId: user.id,
  });

  return registerResponse;
};

export const login = async (
  dto: LoginRequestDto,
): Promise<LoginResponseDto> => {
  const email = dto.email.trim().toLowerCase();
  const password = dto.password;

  if (!email || !password) {
    throw new AppError("Email et mot de passe sont requis.", 400);
  }

  const user = await prisma.authUser.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Email ou mot de passe incorrect.", 401);
  }

  if (!user.isActive) {
    throw new AppError(
      "Veuillez confirmer votre email avant de vous connecter.",
      403,
    );
  }

  if (user.deletedAt !== null) {
    throw new AppError("Votre compte à été supprimé.", 403);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new AppError("Email ou mot de passe incorrect.", 401);
  }

  const accessToken = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  } as AccessTokenDto);

  const loginResponse: LoginResponseDto = {
    id: user.id,
    email: user.email,
    role: user.role,
    accessToken,
  };

  await logger.info(`User logged in successfully: ${user.email}`, {
    userId: user.id,
  });

  return loginResponse;
};

export const getAllUsers = async () => {
  const authUsers = await prisma.authUser.findMany({
    where: { deletedAt: null },
    omit: { passwordHash: true },
  });

  const response = await fetch(`${USER_SERVICE_URL}/api/users`, {
    headers: {
      "internal-api-key": process.env.INTERNAL_API_KEY || "",
    },
  });

  if (!response.ok) {
    throw new AppError(
      "Erreur lors de la récupération des profils utilisateurs.",
      500,
    );
  }

  const profiles: UserProfileDto[] = await response.json();

  await logger.info(`User profiles retrieved successfully: ${profiles.length}`);

  return authUsers.map((authUser) => {
    const profile = profiles.find(
      (item: UserProfileDto) => item.authId === authUser.id,
    );

    return {
      ...authUser,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      phone: profile?.phone,
      avatarUrl: profile?.avatarUrl,
    };
  });
};

export const getUserById = async (
  id: string,
  token: string,
): Promise<UserInfosDto> => {
  const user = await prisma.authUser.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  const response = await fetch(`${USER_SERVICE_URL}/api/users/${id}`, {
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new AppError(
      "Erreur lors de la récupération du profil utilisateur.",
      500,
    );
  }

  const profile: UserProfileDto = await response.json();

  const userInfos: UserInfosDto = {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
    phone: profile?.phone,
    avatarUrl: profile?.avatarUrl,
  };

  await logger.info(`User information retrieved successfully: ${id}`, {
    userId: user.id,
  });

  return userInfos;
};

export const getUserByIdInternal = async (
  id: string,
): Promise<UserInfosDto> => {
  const user = await prisma.authUser.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  const response = await fetch(`${USER_SERVICE_URL}/api/users/internal/${id}`, {
    headers: {
      "internal-api-key": process.env.INTERNAL_API_KEY || "",
    },
  });

  if (!response.ok) {
    throw new AppError(
      "Erreur lors de la récupération du profil utilisateur.",
      500,
    );
  }

  const profile: UserProfileDto = await response.json();

  const userInfos: UserInfosDto = {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
    phone: profile?.phone,
    avatarUrl: profile?.avatarUrl,
  };

  await logger.info(`Internal user information retrieved successfully: ${id}`, {
    userId: user.id,
  });

  return userInfos;
};

export const verifyEmail = async (token: string): Promise<void> => {
  const decoded = verifyToken(token) as VerificationTokenDto;

  if (decoded.type !== VerificationTokenType.EMAIL_CONFIRMATION) {
    throw new AppError("Token invalide.", 400);
  }

  const user = await prisma.authUser.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  if (user.isActive) {
    throw new AppError("Ce compte est déjà activé.", 400);
  }

  await prisma.authUser.update({
    where: { id: user.id },
    data: { isActive: true },
  });

  try {
    await publishNotification({
      template: "WELCOME_EMAIL",
      to: user.email,
      data: {},
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish WELCOME_EMAIL notification for ${user.email}`,
      { userId: user.id },
    );
  }

  await logger.info(`User account verified successfully: ${user.email}`, {
    userId: user.id,
  });
};

export const updateUserRole = async (id: string, role: Role) => {
  const user = await prisma.authUser.findUnique({
    where: { id },
  });

  if (!user || user.deletedAt) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  const updatedUser = await prisma.authUser.update({
    where: { id },
    data: { role },
  });

  try {
    await publishNotification({
      template: "ROLE_UPDATED",
      to: user.email,
      data: { role },
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish ROLE_UPDATED notification for ${user.email}`,
      { userId: user.id },
    );
  }

  await logger.info(`User role updated successfully: ${id}`, {
    userId: user.id,
  });

  return updatedUser;
};

export const deleteUser = async (id: string): Promise<void> => {
  const user = await prisma.authUser.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  if (user.deletedAt) {
    throw new AppError("Cet utilisateur a déjà été supprimé.", 409);
  }

  await prisma.authUser.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  const userServiceResponse = await fetch(
    `${USER_SERVICE_URL}/api/users/${id}`,
    {
      method: "DELETE",
      headers: {
        "internal-api-key": process.env.INTERNAL_API_KEY || "",
      },
    },
  );

  if (!userServiceResponse.ok) {
    await prisma.authUser.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });

    throw new AppError(
      "Erreur lors de la suppression du profil utilisateur.",
      500,
    );
  }

  try {
    await publishNotification({
      template: "ACCOUNT_DELETED",
      to: user.email,
      data: {},
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish ACCOUNT_DELETED notification for ${user.email}`,
      { userId: user.id },
    );
  }

  await logger.info(`User deleted successfully: ${id}`, {
    userId: user.id,
  });
};
