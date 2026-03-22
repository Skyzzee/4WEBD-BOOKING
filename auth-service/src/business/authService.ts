import bcrypt from "bcrypt";
import { prisma } from "../data/prismaClient";
import { Role } from "@prisma/client";
import { AppError } from "./config/appError";
import { generateToken, verifyToken } from "./config/tokenJwt";
import { RegisterRequestDto } from "./types/register/registerRequestDto";
import { RegisterResponseDto } from "./types/register/registerResponseDto";
import { LoginRequestDto } from "./types/login/loginRequestDto";
import { LoginResponseDto } from "./types/login/loginResponseDto";
import { UserInfosDto } from "./types/userInfosDto";
import {
  VerificationTokenDto,
  VerificationTokenType,
} from "./types/tokens/verificationTokenDto";
import { AccessTokenDto } from "./types/tokens/accessTokenDto";
import { UserProfileDto } from "./types/userProfileDto";
import { publishNotification } from "./publisher/notificationPublisher";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3000";

export const register = async (dto: RegisterRequestDto) => {
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
    where: { email: email },
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
  } catch (error: any) {
    console.error("Erreur publication notification:", error.message);
    // TODO: publish an event for the log queue
  }

  const registerResponse: RegisterResponseDto = {
    id: user.id,
    email: user.email,
  };

  return registerResponse;
};

export const login = async (dto: LoginRequestDto) => {
  const { email, password } = dto;

  if (!email || !password) {
    throw new AppError("Email et mot de passe sont requis.", 400);
  }

  const user = await prisma.authUser.findUnique({
    where: { email: email.trim().toLowerCase() },
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

  const profiles: UserProfileDto[] = await response.json();

  return authUsers.map((authUser) => {
    const profile = profiles.find(
      (p: UserProfileDto) => p.authId === authUser.id,
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

export const getUserById = async (id: string, token: string) => {
  const user = await prisma.authUser.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("Utilisateur non trouvé.", 404);
  }

  const response = await fetch(`${USER_SERVICE_URL}/api/users/${id}`, {
    headers: {
      Authorization: `${token}`,
    },
  });

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

  return userInfos;
};

export const getUserByIdInternal = async (id: string) => {
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

  return userInfos;
};

export const verifyEmail = async (token: string) => {
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

  try {
    await publishNotification({
      template: "WELCOME_EMAIL",
      to: user.email,
      data: {},
    });
  } catch (error: any) {
    console.error("Erreur publication notification:", error.message);
    // TODO: publish an event for the log queue
  }

  await prisma.authUser.update({
    where: { id: user.id },
    data: { isActive: true },
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
  } catch (error: any) {
    console.error("Erreur publication notification:", error.message);
    // TODO: publish an event for the log queue
  }

  return updatedUser;
};

export const deleteUser = async (id: string) => {
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
  } catch (error: any) {
    console.error("Erreur publication notification:", error.message);
    // TODO: publish an event for the log queue
  }
};
