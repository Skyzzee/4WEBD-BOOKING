import 'dotenv/config';
import express from 'express';
import authRouter from './presentation/routes/authRoute';

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('StreamLine API Auth Service - Opérationnelle');
});

app.listen(PORT, () => {
  console.log(`Serveur StreamLine Auth Service lancé sur http://localhost:${PORT}`);
});