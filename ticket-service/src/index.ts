import "dotenv/config";
import express from "express";
import ticketRouter from "./presentation/routes/ticketRoute";
import { errorMiddleware } from "./presentation/middlewares/errorMiddleware";
import { connectRabbitMQ } from "./business/config/rabbitmq";

const app = express();
app.use(express.json());

app.use("/api/tickets", ticketRouter);

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Booking API Ticket Service - Opérationnelle");
});

app.use(errorMiddleware);

const start = async () => {
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`Ticket Service lancé sur http://localhost:${PORT}`);
  });
};

start();
