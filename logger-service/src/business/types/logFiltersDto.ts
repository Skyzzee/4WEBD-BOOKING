import { LogLevel } from "@prisma/client";

export interface LogFilters {
    level?: LogLevel;
    from?: Date;
    to?: Date;
}