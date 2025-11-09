const db = require('../config/database');

const Course = {
  // Get course by ID with college info
  getCourseById: async (courseId) => {
    const result = await db.query(
      `SELECT c.*, col.name as college_name, col.college_id 
       FROM courses c 
       JOIN colleges col ON c.college_id = col.college_id 
       WHERE c.course_id = $1`,
      [courseId]
    );
    return result.rows[0];
  },

  // Get multiple courses by IDs
  getCoursesByIds: async (courseIds) => {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }
    const result = await db.query(
      `SELECT c.*, col.name as college_name, col.college_id 
       FROM courses c 
       JOIN colleges col ON c.college_id = col.college_id 
       WHERE c.course_id = ANY($1::int[])`,
      [courseIds]
    );
    return result.rows;
  },

  // Get all courses by college
  getCoursesByCollege: async (collegeId) => {
    const result = await db.query(
      'SELECT * FROM courses WHERE college_id = $1 ORDER BY course_id',
      [collegeId]
    );
    return result.rows;
  },

  // Create new course
  createCourse: async (code, collegeId) => {
    const result = await db.query(
      'INSERT INTO courses (code, college_id) VALUES ($1, $2) RETURNING *',
      [code, collegeId]
    );
    return result.rows[0];
  },

  // Check if course exists
  courseExists: async (courseId) => {
    const result = await db.query(
      'SELECT EXISTS(SELECT 1 FROM courses WHERE course_id = $1)',
      [courseId]
    );
    return result.rows[0].exists;
  },
};

module.exports = Course;




