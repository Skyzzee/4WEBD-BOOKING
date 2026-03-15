import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import * as authController from '../controllers/authController';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { Role } from '@prisma/client';

const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/verify-email/:token', authController.verifyEmail);

authRouter.get('/me', authMiddleware, authController.me);
authRouter.get('/', authMiddleware, roleMiddleware(Role.ADMIN), authController.getAllUsers);
authRouter.get('/:id', authMiddleware, roleMiddleware(Role.ADMIN), authController.getUserById);
authRouter.patch('/:id/role', authMiddleware, roleMiddleware(Role.ADMIN), authController.updateUserRole);
authRouter.delete('/:id', authMiddleware, roleMiddleware(Role.ADMIN), authController.deleteUser);

export default authRouter;