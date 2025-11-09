const db = require('../config/database');

const Timetable = {
  // Get all timetables for a course
  getTimetablesByCourse: async (courseId) => {
    const result = await db.query(
      'SELECT * FROM timetables WHERE course_id = $1 ORDER BY day_of_week, start_time',
      [courseId]
    );
    return result.rows;
  },

  // Get timetables for multiple courses
  getTimetablesByCourses: async (courseIds) => {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }
    const result = await db.query(
      'SELECT * FROM timetables WHERE course_id = ANY($1::int[]) ORDER BY course_id, day_of_week, start_time',
      [courseIds]
    );
    return result.rows;
  },

  // Get timetable by ID
  getTimetableById: async (timetableId) => {
    const result = await db.query(
      'SELECT * FROM timetables WHERE timetable_id = $1',
      [timetableId]
    );
    return result.rows[0];
  },

  // Create new timetable
  createTimetable: async (courseId, dayOfWeek, startTime, endTime) => {
    const result = await db.query(
      'INSERT INTO timetables (course_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [courseId, dayOfWeek, startTime, endTime]
    );
    return result.rows[0];
  },

  // Update timetable
  updateTimetable: async (timetableId, dayOfWeek, startTime, endTime) => {
    const result = await db.query(
      'UPDATE timetables SET day_of_week = $1, start_time = $2, end_time = $3 WHERE timetable_id = $4 RETURNING *',
      [dayOfWeek, startTime, endTime, timetableId]
    );
    return result.rows[0];
  },

  // Delete timetable
  deleteTimetable: async (timetableId) => {
    const result = await db.query(
      'DELETE FROM timetables WHERE timetable_id = $1 RETURNING *',
      [timetableId]
    );
    return result.rows[0];
  },
};

module.exports = Timetable;




