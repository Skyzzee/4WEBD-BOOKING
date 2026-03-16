import 'dotenv/config';
import express from 'express';
import authRouter from './presentation/routes/authRoute';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Booking API Auth Service - Opérationnelle');
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Auth Service lancé sur http://localhost:${PORT}`);
});