import { Role } from '@prisma/client';

export interface LoginResponseDto {
    id: string;
    email: string;
    role: Role;
    accessToken: string;
}