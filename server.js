const app = require('./app');
const db = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Initialize database on startup
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('Database connection established');

    // Initialize database schema (uncomment if you want to auto-initialize)
    // await db.initDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await db.closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await db.closePool();
  process.exit(0);
});

startServer();

