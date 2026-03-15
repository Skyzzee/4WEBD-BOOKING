import jwt from 'jsonwebtoken';
import { AppError } from './appError';
import { AccessTokenDto } from '../types/tokens/accessTokenDto';
import { VerificationTokenDto } from '../types/tokens/verificationTokenDto';

const JWT_SECRET = process.env.JWT_SECRET || "super_secret";
const JWT_EXPIRES_IN = "24h";

export const generateToken = (payload: AccessTokenDto | VerificationTokenDto): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): AccessTokenDto | VerificationTokenDto => {
    try {
        return jwt.verify(token, JWT_SECRET) as AccessTokenDto | VerificationTokenDto;
    } catch (error) {
        console.log(`Erreur lors de la vérification du token: ${error}`);
        throw new AppError("Token invalide ou expiré.", 401);
    }
};