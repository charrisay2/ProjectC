import { Request, Response } from 'express';
import User from '../models/User.ts';
import bcrypt from 'bcryptjs';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, name, email, phone, address, joinDate, role, avatar, major, cohort } = req.body;

    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      username,
      password,
      name,
      email,
      phone,
      address,
      joinDate,
      role,
      avatar,
      major,
      cohort,
    });

    const userResponse = user.toJSON();
    delete (userResponse as any).password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.address = req.body.address !== undefined ? req.body.address : user.address;
      user.joinDate = req.body.joinDate !== undefined ? req.body.joinDate : user.joinDate;
      user.role = req.body.role || user.role;
      user.avatar = req.body.avatar || user.avatar;
      user.major = req.body.major !== undefined ? req.body.major : user.major;
      user.cohort = req.body.cohort !== undefined ? req.body.cohort : user.cohort;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      
      const userResponse = updatedUser.toJSON();
      delete (userResponse as any).password;

      res.json(userResponse);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
  try {
    console.log(`Attempting to delete user with ID: ${req.params.id}`);
    const user = await User.findByPk(req.params.id);

    if (user) {
      await user.destroy();
      console.log(`User ${req.params.id} deleted successfully`);
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
