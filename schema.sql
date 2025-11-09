-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS times_overlap(VARCHAR, TIME, TIME, VARCHAR, TIME, TIME) CASCADE;
DROP FUNCTION IF EXISTS check_enrollment_timetable_clash() CASCADE;
DROP FUNCTION IF EXISTS validate_same_college() CASCADE;
DROP FUNCTION IF EXISTS check_timetable_update_conflicts() CASCADE;

-- Colleges table
CREATE TABLE colleges (
    college_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    college_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE,
    CONSTRAINT unique_student_name_per_college UNIQUE (name, college_id)
);

-- Courses table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    college_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE,
    CONSTRAINT unique_course_code_per_college UNIQUE (code, college_id)
);

-- Timetables table
CREATE TABLE timetables (
    timetable_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enrollments table
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT unique_student_course UNIQUE (student_id, course_id)
);

-- Indexes for better query performance
CREATE INDEX idx_students_college_id ON students(college_id);
CREATE INDEX idx_courses_college_id ON courses(college_id);
CREATE INDEX idx_timetables_course_id ON timetables(course_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);

-- Function to check if two time slots overlap on the same day
CREATE OR REPLACE FUNCTION times_overlap(
    day1 VARCHAR,
    start1 TIME,
    end1 TIME,
    day2 VARCHAR,
    start2 TIME,
    end2 TIME
) RETURNS BOOLEAN AS $$
BEGIN
    -- If different days, no overlap
    IF day1 != day2 THEN
        RETURN FALSE;
    END IF;
    
    -- If same day, check time overlap
    -- Times overlap if: start1 < end2 AND start2 < end1
    RETURN (start1 < end2 AND start2 < end1);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to prevent timetable clashes for enrolled students
CREATE OR REPLACE FUNCTION check_enrollment_timetable_clash()
RETURNS TRIGGER AS $$
DECLARE
    student_college_id INTEGER;
    conflicting_course_id INTEGER;
    existing_day VARCHAR;
    existing_start TIME;
    existing_end TIME;
    new_day VARCHAR;
    new_start TIME;
    new_end TIME;
BEGIN
    -- Get the student's college
    SELECT college_id INTO student_college_id
    FROM students
    WHERE student_id = NEW.student_id;
    
    -- Check all existing enrollments for this student
    FOR conflicting_course_id IN
        SELECT e.course_id
        FROM enrollments e
        WHERE e.student_id = NEW.student_id
        AND e.course_id != NEW.course_id
    LOOP
        -- Check each timetable of the conflicting course against new course timetables
        FOR existing_day, existing_start, existing_end IN
            SELECT day_of_week, start_time, end_time
            FROM timetables
            WHERE course_id = conflicting_course_id
        LOOP
            -- Check against all timetables of the new course
            FOR new_day, new_start, new_end IN
                SELECT day_of_week, start_time, end_time
                FROM timetables
                WHERE course_id = NEW.course_id
            LOOP
                -- Check if timetables overlap
                IF times_overlap(
                    existing_day, existing_start, existing_end,
                    new_day, new_start, new_end
                ) THEN
                    RAISE EXCEPTION 'Timetable clash detected: Course % conflicts with course % on % between % and %',
                        conflicting_course_id, NEW.course_id, new_day, new_start, new_end;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check timetable clashes on enrollment insert
CREATE TRIGGER enrollment_timetable_clash_check
BEFORE INSERT ON enrollments
FOR EACH ROW
EXECUTE FUNCTION check_enrollment_timetable_clash();

-- Function to validate student and course are from same college
CREATE OR REPLACE FUNCTION validate_same_college()
RETURNS TRIGGER AS $$
DECLARE
    student_college_id INTEGER;
    course_college_id INTEGER;
BEGIN
    SELECT college_id INTO student_college_id
    FROM students
    WHERE student_id = NEW.student_id;
    
    SELECT college_id INTO course_college_id
    FROM courses
    WHERE course_id = NEW.course_id;
    
    IF student_college_id != course_college_id THEN
        RAISE EXCEPTION 'Student and course must belong to the same college. Student college: %, Course college: %',
            student_college_id, course_college_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate same college constraint
CREATE TRIGGER enrollment_same_college_check
BEFORE INSERT ON enrollments
FOR EACH ROW
EXECUTE FUNCTION validate_same_college();

-- Trigger to prevent timetable updates that cause conflicts
CREATE OR REPLACE FUNCTION check_timetable_update_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    enrolled_student_id INTEGER;
    student_enrolled_courses INTEGER[];
    conflict_course_id INTEGER;
    conflict_day VARCHAR;
    conflict_start TIME;
    conflict_end TIME;
BEGIN
    -- Get all students enrolled in this course
    FOR enrolled_student_id IN
        SELECT DISTINCT student_id
        FROM enrollments
        WHERE course_id = NEW.course_id
    LOOP
        -- Get all other courses this student is enrolled in
        SELECT ARRAY_AGG(course_id) INTO student_enrolled_courses
        FROM enrollments
        WHERE student_id = enrolled_student_id
        AND course_id != NEW.course_id;
        
        -- Check each enrolled course for conflicts
        IF student_enrolled_courses IS NOT NULL THEN
            FOREACH conflict_course_id IN ARRAY student_enrolled_courses
            LOOP
                SELECT day_of_week, start_time, end_time 
                INTO conflict_day, conflict_start, conflict_end
                FROM timetables
                WHERE course_id = conflict_course_id
                AND day_of_week = NEW.day_of_week;
                
                -- Check if times overlap
                IF conflict_day IS NOT NULL AND
                   times_overlap(
                       conflict_day, conflict_start, conflict_end,
                       NEW.day_of_week, NEW.start_time, NEW.end_time
                   ) THEN
                    RAISE EXCEPTION 'Timetable update would cause conflict for student % with course %',
                        enrolled_student_id, conflict_course_id;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check conflicts on timetable update
CREATE TRIGGER timetable_update_conflict_check
BEFORE UPDATE ON timetables
FOR EACH ROW
EXECUTE FUNCTION check_timetable_update_conflicts();




