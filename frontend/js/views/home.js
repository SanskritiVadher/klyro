/**
 * KLYRO — View: Financial Home & Money Weather
 * Connected to live backend API (/api/v1/dashboard)
 * Animated count-up metrics, weather hero illustration, Safe-to-Spend ring, and pacing markers.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { formatINR, formatDate, formatRelativeDate } from '../utils/formatters.js';
import { renderDashboardSkeleton, renderErrorBanner, renderEmptyState } from '../components/loading.js';
import { renderWeatherIllustration } from '../components/weather-icon.js';
import { animateNumber, animatePercent, animateProgressRing, init3DTilt } from '../utils/animate.js';

export async function renderHomeView(container) {
  const activePeriod = store.getState().activePeriod;
  const { label } = store.getPeriodRange();

  container.innerHTML = renderDashboardSkeleton();

  try {
    const data = await api.getDashboardSummary(activePeriod);
    const weather = data.money_weather;

    // Weather Visual Configuration
    let weatherClass = 'weather-comfortable';
    let weatherBadgeClass = 'badge-sage';
    let weatherPulseClass = 'bg-[#2D7A58]';
    let weatherBorderClass = 'border-[#BBEFCE]';

    if (weather.status === 'tightening') {
      weatherClass = 'weather-tightening';
      weatherBadgeClass = 'badge-marigold';
      weatherPulseClass = 'bg-[#D97706]';
      weatherBorderClass = 'border-[#FDE68A]';
    } else if (weather.status === 'at_risk') {
      weatherClass = 'weather-at-risk';
      weatherBadgeClass = 'badge-terracotta';
      weatherPulseClass = 'bg-[#B84A39]';
      weatherBorderClass = 'border-[#FECACA]';
    }

    // Calculate month pacing percentage for budget bars
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let daysInMonth = 30;
    let dayOfMonth = 15;
    let isCurrentMonth = true;
    if (activePeriod) {
      const [yearStr, monthStr] = activePeriod.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      daysInMonth = new Date(y, m, 0).getDate();
      if (y === currentYear && m === currentMonth + 1) {
        dayOfMonth = now.getDate();
        isCurrentMonth = true;
      } else if (y < currentYear || (y === currentYear && m < currentMonth + 1)) {
        dayOfMonth = daysInMonth;
        isCurrentMonth = false;
      } else {
        dayOfMonth = 0;
        isCurrentMonth = false;
      }
    }
    const monthPacingPct = Math.min(100, Math.max(0, Math.round((dayOfMonth / daysInMonth) * 100)));

    // Savings Rate Label & Tier Thresholds: >=30% Excellent, 20-29% Healthy, 10-19% Moderate, <10% Low
    const savingLabel = isCurrentMonth ? 'Projected saving:' : 'Saved:';
    const rate = typeof data.savings_rate_pct === 'number' ? data.savings_rate_pct : 0;
    let savingsRateLabel = 'Low';
    let savingsRateClass = 'text-[#D45644]';

    if (rate >= 30) {
      savingsRateLabel = 'Excellent';
      savingsRateClass = 'text-[#2D7A58]';
    } else if (rate >= 20) {
      savingsRateLabel = 'Healthy';
      savingsRateClass = 'text-[#2D7A58]';
    } else if (rate >= 10) {
      savingsRateLabel = 'Moderate';
      savingsRateClass = 'text-[#D97706]';
    } else {
      savingsRateLabel = 'Low';
      savingsRateClass = 'text-[#D45644]';
    }

    // Safe-to-Spend Ring calculation (spent vs safe capacity)
    const safeTotalCapacity = Math.max(1, weather.safe_to_spend_minor + data.period_expense_minor);
    const safeSpentPct = Math.min(100, Math.max(0, Math.round((data.period_expense_minor / safeTotalCapacity) * 100)));
    const ringRadius = 34;
    const ringCircumference = 2 * Math.PI * ringRadius;

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Klyro Brand Bar & Tagline -->
        <div class="fade-up-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E1D6]">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-serif font-bold text-[#1C1917] tracking-tight">Klyro Financial Intelligence</span>
              <span class="text-xs text-[#78716C]">• Clarity you can act on.</span>
            </div>
            <p class="text-[11px] text-[#78716C] mt-0.5">Real-time financial forecast, safe spending limits, and cash flow intelligence for ${label}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-neutral text-[10px] font-mono">INR Paise Precision</span>
          </div>
        </div>

        <!-- Signature Feature: Money Weather Banner (Gentle Floating Hero Card) -->
        <section class="weather-banner ${weatherClass} shadow-sm" id="money-weather-widget" style="opacity: 1; visibility: visible;">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="flex items-start gap-5 flex-1">
              <!-- Large Animated Weather Hero Illustration -->
              ${renderWeatherIllustration(weather.status, 'w-20 h-20 sm:w-24 sm:h-24')}
              <div class="space-y-1.5 flex-1">
                <div class="flex items-center gap-2">
                  <span class="badge ${weatherBadgeClass} text-xs">
                    <span class="w-1.5 h-1.5 rounded-full ${weatherPulseClass} animate-pulse"></span>
                    ${weather.headline}
                  </span>
                  <span class="text-xs text-[#78716C]">• Projected for ${label}</span>
                </div>
                <h3 class="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
                  ${weather.status === 'comfortable' ? 'Finances are in comfortable territory' : weather.status === 'tightening' ? 'Cash reserves are tightening' : 'Elevated cash-flow risk detected'}
                </h3>
                <p class="text-xs text-[#44403C] max-w-2xl leading-relaxed">
                  ${weather.explanation}
                </p>
              </div>
            </div>

            <!-- Weather Metric Capsule with Big Animated Progress Ring -->
            <div class="flex flex-col sm:flex-row items-center gap-6 bg-white/95 backdrop-blur-sm p-5 rounded-2xl border ${weatherBorderClass} shadow-xs shrink-0">
              
              <!-- Big Safe-to-Spend Donut with Today's Daily in Center -->
              <div class="flex items-center gap-4">
                <div class="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                  <svg class="w-24 h-24 sm:w-28 sm:h-28 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="${ringRadius}" stroke="#E6E1D6" stroke-width="5.5" fill="none" />
                    <circle id="safe-ring-progress" cx="40" cy="40" r="${ringRadius}"
                      stroke="${weather.status === 'at_risk' ? '#D45644' : weather.status === 'tightening' ? '#D97706' : '#2D7A58'}"
                      stroke-width="5.5" stroke-linecap="round" fill="none"
                      class="progress-ring-circle"
                      style="stroke-dasharray: ${ringCircumference}; stroke-dashoffset: ${ringCircumference};" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
                    <span class="text-[8px] uppercase tracking-wider text-[#78716C] font-semibold leading-none">Today's Daily</span>
                    <span class="font-serif text-xs sm:text-sm font-bold text-[#2D7A58] num leading-tight mt-0.5">${formatINR(weather.safe_to_spend_daily_minor)}</span>
                    <span class="text-[8px] text-[#78716C] leading-none mt-0.5">${safeSpentPct}% used</span>
                  </div>
                </div>

                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">Safe-to-Spend Pool</p>
                  <p id="safe-to-spend-amount" class="font-serif text-2xl sm:text-3xl font-bold text-[#2D7A58] num">${formatINR(weather.safe_to_spend_minor || 0)}</p>
                  <p class="text-[11px] text-[#78716C] mt-0.5">${weather.days_remaining} days remaining in cycle</p>
                </div>
              </div>

              <div class="h-12 w-[1px] bg-[#E6E1D6] hidden sm:block"></div>

              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">Projected End Balance</p>
                <p id="projected-end-balance-amount" class="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] num">${formatINR(weather.projected_end_balance_minor || 0)}</p>
                <p class="text-[11px] text-[#78716C] mt-0.5">Buffer: ${formatINR(weather.buffer_reserved_minor)} (10%)</p>
              </div>

            </div>
          </div>
        </section>

        <!-- 4 Metric Pillars (Staggered Fade-Up) -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- 1. Recorded Cash Balance -->
          <div class="fade-up-card delay-2 paper-card p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Available Liquidity</p>
            <p id="kpi-liquidity" class="font-serif text-2xl font-bold text-[#1C1917] mt-1 num">${formatINR(data.current_liquidity_minor || 0)}</p>
            <div class="flex items-center justify-between mt-3 text-xs text-[#78716C] border-t border-[#F6F3EB] pt-2">
              <span>Liquid assets</span>
              <a href="#accounts" class="text-[#D45644] hover:underline font-medium">Accounts →</a>
            </div>
          </div>

          <!-- 2. Period Inflow -->
          <div class="fade-up-card delay-2 paper-card p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Income Recognized</p>
            <p id="kpi-income" class="font-serif text-2xl font-bold text-[#2D7A58] mt-1 num">${formatINR(data.period_income_minor || 0)}</p>
            <div class="flex items-center justify-between mt-3 text-xs text-[#78716C] border-t border-[#F6F3EB] pt-2">
              <span>Period Inflows</span>
              <span class="text-[#2D7A58] font-medium">${data.period_income_minor > 0 ? 'Confirmed' : 'No deposits'}</span>
            </div>
          </div>

          <!-- 3. Period Outflow -->
          <div class="fade-up-card delay-3 paper-card p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Total Expenses</p>
            <p id="kpi-expenses" class="font-serif text-2xl font-bold text-[#D45644] mt-1 num">${formatINR(data.period_expense_minor || 0)}</p>
            <div class="flex items-center justify-between mt-3 text-xs text-[#78716C] border-t border-[#F6F3EB] pt-2">
              <span>Net Consumption</span>
              <a href="#transactions" class="text-[#D45644] hover:underline font-medium">Ledger →</a>
            </div>
          </div>

          <!-- 4. Savings Rate -->
          <div class="fade-up-card delay-3 paper-card p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Net Savings Rate</p>
            <p id="kpi-savings-rate" class="font-serif text-2xl font-bold text-[#1C1917] mt-1 num">${(data.savings_rate_pct || 0).toFixed(1)}%</p>
            <div class="flex items-center justify-between mt-3 text-xs text-[#78716C] border-t border-[#F6F3EB] pt-2">
              <span>${savingLabel} ${formatINR(data.period_savings_minor)}</span>
              <span class="${savingsRateClass} font-medium">
                ${savingsRateLabel}
              </span>
            </div>
          </div>
        </section>

        <!-- Main Workspace: Budget Pulse & What Changed vs Commitments -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left 2 Cols: Budget Pulse, What Changed, and Recent Ledger -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Budget Pulse with Staggered Fill & Pacing Marker -->
            <div class="fade-up-card delay-4 paper-card p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-serif text-base font-bold text-[#1C1917]">Budget Pulse</h4>
                    <span class="badge badge-neutral text-[10px]" title="Today is day ${dayOfMonth} of ${daysInMonth}">
                      Today: Day ${dayOfMonth} (${monthPacingPct}% elapsed)
                    </span>
                  </div>
                  <p class="text-xs text-[#78716C] mt-0.5">Category pacing and run rates against current month milestone</p>
                </div>
                <a href="#budgets" class="text-xs font-semibold text-[#D45644] hover:underline">View All Allocations →</a>
              </div>

              ${
                data.budget_pulse && data.budget_pulse.length > 0
                  ? `<div class="space-y-4">
                      ${data.budget_pulse
                        .slice(0, 4)
                        .map((cat, idx) => {
                          const isOverPace = cat.percent_spent > monthPacingPct;
                          const isExceeded = cat.pace_status === 'exceeded' || cat.percent_spent > 100;

                          let barColor = 'bg-[#2D7A58]';
                          let badge = '<span class="badge badge-sage text-[10px]">On Track</span>';

                          if (isExceeded) {
                            barColor = 'bg-[#B84A39]';
                            badge = '<span class="badge badge-terracotta text-[10px]">Exceeded</span>';
                          } else if (isOverPace) {
                            barColor = 'bg-[#D45644]';
                            badge = '<span class="badge badge-terracotta text-[10px]">Over Pace</span>';
                          } else if (cat.pace_status === 'tightening') {
                            barColor = 'bg-[#D97706]';
                            badge = '<span class="badge badge-marigold text-[10px]">Tightening</span>';
                          }

                          return `
                            <div>
                              <div class="flex items-center justify-between text-xs mb-1.5">
                                <div class="flex items-center gap-2">
                                  <span class="font-semibold text-[#1C1917]">${cat.category_name}</span>
                                  ${badge}
                                </div>
                                <span class="text-[#78716C]"><strong class="text-[#1C1917]">${formatINR(cat.spent_minor)}</strong> of ${formatINR(cat.allocated_minor)} (${cat.percent_spent}%)</span>
                              </div>
                              <div class="relative w-full bg-[#F6F3EB] h-3 sm:h-3.5 rounded-full overflow-hidden border border-[#E6E1D6]">
                                <!-- Month Elapsed Pacing Marker -->
                                <div class="absolute top-0 bottom-0 w-[2px] bg-[#1C1917] z-10 pointer-events-none" style="left: ${monthPacingPct}%;" title="Pacing target for today (${monthPacingPct}%)">
                                  <div class="w-1.5 h-1.5 -ml-[2px] -mt-[1px] rounded-full bg-[#1C1917]"></div>
                                </div>
                                <!-- Staggered Filled Bar with Shimmer Sweep & Over-pace Wobble -->
                                <div class="budget-bar-fill ${barColor} ${isOverPace || isExceeded ? 'bar-wobble' : ''} h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                                  data-percent="${Math.min(100, cat.percent_spent)}"
                                  style="width: 0%; transition-delay: ${idx * 90}ms;">
                                  <div class="shimmer-sweep-layer absolute inset-0 pointer-events-none"></div>
                                </div>
                              </div>
                            </div>
                          `;
                        })
                        .join('')}
                    </div>`
                  : `<p class="text-xs text-[#78716C] italic py-3">No active budget allocations set for ${label}. <a href="#budgets" class="text-[#D45644] font-medium underline">Create one now</a></p>`
              }
            </div>

            <!-- What Changed? Summary -->
            <div class="fade-up-card delay-5 paper-card p-6">
              <div class="flex items-center gap-2 mb-3">
                <span class="badge badge-neutral text-xs">Editorial Shift</span>
                <h4 class="font-serif text-base font-bold text-[#1C1917]">What Changed in Your Finances?</h4>
              </div>
              <ul class="text-xs text-[#44403C] space-y-2 leading-relaxed">
                ${data.what_changed.map((shift) => `<li>• ${shift}</li>`).join('')}
              </ul>
            </div>

            <!-- Recent Ledger Activity Preview -->
            <div class="fade-up-card delay-5 paper-card overflow-hidden">
              <div class="p-5 border-b border-[#E6E1D6] flex items-center justify-between bg-[#F6F3EB]">
                <div>
                  <h4 class="font-serif text-base font-bold text-[#1C1917]">Recent Ledger Entries</h4>
                  <p class="text-xs text-[#78716C]">Last 5 recorded transactions</p>
                </div>
                <a href="#transactions" class="text-xs font-semibold text-[#D45644] hover:underline">Full Ledger →</a>
              </div>
              ${
                data.recent_transactions && data.recent_transactions.length > 0
                  ? `<div class="divide-y divide-[#E6E1D6]">
                      ${data.recent_transactions
                        .map((tx) => {
                          const isIncome = tx.transaction_type === 'income';
                          const isTransfer = tx.transaction_type === 'transfer';
                          const sign = isIncome ? '+' : isTransfer ? '' : '-';
                          const color = isIncome ? 'text-[#2D7A58]' : isTransfer ? 'text-[#78716C]' : 'text-[#D45644]';
                          const icon = isIncome ? '💰' : isTransfer ? '⇄' : '🛒';

                          return `
                            <div class="p-4 flex items-center justify-between hover:bg-[#F6F3EB] transition-colors text-xs">
                              <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded bg-[#F6F3EB] border border-[#E6E1D6] flex items-center justify-center font-bold text-sm">
                                  ${icon}
                                </div>
                                <div>
                                  <p class="font-semibold text-[#1C1917]">${tx.merchant || tx.description || 'Transaction'}</p>
                                  <p class="text-[11px] text-[#78716C]">${tx.category_name || 'General'} · ${tx.account_name || 'Account'} · ${formatDate(tx.transaction_date)}</p>
                                </div>
                              </div>
                              <span class="font-serif font-bold text-sm ${color} num">${sign}${formatINR(tx.amount_minor)}</span>
                            </div>
                          `;
                        })
                        .join('')}
                    </div>`
                  : `<div class="p-6 text-center text-xs text-[#78716C]">No transactions recorded yet in ${label}.</div>`
              }
            </div>

          </div>

          <!-- Right 1 Col: Upcoming Commitments Timeline -->
          <div class="space-y-6">
            
            <!-- Upcoming Commitments Radar (Pulsing Dot within 3 Days) -->
            <div class="fade-up-card delay-4 paper-card p-6">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-serif text-base font-bold text-[#1C1917]">Upcoming Commitments</h4>
                <a href="#recurring" class="badge badge-marigold text-[10px] hover:underline">Full Radar →</a>
              </div>

              ${
                data.upcoming_commitments && data.upcoming_commitments.length > 0
                  ? `<div class="space-y-3">
                      ${data.upcoming_commitments
                        .map((comm, commIdx) => {
                          const isDueWithin3Days = comm.days_until_due <= 3;
                          const isUrgent = comm.days_until_due <= 5;
                          const cardBorder = isDueWithin3Days
                            ? 'border-[#F7C6BE] bg-[#FDEDE8]/60 shadow-xs'
                            : isUrgent
                            ? 'border-[#FDE68A] bg-[#FEF8E7]'
                            : 'border-[#E6E1D6] bg-white';
                          
                          const dotClass = isDueWithin3Days
                            ? 'w-2.5 h-2.5 rounded-full bg-[#D45644] mt-1 shrink-0 pulsing-dot-urgent'
                            : isUrgent
                            ? 'w-2 h-2 rounded-full bg-[#D97706] mt-1 shrink-0 animate-pulse'
                            : 'w-2 h-2 rounded-full bg-[#78716C] mt-1 shrink-0';

                          return `
                            <div class="commitment-item flex items-start gap-3 p-3 rounded-lg border ${cardBorder}" style="animation-delay: ${commIdx * 70}ms;">
                              <div class="${dotClass}"></div>
                              <div class="flex-1 text-xs">
                                <div class="flex items-center justify-between">
                                  <span class="font-semibold text-[#1C1917]">${comm.name}</span>
                                  <span class="font-serif font-bold text-[#1C1917]">${formatINR(comm.expected_amount_minor)}</span>
                                </div>
                                <p class="text-[11px] text-[#78716C] mt-0.5">Due ${formatRelativeDate(comm.due_date)} (${formatDate(comm.due_date)})</p>
                              </div>
                            </div>
                          `;
                        })
                        .join('')}
                    </div>`
                  : `<p class="text-xs text-[#78716C] py-3">No upcoming commitments scheduled for the next 14 days.</p>`
              }
            </div>

            <!-- Quick Action Contextual Banner -->
            <div class="fade-up-card delay-5 paper-card p-5 bg-[#F6F3EB] border border-[#E6E1D6] space-y-2">
              <h5 class="font-serif text-sm font-bold text-[#1C1917]">Financial Discipline Tip</h5>
              <p class="text-xs text-[#44403C] leading-relaxed">
                Log purchases right when they happen. Press <kbd class="font-mono text-[10px] bg-white border border-[#D5CEBF] px-1 py-0.5 rounded">Q</kbd> anywhere in the studio to quickly record expenses.
              </p>
              <button onclick="document.getElementById('quick-capture-btn')?.click()" class="btn btn-secondary text-xs mt-2 w-full">
                + Quick Record Transaction
              </button>
            </div>

          </div>

        </div>

      </div>
    `;

    // --- Execute Visual Animations After DOM Injection (safely wrapped in try/catch) ---
    requestAnimationFrame(() => {
      try {
        // 1. Count-up numbers on Money Weather hero
        animateNumber(document.getElementById('safe-to-spend-amount'), weather.safe_to_spend_minor || 0, 0, 600);
        animateNumber(document.getElementById('projected-end-balance-amount'), weather.projected_end_balance_minor || 0, 0, 600);

        // 2. Count-up numbers on 4 KPI cards
        animateNumber(document.getElementById('kpi-liquidity'), data.current_liquidity_minor || 0, 0, 600);
        animateNumber(document.getElementById('kpi-income'), data.period_income_minor || 0, 0, 600);
        animateNumber(document.getElementById('kpi-expenses'), data.period_expense_minor || 0, 0, 600);
        animatePercent(document.getElementById('kpi-savings-rate'), data.savings_rate_pct || 0, 0, 600);

        // 3. Safe-to-Spend circular progress ring
        const ringCircle = document.getElementById('safe-ring-progress');
        if (ringCircle) {
          animateProgressRing(ringCircle, safeSpentPct, ringRadius, 650);
        }

        // 4. Staggered budget pulse bar fill
        document.querySelectorAll('.budget-bar-fill').forEach((bar) => {
          const targetPercent = bar.getAttribute('data-percent') || '0';
          bar.style.width = `${targetPercent}%`;
        });

        // 5. 3D Card Tilt Interaction
        init3DTilt(container);
      } catch (animErr) {
        console.warn('[Klyro Animation] Recovered gracefully from animation error:', animErr);
      }
    });

  } catch (err) {
    container.innerHTML = renderErrorBanner(
      err.message || 'Unable to connect to the Klyro Financial Intelligence backend. Ensure FastAPI server is running.',
      'location.reload()'
    );
  }
}
