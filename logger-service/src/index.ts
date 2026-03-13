import 'dotenv/config';
import express from 'express';
import loggerRouter from './presentation/routes/loggerRoute';

const app = express();
app.use(express.json());

app.use('/api/logger', loggerRouter);

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('StreamLine API Logger Service - Opérationnelle');
});

app.listen(PORT, () => {
  console.log(`Serveur StreamLine Logger Service lancé sur http://localhost:${PORT}`);
});