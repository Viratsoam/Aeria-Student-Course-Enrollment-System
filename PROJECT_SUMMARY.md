# Project Summary: Aeria Student Course Enrollment System

## Overview
This is a Node.js/Express backend system for managing student course enrollments with automatic timetable conflict detection. The system ensures students can only enroll in courses from their college and prevents timetable clashes through both application-level and database-level validation.

## Architecture
The project follows a layered architecture pattern:
- **Routes**: Define API endpoints and request validation
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and validation
- **Models**: Database queries and data access
- **Utils**: Helper functions (time utilities)
- **Config**: Database configuration
- **Middleware**: Error handling and request processing

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Validation**: express-validator
- **Environment**: dotenv

## File Structure and Purpose

### Configuration Files
- **package.json**: Project dependencies and npm scripts
- **.env**: Environment variables (database credentials, port) - *Create this file*
- **.gitignore**: Files to exclude from version control

### Database
- **schema.sql**: Complete database schema with:
  - Tables: colleges, students, courses, timetables, enrollments
  - Foreign key constraints
  - Unique constraints
  - Check constraints
  - Triggers for timetable clash prevention
  - Functions for time overlap detection

### Configuration
- **config/database.js**: 
  - PostgreSQL connection pool setup
  - Database initialization function
  - Query execution wrapper
  - Connection management

### Models (Data Access Layer)
- **models/College.js**: 
  - `getCollegeById()` - Fetch college by ID
  - `getAllColleges()` - Get all colleges
  - `createCollege()` - Create new college
  - `collegeExists()` - Check if college exists

- **models/Student.js**: 
  - `getStudentById()` - Fetch student with college information
  - `getStudentsByCollege()` - Get all students in a college
  - `createStudent()` - Create new student
  - `studentExists()` - Check if student exists

- **models/Course.js**: 
  - `getCourseById()` - Fetch course with college information
  - `getCoursesByIds()` - Fetch multiple courses by IDs
  - `getCoursesByCollege()` - Get all courses in a college
  - `createCourse()` - Create new course
  - `courseExists()` - Check if course exists

- **models/Timetable.js**: 
  - `getTimetablesByCourse()` - Get all timetables for a course
  - `getTimetablesByCourses()` - Get timetables for multiple courses
  - `getTimetableById()` - Get single timetable
  - `createTimetable()` - Create new timetable
  - `updateTimetable()` - Update timetable
  - `deleteTimetable()` - Delete timetable

- **models/Enrollment.js**: 
  - `getEnrollmentsByStudent()` - Get all enrollments for a student
  - `createEnrollment()` - Create single enrollment
  - `createEnrollments()` - Bulk create enrollments
  - `deleteEnrollment()` - Delete enrollment
  - `checkExistingEnrollments()` - Check if already enrolled

### Services (Business Logic Layer)
- **services/enrollmentService.js**: 
  - **Main Function**: `saveStudentCourseSelection(studentId, courseIds)`
    - Validates student exists
    - Validates all courses exist
    - Ensures same college constraint
    - Checks for duplicate enrollments
    - Detects timetable clashes (within new courses and with existing enrollments)
    - Handles edge cases (empty lists, invalid IDs)
    - Returns structured success/error responses
  
  - **Helper Function**: `getStudentEnrolledCourses(studentId)`
    - Fetches student information
    - Retrieves all enrollments with timetables
    - Returns formatted response

- **services/timetableService.js**: 
  - **Admin Functions**:
    - `addTimetable()` - Add timetable with validation
    - `updateTimetable()` - Update timetable (database trigger checks conflicts)
    - `removeTimetable()` - Delete timetable
  - Validates course exists
  - Validates day of week and time format
  - Checks for conflicts with existing timetables

### Controllers (HTTP Layer)
- **controllers/enrollmentController.js**: 
  - `enrollStudent()` - POST endpoint handler for enrollment
  - `getStudentEnrollments()` - GET endpoint handler for student enrollments
  - Handles validation errors
  - Returns appropriate HTTP status codes

- **controllers/adminController.js**: 
  - `addTimetable()` - POST endpoint for adding timetables
  - `updateTimetable()` - PUT endpoint for updating timetables
  - `deleteTimetable()` - DELETE endpoint for removing timetables
  - Handles validation and errors

### Routes
- **routes/enrollmentRoutes.js**: 
  - POST `/api/enrollments` - Enroll student in courses
  - GET `/api/enrollments/student/:studentId` - Get student enrollments
  - Includes express-validator validation rules

- **routes/adminRoutes.js**: 
  - POST `/api/admin/timetables` - Add timetable
  - PUT `/api/admin/timetables/:timetableId` - Update timetable
  - DELETE `/api/admin/timetables/:timetableId` - Delete timetable
  - Includes validation for timetable data

### Utilities
- **utils/timeUtils.js**: 
  - `parseTime()` - Convert "HH:MM" to minutes since midnight
  - `formatTime()` - Convert minutes to "HH:MM" format
  - `timesOverlap()` - Check if two time slots overlap on the same day
  - `checkTimetableClashes()` - Check for clashes in an array of timetables

