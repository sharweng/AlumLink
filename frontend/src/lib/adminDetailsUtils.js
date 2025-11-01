// --- DISCUSSION ANALYTICS ---
export function getDiscussionCategoryData(discussions) {
  const catCounts = discussions.reduce((acc, d) => {
    const cat = d.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const allCategories = ['General', 'Technical', 'Career', 'Events', 'Help', 'Other'];
  return allCategories.map(category => ({ category, count: catCounts[category] || 0 }));
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
    const type = e.type || 'Reunion';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const allTypes = ['Reunion', 'Webinar', 'Workshop'];
  return allTypes.map(type => ({ type, count: typeCounts[type] || 0 }));
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
    const status = e.status || 'upcoming';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const allStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
  return allStatuses.map(status => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: statusCounts[status] || 0
  }));
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
    else type = 'Full-Time'; // fallback to Full-Time if invalid
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const allTypes = ['Full-Time', 'Part-Time', 'Internship', 'Freelance'];
  return allTypes.map(type => ({ type, count: typeCounts[type] || 0 }));
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
  const allWorkTypes = ['Remote', 'Onsite', 'Hybrid'];
  return allWorkTypes.map(worktype => ({ worktype, count: worktypeCounts[worktype] || 0 }));
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

// --- USER ANALYTICS ---
export function getUserStatusData(users) {
  const statusCounts = users.reduce((acc, user) => {
    if (user.banned) {
      acc.Banned = (acc.Banned || 0) + 1;
    } else if (user.isActive) {
      acc.Active = (acc.Active || 0) + 1;
    } else {
      acc.Inactive = (acc.Inactive || 0) + 1;
    }
    return acc;
  }, {});
  return [
    { status: "Active", count: statusCounts["Active"] || 0 },
    { status: "Inactive", count: statusCounts["Inactive"] || 0 },
    { status: "Banned", count: statusCounts["Banned"] || 0 },
  ];
}

export function getUserPermissionData(users) {
  const permissionCounts = users.reduce((acc, user) => {
    const perm = user.permission || 'regular';
    acc[perm] = (acc[perm] || 0) + 1;
    return acc;
  }, {});
  const allPermissions = ['regular', 'admin', 'superAdmin'];
  return allPermissions.map(perm => ({
    permission: perm.charAt(0).toUpperCase() + perm.slice(1),
    count: permissionCounts[perm] || 0
  }));
}

export function getUserRoleData(users) {
  const roleCounts = users.reduce((acc, user) => {
    const role = user.role || 'student';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const allRoles = ['student', 'alumni', 'staff'];
  return allRoles.map(role => ({
    role: role.charAt(0).toUpperCase() + role.slice(1),
    count: roleCounts[role] || 0
  }));
}

// --- ALUMNI ANALYTICS ---
export function getAlumniByWorkExperienceData(users) {
  const alumni = users.filter(user => user.role === 'alumni');
  const withExperience = alumni.filter(user => user.experience && user.experience.length > 0).length;
  const withoutExperience = alumni.length - withExperience;
  
  return [
    { status: 'With Work Experience', count: withExperience },
    { status: 'Without Work Experience', count: withoutExperience },
  ];
}

export function getAlumniWorkRelevanceData(users) {
  const alumni = users.filter(user => user.role === 'alumni' && user.experience && user.experience.length > 0);
  
  // Helper function to check if work is related to course
  const isWorkRelatedToCourse = (user) => {
    if (!user.course || !user.experience || user.experience.length === 0) return false;
    
    const course = user.course.toLowerCase();
    const experience = user.experience[0]; // Check most recent/first experience
    const jobTitle = (experience.title || '').toLowerCase();
    const company = (experience.company || '').toLowerCase();
    
    // Define course-related keywords
    const courseKeywords = {
      'bsit': ['developer', 'programmer', 'software', 'it', 'web', 'tech', 'data', 'system', 'network', 'database', 'engineer', 'analyst', 'qa', 'devops', 'frontend', 'backend', 'fullstack'],
      'bscs': ['developer', 'programmer', 'software', 'computer', 'tech', 'data', 'ai', 'ml', 'algorithm', 'system', 'engineer', 'analyst', 'researcher'],
      'bsis': ['analyst', 'system', 'business', 'data', 'it', 'information', 'database', 'erp', 'crm', 'consultant'],
      'bsece': ['engineer', 'electrical', 'electronics', 'circuit', 'embedded', 'hardware', 'telecom', 'signal'],
      'bsme': ['engineer', 'mechanical', 'manufacturing', 'design', 'cad', 'production', 'maintenance'],
      'bsce': ['engineer', 'civil', 'construction', 'structural', 'infrastructure', 'building', 'project'],
    };
    
    // Find matching keywords for the course
    let keywords = [];
    for (const [key, words] of Object.entries(courseKeywords)) {
      if (course.includes(key)) {
        keywords = words;
        break;
      }
    }
    
    // If no specific keywords found, check for general IT/engineering terms
    if (keywords.length === 0 && (course.includes('bs') || course.includes('engineering'))) {
      keywords = ['engineer', 'developer', 'analyst', 'technician', 'specialist'];
    }
    
    // Check if job title or company contains any of the keywords
    const matchFound = keywords.some(keyword => 
      jobTitle.includes(keyword) || company.includes(keyword)
    );
    
    return matchFound;
  };
  
  const related = alumni.filter(user => isWorkRelatedToCourse(user)).length;
  const notRelated = alumni.length - related;
  
  return [
    { status: 'Related to Course', count: related },
    { status: 'Not Related to Course', count: notRelated },
  ];
}


// --- FEEDBACK ANALYTICS ---
export function getFeedbackStatusData(feedbacks) {
  const statusCounts = feedbacks.reduce((acc, fb) => {
    const status = fb.seen ? 'Seen' : 'Unseen';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  return [
    { status: 'Seen', count: statusCounts['Seen'] || 0 },
    { status: 'Unseen', count: statusCounts['Unseen'] || 0 },
  ];
}

// --- REPORTS ANALYTICS ---
export function getReportsByTypeData(reports) {
  const typeCounts = reports.reduce((acc, r) => {
    const type = r.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const allTypes = ['post', 'job', 'event', 'discussion', 'other'];
  return allTypes.map(type => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count: typeCounts[type] || 0
  }));
}

export function getReportsByStatusData(reports) {
  const statusCounts = reports.reduce((acc, r) => {
    const status = r.seen ? 'Seen' : 'Unseen';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  return [
    { status: 'Seen', count: statusCounts['Seen'] || 0 },
    { status: 'Unseen', count: statusCounts['Unseen'] || 0 },
  ];
}

// --- MODERATION LOGS ANALYTICS ---
export function getModerationActionData(logs) {
  const actionCounts = logs.reduce((acc, log) => {
    const action = log.action.toLowerCase();
    if (action.includes('unban')) {
      acc.Unban = (acc.Unban || 0) + 1;
    } else if (action.includes('ban')) {
      acc.Ban = (acc.Ban || 0) + 1;
    }
    return acc;
  }, {});
  return [
    { action: 'Ban', count: actionCounts['Ban'] || 0 },
    { action: 'Unban', count: actionCounts['Unban'] || 0 },
  ];
}

export function getModerationTargetData(logs) {
  const targetCounts = logs.reduce((acc, log) => {
    const target = log.targetType || 'other';
    acc[target] = (acc[target] || 0) + 1;
    return acc;
  }, {});
  const allTargets = ['post', 'comment', 'reply', 'job', 'event', 'discussion', 'user'];
  return allTargets.map(target => ({
    target: target.charAt(0).toUpperCase() + target.slice(1),
    count: targetCounts[target] || 0
  }));
}

export function getModerationTimeData(logs, mode = 'month') {
  const now = new Date();
  if (mode === 'month') {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: d.toLocaleString('default', { month: 'short' }),
        bans: 0,
        unbans: 0,
      });
    }
    logs.forEach((log) => {
      const dt = new Date(log.performedAt);
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx !== -1) {
        const action = log.action.toLowerCase();
        if (action.includes('unban')) months[idx].unbans++;
        else if (action.includes('ban')) months[idx].bans++;
      }
    });
    return months.map((m) => ({ period: m.label, bans: m.bans, unbans: m.unbans }));
  } else {
    const weeks = [];
    let start = new Date(now);
    start.setDate(start.getDate() - (now.getDay() || 7));
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - i * 7);
      const label = `W${5 - i}`;
      weeks.push({ key: weekStart.toISOString().slice(0, 10), label, bans: 0, unbans: 0 });
    }
    logs.forEach((log) => {
      const dt = new Date(log.performedAt);
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = new Date(weeks[i].key);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (dt >= weekStart && dt < weekEnd) {
          const action = log.action.toLowerCase();
          if (action.includes('unban')) weeks[i].unbans++;
          else if (action.includes('ban')) weeks[i].bans++;
          break;
        }
      }
    });
    return weeks.map((w) => ({ period: w.label, bans: w.bans, unbans: w.unbans }));
  }
}