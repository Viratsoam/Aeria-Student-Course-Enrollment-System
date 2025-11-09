const db = require('../config/database');

const Enrollment = {
  // Get all enrollments for a student
  getEnrollmentsByStudent: async (studentId) => {
    const result = await db.query(
      `SELECT e.*, c.code as course_code, c.course_id, c.college_id 
       FROM enrollments e 
       JOIN courses c ON e.course_id = c.course_id 
       WHERE e.student_id = $1 
       ORDER BY e.created_at`,
      [studentId]
    );
    return result.rows;
  },

  // Create single enrollment
  createEnrollment: async (studentId, courseId) => {
    const result = await db.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) RETURNING *',
      [studentId, courseId]
    );
    return result.rows[0];
  },

  // Create multiple enrollments (bulk insert)
  createEnrollments: async (studentId, courseIds) => {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }

    const values = courseIds.map((_, index) => {
      const num = index * 2 + 1;
      return `($${num}, $${num + 1})`;
    }).join(', ');

    const params = courseIds.flatMap(courseId => [studentId, courseId]);
    const query = `INSERT INTO enrollments (student_id, course_id) VALUES ${values} RETURNING *`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Delete enrollment
  deleteEnrollment: async (studentId, courseId) => {
    const result = await db.query(
      'DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2 RETURNING *',
      [studentId, courseId]
    );
    return result.rows[0];
  },

  // Check if student is already enrolled in any of these courses
  checkExistingEnrollments: async (studentId, courseIds) => {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }
    const result = await db.query(
      'SELECT course_id FROM enrollments WHERE student_id = $1 AND course_id = ANY($2::int[])',
      [studentId, courseIds]
    );
    return result.rows.map(row => row.course_id);
  },
};

module.exports = Enrollment;




