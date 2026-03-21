import "dotenv/config";
import express from "express";
import userRouter from "./presentation/routes/userRoute";
import { errorMiddleware } from "./presentation/middlewares/errorMiddleware";
import { connectRabbitMQ } from "./business/config/rabbitmq";

const app = express();
app.use(express.json());

app.use("/api/users", userRouter);

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Booking API User Service - Opérationnelle");
});

app.use(errorMiddleware);

const start = async () => {
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`User Service lancé sur http://localhost:${PORT}`);
  });
};

start();
