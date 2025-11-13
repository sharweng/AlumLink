/**
 * Event Analytics Utilities for Event Organizers
 * Provides chart data for attendees, RSVP status, and feedback
 */

/**
 * Get RSVP status distribution (Going vs Interested vs Not Going)
 */
export function getRsvpStatusData(event) {
  if (!event || !event.attendees) return [];

  const statusCounts = {
    going: 0,
    interested: 0,
    not_going: 0
  };

  event.attendees.forEach(attendee => {
    const status = attendee.rsvpStatus || 'not_going';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return [
    { status: 'Going', count: statusCounts.going, fill: '#10b981' }, // green
    { status: 'Interested', count: statusCounts.interested, fill: '#3b82f6' }, // blue
    { status: 'Not Going', count: statusCounts.not_going, fill: '#6b7280' } // gray
  ];
}

/**
 * Get attendees to feedback ratio
 */
export function getFeedbackRatioData(event, feedbacks) {
  if (!event || !event.attendees) return [];

  const goingCount = event.attendees.filter(a => a.rsvpStatus === 'going').length;
  const feedbackCount = feedbacks?.length || 0;
  const noFeedbackCount = Math.max(0, goingCount - feedbackCount);

  return [
    { 
      category: 'With Feedback', 
      count: feedbackCount,
      fill: '#10b981' // green
    },
    { 
      category: 'No Feedback', 
      count: noFeedbackCount,
      fill: '#f59e0b' // amber
    }
  ];
}

/**
 * Get going vs interested ratio
 */
export function getGoingVsInterestedData(event) {
  if (!event || !event.attendees) return [];

  const goingCount = event.attendees.filter(a => a.rsvpStatus === 'going').length;
  const interestedCount = event.attendees.filter(a => a.rsvpStatus === 'interested').length;

  return [
    { 
      status: 'Going', 
      count: goingCount,
      fill: '#10b981' // green
    },
    { 
      status: 'Interested', 
      count: interestedCount,
      fill: '#3b82f6' // blue
    }
  ];
}

/**
 * Get capacity utilization data
 */
export function getCapacityUtilizationData(event) {
  if (!event || event.capacity <= 0) return [];

  const goingCount = event.attendees?.filter(a => a.rsvpStatus === 'going').length || 0;
  const remainingCapacity = Math.max(0, event.capacity - goingCount);

  return [
    { 
      category: 'Filled', 
      count: goingCount,
      fill: '#10b981' // green
    },
    { 
      category: 'Available', 
      count: remainingCapacity,
      fill: '#e5e7eb' // gray-200
    }
  ];
}

/**
 * Get attendee engagement score
 */
export function getEngagementData(event, feedbacks) {
  if (!event || !event.attendees) return [];

  const totalAttendees = event.attendees.length;
  const goingCount = event.attendees.filter(a => a.rsvpStatus === 'going').length;
  const interestedCount = event.attendees.filter(a => a.rsvpStatus === 'interested').length;
  const feedbackCount = feedbacks?.length || 0;

  const goingRate = totalAttendees > 0 ? ((goingCount / totalAttendees) * 100).toFixed(1) : 0;
  const interestedRate = totalAttendees > 0 ? ((interestedCount / totalAttendees) * 100).toFixed(1) : 0;
  const feedbackRate = goingCount > 0 ? ((feedbackCount / goingCount) * 100).toFixed(1) : 0;

  return {
    goingRate: parseFloat(goingRate),
    interestedRate: parseFloat(interestedRate),
    feedbackRate: parseFloat(feedbackRate),
    totalResponses: totalAttendees,
    goingCount,
    interestedCount,
    feedbackCount
  };
}
