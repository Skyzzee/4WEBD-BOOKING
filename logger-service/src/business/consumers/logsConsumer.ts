import { getChannel } from "../config/rabbitmq";
import * as loggerService from "../loggerService";
import { CreateLogDto } from "../types/createLogDto";

const QUEUE = "log.write";

export const startLogsConsumer = async (): Promise<void> => {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });

  console.log(`Waiting for messages in queue: ${QUEUE}`);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const payload = JSON.parse(msg.content.toString()) as CreateLogDto;

      await loggerService.createLog({
        level: payload.level,
        serviceName: payload.serviceName,
        message: payload.message,
        userId: payload.userId,
      });

      channel.ack(msg);
    } catch (error: any) {
      console.error("Error while processing log message:", error.message);
      channel.nack(msg, false, false);
    }
  });
};
