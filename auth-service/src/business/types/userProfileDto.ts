export interface UserProfileDto {
    id: string;
    authId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}