import { Role } from "@prisma/client";

export interface UserInfosDto {
    id: string;
    email: string;
    role: Role;
    isActive: boolean;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
}