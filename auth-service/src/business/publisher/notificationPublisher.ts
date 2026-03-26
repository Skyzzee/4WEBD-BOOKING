import { getChannel } from "../config/rabbitmq";

const QUEUE = "notification.send";

interface NotificationPayload {
  template: string;
  to: string;
  data: any;
}

export const publishNotification = async (
  payload: NotificationPayload,
): Promise<void> => {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });

  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  console.log(`Notification publiée : ${payload.template} → ${payload.to}`);
};
