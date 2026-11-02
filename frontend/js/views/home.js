/**
 * KLYRO — View: Premium Financial Dashboard & Money Weather
 * Phase 6: Signature Financial Forecasting, Transparent Safe-to-Spend Decomposition,
 * Interactive Rupee Charts, Recent Activity Feed, and Budget/Goal Velocity Tracking.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { formatINR, formatCompactINR, formatDate, formatRelativeDate } from '../utils/formatters.js';
import { renderDashboardSkeleton, renderErrorBanner, renderEmptyState } from '../components/loading.js';
import { renderWeatherIllustration } from '../components/weather-icon.js';
import { renderMascot } from '../components/mascot.js';
import { animateNumber, animatePercent, animateProgressRing, isReducedMotion, init3DTilt } from '../utils/animate.js';

// Chart instance holders for clean lifecycle management
let cashFlowChartInstance = null;
let categoryChartInstance = null;
let budgetProgressChartInstance = null;
let activeCashFlowMonths = 6;

function destroyDashboardCharts() {
  if (cashFlowChartInstance) {
    try { cashFlowChartInstance.destroy(); } catch (e) { /* silent */ }
    cashFlowChartInstance = null;
  }
  if (categoryChartInstance) {
    try { categoryChartInstance.destroy(); } catch (e) { /* silent */ }
    categoryChartInstance = null;
  }
  if (budgetProgressChartInstance) {
    try { budgetProgressChartInstance.destroy(); } catch (e) { /* silent */ }
    budgetProgressChartInstance = null;
  }
}

