import 'dotenv/config';
import express from 'express';
import ticketRouter from './presentation/routes/ticketRoute';

const app = express();
app.use(express.json());

app.use('/api/tickets', ticketRouter);

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Booking API Ticket Service - Opérationnelle');
});

app.listen(PORT, () => {
  console.log(`Ticket Service lancé sur http://localhost:${PORT}`);
});