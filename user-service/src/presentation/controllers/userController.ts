import { Request, Response, NextFunction } from 'express';
import * as userService from '../../business/userService';

// Peut être appelé seulement par l'auth-Service donc n'a pas besoin de renvoyer un message
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await userService.createUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

// Peut être appelé seulement par l'auth-Service donc n'a pas besoin de renvoyer un message
export const getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await userService.getAllUsers();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getUserByAuthId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await userService.getUserByAuthId(req.params.authId as string);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await userService.updateUser(req.params.authId as string, req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// Peut être appelé seulement par l'auth-Service donc n'a pas besoin de renvoyer un message
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userService.deleteUser(req.params.authId as string);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};