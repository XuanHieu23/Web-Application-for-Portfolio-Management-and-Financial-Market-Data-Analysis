import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, cancelPro } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.put('/cancel-pro', verifyToken, cancelPro);

export default router;
