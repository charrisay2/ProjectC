import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.ts';
import { protect, authorize } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.route('/')
  .get(protect, authorize('ADMIN'), getUsers)
  .post(protect, authorize('ADMIN'), createUser);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateUser)
  .delete(protect, authorize('ADMIN'), deleteUser);

export default router;
