const db = require('../config/database');

const Student = {
  // Get student by ID with college info
  getStudentById: async (studentId) => {
    const result = await db.query(
      `SELECT s.*, c.name as college_name, c.college_id 
       FROM students s 
       JOIN colleges c ON s.college_id = c.college_id 
       WHERE s.student_id = $1`,
      [studentId]
    );
    return result.rows[0];
  },

  // Get all students by college
  getStudentsByCollege: async (collegeId) => {
    const result = await db.query(
      'SELECT * FROM students WHERE college_id = $1 ORDER BY student_id',
      [collegeId]
    );
    return result.rows;
  },

  // Create new student
  createStudent: async (name, collegeId) => {
    const result = await db.query(
      'INSERT INTO students (name, college_id) VALUES ($1, $2) RETURNING *',
      [name, collegeId]
    );
    return result.rows[0];
  },

  // Check if student exists
  studentExists: async (studentId) => {
    const result = await db.query(
      'SELECT EXISTS(SELECT 1 FROM students WHERE student_id = $1)',
      [studentId]
    );
    return result.rows[0].exists;
  },
};

module.exports = Student;




