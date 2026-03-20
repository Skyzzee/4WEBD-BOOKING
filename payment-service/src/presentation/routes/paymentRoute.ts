import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { internalMiddleware } from '../middlewares/internalMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { Role } from '../../business/types/enums/role';

const paymentRouter = Router();

paymentRouter.post('/', internalMiddleware, paymentController.createPayment);
paymentRouter.get('/user/:userId', authMiddleware, roleMiddleware(Role.ADMIN), paymentController.getPaymentsByUserId);
paymentRouter.get('/event/:eventId', authMiddleware, roleMiddleware(Role.ADMIN, Role.EVENT_CREATOR), paymentController.getPaymentsByEventId);
paymentRouter.get('/ticket/:ticketId', authMiddleware, paymentController.getPaymentByTicketId);
paymentRouter.get('/:id', authMiddleware, roleMiddleware(Role.ADMIN), paymentController.getPaymentById);
paymentRouter.patch('/:id/refund', authMiddleware, roleMiddleware(Role.ADMIN), paymentController.refundPayment);


export default paymentRouter;