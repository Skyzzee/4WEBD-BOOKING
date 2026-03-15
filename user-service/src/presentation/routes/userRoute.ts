import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { internalMiddleware } from '../middlewares/internalMiddleware';

const userRouter = Router();

userRouter.post('/', internalMiddleware, userController.createUser);
userRouter.get('/', internalMiddleware, userController.getAllUsers);
userRouter.delete('/:authId', internalMiddleware, userController.deleteUser);

userRouter.get('/:authId', authMiddleware, userController.getUserByAuthId);
userRouter.patch('/:authId', authMiddleware, userController.updateUser);

export default userRouter;