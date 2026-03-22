import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import jsYaml from "js-yaml";
import fs from "fs";
import path from "path";
import loggerRouter from "./presentation/routes/loggerRoute";
import { connectRabbitMQ } from "./business/config/rabbitmq";

const app = express();
app.use(express.json());

const swaggerDocument = jsYaml.load(
  fs.readFileSync(path.join(__dirname, "../doc/openapi.yaml"), "utf8"),
) as object;

app.use("/api/loggers/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
