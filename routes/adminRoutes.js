const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AdminController = require('../controllers/adminController');

// Validation rules for timetable
const timetableValidation = [
  body('courseId')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer'),
  body('dayOfWeek')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Day of week must be a valid day'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/)
    .withMessage('End time must be in HH:MM format'),
];

// POST /api/admin/timetables - Add timetable
router.post('/timetables', timetableValidation, AdminController.addTimetable);

// PUT /api/admin/timetables/:timetableId - Update timetable
router.put('/timetables/:timetableId', timetableValidation, AdminController.updateTimetable);

// DELETE /api/admin/timetables/:timetableId - Delete timetable
router.delete('/timetables/:timetableId', AdminController.deleteTimetable);

module.exports = router;

