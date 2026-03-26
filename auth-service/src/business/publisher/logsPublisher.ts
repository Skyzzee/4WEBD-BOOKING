import { getChannel } from "../config/rabbitmq";

const QUEUE = "log.write";

export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface PublishLogPayload {
  level: LogLevel;
  serviceName: string;
  message: string;
  userId?: string | null;
}

export const publishLog = async (payload: PublishLogPayload): Promise<void> => {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });

  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
};
