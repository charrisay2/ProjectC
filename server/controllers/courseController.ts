import { Request, Response } from 'express';
import Course from '../models/Course.ts';
import User from '../models/User.ts';
import Invoice from '../models/Invoice.ts';
import Notification from '../models/Notification.ts';

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Admin/Teacher
export const createCourse = async (req: Request, res: Response) => {
  try {
    const { name, code, teacherId, room, schedule, type, major, targetCohort, credits } = req.body;

    const courseExists = await Course.findOne({ where: { code } });
    if (courseExists) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    const course = await Course.create({
      name,
      code,
      teacherId,
      room,
      schedule,
      type,
      major,
      targetCohort,
      credits: credits || 3,
    });

    const createdCourse = await Course.findByPk(course.id, {
      include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json(createdCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin/Teacher
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (course) {
      course.name = req.body.name || course.name;
      course.code = req.body.code || course.code;
      course.teacherId = req.body.teacherId || course.teacherId;
      course.room = req.body.room || course.room;
      course.schedule = req.body.schedule || course.schedule;
      course.type = req.body.type || course.type;
      course.major = req.body.major || course.major;
      course.targetCohort = req.body.targetCohort || course.targetCohort;
      course.credits = req.body.credits || course.credits;

      await course.save();
      
      const updatedCourse = await Course.findByPk(course.id, {
        include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
      });

      res.json(updatedCourse);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Register for a course
// @route   POST /api/courses/:id/register
// @access  Private/Student
export const registerCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    const studentId = req.user.id;

    if (course) {
      const students = [...course.students];
      if (students.includes(studentId)) {
        return res.status(400).json({ message: 'Already registered for this course' });
      }
      students.push(studentId);
      course.students = students;
      await course.save();

      // Create invoice for the course
      const credits = course.credits || 3;
      let amount = 0;
      if (credits === 2) {
        amount = 1400000;
      } else if (credits === 3) {
        amount = 2100000;
      } else {
        amount = credits * 700000;
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // Due in 14 days

      await Invoice.create({
        studentId,
        title: `Học phí môn ${course.name} (${course.code})`,
        amount,
        dueDate: dueDate.toLocaleDateString('vi-VN'),
        status: 'Unpaid'
      });

      await Notification.create({
        message: `Bạn có hóa đơn học phí mới cho môn ${course.name}`,
        type: 'FEE_REMINDER',
        targetRole: 'STUDENT',
        targetUserId: studentId,
        isRead: false
      });

      const updatedCourse = await Course.findByPk(course.id, {
        include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
      });

      res.json(updatedCourse);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Unregister from a course
// @route   POST /api/courses/:id/unregister
// @access  Private/Student
export const unregisterCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    const studentId = req.user.id;

    if (course) {
      const students = course.students.filter(id => id !== studentId);
      course.students = students;
      await course.save();
      
      // Find and delete the unpaid invoice for this course
      const invoiceTitle = `Học phí môn ${course.name} (${course.code})`;
      await Invoice.destroy({
        where: {
          studentId,
          title: invoiceTitle,
          status: 'Unpaid'
        }
      });

      const updatedCourse = await Course.findByPk(course.id, {
        include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
      });

      res.json(updatedCourse);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    console.log(`Attempting to delete course with ID: ${req.params.id}`);
    const course = await Course.findByPk(req.params.id);

    if (course) {
      await course.destroy();
      console.log(`Course ${req.params.id} deleted successfully`);
      res.json({ message: 'Course removed' });
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
