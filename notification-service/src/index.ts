import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());


const PORT = 3000;

app.get('/', (req, res) => {
  res.send('StreamLine API Notification Service - Opérationnelle');
});

app.listen(PORT, () => {
  console.log(`Serveur StreamLine Notification Service lancé sur http://localhost:${PORT}`);
});