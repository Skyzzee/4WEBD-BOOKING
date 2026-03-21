import { getChannel } from "../config/rabbitmq";
import { processNotification } from "../notificationService";

const QUEUE = "notification.send";

export const startNotificationConsumer = async (): Promise<void> => {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });

  console.log(`En attente de messages sur la queue : ${QUEUE}`);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const { template, to, data } = JSON.parse(msg.content.toString());
      await processNotification(template, to, data);
      console.log(`Succès : ${template} envoyé à ${to}`);
      channel.ack(msg);
    } catch (error: any) {
      console.error(
        `Erreur lors du traitement de la notification :`,
        error.message,
      );
      channel.nack(msg, false, false);
    }
  });
};
