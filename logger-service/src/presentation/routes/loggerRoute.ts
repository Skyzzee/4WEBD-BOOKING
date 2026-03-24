import { Router } from 'express';
import * as loggerController from '../controllers/loggerController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { internalMiddleware } from '../middlewares/internalMiddleware';
import { Role } from '../../business/types/enums/role';

const loggerRouter = Router();

loggerRouter.post('/', internalMiddleware, loggerController.createLog);
loggerRouter.get('/', authMiddleware, roleMiddleware(Role.ADMIN), loggerController.getLogs);
loggerRouter.get('/user/:userId', authMiddleware, roleMiddleware(Role.ADMIN), loggerController.getLogsByUserId);
loggerRouter.get('/service/:serviceName', authMiddleware, roleMiddleware(Role.ADMIN), loggerController.getLogsByServiceName);
loggerRouter.get('/:id', authMiddleware, roleMiddleware(Role.ADMIN), loggerController.getLogById);

export default loggerRouter;