### Middleware
- **middleware/errorHandler.js**: 
  - Centralized error handling
  - Handles PostgreSQL error codes
  - Returns consistent error format
  - Includes stack trace in development mode

- **middleware/validation.js**: 
  - Placeholder for additional validation middleware
  - Currently using express-validator in routes

### Application Files
- **app.js**: 
  - Express app configuration
  - Middleware setup (cors, body-parser, logging)
  - Route registration
  - Health check endpoint
  - 404 handler
  - Error handling middleware

- **server.js**: 
  - Server entry point
  - Database connection test
  - Server startup
  - Graceful shutdown handling

## Database Schema

### Tables

1. **colleges**
   - `college_id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR(255) UNIQUE)
   - `created_at` (TIMESTAMP)

2. **students**
   - `student_id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR(255))
   - `college_id` (INTEGER, FOREIGN KEY)
   - `created_at` (TIMESTAMP)
   - Unique constraint: (name, college_id)

3. **courses**
   - `course_id` (SERIAL PRIMARY KEY)
   - `code` (VARCHAR(50))
   - `college_id` (INTEGER, FOREIGN KEY)
   - `created_at` (TIMESTAMP)
   - Unique constraint: (code, college_id)

4. **timetables**
   - `timetable_id` (SERIAL PRIMARY KEY)
   - `course_id` (INTEGER, FOREIGN KEY)
   - `day_of_week` (VARCHAR(20), CHECK constraint)
   - `start_time` (TIME)
   - `end_time` (TIME)
   - `created_at` (TIMESTAMP)
   - Check constraint: end_time > start_time

5. **enrollments**
   - `enrollment_id` (SERIAL PRIMARY KEY)
   - `student_id` (INTEGER, FOREIGN KEY)
   - `course_id` (INTEGER, FOREIGN KEY)
   - `created_at` (TIMESTAMP)
   - Unique constraint: (student_id, course_id)

### Constraints

- **Foreign Keys**: Ensure referential integrity
- **Unique Constraints**: Prevent duplicate enrollments and duplicate names/codes per college
- **Check Constraints**: Validate day of week and time ranges
- **Indexes**: Improve query performance on frequently queried columns

### Triggers and Functions

1. **times_overlap()**: PostgreSQL function to check if two time slots overlap
2. **check_enrollment_timetable_clash()**: Trigger function that prevents timetable clashes when enrolling
3. **validate_same_college()**: Trigger function that ensures student and course belong to same college
4. **check_timetable_update_conflicts()**: Trigger function that prevents timetable updates that would cause conflicts

## Key Features

### 1. Enrollment Validation
- ✅ Student existence check
- ✅ Course existence check
- ✅ Same college validation
- ✅ Timetable clash detection (application-level and database-level)
- ✅ Duplicate enrollment prevention
- ✅ Edge case handling (empty lists, invalid IDs)

### 2. Database-Level Constraints
- ✅ Foreign key constraints
- ✅ Unique constraints
- ✅ Check constraints
- ✅ Triggers for clash prevention
- ✅ Same college validation trigger

### 3. Admin Functionality
- ✅ Add timetable
- ✅ Edit timetable
- ✅ Delete timetable
- ✅ Conflict detection for timetable updates
- ✅ Prevents conflicts with enrolled students

## API Endpoints Summary

### Enrollment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/enrollments` | Enroll student in courses |
| GET | `/api/enrollments/student/:studentId` | Get student's enrollments |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/timetables` | Add timetable |
| PUT | `/api/admin/timetables/:timetableId` | Update timetable |
| DELETE | `/api/admin/timetables/:timetableId` | Delete timetable |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Error Handling

All endpoints return consistent JSON error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional details (optional)"
}
```

Common error scenarios:
- Validation errors (400)
- Not found errors (404)
- Conflict errors (400/409)
- Database errors (500)

## Testing Considerations

Test scenarios to verify:
1. ✅ Valid enrollments
2. ✅ Timetable clash detection
3. ✅ Same college validation
4. ✅ Invalid student/course IDs
5. ✅ Empty course lists
6. ✅ Duplicate enrollments
7. ✅ Admin timetable operations
8. ✅ Conflict detection on timetable updates

## Future Enhancements

Potential improvements:
- Authentication and authorization
- Rate limiting
- Request logging to file
- API documentation (Swagger/OpenAPI)
- Unit and integration tests
- Data seeding scripts
- Migration scripts for schema changes
- WebSocket support for real-time updates
- Caching layer (Redis)
- Pagination for large result sets

## Development Notes

### Database Connection
- Uses connection pooling for efficiency
- Automatic reconnection on connection loss
- Graceful shutdown closes all connections

### Validation
- Request validation using express-validator
- Database constraints as backup
- Application-level validation for business rules

### Error Messages
- User-friendly error messages
- Detailed error information in development mode
- Consistent error format across all endpoints

---

For setup and running instructions, see **README.md**.

