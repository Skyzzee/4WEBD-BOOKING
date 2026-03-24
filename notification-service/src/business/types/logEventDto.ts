export interface LogEventDto {
    level: LogSeverity;
    message: string;
    userId?: string;
}

export enum LogSeverity {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL'
}