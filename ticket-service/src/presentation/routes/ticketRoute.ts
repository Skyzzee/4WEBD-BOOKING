import { Router } from 'express';
import * as ticketController from '../controllers/ticketController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { Role } from '../../business/types/enums/role';
import { internalMiddleware } from '../middlewares/internalMiddleware';

const ticketRouter = Router();

ticketRouter.post('/', authMiddleware, ticketController.buyTicket);
ticketRouter.get('/my', authMiddleware, ticketController.getMyTickets);
ticketRouter.get('/user/:userId', authMiddleware, roleMiddleware(Role.ADMIN), ticketController.getTicketsByUserId);
ticketRouter.get('/event/:eventId', authMiddleware, roleMiddleware(Role.ADMIN, Role.EVENT_CREATOR), ticketController.getTicketsByEventId);
ticketRouter.get('/internal/event/:eventId', internalMiddleware, ticketController.getTicketsByEventId);
ticketRouter.patch('/:id/validate', authMiddleware, roleMiddleware(Role.ADMIN, Role.EVENT_CREATOR), ticketController.validateTicket);
ticketRouter.patch('/:id/cancel', authMiddleware, ticketController.cancelTicket);
ticketRouter.get('/:id', authMiddleware, ticketController.getTicketById);

export default ticketRouter;