import amqplib, { ChannelModel, Channel } from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672";

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log("RabbitMQ connecté.");
  } catch (error: any) {
    console.error("Erreur de connexion RabbitMQ :", error.message);
    throw error;
  }
};

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error("RabbitMQ channel non initialisé.");
  }
  return channel;
};
