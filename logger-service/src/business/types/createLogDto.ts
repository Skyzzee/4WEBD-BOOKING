import { LogLevel } from "@prisma/client";
import { ServiceName } from "./enums/serviceName";

export interface CreateLogDto {
    level: LogLevel;
    serviceName: ServiceName;
    message: string;
    userId?: string;
}