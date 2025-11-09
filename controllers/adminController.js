const TimetableService = require('../services/timetableService');
const { validationResult } = require('express-validator');

const AdminController = {
  // Add timetable
  addTimetable: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { courseId, dayOfWeek, startTime, endTime } = req.body;

      const result = await TimetableService.addTimetable(
        parseInt(courseId),
        dayOfWeek,
        startTime,
        endTime
      );

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in addTimetable controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    }
  },

  // Update timetable
  updateTimetable: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { timetableId } = req.params;
      const { dayOfWeek, startTime, endTime } = req.body;

      if (!timetableId || isNaN(timetableId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid timetable ID',
        });
      }

      const result = await TimetableService.updateTimetable(
        parseInt(timetableId),
        dayOfWeek,
        startTime,
        endTime
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in updateTimetable controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    }
  },

  // Delete timetable
  deleteTimetable: async (req, res) => {
    try {
      const { timetableId } = req.params;

      if (!timetableId || isNaN(timetableId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid timetable ID',
        });
      }

      const result = await TimetableService.removeTimetable(parseInt(timetableId));

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in deleteTimetable controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    }
  },
};

module.exports = AdminController;

