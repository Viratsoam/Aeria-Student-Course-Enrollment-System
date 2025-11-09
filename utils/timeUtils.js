/**
 * Parse time string (HH:MM) to minutes since midnight
 * @param {string} timeString - Time in format "HH:MM" or "HH:MM:SS"
 * @returns {number} Minutes since midnight
 */
const parseTime = (timeString) => {
  const parts = timeString.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
};

/**
 * Format minutes to time string (HH:MM)
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in format "HH:MM"
 */
const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Check if two time slots overlap on the same day
 * @param {string} day1 - Day of week for first slot
 * @param {string} start1 - Start time for first slot (HH:MM)
 * @param {string} end1 - End time for first slot (HH:MM)
 * @param {string} day2 - Day of week for second slot
 * @param {string} start2 - Start time for second slot (HH:MM)
 * @param {string} end2 - End time for second slot (HH:MM)
 * @returns {boolean} True if times overlap
 */
const timesOverlap = (day1, start1, end1, day2, start2, end2) => {
  // If different days, no overlap
  if (day1 !== day2) {
    return false;
  }

  // Parse times to minutes
  const start1Minutes = parseTime(start1);
  const end1Minutes = parseTime(end1);
  const start2Minutes = parseTime(start2);
  const end2Minutes = parseTime(end2);

  // Times overlap if: start1 < end2 AND start2 < end1
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
};

/**
 * Check for timetable clashes in an array of timetables
 * @param {Array} timetables - Array of timetable objects with day_of_week, start_time, end_time
 * @returns {Array} Array of conflict objects, empty if no conflicts
 */
const checkTimetableClashes = (timetables) => {
  const conflicts = [];

  for (let i = 0; i < timetables.length; i++) {
    for (let j = i + 1; j < timetables.length; j++) {
      const t1 = timetables[i];
      const t2 = timetables[j];

      if (timesOverlap(
        t1.day_of_week,
        t1.start_time,
        t1.end_time,
        t2.day_of_week,
        t2.start_time,
        t2.end_time
      )) {
        conflicts.push({
          timetable1: t1,
          timetable2: t2,
          message: `Time clash on ${t1.day_of_week}: ${t1.start_time} - ${t1.end_time} overlaps with ${t2.start_time} - ${t2.end_time}`,
        });
      }
    }
  }

  return conflicts;
};

module.exports = {
  parseTime,
  formatTime,
  timesOverlap,
  checkTimetableClashes,
};




