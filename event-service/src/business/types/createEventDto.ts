export interface CreateEventDto {
    title: string;
    description?: string;
    location: string;
    date: Date;
    maxCapacity: number;
    price: number;
}