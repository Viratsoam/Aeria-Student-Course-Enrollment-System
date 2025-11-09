const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const { timesOverlap } = require('../utils/timeUtils');

const TimetableService = {
  /**
   * Add a new timetable for a course
   * @param {number} courseId - Course ID
   * @param {string} dayOfWeek - Day of week
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @returns {Object} Result object
   */
  addTimetable: async (courseId, dayOfWeek, startTime, endTime) => {
    try {
      // Validate course exists
      const course = await Course.getCourseById(courseId);
      if (!course) {
        return {
          success: false,
          error: `Course with ID ${courseId} does not exist`,
        };
      }

      // Validate day of week
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (!validDays.includes(dayOfWeek)) {
        return {
          success: false,
          error: `Invalid day of week. Must be one of: ${validDays.join(', ')}`,
        };
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return {
          success: false,
          error: 'Invalid time format. Use HH:MM format',
        };
      }

      // Check for conflicts with existing timetables for this course
      const existingTimetables = await Timetable.getTimetablesByCourse(courseId);
      for (const existing of existingTimetables) {
        if (timesOverlap(
          dayOfWeek, startTime, endTime,
          existing.day_of_week, existing.start_time, existing.end_time
        )) {
          return {
            success: false,
            error: `Timetable conflicts with existing timetable (${existing.day_of_week} ${existing.start_time}-${existing.end_time})`,
          };
        }
      }

      const timetable = await Timetable.createTimetable(courseId, dayOfWeek, startTime, endTime);

      return {
        success: true,
        message: 'Timetable added successfully',
        data: timetable,
      };
    } catch (error) {
      console.error('Error in addTimetable:', error);
      
      // Handle database constraint violations
      if (error.message.includes('conflict') || error.message.includes('clash')) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An error occurred while adding timetable',
        details: error.message,
      };
    }
  },

  /**
   * Update an existing timetable
   * @param {number} timetableId - Timetable ID
   * @param {string} dayOfWeek - Day of week
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @returns {Object} Result object
   */
  updateTimetable: async (timetableId, dayOfWeek, startTime, endTime) => {
    try {
      // Validate timetable exists
      const existingTimetable = await Timetable.getTimetableById(timetableId);
      if (!existingTimetable) {
        return {
          success: false,
          error: `Timetable with ID ${timetableId} does not exist`,
        };
      }

      // Validate day of week
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (!validDays.includes(dayOfWeek)) {
        return {
          success: false,
          error: `Invalid day of week. Must be one of: ${validDays.join(', ')}`,
        };
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return {
          success: false,
          error: 'Invalid time format. Use HH:MM format',
        };
      }

      // The database trigger will check for conflicts with enrolled students
      const timetable = await Timetable.updateTimetable(timetableId, dayOfWeek, startTime, endTime);

      return {
        success: true,
        message: 'Timetable updated successfully',
        data: timetable,
      };
    } catch (error) {
      console.error('Error in updateTimetable:', error);
      
      // Handle database constraint violations
      if (error.message.includes('conflict') || error.message.includes('clash') || 
          error.message.includes('would cause conflict')) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An error occurred while updating timetable',
        details: error.message,
      };
    }
  },

  /**
   * Delete a timetable
   * @param {number} timetableId - Timetable ID
   * @returns {Object} Result object
   */
  removeTimetable: async (timetableId) => {
    try {
      const timetable = await Timetable.getTimetableById(timetableId);
      if (!timetable) {
        return {
          success: false,
          error: `Timetable with ID ${timetableId} does not exist`,
        };
      }

      await Timetable.deleteTimetable(timetableId);

      return {
        success: true,
        message: 'Timetable removed successfully',
      };
    } catch (error) {
      console.error('Error in removeTimetable:', error);
      return {
        success: false,
        error: 'An error occurred while removing timetable',
        details: error.message,
      };
    }
  },
};

module.exports = TimetableService;

