import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { internalMiddleware } from '../middlewares/internalMiddleware';
import { Role } from '../../business/types/enums/role';

const eventRouter = Router();

eventRouter.post('/', authMiddleware, roleMiddleware(Role.ADMIN, Role.EVENT_CREATOR), eventController.createEvent);

eventRouter.get('/all', authMiddleware, roleMiddleware(Role.USER), eventController.getAllEventsForUser);
eventRouter.get('/ec/all', authMiddleware, roleMiddleware(Role.EVENT_CREATOR), eventController.getEventsForEventCreator);
eventRouter.get('/adm/all', authMiddleware, roleMiddleware(Role.ADMIN), eventController.getAllEventsForAdmin);

eventRouter.get('/internal/:id', internalMiddleware, eventController.getEventByIdForUser);
eventRouter.get('/ec/:id', authMiddleware, roleMiddleware(Role.EVENT_CREATOR), eventController.getEventByIdForEventCreator);
eventRouter.get('/adm/:id', authMiddleware, roleMiddleware(Role.ADMIN), eventController.getEventByIdForAdmin);
eventRouter.get('/:id', authMiddleware, roleMiddleware(Role.USER), eventController.getEventByIdForUser);

eventRouter.patch('/:id/status', authMiddleware, roleMiddleware(Role.ADMIN, Role.EVENT_CREATOR), eventController.updateEventStatus);
eventRouter.patch('/:id', authMiddleware, roleMiddleware(Role.ADMIN, Role.EVENT_CREATOR), eventController.updateEvent);

eventRouter.delete('/:id', authMiddleware, roleMiddleware(Role.ADMIN, Role.EVENT_CREATOR), eventController.deleteEvent);

eventRouter.post('/:id/decrement', internalMiddleware, eventController.decrementStock);

export default eventRouter;