export async function renderHomeView(container) {
  const activePeriod = store.getState().activePeriod;
  const { startDate, endDate, label, year, month } = store.getPeriodRange();
  const user = store.getState().user;

  // Clean previous chart instances if re-rendering
  destroyDashboardCharts();

  container.innerHTML = renderDashboardSkeleton();

  try {
    // Parallel fetching of actual backend data
    const [dashData, accounts, goals, spendingCategoryData, cashFlowData] = await Promise.all([
      api.getDashboardSummary(activePeriod),
      api.getAccounts().catch(() => []),
      api.getGoals().catch(() => []),
      api.getSpendingByCategory(startDate, endDate).catch(() => ({ total_expense_minor: 0, categories: [] })),
      api.getCashFlow(activeCashFlowMonths).catch(() => ({ summary: {}, timeline: [] })),
    ]);

    const weather = dashData.money_weather || {};
    const weatherStatus = weather.status || 'comfortable';

    // 1. Personalized Greeting based on local hour
    const now = new Date();
    const hour = now.getHours();
    let timeGreeting = 'Good morning';
    let timeEmoji = '🌅';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
      timeEmoji = '☀️';
    } else if (hour >= 17 && hour < 22) {
      timeGreeting = 'Good evening';
      timeEmoji = '🌆';
    } else if (hour >= 22 || hour < 5) {
      timeGreeting = 'Good night';
      timeEmoji = '🌙';
    }

    const userName = (user && user.name) ? user.name.split(' ')[0] : 'Sanskriti';
    const formattedToday = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // 2. Weather Visual & Linguistic Hierarchy
    let weatherTheme = {
      cardClass: 'weather-comfortable',
      badgeClass: 'badge-sage',
      pulseClass: 'bg-[#2D7A58]',
      title: 'Comfortable Financial Horizon',
      subtext: 'Your liquid resources and projected inflows safely cover scheduled commitments and everyday living costs.',
      pillText: 'Clear & Comfortable',
      accentColor: '#2D7A58',
      ringColor: '#2D7A58',
    };

    if (weatherStatus === 'tightening') {
      weatherTheme = {
        cardClass: 'weather-tightening',
        badgeClass: 'badge-marigold',
        pulseClass: 'bg-[#D97706]',
        title: 'Tightening Cash Reserves',
        subtext: 'Upcoming bills or daily spending run rates are approaching your discretionary threshold. Exercise caution.',
        pillText: 'Tightening Skies',
        accentColor: '#D97706',
        ringColor: '#D97706',
      };
    } else if (weatherStatus === 'at_risk') {
      weatherTheme = {
        cardClass: 'weather-at-risk',
        badgeClass: 'badge-terracotta',
        pulseClass: 'bg-[#B84A39]',
        title: 'Elevated Cash-Flow Pressure',
        subtext: 'Projected mandatory commitments and everyday burn exceed available liquidity before the next major inflow.',
        pillText: 'Storm Warning · At Risk',
        accentColor: '#B84A39',
        ringColor: '#D45644',
      };
    }

    // 3. Liquid Assets Breakdown
    const liquidAccs = accounts.filter(a => a.is_active && !a.is_reserve && ['bank', 'wallet', 'cash'].includes(a.account_type));
    const totalLiquidFromAccounts = liquidAccs.reduce((sum, a) => sum + (a.current_balance_minor > 0 ? a.current_balance_minor : 0), 0);
    const availableBalancePaise = dashData.current_liquidity_minor ?? totalLiquidFromAccounts;

    // 4. Safe-to-Spend Computation & Explanation
    const safeToSpendPaise = weather.safe_to_spend_minor || 0;
    const dailySafeToSpendPaise = weather.safe_to_spend_daily_minor || 0;
    const daysRemaining = weather.days_remaining || 1;
    const bufferReservedPaise = weather.buffer_reserved_minor || 0;
    const expectedInflowsPaise = weather.expected_inflows_minor || 0;
    const upcomingOutflowsPaise = weather.upcoming_outflows_minor || 0;
    const projectedEndBalPaise = weather.projected_end_balance_minor || 0;

    // Runway Estimate (Days of liquidity if no more income arrives, based on monthly expense run rate)
    const currentMonthExpenses = dashData.period_expense_minor || 0;
    const daysElapsed = Math.max(1, now.getDate());
    const dailyBurnRate = currentMonthExpenses > 0 ? Math.round(currentMonthExpenses / daysElapsed) : 0;
    const estimatedRunwayDays = dailyBurnRate > 0 ? Math.min(365, Math.floor(availableBalancePaise / dailyBurnRate)) : 90;

    // Safe to spend progress ring (Spent vs Safe capacity)
    const safeCapacity = Math.max(1, safeToSpendPaise + currentMonthExpenses);
    const safeSpentPct = Math.min(100, Math.max(0, Math.round((currentMonthExpenses / safeCapacity) * 100)));
    const ringRadius = 38;
    const ringCircumference = 2 * Math.PI * ringRadius;

    // Month Pacing
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayOfMonth = (now.getFullYear() === year && now.getMonth() + 1 === month) ? now.getDate() : daysInMonth;
    const monthPacingPct = Math.min(100, Math.max(0, Math.round((dayOfMonth / daysInMonth) * 100)));

    // Savings Rate Tier
    const savingsRate = Number(dashData.savings_rate_pct || 0);
    let savingsTierBadge = '<span class="badge badge-sage text-[10px]">Solid</span>';
    if (savingsRate >= 35) savingsTierBadge = '<span class="badge badge-sage text-[10px]">Optimal Pace</span>';
    else if (savingsRate >= 20) savingsTierBadge = '<span class="badge badge-sage text-[10px]">Healthy</span>';
    else if (savingsRate >= 10) savingsTierBadge = '<span class="badge badge-marigold text-[10px]">Moderate</span>';
    else savingsTierBadge = '<span class="badge badge-terracotta text-[10px]">Low Margin</span>';

    // Top upcoming commitments
    const upcomingItems = (dashData.upcoming_commitments || []).slice(0, 5);

    // Recent Transactions
    const recentTxList = (dashData.recent_transactions || []).slice(0, 5);

    // Budget Pulse Categories
    const budgetCategories = dashData.budget_pulse || [];

    // Goals Top List
    const activeGoals = goals.filter(g => g.status !== 'completed').slice(0, 4);

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">

        <!-- 1. PERSONALIZED HERO GREETING & CONTEXT HEADER -->
        <section class="fade-up-card flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle,#E6E1D6)]">
          <div class="flex items-center gap-4">
            <!-- Mascot Companion in Welcoming Pose -->
            <div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" id="dashboard-mascot-companion" title="Meet Kly, your Klyro financial guide! Click to replay intro.">
              ${renderMascot('welcoming', 'w-14 h-14 sm:w-16 sm:h-16')}
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xl" role="img" aria-label="Greeting icon">${timeEmoji}</span>
                <h2 class="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
                  ${timeGreeting}, <span class="text-[#D45644]">${userName}</span>
                </h2>
              </div>
              <p class="text-xs text-[#78716C] flex items-center gap-2">
                <span>${formattedToday}</span>
                <span>•</span>
                <span class="font-medium text-[#44403C]">Period: ${label}</span>
                <span>•</span>
                <span class="badge badge-neutral text-[10px] font-mono">INR Precision</span>
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button id="replay-logo-intro-btn" class="btn btn-secondary text-xs flex items-center gap-1.5 shadow-xs" title="Watch Klyro Animated Logo Intro">
              <span>▶ Replay Intro</span>
            </button>
            <button id="dashboard-quick-tx-btn" class="btn btn-coral text-xs flex items-center gap-1.5 shadow-xs">
              <span>+ Record Transaction</span>
              <kbd class="font-mono text-[9px] bg-white/20 px-1 py-0.5 rounded ml-1 hidden sm:inline">Q</kbd>
            </button>
            <a href="#transactions" class="btn btn-secondary text-xs">
              View Ledger
            </a>
          </div>
        </section>

        <!-- 2. MONEY WEATHER SIGNATURE EXPERIENCE & SAFE-TO-SPEND SPOTLIGHT -->
        <section class="weather-banner ${weatherTheme.cardClass} shadow-sm relative overflow-hidden" id="money-weather-widget">
          <!-- Background Ambient Glow -->
          <div class="absolute -right-16 -top-16 w-64 h-64 rounded-full pointer-events-none opacity-20 bg-amber-400 blur-3xl"></div>

          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <!-- Left: Weather Forecast Headline & Explanation -->
            <div class="flex items-start gap-5 flex-1">
              ${renderWeatherIllustration(weatherStatus, 'w-20 h-20 sm:w-24 sm:h-24')}
              <div class="space-y-2 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge ${weatherTheme.badgeClass} text-xs font-semibold">
                    <span class="w-2 h-2 rounded-full ${weatherTheme.pulseClass} animate-pulse"></span>
                    ${weather.headline || weatherTheme.pillText}
                  </span>
                  <span class="text-xs text-[#78716C] font-medium">• ${daysRemaining} days remaining in cycle</span>
                </div>
                <h3 class="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
                  ${weatherTheme.title}
                </h3>
                <div class="flex items-start gap-3">
                  <div class="shrink-0 mt-0.5 cursor-pointer hover:scale-110 transition-transform" id="weather-owl-explaining" title="Click to hear Professor Kly explain your Money Weather">
                    ${renderMascot('explaining', 'w-10 h-10')}
                  </div>
                  <p class="text-xs sm:text-sm text-[#44403C] max-w-2xl leading-relaxed">
                    ${weather.explanation || weatherTheme.subtext}
                  </p>
                </div>

                <!-- Financial Cushion & Runway Metrics Strip -->
                <div class="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#78716C]">
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#2D7A58]"></span>
                    <span>Safety Buffer: <strong class="text-[#1C1917] num font-serif">${formatINR(bufferReservedPaise)}</strong> (10% cushion)</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                    <span>Cash Runway: <strong class="text-[#1C1917] font-serif num">~${estimatedRunwayDays} days</strong> at current burn</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#D45644]"></span>
                    <span>End-of-Month Proj: <strong class="text-[#1C1917] num font-serif">${formatINR(projectedEndBalPaise)}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Prominent Safe-to-Spend Centerpiece with Radial Progress Ring -->
            <div class="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-[var(--border-subtle,#E6E1D6)] shadow-xs shrink-0 flex flex-col sm:flex-row items-center gap-6">
              <div class="flex items-center gap-4">
                <div class="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                  <svg class="w-24 h-24 sm:w-28 sm:h-28 -rotate-90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="${ringRadius}" stroke="#E6E1D6" stroke-width="6" fill="none" opacity="0.6" />
                    <circle id="safe-ring-progress" cx="45" cy="45" r="${ringRadius}"
                      stroke="${weatherTheme.ringColor}"
                      stroke-width="6" stroke-linecap="round" fill="none"
                      class="progress-ring-circle"
                      style="stroke-dasharray: ${ringCircumference}; stroke-dashoffset: ${ringCircumference};" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
                    <span class="text-[9px] uppercase tracking-wider text-[#78716C] font-semibold leading-none">Daily Cap</span>
                    <span class="font-serif text-xs sm:text-sm font-bold text-[#2D7A58] num leading-tight mt-1">
                      ${formatINR(dailySafeToSpendPaise)}
                    </span>
                    <span class="text-[9px] text-[#78716C] leading-none mt-0.5">${daysRemaining}d left</span>
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">Safe-to-Spend</span>
                    <button id="sts-info-toggle-btn" class="text-xs text-[#78716C] hover:text-[#1C1917] cursor-pointer" title="Click to view full mathematical formula breakdown">ⓘ</button>
                  </div>
                  <p id="safe-to-spend-amount" class="font-serif text-2xl sm:text-3xl font-bold text-[#2D7A58] num">
                    ${formatINR(safeToSpendPaise)}
                  </p>
                  <p class="text-[11px] text-[#78716C]">
                    Discretionary allowance without risking scheduled bills
                  </p>
                </div>
              </div>

              <!-- Collapsible Breakdown Drawer Button -->
              <div class="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-[var(--border-subtle,#E6E1D6)] pt-3 sm:pt-0 sm:pl-4 flex flex-col justify-center">
                <button id="toggle-breakdown-btn" class="btn btn-secondary text-xs whitespace-nowrap w-full">
                  Formula Breakdown ▾
                </button>
              </div>
            </div>
          </div>

          <!-- Collapsible Safe-to-Spend Formula Breakdown Accordion -->
          <div id="sts-breakdown-drawer" class="hidden mt-6 pt-5 border-t border-[var(--border-subtle,#E6E1D6)] text-xs text-[#44403C] space-y-3">
            <div class="flex items-center justify-between">
              <h5 class="font-serif font-bold text-sm text-[#1C1917] flex items-center gap-2">
                <span>Safe-to-Spend Mathematical Decomposition</span>
                <span class="badge badge-neutral text-[9px]">Live Backend Engine</span>
              </h5>
              <span class="text-[11px] text-[#78716C]">Note: Figures reflect recorded ledger data; actual runway may vary if recurring rules are unrecorded.</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white/80 p-3.5 rounded-xl border border-[var(--border-subtle,#E6E1D6)]">
              <div class="space-y-0.5">
                <span class="text-[10px] uppercase font-semibold text-[#78716C]">1. Liquid Funds</span>
                <p class="font-serif font-bold text-sm text-[#1C1917] num">+${formatINR(availableBalancePaise)}</p>
                <p class="text-[10px] text-[#78716C]">Bank, cash, and wallet balances</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] uppercase font-semibold text-[#78716C]">2. Expected Inflows</span>
                <p class="font-serif font-bold text-sm text-[#2D7A58] num">+${formatINR(expectedInflowsPaise)}</p>
                <p class="text-[10px] text-[#78716C]">Scheduled salaries & receivables</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] uppercase font-semibold text-[#78716C]">3. Upcoming Outflows</span>
                <p class="font-serif font-bold text-sm text-[#D45644] num">-${formatINR(upcomingOutflowsPaise)}</p>
                <p class="text-[10px] text-[#78716C]">Pending EMIs, rent, subscriptions</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] uppercase font-semibold text-[#78716C]">4. Safety Buffer (10%)</span>
                <p class="font-serif font-bold text-sm text-[#D97706] num">-${formatINR(bufferReservedPaise)}</p>
                <p class="text-[10px] text-[#78716C]">Reserved emergency cushion</p>
              </div>
            </div>
            <p class="text-[11px] text-[#78716C] italic leading-relaxed">
              <strong>Calculation Rule:</strong> Safe Pool = max(0, Liquid Assets + Expected Inflows - Upcoming Outflows - 10% Cushion). Capped by remaining budget allocation (${formatINR(safeToSpendPaise)}). Daily limit is divided evenly across the remaining ${daysRemaining} days.
            </p>
          </div>
        </section>

        <!-- 3. TOP 4 FINANCIAL METRIC PILLARS -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- 1. Available Liquidity -->
          <div class="fade-up-card delay-1 paper-card p-5 hover:border-[var(--border-strong,#D5CEBF)] transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Available Balance</span>
              <span class="text-xs text-[#2D7A58] font-medium">${liquidAccs.length} Active Accounts</span>
            </div>
            <p id="kpi-liquidity" class="font-serif text-2xl font-bold text-[#1C1917] mt-1.5 num">
              ${formatINR(availableBalancePaise)}
            </p>
            <div class="flex items-center justify-between mt-3 text-xs text-[#78716C] border-t border-[var(--border-subtle,#F6F3EB)] pt-2.5">
              <span>Checking, Cash & UPI</span>
              <a href="#accounts" class="text-[#D45644] hover:underline font-medium">Manage Accounts →</a>
            </div>
          </div>

          <!-- 2. Monthly Income Recognized -->
          <div class="fade-up-card delay-2 paper-card p-5 hover:border-[var(--border-strong,#D5CEBF)] transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Monthly Income</span>
              <span class="badge badge-sage text-[10px]">Inflows</span>
            </div>
            <p id="kpi-income" class="font-serif text-2xl font-bold text-[#2D7A58] mt-1.5 num">
              ${formatINR(dashData.period_income_minor || 0)}
            </p>
            <div class="flex items-center justify-between mt-3 text-xs text-[#78716C] border-t border-[var(--border-subtle,#F6F3EB)] pt-2.5">
              <span>Salary & Deposits</span>
              <span class="text-[#2D7A58] font-medium">${dashData.period_income_minor > 0 ? 'Recorded' : 'None yet'}</span>
            </div>
          </div>

          <!-- 3. Monthly Expenses -->
          <div class="fade-up-card delay-2 paper-card p-5 hover:border-[var(--border-strong,#D5CEBF)] transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Monthly Expenses</span>
              <span class="badge badge-terracotta text-[10px]">Outflows</span>
            </div>
            <p id="kpi-expenses" class="font-serif text-2xl font-bold text-[#D45644] mt-1.5 num">
              ${formatINR(dashData.period_expense_minor || 0)}
            </p>
            <div class="flex items-center justify-between mt-3 text-xs text-[#78716C] border-t border-[var(--border-subtle,#F6F3EB)] pt-2.5">
              <span>Net Consumption</span>
              <a href="#transactions" class="text-[#D45644] hover:underline font-medium">View Ledger →</a>
            </div>
          </div>

          <!-- 4. Net Savings & Savings Rate -->
          <div class="fade-up-card delay-3 paper-card p-5 hover:border-[var(--border-strong,#D5CEBF)] transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Net Savings Rate</span>
              ${savingsTierBadge}
            </div>
            <p id="kpi-savings-rate" class="font-serif text-2xl font-bold text-[#1C1917] mt-1.5 num">
              ${savingsRate.toFixed(1)}%
            </p>
            <div class="flex items-center justify-between mt-3 text-xs text-[#78716C] border-t border-[var(--border-subtle,#F6F3EB)] pt-2.5">
              <span>Net: ${formatINR(dashData.period_savings_minor || 0)}</span>
              <span class="text-[#2D7A58] font-medium">Retained</span>
            </div>
          </div>
        </section>

        <!-- 4. INTERACTIVE FINANCIAL VISUALIZATIONS GRID -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Chart 1: Income vs Expenses & Cash Flow Trajectory -->
          <div class="fade-up-card delay-3 paper-card p-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 class="font-serif text-base font-bold text-[#1C1917]">Cash Flow Trajectory (Income vs Expenses)</h4>
                <p class="text-xs text-[#78716C]">Month-over-month recognized inflows against net outflows</p>
              </div>
              <div class="flex items-center gap-1.5 bg-[#F6F3EB] p-1 rounded-lg border border-[var(--border-subtle,#E6E1D6)]">
                <button class="cashflow-filter-btn px-2.5 py-1 text-[11px] font-medium rounded ${activeCashFlowMonths === 3 ? 'bg-white shadow-xs font-bold text-[#1C1917]' : 'text-[#78716C] hover:text-[#1C1917]'}" data-months="3">3M</button>
                <button class="cashflow-filter-btn px-2.5 py-1 text-[11px] font-medium rounded ${activeCashFlowMonths === 6 ? 'bg-white shadow-xs font-bold text-[#1C1917]' : 'text-[#78716C] hover:text-[#1C1917]'}" data-months="6">6M</button>
                <button class="cashflow-filter-btn px-2.5 py-1 text-[11px] font-medium rounded ${activeCashFlowMonths === 12 ? 'bg-white shadow-xs font-bold text-[#1C1917]' : 'text-[#78716C] hover:text-[#1C1917]'}" data-months="12">12M</button>
              </div>
            </div>

            <div class="h-64 relative flex items-center justify-center">
              <canvas id="dashboard-cashflow-chart"></canvas>
            </div>

            <div class="flex items-center justify-between text-xs text-[#78716C] pt-2 border-t border-[var(--border-subtle,#F6F3EB)]">
              <span>Avg Historical Savings Rate: <strong class="text-[#2D7A58]">${cashFlowData.summary?.average_savings_rate || 0}%</strong></span>
              <a href="#insights" class="text-[#D45644] hover:underline font-medium">Spending DNA Analytics →</a>
            </div>
          </div>

          <!-- Chart 2: Category Expense Breakdown Donut & Concentration -->
          <div class="fade-up-card delay-3 paper-card p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-serif text-base font-bold text-[#1C1917]">Spending by Category</h4>
                <p class="text-xs text-[#78716C]">Current period expense distribution (${label})</p>
              </div>
              <span class="font-serif font-bold text-sm text-[#1C1917] num">
                Total: ${formatINR(spendingCategoryData.total_expense_minor || 0)}
              </span>
            </div>

            <div class="h-64 relative flex items-center justify-center">
              ${
                spendingCategoryData.categories && spendingCategoryData.categories.length > 0
                  ? `<canvas id="dashboard-category-chart"></canvas>`
                  : `<div class="text-center py-12 text-xs text-[#78716C]">
                      <p>No category expenses recorded for ${label}.</p>
                      <button onclick="document.getElementById('quick-capture-btn')?.click()" class="btn btn-secondary text-xs mt-2">+ Record First Expense</button>
                    </div>`
              }
            </div>

            <div class="flex items-center justify-between text-xs text-[#78716C] pt-2 border-t border-[var(--border-subtle,#F6F3EB)]">
              <span>Top Outflow: <strong class="text-[#1C1917]">${spendingCategoryData.categories?.[0]?.category_name || 'None'}</strong> (${spendingCategoryData.categories?.[0]?.percentage || 0}%)</span>
              <a href="#insights" class="text-[#D45644] hover:underline font-medium">Category Breakdown →</a>
            </div>
          </div>

        </section>

        <!-- 5. MAIN WORKSPACE: BUDGET UTILIZATION & SAVINGS GOALS VS COMMITMENTS & ACTIVITY -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left 2 Cols: Budget Pulse, Goals Progress, & Recent Transaction Feed -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Budget Pulse / Utilization with Month-Elapsed Target Marker -->
            <div class="fade-up-card delay-4 paper-card p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-serif text-base font-bold text-[#1C1917]">Budget Pulse & Utilization</h4>
                    <span class="badge badge-neutral text-[10px]" title="Today is day ${dayOfMonth} of ${daysInMonth}">
                      Day ${dayOfMonth} (${monthPacingPct}% of month elapsed)
                    </span>
                  </div>
                  <p class="text-xs text-[#78716C] mt-0.5">Category spending pace compared against the monthly milestone</p>
                </div>
                <a href="#budgets" class="text-xs font-semibold text-[#D45644] hover:underline">All Budgets →</a>
              </div>

              ${
                budgetCategories.length > 0
                  ? `
                    <div class="space-y-4">
                      ${budgetCategories.slice(0, 5).map((cat, idx) => {
                        const isOverPace = cat.percent_spent > monthPacingPct;
                        const isExceeded = cat.pace_status === 'exceeded' || cat.percent_spent > 100;
                        let barColor = 'bg-[#2D7A58]';
                        let badgeHtml = '<span class="badge badge-sage text-[10px]">On Track</span>';

                        if (isExceeded) {
                          barColor = 'bg-[#B84A39]';
                          badgeHtml = '<span class="badge badge-terracotta text-[10px]">Exceeded</span>';
                        } else if (isOverPace) {
                          barColor = 'bg-[#D45644]';
                          badgeHtml = '<span class="badge badge-terracotta text-[10px]">Over Pace</span>';
                        } else if (cat.pace_status === 'tightening') {
                          barColor = 'bg-[#D97706]';
                          badgeHtml = '<span class="badge badge-marigold text-[10px]">Tightening</span>';
                        }

                        return `
                          <div>
                            <div class="flex items-center justify-between text-xs mb-1.5">
                              <div class="flex items-center gap-2">
                                <span class="font-semibold text-[#1C1917]">${cat.category_name}</span>
                                ${badgeHtml}
                              </div>
                              <span class="text-[#78716C]">
                                <strong class="text-[#1C1917]">${formatINR(cat.spent_minor)}</strong> of ${formatINR(cat.allocated_minor)} (${cat.percent_spent}%)
                              </span>
                            </div>
                            <div class="relative w-full bg-[#F6F3EB] h-3 rounded-full overflow-hidden border border-[var(--border-subtle,#E6E1D6)]">
                              <!-- Elapsed month reference pin -->
                              <div class="absolute top-0 bottom-0 w-[2px] bg-[#1C1917] z-10 pointer-events-none" style="left: ${monthPacingPct}%;" title="Pacing target for today (${monthPacingPct}%)"></div>
                              <div class="budget-bar-fill ${barColor} h-full rounded-full transition-all duration-700 ease-out"
                                data-percent="${Math.min(100, cat.percent_spent)}"
                                style="width: 0%; transition-delay: ${idx * 75}ms;"></div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `
                  : `
                    <div class="py-6 text-center text-xs text-[#78716C] bg-[#F6F3EB] rounded-xl border border-dashed border-[var(--border-subtle,#E6E1D6)]">
                      <p>No active budget allocations defined for ${label}.</p>
                      <a href="#budgets" class="btn btn-secondary text-xs mt-2 inline-block">Create Budget Target</a>
                    </div>
                  `
              }
            </div>

            <!-- Savings Goals Velocity & Progress -->
            <div class="fade-up-card delay-4 paper-card p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-serif text-base font-bold text-[#1C1917]">Savings Goals & Velocity</h4>
                  <p class="text-xs text-[#78716C]">Active milestones and estimated completion dates</p>
                </div>
                <a href="#goals" class="text-xs font-semibold text-[#D45644] hover:underline">View All Goals →</a>
              </div>

              ${
                activeGoals.length > 0
                  ? `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      ${activeGoals.map((g) => {
                        const pct = Math.min(100, Math.round(g.percent_achieved || 0));
                        return `
                          <div class="p-4 rounded-xl border border-[var(--border-subtle,#E6E1D6)] bg-white space-y-2 hover:border-[#D5CEBF] transition-all">
                            <div class="flex items-center justify-between">
                              <span class="font-semibold text-xs text-[#1C1917] truncate max-w-[180px]">${g.name}</span>
                              <span class="badge badge-sage text-[10px]">${pct}%</span>
                            </div>
                            <div class="flex items-baseline justify-between text-xs">
                              <span class="font-serif font-bold text-sm text-[#2D7A58] num">${formatINR(g.current_amount_minor)}</span>
                              <span class="text-[#78716C]">of ${formatINR(g.target_amount_minor)}</span>
                            </div>
                            <div class="w-full bg-[#F6F3EB] h-2 rounded-full overflow-hidden border border-[var(--border-subtle,#E6E1D6)]">
                              <div class="bg-[#2D7A58] h-full rounded-full transition-all duration-700" style="width: ${pct}%;"></div>
                            </div>
                            <div class="flex items-center justify-between text-[11px] text-[#78716C] pt-1">
                              <span>Target: ${formatDate(g.target_date)}</span>
                              <span>${g.projected_completion_date ? `Proj: ${formatDate(g.projected_completion_date)}` : ''}</span>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `
                  : `
                    <p class="text-xs text-[#78716C] italic py-3">No active savings goals found. <a href="#goals" class="text-[#D45644] underline">Set your first savings target</a></p>
                  `
              }
            </div>

            <!-- Recent Activity Ledger (Clear distinction between income, expenses, and internal transfers) -->
            <div class="fade-up-card delay-5 paper-card overflow-hidden">
              <div class="p-5 border-b border-[var(--border-subtle,#E6E1D6)] flex items-center justify-between bg-[#F6F3EB]">
                <div>
                  <h4 class="font-serif text-base font-bold text-[#1C1917]">Recent Financial Activity</h4>
                  <p class="text-xs text-[#78716C]">Transactions from actual ledger with verified classification</p>
                </div>
                <a href="#transactions" class="text-xs font-semibold text-[#D45644] hover:underline">Full Ledger →</a>
              </div>

              ${
                recentTxList.length > 0
                  ? `
                    <div class="divide-y divide-[var(--border-subtle,#E6E1D6)]">
                      ${recentTxList.map((tx) => {
                        const isIncome = tx.transaction_type === 'income';
                        const isTransfer = tx.transaction_type === 'transfer';
                        const isRefund = tx.transaction_type === 'refund';

                        let sign = '-';
                        let color = 'text-[#D45644]';
                        let badgeHtml = '<span class="badge badge-terracotta text-[10px]">Expense</span>';
                        let icon = '🛒';

                        if (isIncome) {
                          sign = '+';
                          color = 'text-[#2D7A58]';
                          badgeHtml = '<span class="badge badge-sage text-[10px]">Income</span>';
                          icon = '💰';
                        } else if (isTransfer) {
                          sign = '';
                          color = 'text-[#78716C]';
                          badgeHtml = '<span class="badge badge-neutral text-[10px]">Transfer</span>';
                          icon = '⇄';
                        } else if (isRefund) {
                          sign = '+';
                          color = 'text-[#2D7A58]';
                          badgeHtml = '<span class="badge badge-sage text-[10px]">Refund</span>';
                          icon = '↩️';
                        }

                        const title = tx.merchant || tx.description || (isTransfer ? 'Account Transfer' : 'Transaction');
                        const subtitle = `${tx.category_name || (isTransfer ? 'Internal Transfer' : 'Uncategorized')} · ${tx.account_name || 'Account'} · ${formatDate(tx.transaction_date)}`;

                        return `
                          <div class="p-4 flex items-center justify-between hover:bg-[#F6F3EB] transition-colors text-xs">
                            <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-lg bg-[#F6F3EB] border border-[var(--border-subtle,#E6E1D6)] flex items-center justify-center font-bold text-sm shrink-0">
                                ${icon}
                              </div>
                              <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                  <p class="font-semibold text-[#1C1917] truncate max-w-xs">${title}</p>
                                  ${badgeHtml}
                                </div>
                                <p class="text-[11px] text-[#78716C] truncate mt-0.5">${subtitle}</p>
                              </div>
                            </div>
                            <span class="font-serif font-bold text-sm ${color} num whitespace-nowrap ml-4">
                              ${sign}${formatINR(tx.amount_minor)}
                            </span>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `
                  : `
                    <div class="p-8 text-center text-xs text-[#78716C]">
                      No transactions recorded yet in this cycle.
                    </div>
                  `
              }
            </div>

          </div>

          <!-- Right 1 Col: Upcoming Commitments, Cash-Flow Pressure & Tips -->
          <div class="space-y-6">

            <!-- Upcoming Commitments Radar (Next 14 Days) -->
            <div class="fade-up-card delay-4 paper-card p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-serif text-base font-bold text-[#1C1917]">Upcoming Commitments</h4>
                  <p class="text-xs text-[#78716C]">Mandatory bills due in next 14 days</p>
                </div>
                <a href="#recurring" class="badge badge-marigold text-[10px] hover:underline">Full Radar →</a>
              </div>

              ${
                upcomingItems.length > 0
                  ? `
                    <div class="space-y-3">
                      ${upcomingItems.map((comm) => {
                        const isDueWithin3Days = comm.days_until_due <= 3 && comm.days_until_due >= 0;
                        const isOverdue = comm.is_overdue || comm.days_until_due < 0;
                        const isIncome = comm.rule_type === 'income';

                        let cardBorder = 'border-[var(--border-subtle,#E6E1D6)] bg-white';
                        let dotClass = 'w-2 h-2 rounded-full bg-[#78716C] mt-1 shrink-0';

                        if (isOverdue) {
                          cardBorder = 'border-[#FECACA] bg-[#FEF2F2]';
                          dotClass = 'w-2.5 h-2.5 rounded-full bg-[#B84A39] mt-1 shrink-0 animate-pulse';
                        } else if (isDueWithin3Days) {
                          cardBorder = 'border-[#F7C6BE] bg-[#FDEDE8]/70';
                          dotClass = 'w-2.5 h-2.5 rounded-full bg-[#D45644] mt-1 shrink-0 pulsing-dot-urgent';
                        } else if (isIncome) {
                          cardBorder = 'border-[#BBEFCE] bg-[#ECFDF5]/60';
                          dotClass = 'w-2 h-2 rounded-full bg-[#2D7A58] mt-1 shrink-0';
                        }

                        return `
                          <div class="flex items-start gap-3 p-3 rounded-lg border ${cardBorder} text-xs">
                            <div class="${dotClass}"></div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between">
                                <span class="font-semibold text-[#1C1917] truncate">${comm.name}</span>
                                <span class="font-serif font-bold ${isIncome ? 'text-[#2D7A58]' : 'text-[#1C1917]'} num">
                                  ${isIncome ? '+' : ''}${formatINR(comm.expected_amount_minor)}
                                </span>
                              </div>
                              <div class="flex items-center justify-between text-[11px] text-[#78716C] mt-0.5">
                                <span>${comm.account_name || 'Account'}</span>
                                <span class="${isOverdue ? 'text-[#B84A39] font-bold' : ''}">
                                  ${isOverdue ? 'Overdue: ' : 'Due '}${formatRelativeDate(comm.due_date)} (${formatDate(comm.due_date)})
                                </span>
                              </div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `
                  : `
                    <div class="p-6 text-center text-xs text-[#78716C] bg-[#F6F3EB] rounded-xl border border-dashed border-[var(--border-subtle,#E6E1D6)]">
                      <p>No upcoming commitments due in the next 14 days.</p>
                      <a href="#recurring" class="text-[#D45644] underline font-medium mt-1 inline-block">Add Recurring Bill</a>
                    </div>
                  `
              }
            </div>

            <!-- What Changed in Your Finances? (Insights Engine) -->
            <div class="fade-up-card delay-5 paper-card p-6 space-y-3">
              <div class="flex items-center gap-2">
                <span class="badge badge-neutral text-xs">Editorial Shift</span>
                <h4 class="font-serif text-base font-bold text-[#1C1917]">What Changed in Your Finances?</h4>
              </div>
              ${
                dashData.what_changed && dashData.what_changed.length > 0
                  ? `
                    <ul class="text-xs text-[#44403C] space-y-2 leading-relaxed">
                      ${dashData.what_changed.map((shift) => `<li class="flex items-start gap-2"><span class="text-[#D45644]">•</span><span>${shift}</span></li>`).join('')}
                    </ul>
                  `
                  : `
                    <p class="text-xs text-[#78716C]">Your financial cadence remains steady with no sudden deviations detected.</p>
                  `
              }
            </div>

            <!-- Financial Discipline Action Card -->
            <div class="fade-up-card delay-5 paper-card p-5 bg-[#F6F3EB] border border-[var(--border-subtle,#E6E1D6)] space-y-2">
              <h5 class="font-serif text-sm font-bold text-[#1C1917]">Quick Capture</h5>
              <p class="text-xs text-[#44403C] leading-relaxed">
                Log purchases right when they occur to keep Safe-to-Spend accurate in real-time.
              </p>
              <button id="dashboard-bottom-quick-btn" class="btn btn-secondary text-xs mt-2 w-full">
                + Quick Record Transaction (Q)
              </button>
            </div>

          </div>

        </div>

      </div>
    `;

    // 6. EVENT BINDING: Breakdown Accordion & Quick Capture
    const toggleBtn = container.querySelector('#toggle-breakdown-btn');
    const stsInfoBtn = container.querySelector('#sts-info-toggle-btn');
    const drawer = container.querySelector('#sts-breakdown-drawer');

    const toggleDrawer = () => {
      if (drawer) {
        drawer.classList.toggle('hidden');
        if (toggleBtn) {
          toggleBtn.textContent = drawer.classList.contains('hidden') ? 'Formula Breakdown ▾' : 'Hide Breakdown ▴';
        }
      }
    };
    if (toggleBtn) toggleBtn.addEventListener('click', toggleDrawer);
    if (stsInfoBtn) stsInfoBtn.addEventListener('click', toggleDrawer);

    // Quick Capture Button triggers
    const triggerQuickCapture = () => {
      const topBtn = document.getElementById('quick-capture-btn');
      if (topBtn) topBtn.click();
    };
    container.querySelector('#dashboard-quick-tx-btn')?.addEventListener('click', triggerQuickCapture);
    container.querySelector('#dashboard-bottom-quick-btn')?.addEventListener('click', triggerQuickCapture);

    // Replay Animated Logo Intro handlers
    const replayIntro = () => {
      if (window.KLYRO_MASCOT && typeof window.KLYRO_MASCOT.playIntro === 'function') {
        window.KLYRO_MASCOT.playIntro(true);
      }
    };
    container.querySelector('#replay-logo-intro-btn')?.addEventListener('click', replayIntro);

    // Greeting Mascot Click: Witty Contextual Dialogue based on actual financial state
    container.querySelector('#dashboard-mascot-companion')?.addEventListener('click', () => {
      let commentary = "Hi again! Let's take a quick look at your money.";
      let pose = 'welcoming';
      if (weatherStatus === 'tightening') {
        commentary = "This week looks a bit tight. A few bills are due soon, so maybe go easy on extras.";
        pose = 'thinking';
      } else if (weatherStatus === 'at_risk') {
        commentary = "Money's running a little low, and some bills are coming up. Maybe skip a treat or two this week?";
        pose = 'explaining';
      } else if (weatherStatus === 'comfortable') {
        commentary = `Things look good! You have about ${estimatedRunwayDays} days of spending money ready.`;
        pose = 'encouraging';
      }
      if (window.KYLRO_OWL && typeof window.KYLRO_OWL.speak === 'function') {
        window.KYLRO_OWL.speak(commentary, { pose, duration: 4500, speakAloud: true });
      }
    });

    // Money Weather Mascot Click: Explains actual weather forecast
    container.querySelector('#weather-owl-explaining')?.addEventListener('click', () => {
      let weatherText = "This week looks a bit tight. A few bills are due soon, so maybe go easy on extras.";
      if (weatherStatus === 'at_risk') {
        weatherText = "Money's running a little low, and some bills are coming up. Maybe skip a treat or two this week?";
      } else if (weatherStatus === 'comfortable') {
        weatherText = "Things look clear and steady! You have plenty of room for your normal plans.";
      }
      const targetPose = weatherStatus === 'tightening' ? 'thinking' : (weatherStatus === 'at_risk' ? 'explaining' : 'encouraging');
      if (window.KYLRO_OWL && typeof window.KYLRO_OWL.flyToElement === 'function') {
        window.KYLRO_OWL.flyToElement('#money-weather-widget', {
          pose: targetPose,
          text: weatherText,
          returnAfterMs: 4500,
          speakAloud: true,
        });
      } else if (window.KYLRO_OWL && typeof window.KYLRO_OWL.speak === 'function') {
        window.KYLRO_OWL.speak(weatherText, { pose: targetPose, duration: 5000, speakAloud: true });
      }
    });

    // Safe-to-Spend Centerpiece Click: Explains discretionary allowance
    container.querySelector('#safe-to-spend-amount')?.addEventListener('click', () => {
      const formattedAmount = Math.round(dailySafeToSpendPaise / 100).toLocaleString('en-IN');
      const stsLine = `You can spend ₹${formattedAmount} without worry. I've already kept money aside for your bills.`;
      if (window.KYLRO_OWL && typeof window.KYLRO_OWL.flyToElement === 'function') {
        window.KYLRO_OWL.flyToElement('#safe-to-spend-amount', {
          pose: 'encouraging',
          text: stsLine,
          returnAfterMs: 4500,
          speakAloud: true,
        });
      }
    });

    // Cash Flow Timeline Date Range Filter buttons
    container.querySelectorAll('.cashflow-filter-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const months = parseInt(e.currentTarget.getAttribute('data-months'), 10);
        if (months && months !== activeCashFlowMonths) {
          activeCashFlowMonths = months;
          container.querySelectorAll('.cashflow-filter-btn').forEach(b => {
            b.classList.remove('bg-white', 'shadow-xs', 'font-bold', 'text-[#1C1917]');
            b.classList.add('text-[#78716C]');
          });
          e.currentTarget.classList.add('bg-white', 'shadow-xs', 'font-bold', 'text-[#1C1917]');
          e.currentTarget.classList.remove('text-[#78716C]');

          try {
            const newCashFlow = await api.getCashFlow(months);
            initCashFlowChart(newCashFlow);
          } catch (cfErr) {
            console.warn('[Dashboard] Could not update cashflow filter:', cfErr);
          }
        }
      });
    });

    // 7. CHART.JS INITIALIZATIONS (Polished, Accessible, Indian INR Tooltips)
    initCashFlowChart(cashFlowData);
    initCategoryChart(spendingCategoryData);

    // 8. ANIMATIONS & 3D TILT
    requestAnimationFrame(() => {
      try {
        // Safe-to-Spend & Liquidity Number Countups
        animateNumber(document.getElementById('safe-to-spend-amount'), safeToSpendPaise, 0, 500);
        animateNumber(document.getElementById('kpi-liquidity'), availableBalancePaise, 0, 500);
        animateNumber(document.getElementById('kpi-income'), dashData.period_income_minor || 0, 0, 500);
        animateNumber(document.getElementById('kpi-expenses'), dashData.period_expense_minor || 0, 0, 500);
        animatePercent(document.getElementById('kpi-savings-rate'), savingsRate, 0, 500);

        // Safe-to-Spend Circular Progress Ring
        const ringCircle = document.getElementById('safe-ring-progress');
        if (ringCircle) {
          animateProgressRing(ringCircle, safeSpentPct, ringRadius, 600);
        }

        // Budget Pulse Bar Fills
        document.querySelectorAll('.budget-bar-fill').forEach((bar) => {
          const targetPercent = bar.getAttribute('data-percent') || '0';
          bar.style.width = `${targetPercent}%`;
        });

        // 3D Tilt Effect
        init3DTilt(container);
      } catch (animErr) {
        console.warn('[Dashboard Animation] Gracefully handled animation error:', animErr);
      }
    });

  } catch (err) {
    container.innerHTML = renderErrorBanner(
      err.message || 'Unable to communicate with the Klyro Financial Intelligence backend.',
      'location.reload()'
    );
  }
}

/**
 * Initialize / update Cash Flow Chart (Income vs Expense bar series)
 */
function initCashFlowChart(cashFlowData) {
  if (typeof Chart === 'undefined') return;

  const canvas = document.getElementById('dashboard-cashflow-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (cashFlowChartInstance) {
    try { cashFlowChartInstance.destroy(); } catch (e) { /* silent */ }
    cashFlowChartInstance = null;
  }

  const timeline = cashFlowData.timeline || [];
  const labels = timeline.map(t => t.period_label);
  const incomeValues = timeline.map(t => t.income_minor / 100);
  const expenseValues = timeline.map(t => t.expense_minor / 100);

  const isSunset = document.documentElement.getAttribute('data-theme') === 'sunset';

  // Gradient fills
  const gradIncome = ctx.createLinearGradient(0, 0, 0, 260);
  gradIncome.addColorStop(0, isSunset ? '#4ADE80' : '#3AA876');
  gradIncome.addColorStop(1, isSunset ? '#10B981' : '#2D7A58');

  const gradExpense = ctx.createLinearGradient(0, 0, 0, 260);
  gradExpense.addColorStop(0, isSunset ? '#F87171' : '#E87361');
  gradExpense.addColorStop(1, isSunset ? '#DC2626' : '#D45644');

  cashFlowChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeValues,
          backgroundColor: gradIncome,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: expenseValues,
          backgroundColor: gradExpense,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: isReducedMotion() ? false : { duration: 550, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
            color: isSunset ? '#F8F4EC' : '#1C1917',
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: isSunset ? '#27211C' : '#1C1917',
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          callbacks: {
            label: (ctx) => {
              const minor = Math.round(ctx.parsed.y * 100);
              return ` ${ctx.dataset.label}: ${formatINR(minor)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: isSunset ? '#332B24' : '#E6E1D6' },
          ticks: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
            color: isSunset ? '#9E9486' : '#78716C',
            callback: (val) => formatCompactINR(val * 100),
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
            color: isSunset ? '#D6CEC3' : '#78716C',
          },
        },
      },
    },
  });
}

/**
 * Initialize / update Category Distribution Donut Chart
 */
function initCategoryChart(spendingData) {
  if (typeof Chart === 'undefined') return;

  const canvas = document.getElementById('dashboard-category-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (categoryChartInstance) {
    try { categoryChartInstance.destroy(); } catch (e) { /* silent */ }
    categoryChartInstance = null;
  }

  const categories = spendingData.categories || [];
  if (categories.length === 0) return;

  const isSunset = document.documentElement.getAttribute('data-theme') === 'sunset';
  const labels = categories.map(c => c.category_name);
  const dataValues = categories.map(c => c.total_spent_minor / 100);

  // Elegant warm palette matching Klyro design system
  const palette = [
    '#D45644', // coral
    '#2D7A58', // sage
    '#D97706', // amber gold
    '#B84A39', // terracotta
    '#6366F1', // indigo
    '#059669', // emerald
    '#8B5CF6', // violet
    '#78716C', // stone
  ];

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: palette.slice(0, categories.length),
          borderColor: isSunset ? '#1E1A16' : '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      animation: isReducedMotion() ? false : { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' },
            color: isSunset ? '#F8F4EC' : '#1C1917',
            boxWidth: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: isSunset ? '#27211C' : '#1C1917',
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          callbacks: {
            label: (ctx) => {
              const minor = Math.round(ctx.parsed * 100);
              const catItem = categories[ctx.dataIndex];
              const pct = catItem ? catItem.percentage : 0;
              return ` ${ctx.label}: ${formatINR(minor)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}
