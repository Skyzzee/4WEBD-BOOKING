import jwt from 'jsonwebtoken';
import { AppError } from './appError';
import { TokenDto } from '../types/tokenDto';
import { QrCodeDto } from '../types/qrCodeDto';


const JWT_SECRET = process.env.JWT_SECRET || "super_secret";
const JWT_QRCODE_SECRET = process.env.JWT_QRCODE_SECRET || "super_secret_qrcode";
const JWT_EXPIRES_IN = "24h";


export const generateToken = (payload: TokenDto): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenDto => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenDto;
    } catch (error) {
        console.log(`Erreur lors de la vérification du token: ${error}`);
        throw new AppError("Token invalide ou expiré.", 401);
    }
};

export const generateQrCode = (payload: QrCodeDto): string => {
    return jwt.sign(
        payload,
        JWT_QRCODE_SECRET,
        { noTimestamp: true }
    );
};

export const verifyQrCode = (qrCode: string): QrCodeDto => {
    try {
        return jwt.verify(qrCode, JWT_QRCODE_SECRET) as QrCodeDto;
    } catch (error) {
        console.error(`Erreur lors de la vérification du QR code: ${error}`);
        throw new AppError("QR code invalide.", 400);
    }
};