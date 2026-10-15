/**
 * KLYRO — Central Reactive State Store
 * Manages active budget period, user context, filter state, and UI event subscriptions.
 */

class StateStore {
  constructor() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    this.state = {
      // Active period format: YYYY-MM
      activePeriod: `${year}-${month}`,
      activeView: 'home',
      activeAccountId: null,
      searchQuery: '',
      user: {
        id: 1,
        name: 'Sanskriti Vadher',
        currency: 'INR',
        email: 'user@example.com'
      },
      isQuickCaptureOpen: false,
      isLoading: false,
    };

    this.listeners = new Map();
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...partialState };

    // Notify listeners for modified keys
    Object.keys(partialState).forEach((key) => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach((callback) => callback(this.state[key], prevState[key]));
      }
    });

    // Notify global subscribers
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach((callback) => callback(this.state, prevState));
    }
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key).delete(callback);
    };
  }

  /**
   * Get start and end date bounds for the currently active period.
   * @returns {{ startDate: string, endDate: string, label: string }}
   */
  getPeriodRange() {
    const [yearStr, monthStr] = this.state.activePeriod.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // last day of month

    const formatYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const monthLabel = start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return {
      startDate: formatYMD(start),
      endDate: formatYMD(end),
      label: monthLabel,
      year,
      month: month + 1,
    };
  }

  /**
   * Shift active period by N months (+1 for next, -1 for previous).
   */
  shiftPeriod(deltaMonths) {
    const [yearStr, monthStr] = this.state.activePeriod.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + deltaMonths;

    while (month > 12) {
      month -= 12;
      year += 1;
    }
    while (month < 1) {
      month += 12;
      year -= 1;
    }

    const nextPeriod = `${year}-${String(month).padStart(2, '0')}`;
    this.setState({ activePeriod: nextPeriod });
  }
}

export const store = new StateStore();
