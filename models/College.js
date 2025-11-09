const db = require('../config/database');

const College = {
  // Get college by ID
  getCollegeById: async (collegeId) => {
    const result = await db.query(
      'SELECT * FROM colleges WHERE college_id = $1',
      [collegeId]
    );
    return result.rows[0];
  },

  // Get all colleges
  getAllColleges: async () => {
    const result = await db.query('SELECT * FROM colleges ORDER BY college_id');
    return result.rows;
  },

  // Create new college
  createCollege: async (name) => {
    const result = await db.query(
      'INSERT INTO colleges (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  },

  // Check if college exists
  collegeExists: async (collegeId) => {
    const result = await db.query(
      'SELECT EXISTS(SELECT 1 FROM colleges WHERE college_id = $1)',
      [collegeId]
    );
    return result.rows[0].exists;
  },
};

module.exports = College;




