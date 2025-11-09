const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const EnrollmentController = require('../controllers/enrollmentController');

// Validation rules for enrollment
const enrollmentValidation = [
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  body('courseIds')
    .isArray({ min: 1 })
    .withMessage('Course IDs must be a non-empty array')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('Course IDs must be an array');
      }
      if (value.length === 0) {
        throw new Error('At least one course ID is required');
      }
      value.forEach((id, index) => {
        if (!Number.isInteger(id) || id < 1) {
          throw new Error(`Course ID at index ${index} must be a positive integer`);
        }
      });
      return true;
    }),
];

// POST /api/enrollments - Enroll student in courses
router.post('/', enrollmentValidation, EnrollmentController.enrollStudent);

// GET /api/enrollments/student/:studentId - Get student's enrollments
router.get('/student/:studentId', EnrollmentController.getStudentEnrollments);

module.exports = router;

