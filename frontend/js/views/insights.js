/**
 * KLYRO — View: Spending DNA & Analytical Workspace
 * Connected to live backend APIs (/api/v1/analytics/*) with Chart.js visualizations.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { formatINR, formatCompactINR } from '../utils/formatters.js';
import { renderCardSkeleton, renderErrorBanner, renderEmptyState } from '../components/loading.js';
import { isReducedMotion, init3DTilt } from '../utils/animate.js';

let incomeExpenseChartInstance = null;
let categoryChartInstance = null;

export async function renderInsightsView(container) {
  const { startDate, endDate, label } = store.getPeriodRange();

  container.innerHTML = renderCardSkeleton(4);

  try {
    const [spendingData, cashFlowData, insights] = await Promise.all([
      api.getSpendingByCategory(startDate, endDate),
      api.getCashFlow(6),
      api.getSpendingDNA(),
    ]);

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="fade-up-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-serif text-2xl font-bold text-[#1C1917]">Spending DNA & Visual Analytics</h3>
            <p class="text-xs text-[#78716C] mt-0.5">Behavioral patterns, historical cash flows, and category concentration for ${label}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-neutral text-xs">Analysis Period: ${label}</span>
          </div>
        </div>

        <!-- Evidence-Based Editorial Insights Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${
            insights.length > 0
              ? insights
                  .map((ins, idx) => {
                    const borderLeft =
                      ins.severity === 'positive'
                        ? 'border-l-[#2D7A58]'
                        : ins.severity === 'warning'
                        ? 'border-l-[#B84A39]'
                        : 'border-l-[#D97706]';
                    const badge =
                      ins.severity === 'positive'
                        ? '<span class="badge badge-sage text-[10px]">Positive Trend</span>'
                        : ins.severity === 'warning'
                        ? '<span class="badge badge-terracotta text-[10px]">Overspending Risk</span>'
                        : '<span class="badge badge-marigold text-[10px]">Attention Required</span>';

                    return `
                      <div class="fade-up-card delay-${Math.min(idx + 1, 3)} paper-card p-5 border-l-4 ${borderLeft} space-y-2">
                        <div class="flex items-center justify-between">
                          ${badge}
                          ${ins.action_route ? `<a href="#${ins.action_route}" class="text-xs text-[#D45644] font-medium hover:underline">Inspect →</a>` : ''}
                        </div>
                        <h4 class="font-serif text-base font-bold text-[#1C1917]">${ins.title}</h4>
                        <p class="text-xs text-[#44403C] leading-relaxed">${ins.explanation}</p>
                      </div>
                    `;
                  })
                  .join('')
              : `
                <div class="fade-up-card paper-card p-5 border-l-4 border-l-[#2D7A58] col-span-2">
                  <span class="badge badge-sage text-[10px]">Stable Finances</span>
                  <h4 class="font-serif text-base font-bold text-[#1C1917] mt-1">Normal Spending Cadence</h4>
                  <p class="text-xs text-[#44403C] mt-1">No anomalous surges or overdue commitments detected for the selected period.</p>
                </div>
              `
          }
        </div>

        <!-- Visual Analytics Grid: 2 Interactive Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Chart 1: 6-Month Income vs Expense Trend -->
          <div class="fade-up-card delay-2 paper-card p-6 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-serif text-base font-bold text-[#1C1917]">Income vs Expense Trajectory</h4>
                <p class="text-xs text-[#78716C]">Historical cash flows (last 6 calendar months)</p>
              </div>
              <span class="text-xs font-semibold text-[#2D7A58]">Avg Savings: ${cashFlowData.summary?.average_savings_rate || 0}%</span>
            </div>
            <div class="h-64 relative">
              <canvas id="income-expense-chart"></canvas>
            </div>
          </div>

          <!-- Chart 2: Category Distribution Donut -->
          <div class="fade-up-card delay-3 paper-card p-6 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-serif text-base font-bold text-[#1C1917]">Expense Concentration</h4>
                <p class="text-xs text-[#78716C]">Where your money went in ${label}</p>
              </div>
              <span class="font-serif font-bold text-sm text-[#1C1917] num">Total: ${formatINR(spendingData.total_expense_minor)}</span>
            </div>
            <div class="h-64 relative flex items-center justify-center">
              ${
                spendingData.categories.length > 0
                  ? `<canvas id="category-distribution-chart"></canvas>`
                  : `<p class="text-xs text-[#78716C] italic">No expense entries recorded for this period.</p>`
              }
            </div>
          </div>

        </div>

        <!-- Category Details Ledger Breakdown -->
        <div class="fade-up-card delay-4 paper-card overflow-hidden">
          <div class="p-5 border-b border-[#E6E1D6] bg-[#F6F3EB]">
            <h4 class="font-serif text-base font-bold text-[#1C1917]">Category Expense Audit</h4>
            <p class="text-xs text-[#78716C]">Consolidated consumption ranking for ${label}</p>
          </div>
          ${
            spendingData.categories.length > 0
              ? `
                <div class="divide-y divide-[#E6E1D6]">
                  ${spendingData.categories
                    .map((cat) => `
                      <div class="p-4 flex items-center justify-between hover:bg-[#F6F3EB] transition-colors text-xs">
                        <div class="flex items-center gap-3">
                          <span class="w-3 h-3 rounded-full bg-[#D45644]"></span>
                          <div>
                            <span class="font-semibold text-[#1C1917]">${cat.category_name}</span>
                            <p class="text-[11px] text-[#78716C]">${cat.transaction_count} transaction${cat.transaction_count > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="font-serif font-bold text-sm text-[#1C1917] num">${formatINR(cat.total_spent_minor)}</p>
                          <p class="text-[11px] text-[#78716C]">${cat.percentage}% of outflows</p>
                        </div>
                      </div>
                    `)
                    .join('')}
                </div>
              `
              : `<div class="p-6 text-center text-xs text-[#78716C]">No category expenses to audit.</div>`
          }
        </div>

      </div>
    `;

    // --- Initialize Chart.js Visualizations ---
    if (typeof Chart !== 'undefined') {
      if (incomeExpenseChartInstance) incomeExpenseChartInstance.destroy();
      if (categoryChartInstance) categoryChartInstance.destroy();

      const chartAnimConfig = isReducedMotion() ? false : {
        duration: 600,
        easing: 'easeOutQuart',
      };

      // Chart 1: Cash Flow Multi-bar
      const ctxCashFlow = document.getElementById('income-expense-chart')?.getContext('2d');
      if (ctxCashFlow && cashFlowData.timeline) {
        const labels = cashFlowData.timeline.map((t) => t.period_label);
        const incomeValues = cashFlowData.timeline.map((t) => t.income_minor / 100);
        const expenseValues = cashFlowData.timeline.map((t) => t.expense_minor / 100);

        // Vibrant brand gradients
        const gradIncome = ctxCashFlow.createLinearGradient(0, 0, 0, 260);
        gradIncome.addColorStop(0, '#3AA876');
        gradIncome.addColorStop(1, '#2D7A58');

        const gradExpense = ctxCashFlow.createLinearGradient(0, 0, 0, 260);
        gradExpense.addColorStop(0, '#E87361');
        gradExpense.addColorStop(1, '#D45644');

        incomeExpenseChartInstance = new Chart(ctxCashFlow, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Income',
                data: incomeValues,
                backgroundColor: gradIncome,
                borderRadius: 8,
                borderSkipped: false,
              },
              {
                label: 'Expenses',
                data: expenseValues,
                backgroundColor: gradExpense,
                borderRadius: 8,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: chartAnimConfig,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
                  color: '#1C1917',
                  usePointStyle: true,
                  pointStyle: 'circle',
                  boxWidth: 8,
                },
              },
              tooltip: {
                backgroundColor: '#1C1917',
                padding: 10,
                cornerRadius: 8,
                titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
                bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                callbacks: {
                  label: (ctx) => {
                    const minor = Math.round(ctx.parsed.y * 100);
                    return ` ${ctx.dataset.label}: ${formatCompactINR(minor)} (${formatINR(minor)})`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#E6E1D6' },
                ticks: {
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
                  color: '#78716C',
                  callback: (val) => formatCompactINR(val * 100),
                },
              },
              x: {
                grid: { display: false },
                ticks: {
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
                  color: '#78716C',
                },
              },
            },
          },
        });
      }

      // Chart 2: Donut of Category Distribution
      const ctxCat = document.getElementById('category-distribution-chart')?.getContext('2d');
      if (ctxCat && spendingData.categories && spendingData.categories.length > 0) {
        const catLabels = spendingData.categories.map((c) => c.category_name);
        const catValues = spendingData.categories.map((c) => c.total_spent_minor / 100);
        const editorialPalette = [
          '#D45644', // coral
          '#2D7A58', // sage
          '#D97706', // marigold
          '#1C1917', // espresso/charcoal
          '#B84A39', // terracotta
          '#57534E', // stone
          '#8C7E72', // warm sand
        ];

        categoryChartInstance = new Chart(ctxCat, {
          type: 'doughnut',
          data: {
            labels: catLabels,
            datasets: [
              {
                data: catValues,
                backgroundColor: editorialPalette.slice(0, catLabels.length),
                borderWidth: 2,
                borderColor: '#FFFFFF',
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: chartAnimConfig,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' },
                  color: '#1C1917',
                  boxWidth: 10,
                  usePointStyle: true,
                  pointStyle: 'circle',
                },
              },
              tooltip: {
                backgroundColor: '#1C1917',
                padding: 10,
                cornerRadius: 8,
                titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
                bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                callbacks: {
                  label: (ctx) => {
                    const minor = Math.round(ctx.parsed * 100);
                    return ` ${ctx.label}: ${formatCompactINR(minor)} (${formatINR(minor)})`;
                  },
                },
              },
            },
            cutout: '65%',
          },
        });
      }
    }

    requestAnimationFrame(() => {
      init3DTilt(container);
    });

  } catch (err) {
    container.innerHTML = renderErrorBanner(
      err.message || 'Unable to load analytical data from server.',
      'location.reload()'
    );
  }
}
