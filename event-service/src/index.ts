import 'dotenv/config';
import express from 'express';
import eventRouter from './presentation/routes/eventRoute';

const app = express();
app.use(express.json());

app.use('/api/event', eventRouter);

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('StreamLine API Event Service - Opérationnelle');
});

app.listen(PORT, () => {
  console.log(`Serveur StreamLine Event Service lancé sur http://localhost:${PORT}`);
});