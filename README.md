# Aeria Student Course Enrollment System

A Node.js/Express backend system for managing student course enrollments with automatic timetable conflict detection. The system ensures students can only enroll in courses from their college and prevents timetable clashes.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Assignment Requirements](#assignment-requirements)

## 🎯 Overview

This backend system manages:
- **Colleges**: Multiple colleges onboarded onto the platform
- **Students**: Students enrolled in colleges
- **Courses**: Courses offered by each college (e.g., CS101, MA204, AP105)
- **Timetables**: Schedule for each course (day, start time, end time)
- **Enrollments**: Student course selections with automatic conflict detection

### Key Features

✅ **Enrollment Validation**
- Verifies student and courses exist
- Ensures student and courses belong to the same college
- Detects and prevents timetable clashes
- Handles edge cases (empty lists, invalid IDs, duplicate enrollments)

✅ **Database-Level Constraints**
- Foreign key constraints for referential integrity
- Unique constraints to prevent duplicates
- Check constraints for data validation
- Database triggers to prevent timetable clashes at the database level

✅ **Admin Functionality**
- Add, edit, and remove course timetables
- Automatic conflict detection for timetable updates
- Prevents updates that would cause clashes for enrolled students

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for cloning)

## 📦 Installation

### 1. Clone or Download the Repository

```bash
# If using Git
git clone <repository-url>
cd Aeria-Student-Course-Enrollment-System

# Or download and extract the ZIP file
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- `express` - Web framework
- `pg` - PostgreSQL client
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `express-validator` - Request validation

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE enrollment_system;

# Exit PostgreSQL
\q
```

### 2. Initialize Database Schema

Run the SQL schema file to create all tables, constraints, and triggers:

```bash
# Using psql command line
psql -U postgres -d enrollment_system -f schema.sql
```

Or manually execute the SQL file:
1. Open `schema.sql` in a text editor
2. Copy the entire contents
3. Run it in your PostgreSQL client (pgAdmin, DBeaver, etc.)

The schema includes:
- Tables: `colleges`, `students`, `courses`, `timetables`, `enrollments`
- Foreign key constraints
- Unique constraints
- Check constraints
- Triggers for clash prevention
- Functions for time overlap detection

### 3. Verify Database Setup

