import 'dotenv/config';
import express from 'express';
import { handleNotify } from './presentation/controllers/notificationController';

const app = express();
app.use(express.json());

app.post('/api/notify', handleNotify);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Service lancé sur http://localhost:${PORT}`);
});