const EnrollmentService = require('../services/enrollmentService');
const { validationResult } = require('express-validator');

const EnrollmentController = {
  // Enroll student in courses
  enrollStudent: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { studentId, courseIds } = req.body;

      const result = await EnrollmentService.saveStudentCourseSelection(
        parseInt(studentId),
        courseIds.map(id => parseInt(id))
      );

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in enrollStudent controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    }
  },

  // Get student's enrollments
  getStudentEnrollments: async (req, res) => {
    try {
      const { studentId } = req.params;

      if (!studentId || isNaN(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID',
        });
      }

      const result = await EnrollmentService.getStudentEnrolledCourses(parseInt(studentId));

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in getStudentEnrollments controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    }
  },
};

module.exports = EnrollmentController;

