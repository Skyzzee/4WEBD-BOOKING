import "dotenv/config";
import express from "express";
import loggerRouter from "./presentation/routes/loggerRoute";
import { connectRabbitMQ } from "./business/config/rabbitmq";

const app = express();
app.use(express.json());

app.use("/api/loggers", loggerRouter);

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Booking API Logger Service - Opérationnelle");
});

const start = async () => {
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`Logger Service lancé sur http://localhost:${PORT}`);
  });
};

start();
