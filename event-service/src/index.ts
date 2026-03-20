import 'dotenv/config';
import express from 'express';
import eventRouter from './presentation/routes/eventRoute';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';

const app = express();
app.use(express.json());

app.use('/api/events', eventRouter);

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Booking API Event Service - Opérationnelle');
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Event Service lancé sur http://localhost:${PORT}`);
});