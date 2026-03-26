import { publishLog } from "../publisher/logsPublisher";

interface LogOptions {
  userId?: string | null;
}

class Logger {
  constructor(private readonly serviceName: string) {}

  private async send(
    level: "INFO" | "WARN" | "ERROR",
    message: string,
    options?: LogOptions,
  ): Promise<void> {
    await publishLog({
      level,
      serviceName: this.serviceName,
      message,
      userId: options?.userId ?? null,
    });
  }

  async info(message: string, options?: LogOptions): Promise<void> {
    await this.send("INFO", message, options);
  }

  async warn(message: string, options?: LogOptions): Promise<void> {
    await this.send("WARN", message, options);
  }

  async error(message: string, options?: LogOptions): Promise<void> {
    await this.send("ERROR", message, options);
  }
}

export const logger = new Logger("PAYMENT_SERVICE");
