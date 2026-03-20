import { Request, Response, NextFunction } from 'express';
import * as ticketService from '../../business/ticketService';

export const buyTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ticketService.buyTicket(
            req.body.eventId,
            res.locals.user.userId
        );
        res.status(201).json({
            message: "Billet acheté avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ticketService.getTicketById(
            req.params.id as string,
            res.locals.user.userId,
            res.locals.user.role
        );
        res.status(200).json({
            message: "Billet récupéré avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getMyTickets = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ticketService.getTicketsByUserId(res.locals.user.userId);
        res.status(200).json({
            message: "Billets récupérés avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getTicketsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ticketService.getTicketsByUserId(req.params.userId as string);
        res.status(200).json({
            message: "Billets récupérés avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getTicketsByEventId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ticketService.getTicketsByEventId(req.params.eventId as string);
        res.status(200).json({
            message: "Billets récupérés avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const validateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ticketService.validateTicket(req.params.id as string);
        res.status(200).json({
            message: "Billet validé avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const cancelTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ticketService.cancelTicket(
            req.params.id as string,
            res.locals.user.userId,
            res.locals.user.role
        );
        res.status(200).json({
            message: "Billet annulé avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};