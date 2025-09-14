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

// Hapus prefix /api karena di server.js sudah ada /api/users
userRouter.post('/login', login);
userRouter.post('/register', register);
userRouter.get('/getUsers', getAllUsers);
userRouter.get('/:id', verifyToken, getUser);
userRouter.delete('/:id', verifyToken, deleteUser);
userRouter.put('/:id', verifyToken, updateUser);
userRouter.post('/getToken', getToken);
userRouter.post('/logout', logout);

export default userRouter;
