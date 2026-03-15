import { Request, Response } from 'express';
import * as notificationService from '../../business/notificationService';

export const handleNotify = async (req: Request, res: Response) => {
    try {
        const { template, to, data } = req.body;

        await notificationService.processNotification(template, to, data);

        console.log(`Succès : ${template} envoyé à ${to}`);
        res.status(200).json({ message: "Email envoyé" });
    } catch (error: any) {
        console.error(`Erreur :`, error.message);
        res.status(500).json({ error: "Échec de l'envoi de l'email" });
    }
};