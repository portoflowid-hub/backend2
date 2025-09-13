import express from 'express';
import { 
    login,
    register,
    getAllUsers,
    getUser,
    deleteUser,
    updateUser,
    getToken,
    logout
} from '../controller/user/userController.js';
import verifyToken from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/api/login', login);
userRouter.post('/api/register', register);
userRouter.get('/api/getUsers', getAllUsers);
userRouter.get('/api/user/:id', verifyToken, getUser);
userRouter.delete('/api/user/:id', verifyToken, deleteUser);
userRouter.put('/api/user/:id', verifyToken, updateUser);
userRouter.post('/api/getToken', getToken);
userRouter.post('/api/logout', logout);

export default userRouter;