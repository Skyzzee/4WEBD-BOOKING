import { Request, Response, NextFunction } from 'express';
import * as eventService from '../../business/eventService';
import { EventStatus } from '@prisma/client';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization as string;
        const result = await eventService.createEvent(req.body, res.locals.user.userId, token);

        res.status(201).json({ 
            message: "Événement créé avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const getAllEventsForUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const availableOnly = req.query.availableOnly === 'true';
        const result = await eventService.getAllEventsForUser(availableOnly);
        res.status(200).json({ 
            message: "Événements récupérés avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const getAllEventsForAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = req.query.status as EventStatus | undefined;
        const result = await eventService.getAllEventsForAdmin(status);
        res.status(200).json({ 
            message: "Événements récupérés avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const getEventsForEventCreator = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = req.query.status as EventStatus | undefined;
        const result = await eventService.getEventsForEventCreator(res.locals.user.userId, status);
        res.status(200).json({ 
            message: "Événements récupérés avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const getEventByIdForUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await eventService.getEventByIdForUser(req.params.id as string);
        res.status(200).json({ 
            message: "Événement récupéré avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const getEventByIdForAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await eventService.getEventByIdForAdmin(req.params.id as string);
        res.status(200).json({ 
            message: "Événement récupéré avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const getEventByIdForEventCreator = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await eventService.getEventByIdForEventCreator(
            req.params.id as string,
            res.locals.user.userId
        );
        res.status(200).json({ 
            message: "Événement récupéré avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization as string;
        const result = await eventService.updateEvent(
            req.params.id as string,
            req.body,
            res.locals.user.userId,
            res.locals.user.role,
            token
        );
        res.status(200).json({ 
            message: "Événement mis à jour avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const updateEventStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization as string;
        const result = await eventService.updateEventStatus(
            req.params.id as string,
            req.body.status as EventStatus,
            res.locals.user.userId,
            res.locals.user.role,
            token
        );
        res.status(200).json({ 
            message: "Statut de l'événement mis à jour avec succès.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization as string;
        await eventService.deleteEvent(
            req.params.id as string,
            res.locals.user.userId,
            res.locals.user.role,
            token
        );
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const decrementStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await eventService.decrementStock(req.params.id as string);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};