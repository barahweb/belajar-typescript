import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/check', AuthController.checkAuth);

// Protected routes (require authentication)
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.post('/change-password', authenticate, AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

// Admin only routes
router.get('/admin/users', authenticate, authorize('admin'), (req, res) => {
    res.json({ message: 'Admin access granted' });
});

export default router;