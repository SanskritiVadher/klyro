/**
 * KLYRO — API Client
 * Consumes the versioned REST API (/api/v1) with typed error handling and credentials support.
 */

const BASE_URL = (typeof window !== 'undefined' && (window.KLYRO_API_BASE || localStorage.getItem('klyro_api_base'))) || '/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('klyro_token') || localStorage.getItem('kosh_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('klyro_token', token);
    } else {
      localStorage.removeItem('klyro_token');
      localStorage.removeItem('kosh_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errObj = data?.error || {
          code: `HTTP_${response.status}`,
          message: data?.detail || 'An unexpected error occurred while communicating with the server.',
        };
        const error = new Error(errObj.message || 'API Error');
        error.code = errObj.code;
        error.details = errObj.details;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // --- Auth ---
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // --- Dashboard & Money Weather ---
  async getDashboardSummary(period) {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/dashboard${query}`);
  }

  async getMoneyWeather(startDate, endDate) {
    return this.request(`/dashboard/money-weather?start_date=${startDate}&end_date=${endDate}`);
  }

  // --- Accounts ---
  async getAccounts() {
    return this.request('/accounts');
  }

  async createAccount(payload) {
    return this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async adjustAccountBalance(accountId, newBalanceMinor, notes) {
    return this.request(`/accounts/${accountId}/adjustments`, {
      method: 'POST',
      body: JSON.stringify({ new_balance_minor: newBalanceMinor, notes }),
    });
  }

  async updateAccount(accountId, payload) {
    return this.request(`/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteAccount(accountId) {
    return this.request(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // --- Categories ---
  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(payload) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Transactions & Transfers ---
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return this.request(`/transactions?${query.toString()}`);
  }

  async createTransaction(payload) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTransaction(transactionId, payload) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async createTransfer(payload) {
    return this.request('/transactions/transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteTransaction(transactionId) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  // --- Budgets ---
  async getBudgets() {
    return this.request('/budgets');
  }

  async getBudgetPerformance(budgetId, asOfDate) {
    const query = asOfDate ? `?as_of_date=${asOfDate}` : '';
    return this.request(`/budgets/${budgetId}/performance${query}`);
  }

  async createBudget(payload) {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteBudget(budgetId) {
    return this.request(`/budgets/${budgetId}`, {
      method: 'DELETE',
    });
  }

  // --- Goals ---
  async getGoals() {
    return this.request('/goals');
  }

  async createGoal(payload) {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteGoal(goalId) {
    return this.request(`/goals/${goalId}`, {
      method: 'DELETE',
    });
  }

  async addGoalContribution(goalId, payload) {
    return this.request(`/goals/${goalId}/contributions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Recurring Rules & Calendar ---
  async getRecurringRules() {
    return this.request('/recurring-rules');
  }

  async createRecurringRule(payload) {
    return this.request('/recurring-rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteRecurringRule(ruleId) {
    return this.request(`/recurring-rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async getUpcomingCommitments(days = 30) {
    return this.request(`/calendar/upcoming?days=${days}`);
  }

  // --- Analytics & Insights ---
  async getSpendingByCategory(startDate, endDate) {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    return this.request(`/analytics/spending-by-category?${query.toString()}`);
  }

  async getCashFlow(months = 6) {
    return this.request(`/analytics/cash-flow?months=${months}`);
  }

  async getSpendingDNA() {
    return this.request('/analytics/insights');
  }

  // --- Settings & Data Export ---
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(payload) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  getExportTransactionsUrl() {
    return `${BASE_URL}/export/transactions`;
  }

  getExportBackupUrl() {
    return `${BASE_URL}/export/backup`;
  }

  async reseedDemoData() {
    return this.request('/management/reseed', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