```bash
# Connect to the database
psql -U postgres -d enrollment_system

# List all tables
\dt

# Exit
\q
```

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example` if provided):

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enrollment_system
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Important**: Update the database credentials to match your PostgreSQL setup.

### 2. Update Database Credentials

Edit the `.env` file with your PostgreSQL credentials:
- `DB_USER`: Your PostgreSQL username (default: `postgres`)
- `DB_PASSWORD`: Your PostgreSQL password
- `DB_NAME`: Database name (default: `enrollment_system`)
- `DB_HOST`: Database host (default: `localhost`)
- `DB_PORT`: Database port (default: `5432`)

## ▶️ Running the Project

### Development Mode (with auto-reload)

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

### Production Mode

```bash
npm start
```

### Verify Server is Running

Once started, you should see:
```
Connected to PostgreSQL database
Server is running on port 3000
Environment: development
```

### Test the Health Endpoint

Open your browser or use curl:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Enrollment Endpoints

#### 1. Enroll Student in Courses

**POST** `/api/enrollments`

Enroll a student in one or more courses with automatic validation.

**Request Body:**
```json
{
  "studentId": 1,
  "courseIds": [1, 2, 3]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully enrolled student 1 in 3 course(s)",
  "data": {
    "studentId": 1,
    "enrollments": [...],
    "courses": [
      { "course_id": 1, "code": "CS101" },
      { "course_id": 2, "code": "MA204" },
      { "course_id": 3, "code": "AP105" }
    ]
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Timetable clash detected: Course CS101 (Monday 09:00-10:00) conflicts with existing enrollment MA204 (Monday 09:00-10:00)"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "courseIds": [1, 2, 3]
  }'
```

#### 2. Get Student Enrollments

**GET** `/api/enrollments/student/:studentId`

Get all enrollments for a specific student.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "student": {
      "student_id": 1,
      "name": "John Doe",
      "college_id": 1,
      "college_name": "MIT"
    },
    "enrollments": [
      {
        "enrollment_id": 1,
        "course_id": 1,
        "course_code": "CS101",
        "created_at": "2024-01-01T12:00:00.000Z",
        "timetables": [
          {
            "timetable_id": 1,
            "day_of_week": "Monday",
            "start_time": "09:00:00",
            "end_time": "10:00:00"
          }
        ]
      }
    ]
  }
}
```

**Example using curl:**
```bash
curl http://localhost:3000/api/enrollments/student/1
```

### Admin Endpoints

#### 1. Add Timetable

**POST** `/api/admin/timetables`

Add a new timetable for a course.

**Request Body:**
```json
{
  "courseId": 1,
  "dayOfWeek": "Monday",
  "startTime": "09:00",
  "endTime": "10:00"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/admin/timetables \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": 1,
    "dayOfWeek": "Monday",
    "startTime": "09:00",
    "endTime": "10:00"
  }'
```

#### 2. Update Timetable

**PUT** `/api/admin/timetables/:timetableId`

Update an existing timetable.

**Request Body:**
```json
{
  "dayOfWeek": "Tuesday",
  "startTime": "10:00",
  "endTime": "11:00"
}
```

**Example using curl:**
```bash
curl -X PUT http://localhost:3000/api/admin/timetables/1 \
  -H "Content-Type: application/json" \
  -d '{
    "dayOfWeek": "Tuesday",
    "startTime": "10:00",
    "endTime": "11:00"
  }'
```

#### 3. Delete Timetable

**DELETE** `/api/admin/timetables/:timetableId`

Delete a timetable.

**Example using curl:**
```bash
curl -X DELETE http://localhost:3000/api/admin/timetables/1
```

## 📁 Project Structure

```
Aeria-Student-Course-Enrollment-System/
├── README.md                    # This file
├── package.json                 # Node.js dependencies and scripts
├── .env                         # Environment variables (create this)
├── .gitignore                   # Git ignore rules
├── schema.sql                   # Database schema
├── server.js                    # Server entry point
├── app.js                       # Express app configuration
├── config/
│   └── database.js              # Database connection and queries
├── models/
│   ├── College.js               # College data model
│   ├── Student.js               # Student data model
│   ├── Course.js                # Course data model
│   ├── Timetable.js             # Timetable data model
│   └── Enrollment.js            # Enrollment data model
├── services/
│   ├── enrollmentService.js     # Enrollment business logic
│   └── timetableService.js      # Timetable management (admin)
├── controllers/
│   ├── enrollmentController.js  # Enrollment HTTP handlers
│   └── adminController.js       # Admin HTTP handlers
├── routes/
│   ├── enrollmentRoutes.js      # Enrollment API routes
│   └── adminRoutes.js           # Admin API routes
├── middleware/
│   ├── errorHandler.js          # Error handling middleware
│   └── validation.js            # Request validation
└── utils/
    └── timeUtils.js             # Time overlap utilities
```

## 🧪 Testing the API

### 1. Set Up Sample Data

First, insert some sample data into your database:

```sql
-- Insert a college
INSERT INTO colleges (name) VALUES ('MIT');

-- Insert a student
INSERT INTO students (name, college_id) VALUES ('John Doe', 1);

-- Insert courses
INSERT INTO courses (code, college_id) VALUES ('CS101', 1);
INSERT INTO courses (code, college_id) VALUES ('MA204', 1);
INSERT INTO courses (code, college_id) VALUES ('AP105', 1);

-- Insert timetables
INSERT INTO timetables (course_id, day_of_week, start_time, end_time) 
VALUES (1, 'Monday', '09:00', '10:00');

INSERT INTO timetables (course_id, day_of_week, start_time, end_time) 
VALUES (2, 'Tuesday', '10:00', '11:00');

INSERT INTO timetables (course_id, day_of_week, start_time, end_time) 
VALUES (3, 'Monday', '11:00', '12:00');
```

### 2. Test Enrollment

```bash
# Enroll student 1 in courses 1, 2, 3
curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [1, 2, 3]}'
```

### 3. Test Timetable Clash Detection

Try enrolling in courses with overlapping times:

```bash
# This should fail if there's a clash
curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1, "courseIds": [1, 3]}'
```

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: `Connection refused` or `ECONNREFUSED`

**Solutions**:
1. Verify PostgreSQL is running: `pg_isready` or `sudo service postgresql status`
2. Check database credentials in `.env`
3. Ensure database exists: `psql -U postgres -l`
4. Check PostgreSQL is listening on the correct port

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:
1. Change the port in `.env`: `PORT=3001`
2. Or kill the process using port 3000:
   ```bash
   # Find process
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

### Schema Errors

**Error**: `relation "colleges" does not exist`

**Solutions**:
1. Ensure you've run `schema.sql`
2. Check you're connected to the correct database
3. Verify table names in the schema file

## 📝 Assignment Requirements

### Original Assignment Brief

**Objective**: Design and implement a backend system for a student course enrollment platform using a database and a programming language of your choice. The system manages colleges, students, courses, and course timetables, ensuring students can select courses without timetable conflicts.

### Requirements Implemented

✅ **1. Database Design**
- Tables for colleges, students, courses, timetables, and enrollments
- Foreign key relationships
- Constraints to ensure data integrity
- Triggers for clash prevention

✅ **2. Save Operation for Student Course Selection**
- Function: `saveStudentCourseSelection(studentId, courseIds)`
- Validates student and courses exist
- Ensures same college constraint
- Detects timetable clashes
- Handles edge cases

✅ **3. Bonus: Database Constraints and Admin Functionality**
- Database-level constraints (foreign keys, unique, check)
- Triggers to prevent clashes
- Admin endpoints for timetable management
- Conflict detection for timetable updates

## 📄 License

ISC

## 👤 Author

Backend Development Assignment

---

**Need Help?** Check the `PROJECT_SUMMARY.md` file for detailed technical documentation.
