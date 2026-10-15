/**
 * KLYRO — Indian Financial Formatting Utilities
 * Handles INR currency, minor units (paise), Indian numbering (Lakhs/Crores), and dates.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrIntegerFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format integer paise into standard Indian Rupee string (₹1,23,456.00).
 * @param {number} paiseMinor - Amount in minor units (100 paise = 1 INR).
 * @param {boolean} [showDecimals=true] - Whether to show paise decimals.
 * @returns {string} Formatted INR string.
 */
export function formatINR(paiseMinor, showDecimals = true) {
  if (paiseMinor === null || paiseMinor === undefined || isNaN(paiseMinor)) {
    return '₹0.00';
  }
  const rupees = paiseMinor / 100;
  return showDecimals ? inrFormatter.format(rupees) : inrIntegerFormatter.format(rupees);
}

/**
 * Format integer paise into compact Indian notation (₹12.5 L, ₹1.2 Cr, ₹45 k).
 * @param {number} paiseMinor - Amount in minor units.
 * @returns {string} Compact INR notation.
 */
export function formatCompactINR(paiseMinor) {
  if (paiseMinor === null || paiseMinor === undefined || isNaN(paiseMinor)) {
    return '₹0';
  }
  const rupees = Math.abs(paiseMinor) / 100;
  const sign = paiseMinor < 0 ? '-' : '';

  if (rupees >= 10000000) {
    // Crores (>= 1 Cr)
    const cr = (rupees / 10000000).toFixed(2);
    return `${sign}₹${cr} Cr`;
  } else if (rupees >= 100000) {
    // Lakhs (>= 1 L)
    const l = (rupees / 100000).toFixed(2);
    return `${sign}₹${l} L`;
  } else if (rupees >= 1000) {
    // Thousands (>= 1 k)
    const k = (rupees / 1000).toFixed(1);
    return `${sign}₹${k} k`;
  }
  return inrFormatter.format(paiseMinor / 100);
}

/**
 * Safely parse a Rupee string/number input into integer paise (avoiding floating point errors).
 * @param {string|number} rupeeValue - The input in rupees (e.g., "1500.50").
 * @returns {number} Integer paise.
 */
export function parseRupeesToPaise(rupeeValue) {
  if (!rupeeValue) return 0;
  const clean = String(rupeeValue).replace(/[^\d.-]/g, '');
  const floatVal = parseFloat(clean);
  if (isNaN(floatVal)) return 0;
  return Math.round(floatVal * 100);
}

/**
 * Format ISO date string into readable Indian context format (e.g., "15 Oct 2026").
 * @param {string|Date} dateInput
 * @param {object} [options]
 * @returns {string}
 */
export function formatDate(dateInput, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', options);
}

/**
 * Format relative date (e.g. "Today", "Yesterday", "In 3 days").
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatRelativeDate(dateInput) {
  if (!dateInput) return '—';
  const target = new Date(dateInput);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(target, { day: 'numeric', month: 'short' });
}
