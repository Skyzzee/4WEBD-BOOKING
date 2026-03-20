export interface TicketDto {
    id: string;
    eventId: string;
    userId: string;
    paymentId?: string;
    qrCode?: string;
    status: string;
    purchasedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}