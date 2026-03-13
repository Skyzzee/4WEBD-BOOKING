import 'dotenv/config';
import express from 'express';
import paymentRouter from './presentation/routes/paymentRoute';

const app = express();
app.use(express.json());

app.use('/api/payment', paymentRouter);

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('StreamLine API Payment Service - Opérationnelle');
});

app.listen(PORT, () => {
  console.log(`Serveur StreamLine Payment Service lancé sur http://localhost:${PORT}`);
});