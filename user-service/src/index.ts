import 'dotenv/config';
import express from 'express';
import userRouter from './presentation/routes/userRoute';

const app = express();
app.use(express.json());

app.use('/api/users', userRouter);

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Booking API User Service - Opérationnelle');
});

app.listen(PORT, () => {
  console.log(`User Service lancé sur http://localhost:${PORT}`);
});