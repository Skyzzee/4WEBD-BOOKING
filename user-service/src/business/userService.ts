import { prisma } from '../data/prismaClient';
import { AppError } from './config/appError';
import { CreateUserDto } from './types/createUserDto';
import { LogEventDto } from './types/logEventDto';
import { UpdateUserDto } from './types/updateUserDto';

const LOGGER_SERVICE_URL = process.env.LOGGER_SERVICE_URL || 'http://logger-service:3000';

const logEvent = async (dto: LogEventDto) => {
    fetch(`${LOGGER_SERVICE_URL}/api/loggers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'internal-api-key': process.env.INTERNAL_API_KEY || ''
        },
        body: JSON.stringify({
            ...dto,
            serviceName: 'USER_SERVICE'
        })
    }).catch(err => console.error(`[USER_SERVICE] Logger service unavailable:`, err.message));
};

// Peut être appelé seulement par l'auth-Service donc n'a pas besoin de contacter notification-service
export const createUser = async (dto: CreateUserDto) => {
    const existing = await prisma.user.findUnique({ 
        where: { authId: dto.authId } 
    });

    if (existing) {
        throw new AppError("Un profil existe déjà pour cet utilisateur.", 409);
    }

    return await prisma.user.create({
        data: {
            authId: dto.authId,
            firstName: dto.firstName,
            lastName: dto.lastName,
        }
    });
};

// Peut être appelé seulement par l'auth-Service
export const getAllUsers = async () => {
    return await prisma.user.findMany();
};

export const getUserByAuthId = async (authId: string) => {
    const user = await prisma.user.findUnique({ 
        where: { authId } 
    });

    if (!user) {
        throw new AppError("Utilisateur non trouvé.", 404);
    }

    return user;
};

export const updateUser = async (authId: string, dto: UpdateUserDto) => {
    const user = await prisma.user.findUnique({ 
        where: { authId } 
    });

    if (!user || user.deletedAt) {
        throw new AppError("Utilisateur non trouvé.", 404);
    }

    return await prisma.user.update({
        where: { authId },
        data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            avatarUrl: dto.avatarUrl,
        }
    });
};

// Peut être appelé seulement par l'auth-Service donc n'a pas besoin de contacter notification-service
export const deleteUser = async (authId: string) => {
    const user = await prisma.user.findUnique({ 
        where: { authId } 
    });

    if (!user) {
        throw new AppError("Utilisateur non trouvé.", 404);
    }

    if (user.deletedAt) {
        throw new AppError("Cet utilisateur a déjà été supprimé.", 409);
    }

    await prisma.user.update({
        where: { authId },
        data: { deletedAt: new Date() }
    });
};