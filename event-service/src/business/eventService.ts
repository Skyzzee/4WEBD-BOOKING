import { prisma } from '../data/prismaClient';
import { AppError } from './config/appError';
import { EventStatus } from '@prisma/client';
import { CreateEventDto } from './types/createEventDto';
import { UpdateEventDto } from './types/updateEventDto';
import { LogEventDto } from './types/logEventDto';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3000';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';
const LOGGER_SERVICE_URL = process.env.LOGGER_SERVICE_URL || 'http://logger-service:3000';


const getAuthUser = async (userId: string) => {
    const authResponse = await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/${userId}`, {
        headers: { 'internal-api-key': process.env.INTERNAL_API_KEY || '' }
    });

    const result = await authResponse.json();
    return result.data;
};

const logEvent = async (dto: LogEventDto) => {
    fetch(`${LOGGER_SERVICE_URL}/api/loggers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'internal-api-key': process.env.INTERNAL_API_KEY || ''
        },
        body: JSON.stringify({
            ...dto,
            serviceName: 'EVENT_SERVICE'
        })
    }).catch(err => console.error(`[EVENT_SERVICE] Logger service unavailable:`, err.message));
};

export const createEvent = async (dto: CreateEventDto, createdByUserId: string,  token: string) => {
    const title = dto.title.trim();
    const description = dto.description?.trim();
    const location = dto.location.trim();

    if (!title || !location || !dto.date || !dto.maxCapacity || !dto.price) {
        throw new AppError("Tous les champs ormis la description sont obligatoire.", 400);
    }

    if (dto.maxCapacity <= 0) {
        throw new AppError("La capacité doit être supérieure à 0.", 400);
    }

    if (dto.price <= 0) {
        throw new AppError("Le prix doit être supérieur à 0.", 400);
    }

    const newEvent = await prisma.event.create({
        data: {
            title: title,
            description: description,
            location: location,
            date: dto.date,
            maxCapacity: dto.maxCapacity,
            availableStock: dto.maxCapacity,
            price: dto.price,
            createdByUserId,
        }
    });

    const authUser = await getAuthUser(createdByUserId);

    fetch(`${NOTIFICATION_SERVICE_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            template: 'EVENT_CREATED',
            to: authUser.email,
            data: { title: title }
        })
    }).catch(err => console.error('Notification service unavailable:', err.message));

    return newEvent;
};

export const getAllEventsForUser = async (availableOnly: boolean = false) => {
    return await prisma.event.findMany({
        where: { 
            deletedAt: null,
            status: availableOnly 
                ? EventStatus.PUBLISHED 
                : { in: [EventStatus.PUBLISHED, EventStatus.SOLD_OUT] }
        },
        orderBy: { date: 'asc' }
    });
};

export const getAllEventsForAdmin = async (status?: EventStatus) => {
    return await prisma.event.findMany({
        where: { 
            ...(status && { status })
        },
        orderBy: { date: 'asc' }
    });
};

export const getEventsForEventCreator = async (userId: string, status?: EventStatus) => {
    return await prisma.event.findMany({
        where: { 
            createdByUserId: userId,
            ...(status && { status })
        },
        orderBy: { date: 'asc' }
    });
};

export const getEventByIdForUser = async (id: string) => {
    const event = await prisma.event.findUnique({ 
        where: { 
            id,
            deletedAt: null,
            status: { in: [EventStatus.PUBLISHED, EventStatus.SOLD_OUT] }
        } 
    });

    if (!event) {
        throw new AppError("Événement non trouvé.", 404);
    }

    return event;
};

export const getEventByIdForAdmin = async (id: string) => {
    const event = await prisma.event.findUnique({ 
        where: { 
            id
        } 
    });

    if (!event) {
        throw new AppError("Événement non trouvé.", 404);
    }

    return event;
};

export const getEventByIdForEventCreator = async (id: string, userId: string) => {
    const event = await prisma.event.findUnique({ 
        where: { 
            id,
            createdByUserId: userId
        } 
    });

    if (!event) {
        throw new AppError("Événement non trouvé.", 404);
    }

    return event;
};

export const updateEvent = async (id: string, dto: UpdateEventDto, userId: string, userRole: string, token: string) => {
    const event = await prisma.event.findUnique({ 
        where: { id } 
    });

    if (!event || event.deletedAt) {
        throw new AppError("Événement non trouvé.", 404);
    }

    if (userRole !== 'ADMIN' && event.createdByUserId !== userId) {
        throw new AppError("Vous n'êtes pas autorisé à modifier cet événement.", 403);
    }

    const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
            title: dto.title,
            description: dto.description,
            location: dto.location,
            date: dto.date,
            maxCapacity: dto.maxCapacity,
            price: dto.price,
        }
    });

    const authUser = await getAuthUser(event.createdByUserId);

    fetch(`${NOTIFICATION_SERVICE_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            template: 'EVENT_UPDATED',
            to: authUser.email,
            data: { title: updatedEvent.title }
        })
    }).catch(err => console.error('Notification service unavailable:', err.message));

    return updatedEvent;
};

export const updateEventStatus = async (id: string, status: EventStatus, userId: string, userRole: string, token: string) => {
    const event = await prisma.event.findUnique({ 
        where: { id } 
    });

    if (!event || event.deletedAt) {
        throw new AppError("Événement non trouvé.", 404);
    }

    if (userRole !== 'ADMIN' && event.createdByUserId !== userId) {
        throw new AppError("Vous n'êtes pas autorisé à modifier cet événement.", 403);
    }

    const updatedStatus = await prisma.event.update({
        where: { id },
        data: { status }
    });

    const authUser = await getAuthUser(event.createdByUserId);

    fetch(`${NOTIFICATION_SERVICE_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            template: 'EVENT_STATUS_UPDATED',
            to: authUser.email,
            data: { 
                title: event.title,
                status : status
             }
        })
    }).catch(err => console.error('Notification service unavailable:', err.message));

    return updatedStatus;
};

export const deleteEvent = async (id: string, userId: string, userRole: string, token: string) => {
    const event = await prisma.event.findUnique({ 
        where: { id } 
    });

    if (!event) { 
        throw new AppError("Événement non trouvé.", 404);
    }

    if (event.deletedAt) {
        throw new AppError("Cet événement a déjà été supprimé.", 409);
    }

    if (userRole !== 'ADMIN' && event.createdByUserId !== userId) {
        throw new AppError("Vous n'êtes pas autorisé à supprimer cet événement.", 403);
    }

    await prisma.event.update({
        where: { id },
        data: { 
            deletedAt: new Date(),
            status: EventStatus.CANCELLED
         }
    });

    const authUser = await getAuthUser(event.createdByUserId);

    fetch(`${NOTIFICATION_SERVICE_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            template: 'EVENT_DELETED',
            to: authUser.email,
            data: { title: event.title }
        })
    }).catch(err => console.error('Notification service unavailable:', err.message));
};

export const decrementStock = async (id: string) => {
    const event = await prisma.event.findUnique({ 
        where: { id } 
    });

    if (!event || event.deletedAt) {
        throw new AppError("Événement non trouvé.", 404);
    }

    if (event.availableStock <= 0) {
        throw new AppError("Aucune place disponible.", 409);
    }

    return await prisma.event.update({
        where: { 
            id,
            availableStock: { gt: 0 }
         },
        data: { 
            availableStock: { decrement: 1 },
            status: event.availableStock === 1 ? EventStatus.SOLD_OUT : undefined
        }
    });
};