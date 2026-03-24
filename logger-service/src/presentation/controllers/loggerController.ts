import { Request, Response, NextFunction } from 'express';
import * as loggerService from '../../business/loggerService';
import { LogLevel } from '@prisma/client';
import { CreateLogDto } from '../../business/types/createLogDto';
import { LogFilters } from '../../business/types/logFiltersDto';

const extractFilters = (req: Request): LogFilters => ({
    level: req.query.level as LogLevel | undefined,
    from: req.query.from ? new Date(req.query.from as string) : undefined,
    to: req.query.to ? new Date(req.query.to as string) : undefined,
});

export const createLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto: CreateLogDto = req.body;
        const result = await loggerService.createLog(dto);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = {
            ...extractFilters(req),
            serviceName: req.query.serviceName as string | undefined,
        };

        const result = await loggerService.getLogs(filters);

        res.status(200).json({ 
            message: "Logs récupérés avec succès.", 
            data: result }
        );

    } catch (error) {
        next(error);
    }
};

export const getLogById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await loggerService.getLogById(req.params.id as string);
        res.status(200).json({ 
            message: "Log récupéré avec succès.", 
            data: result }
        );

    } catch (error) {
        next(error);
    }
};

export const getLogsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await loggerService.getLogsByUserId(
            req.params.userId as string, 
            extractFilters(req)
        );
        
        res.status(200).json({ 
            message: "Logs récupérés avec succès.", 
            data: result }
        );
    } catch (error) {
        next(error);
    }
};

export const getLogsByServiceName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await loggerService.getLogsByServiceName(
            req.params.serviceName as string, 
            extractFilters(req)
        );

        res.status(200).json({ 
            message: "Logs récupérés avec succès.", 
            data: result }
        );
        
    } catch (error) {
        next(error);
    }
};