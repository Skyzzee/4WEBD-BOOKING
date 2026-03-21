import "dotenv/config";
import express from "express";
import paymentRouter from "./presentation/routes/paymentRoute";
import { errorMiddleware } from "./presentation/middlewares/errorMiddleware";
import { connectRabbitMQ } from "./business/config/rabbitmq";

const app = express();
app.use(express.json());

app.use("/api/payments", paymentRouter);

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Booking API Payment Service - Opérationnelle");
});

app.use(errorMiddleware);

const start = async () => {
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`Payment Service lancé sur http://localhost:${PORT}`);
  });
};

start();
