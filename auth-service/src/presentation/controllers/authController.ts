import { Request, Response, NextFunction } from 'express';
import * as authService from '../../business/authService';
import { Role } from '@prisma/client';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({ 
            message: "Inscription réussie. Veuillez confirmer votre email.",
            data: result 
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({
            message: "Connexion réussie",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authService.verifyEmail(req.params.token as string);
        res.status(200).json({ 
            message: "Email confirmé avec succès. Vous pouvez maintenant vous connecter." 
        });
    } catch (error) {
        next(error);
    }
};

export const me = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, email, role } = res.locals.user;
        res.status(200).json({ 
            message: "Vos informations ont été récupérées avec succès.",
            data: {
                userId, 
                email, 
                role
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getAllUsers();
        res.status(200).json({
            message: "Liste des utilisateurs récupérée avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization!;
        const result = await authService.getUserById(req.params.id as string, token);
        res.status(200).json({ 
            message: "Utilisateur récupéré avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.updateUserRole(req.params.id as string, req.body.role as Role);
        res.status(200).json({ 
            message: "Rôle de l'utilisateur mis à jour avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authService.deleteUser(req.params.id as string);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};