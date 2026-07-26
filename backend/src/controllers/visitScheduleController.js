const asyncHandler = require('express-async-handler');
const VisitSchedule = require('../models/VisitSchedule');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function isDueOn(schedule, date) {
  if (schedule.frequency === 'weekly') return date.getDay() === schedule.dayOfWeek;
  // Monthly: clamp to the month's actual last day (e.g. dayOfMonth 31 in
  // February is due on the 28th/29th instead of never firing).
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const effectiveDay = Math.min(schedule.dayOfMonth, lastDayOfMonth);
  return date.getDate() === effectiveDay;
}

async function loadActiveSchedules(assignee) {
  const query = { isActive: true };
  if (assignee) query.assignee = assignee;
  return VisitSchedule.find(query)
    .populate('assignee', 'name employeeId')
    .populate('territory', 'name')
    .populate('party');
}

// @desc  Which scheduled visits are due on a given date (default today),
//        optionally filtered to one rep/distributor worker.
// @route GET /api/visit-schedules/due?date=YYYY-MM-DD&assignee=<id>
const getDueVisits = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const schedules = await loadActiveSchedules(req.query.assignee);
  const due = schedules.filter((s) => isDueOn(s, date));
  res.json({ success: true, data: { date: date.toISOString().slice(0, 10), dayName: DAY_NAMES[date.getDay()], rows: due } });
});

// @desc  A 7-day view (starting the given date, default today) showing
//        which visits are due each day - the weekly "beat plan" a rep or
//        distributor worker can follow, optionally filtered to one person.
// @route GET /api/visit-schedules/week?start=YYYY-MM-DD&assignee=<id>
const getWeekSchedule = asyncHandler(async (req, res) => {
  const start = req.query.start ? new Date(req.query.start) : new Date();
  const schedules = await loadActiveSchedules(req.query.assignee);

  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const due = schedules.filter((s) => isDueOn(s, date));
    days.push({ date: date.toISOString().slice(0, 10), dayName: DAY_NAMES[date.getDay()], rows: due });
  }

  res.json({ success: true, data: { days } });
});

module.exports = { getDueVisits, getWeekSchedule };
