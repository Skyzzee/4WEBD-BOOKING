import { Role } from '@prisma/client';

export interface AccessTokenDto {
    userId: string;
    email: string;
    role: Role;
}