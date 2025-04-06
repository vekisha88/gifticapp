/**
 * Date formatting utilities that can be shared across packages
 */

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format date to localized string with month, day, year
 */
export const formatDateLocalized = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Calculate time remaining until a future date
 */
export const getTimeUntilDate = (targetDate: string | Date): string => {
  const now = new Date();
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  
  if (target <= now) {
    return 'Unlocked';
  }
  
  const diffTime = Math.abs(target.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 365) {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} remaining`;
  } else if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} remaining`;
  } else {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} remaining`;
  }
}; 