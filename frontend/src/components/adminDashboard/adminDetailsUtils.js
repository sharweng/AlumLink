// --- DISCUSSION ANALYTICS ---
export function getDiscussionCategoryData(discussions) {
  const catCounts = discussions.reduce((acc, d) => {
    const cat = d.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(catCounts).map(([category, count]) => ({ category, count }));
}

export function getDiscussionStatusData(discussions) {
  const statusCounts = discussions.reduce((acc, d) => {
    const status = d.banned ? 'Banned' : 'Active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  return [
    { status: 'Active', count: statusCounts['Active'] || 0 },
    { status: 'Banned', count: statusCounts['Banned'] || 0 },
  ];
}

export function getDiscussionTimeData(discussions, mode = 'month') {
  const now = new Date();
  if (mode === 'month') {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: d.toLocaleString('default', { month: 'short' }),
        discussions: 0,
      });
    }
    discussions.forEach((d) => {
      const dt = new Date(d.createdAt);
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx !== -1) months[idx].discussions++;
    });
    return months.map((m) => ({ period: m.label, discussions: m.discussions }));
  } else {
    const weeks = [];
    let start = new Date(now);
    start.setDate(start.getDate() - (now.getDay() || 7));
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - i * 7);
      const label = `W${5 - i}`;
      weeks.push({ key: weekStart.toISOString().slice(0, 10), label, discussions: 0 });
    }
    discussions.forEach((d) => {
      const dt = new Date(d.createdAt);
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = new Date(weeks[i].key);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (dt >= weekStart && dt < weekEnd) {
          weeks[i].discussions++;
          break;
        }
      }
    });
    return weeks.map((w) => ({ period: w.label, discussions: w.discussions }));
  }
}

// --- EVENT ANALYTICS ---
export function getEventTypeData(events) {
  const typeCounts = events.reduce((acc, e) => {
    const type = e.type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
}

export function getEventPhysicalVirtualData(events) {
  const pvCounts = events.reduce((acc, e) => {
    const pv = e.isVirtual ? 'Virtual' : 'Physical';
    acc[pv] = (acc[pv] || 0) + 1;
    return acc;
  }, {});
  return [
    { type: 'Physical', count: pvCounts['Physical'] || 0 },
    { type: 'Virtual', count: pvCounts['Virtual'] || 0 },
  ];
}

export function getEventStatusData(events) {
  const statusCounts = events.reduce((acc, e) => {
    const status = e.status || 'Other';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
}

export function getEventBannedData(events) {
  const bannedCounts = events.reduce((acc, e) => {
    const status = e.banned ? 'Banned' : 'Active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  return [
    { status: 'Active', count: bannedCounts['Active'] || 0 },
    { status: 'Banned', count: bannedCounts['Banned'] || 0 },
  ];
}

export function getEventTimeData(events, mode = 'month') {
  const now = new Date();
  if (mode === 'month') {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: d.toLocaleString('default', { month: 'short' }),
        events: 0,
      });
    }
    events.forEach((e) => {
      const dt = new Date(e.createdAt);
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx !== -1) months[idx].events++;
    });
    return months.map((m) => ({ period: m.label, events: m.events }));
  } else {
    const weeks = [];
    let start = new Date(now);
    start.setDate(start.getDate() - (now.getDay() || 7));
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - i * 7);
      const label = `W${5 - i}`;
      weeks.push({ key: weekStart.toISOString().slice(0, 10), label, events: 0 });
    }
    events.forEach((e) => {
      const dt = new Date(e.createdAt);
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = new Date(weeks[i].key);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (dt >= weekStart && dt < weekEnd) {
          weeks[i].events++;
          break;
        }
      }
    });
    return weeks.map((w) => ({ period: w.label, events: w.events }));
  }
}
// Utility to aggregate post and job data for AdminDetails charts

export function getPostStatusData(posts) {
  const statusCounts = posts.reduce((acc, post) => {
    const status = post.banned ? "Banned" : "Active";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  return [
    { status: "Active", count: statusCounts["Active"] || 0 },
    { status: "Banned", count: statusCounts["Banned"] || 0 },
  ];
}

export function getPostTimeData(posts, mode = "month") {
  // mode: "month" or "week"
  const now = new Date();
  if (mode === "month") {
    // Last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: d.toLocaleString("default", { month: "short" }),
        posts: 0,
      });
    }
    posts.forEach((post) => {
      const d = new Date(post.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx !== -1) months[idx].posts++;
    });
    return months.map((m) => ({ period: m.label, posts: m.posts }));
  } else {
    // Last 5 weeks
    const weeks = [];
    let start = new Date(now);
    start.setDate(start.getDate() - (now.getDay() || 7)); // last Sunday
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - i * 7);
      const label = `W${5 - i}`;
      weeks.push({ key: weekStart.toISOString().slice(0, 10), label, posts: 0 });
    }
    posts.forEach((post) => {
      const d = new Date(post.createdAt);
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = new Date(weeks[i].key);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (d >= weekStart && d < weekEnd) {
          weeks[i].posts++;
          break;
        }
      }
    });
    return weeks.map((w) => ({ period: w.label, posts: w.posts }));
  }
}


// Group job types: 'job' (full-time), others as is (part-time, internship, freelance)
export function getJobTypeData(jobs) {
  const typeCounts = jobs.reduce((acc, job) => {
    let type;
    if (job.type === 'job') type = 'Full-Time';
    else if (job.type === 'part-time') type = 'Part-Time';
    else if (job.type === 'internship') type = 'Internship';
    else if (job.type === 'freelance') type = 'Freelance';
    else type = 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
}


// Only allow remote, onsite, hybrid (default to 'Onsite' if missing)
export function getJobWorkTypeData(jobs) {
  const worktypeCounts = jobs.reduce((acc, job) => {
    let worktype = (job.workType || '').toLowerCase();
    if (worktype === 'remote') worktype = 'Remote';
    else if (worktype === 'onsite') worktype = 'Onsite';
    else if (worktype === 'hybrid') worktype = 'Hybrid';
    else worktype = 'Onsite'; // fallback to Onsite if missing/invalid
    acc[worktype] = (acc[worktype] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(worktypeCounts).map(([worktype, count]) => ({ worktype, count }));
}
// Job posts per month/week (like posts)
export function getJobTimeData(jobs, mode = "month") {
  const now = new Date();
  if (mode === "month") {
    // Last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: d.toLocaleString("default", { month: "short" }),
        jobs: 0,
      });
    }
    jobs.forEach((job) => {
      const d = new Date(job.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx !== -1) months[idx].jobs++;
    });
    return months.map((m) => ({ period: m.label, jobs: m.jobs }));
  } else {
    // Last 5 weeks
    const weeks = [];
    let start = new Date(now);
    start.setDate(start.getDate() - (now.getDay() || 7)); // last Sunday
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - i * 7);
      const label = `W${5 - i}`;
      weeks.push({ key: weekStart.toISOString().slice(0, 10), label, jobs: 0 });
    }
    jobs.forEach((job) => {
      const d = new Date(job.createdAt);
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = new Date(weeks[i].key);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (d >= weekStart && d < weekEnd) {
          weeks[i].jobs++;
          break;
        }
      }
    });
    return weeks.map((w) => ({ period: w.label, jobs: w.jobs }));
  }
}

export function getJobStatusData(jobs) {
  const statusCounts = jobs.reduce((acc, job) => {
    const status = job.banned ? "Banned" : "Active";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  return [
    { status: "Active", count: statusCounts["Active"] || 0 },
    { status: "Banned", count: statusCounts["Banned"] || 0 },
  ];
}
