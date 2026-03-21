import "dotenv/config";
import express from "express";
import { connectRabbitMQ } from "./business/config/rabbitmq";
import { startNotificationConsumer } from "./business/consumers/notificationConsumer";

const app = express();
app.use(express.json());

const PORT = 3000;

const start = async () => {
  await connectRabbitMQ();
  await startNotificationConsumer();
  app.listen(PORT, () => {
    console.log(`Notifications Service lancé sur http://localhost:${PORT}`);
  });
};

start();
