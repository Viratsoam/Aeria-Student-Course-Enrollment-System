const Student = require('../models/Student');
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const Enrollment = require('../models/Enrollment');
const { checkTimetableClashes, timesOverlap } = require('../utils/timeUtils');

const EnrollmentService = {
  /**
   * Main function to save student course selection
   * @param {number} studentId - Student ID
   * @param {number[]} courseIds - Array of course IDs to enroll in
   * @returns {Object} Result object with success status and data/message
   */
  saveStudentCourseSelection: async (studentId, courseIds) => {
    try {
      // Edge case: Empty course list
      if (!courseIds || courseIds.length === 0) {
        return {
          success: false,
          error: 'Course list cannot be empty',
        };
      }

      // Edge case: Invalid student ID
      if (!studentId || typeof studentId !== 'number') {
        return {
          success: false,
          error: 'Invalid student ID',
        };
      }

      // Validate student exists
      const student = await Student.getStudentById(studentId);
      if (!student) {
        return {
          success: false,
          error: `Student with ID ${studentId} does not exist`,
        };
      }

      // Validate all courses exist
      const courses = await Course.getCoursesByIds(courseIds);
      if (courses.length !== courseIds.length) {
        const foundCourseIds = courses.map(c => c.course_id);
        const missingCourseIds = courseIds.filter(id => !foundCourseIds.includes(id));
        return {
          success: false,
          error: `Courses with IDs ${missingCourseIds.join(', ')} do not exist`,
        };
      }

      // Validate same college
      const studentCollegeId = student.college_id;
      const invalidCourses = courses.filter(c => c.college_id !== studentCollegeId);
      if (invalidCourses.length > 0) {
        return {
          success: false,
          error: `Courses ${invalidCourses.map(c => c.code).join(', ')} do not belong to the same college as the student`,
        };
      }

      // Check for existing enrollments
      const existingEnrollments = await Enrollment.checkExistingEnrollments(studentId, courseIds);
      if (existingEnrollments.length > 0) {
        return {
          success: false,
          error: `Student is already enrolled in courses with IDs: ${existingEnrollments.join(', ')}`,
        };
      }

      // Get currently enrolled courses (to check for clashes with new courses)
      const currentEnrollments = await Enrollment.getEnrollmentsByStudent(studentId);
      const currentCourseIds = currentEnrollments.map(e => e.course_id);

      // Combine current and new courses to check all timetables
      const allCourseIds = [...new Set([...currentCourseIds, ...courseIds])];
      
      // Get all timetables for all courses
      const allTimetables = await Timetable.getTimetablesByCourses(allCourseIds);

      // Group timetables by course
      const timetablesByCourse = {};
      allTimetables.forEach(t => {
        if (!timetablesByCourse[t.course_id]) {
          timetablesByCourse[t.course_id] = [];
        }
        timetablesByCourse[t.course_id].push(t);
      });

      // Check for clashes between new courses and existing enrollments
      const newCourseTimetables = allTimetables.filter(t => courseIds.includes(t.course_id));
      const existingCourseTimetables = allTimetables.filter(t => currentCourseIds.includes(t.course_id));

      // Check clashes within new courses
      const newCourseClashes = checkTimetableClashes(newCourseTimetables);
      if (newCourseClashes.length > 0) {
        return {
          success: false,
          error: `Timetable clash detected in selected courses: ${newCourseClashes[0].message}`,
          conflicts: newCourseClashes,
        };
      }

      // Check clashes between new courses and existing enrollments
      for (const newTimetable of newCourseTimetables) {
        for (const existingTimetable of existingCourseTimetables) {
          if (timesOverlap(
            newTimetable.day_of_week,
            newTimetable.start_time,
            newTimetable.end_time,
            existingTimetable.day_of_week,
            existingTimetable.start_time,
            existingTimetable.end_time
          )) {
            const newCourse = courses.find(c => c.course_id === newTimetable.course_id);
            const existingCourse = courses.find(c => c.course_id === existingTimetable.course_id) ||
              currentEnrollments.find(e => e.course_id === existingTimetable.course_id);
            
            return {
              success: false,
              error: `Timetable clash: ${newCourse.code} (${newTimetable.day_of_week} ${newTimetable.start_time}-${newTimetable.end_time}) conflicts with existing enrollment ${existingCourse.course_code || existingCourse.code} (${existingTimetable.day_of_week} ${existingTimetable.start_time}-${existingTimetable.end_time})`,
            };
          }
        }
      }

      // All validations passed, save enrollments
      const enrollments = await Enrollment.createEnrollments(studentId, courseIds);

      return {
        success: true,
        message: `Successfully enrolled student ${studentId} in ${courseIds.length} course(s)`,
        data: {
          studentId,
          enrollments,
          courses: courses.map(c => ({ course_id: c.course_id, code: c.code })),
        },
      };
    } catch (error) {
      // Handle database constraint violations
      if (error.message.includes('Timetable clash')) {
        return {
          success: false,
          error: error.message,
        };
      }
      if (error.message.includes('same college')) {
        return {
          success: false,
          error: error.message,
        };
      }
      
      console.error('Error in saveStudentCourseSelection:', error);
      return {
        success: false,
        error: 'An error occurred while processing enrollment',
        details: error.message,
      };
    }
  },

  // Get student's enrolled courses
  getStudentEnrolledCourses: async (studentId) => {
    try {
      const student = await Student.getStudentById(studentId);
      if (!student) {
        return {
          success: false,
          error: `Student with ID ${studentId} does not exist`,
        };
      }

      const enrollments = await Enrollment.getEnrollmentsByStudent(studentId);
      const courseIds = enrollments.map(e => e.course_id);
      const timetables = await Timetable.getTimetablesByCourses(courseIds);

      // Group timetables by course
      const timetablesByCourse = {};
      timetables.forEach(t => {
        if (!timetablesByCourse[t.course_id]) {
          timetablesByCourse[t.course_id] = [];
        }
        timetablesByCourse[t.course_id].push(t);
      });

      const coursesWithTimetables = enrollments.map(enrollment => ({
        enrollment_id: enrollment.enrollment_id,
        course_id: enrollment.course_id,
        course_code: enrollment.course_code,
        created_at: enrollment.created_at,
        timetables: timetablesByCourse[enrollment.course_id] || [],
      }));

      return {
        success: true,
        data: {
          student: {
            student_id: student.student_id,
            name: student.name,
            college_id: student.college_id,
            college_name: student.college_name,
          },
          enrollments: coursesWithTimetables,
        },
      };
    } catch (error) {
      console.error('Error in getStudentEnrolledCourses:', error);
      return {
        success: false,
        error: 'An error occurred while fetching enrollments',
        details: error.message,
      };
    }
  },
};

module.exports = EnrollmentService;




