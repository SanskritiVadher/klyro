/**
 * KLYRO — View: Budget Pulse & Allocations
 * Connected to live backend API (/api/v1/budgets) with category pacing tracks and creation modal.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { formatINR, parseRupeesToPaise } from '../utils/formatters.js';
import { renderCardSkeleton, renderErrorBanner, renderEmptyState } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { animateNumber, init3DTilt } from '../utils/animate.js';

export async function renderBudgetsView(container) {
  const { label, startDate, endDate } = store.getPeriodRange();
  const activePeriod = store.getState().activePeriod;

  container.innerHTML = renderCardSkeleton(3);

  try {
    const [budgets, categories] = await Promise.all([
      api.getBudgets(),
      api.getCategories(),
    ]);

    // Find active budget for current period
    const activeBudget = budgets.find(
      (b) => b.start_date <= endDate && b.end_date >= startDate
    ) || budgets[0];

    let perf = null;
    if (activeBudget) {
      perf = await api.getBudgetPerformance(activeBudget.id);
    }

    // Calculate month pacing percentage
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let daysInMonth = 30;
    let dayOfMonth = 15;
    if (activePeriod) {
      const [yearStr, monthStr] = activePeriod.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      daysInMonth = new Date(y, m, 0).getDate();
      if (y === currentYear && m === currentMonth + 1) {
        dayOfMonth = now.getDate();
      } else if (y < currentYear || (y === currentYear && m < currentMonth + 1)) {
        dayOfMonth = daysInMonth;
      } else {
        dayOfMonth = 0;
      }
    }
    const monthPacingPct = Math.min(100, Math.max(0, Math.round((dayOfMonth / daysInMonth) * 100)));

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="fade-up-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-serif text-2xl font-bold text-[#1C1917]">Budget Pulse</h3>
              <span class="badge badge-neutral text-[10px]">
                Today: Day ${dayOfMonth} (${monthPacingPct}% elapsed)
              </span>
            </div>
            <p class="text-xs text-[#78716C] mt-0.5">
              ${activeBudget ? `Monitoring "${activeBudget.name}" (${label})` : `No active budget for ${label}`}
            </p>
          </div>
          <button id="open-budget-modal-btn" class="btn btn-coral text-xs">+ Create / Set Budget</button>
        </div>

        ${
          perf
            ? `
              <!-- Budget Metric Strip -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="fade-up-card delay-1 paper-card p-4">
                  <p class="text-xs font-semibold text-[#78716C] uppercase">Total Budget Cap</p>
                  <p id="budget-total-cap" class="font-serif text-2xl font-bold text-[#1C1917] mt-1 num">₹0.00</p>
                  <p class="text-[11px] text-[#78716C] mt-1">Across ${perf.categories.length} allocated categories</p>
                </div>
                <div class="fade-up-card delay-2 paper-card p-4">
                  <p class="text-xs font-semibold text-[#78716C] uppercase">Spent to Date</p>
                  <p id="budget-total-spent" class="font-serif text-2xl font-bold text-[#D45644] mt-1 num">₹0.00</p>
                  <p class="text-[11px] text-[#78716C] mt-1">${perf.percent_spent}% utilized</p>
                </div>
                <div class="fade-up-card delay-3 paper-card p-4">
                  <p class="text-xs font-semibold text-[#78716C] uppercase">Remaining Safe Cushion</p>
                  <p id="budget-total-remaining" class="font-serif text-2xl font-bold text-[#2D7A58] mt-1 num">₹0.00</p>
                  <p class="text-[11px] text-[#78716C] mt-1">Unallocated spending allowance</p>
                </div>
              </div>

              <!-- Category Allocations List -->
              <div class="fade-up-card delay-3 paper-card p-6 space-y-6">
                <div class="flex items-center justify-between">
                  <h4 class="font-serif text-lg font-bold text-[#1C1917]">Category Allocations & Run Rates</h4>
                  <span class="text-xs text-[#78716C]">Black marker indicates today's target (${monthPacingPct}%)</span>
                </div>

                <div class="space-y-5">
                  ${perf.categories
                    .map((cat, idx) => {
                      const isOverPace = cat.percent_spent > monthPacingPct;
                      const isExceeded = cat.pace_status === 'exceeded' || cat.percent_spent > 100;

                      let barColor = 'bg-[#2D7A58]';
                      let badge = '<span class="badge badge-sage text-[10px]">On Track</span>';

                      if (isExceeded) {
                        barColor = 'bg-[#B84A39]';
                        badge = '<span class="badge badge-terracotta text-[10px]">Over Limit</span>';
                      } else if (isOverPace) {
                        barColor = 'bg-[#D45644]'; // Over-pace turns coral
                        badge = '<span class="badge badge-terracotta text-[10px]">Pacing Fast</span>';
                      } else if (cat.pace_status === 'tightening') {
                        barColor = 'bg-[#D97706]';
                        badge = '<span class="badge badge-marigold text-[10px]">Tightening</span>';
                      }

                      return `
                        <div class="p-4 rounded-lg border border-[#E6E1D6] hover:border-[#D5CEBF] transition-colors">
                          <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                              <span class="font-semibold text-sm text-[#1C1917]">${cat.category_name}</span>
                              ${badge}
                            </div>
                            <span class="font-serif font-bold text-sm text-[#1C1917]">${formatINR(cat.spent_minor)} / ${formatINR(cat.allocated_minor)}</span>
                          </div>
                          <div class="relative w-full bg-[#F6F3EB] h-2.5 rounded-full overflow-hidden border border-[#E6E1D6]">
                            <!-- Pacing Marker for where you should be today -->
                            <div class="pacing-marker" style="left: ${monthPacingPct}%" title="Target for day ${dayOfMonth}: ${monthPacingPct}%"></div>
                            <!-- Staggered Animated Bar with Shimmer & Wobble -->
                            <div class="budget-cat-bar ${barColor} ${isOverPace || isExceeded ? 'bar-wobble' : ''} relative h-full rounded-full transition-all duration-500 ease-out overflow-hidden"
                              data-percent="${Math.min(100, cat.percent_spent)}"
                              style="width: 0%; transition-delay: ${idx * 60}ms;">
                              <div class="absolute inset-0 shimmer-sweep-layer pointer-events-none"></div>
                            </div>
                          </div>
                          <div class="flex justify-between text-[11px] text-[#78716C] mt-2">
                            <span>Spent ${cat.percent_spent}% • Projected month-end: ${formatINR(cat.projected_spend_minor)}</span>
                            <span class="${cat.remaining_minor > 0 ? 'text-[#2D7A58]' : 'text-[#B84A39]'} font-medium">
                              ${cat.remaining_minor > 0 ? `${formatINR(cat.remaining_minor)} cushion` : 'Budget exhausted'}
                            </span>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </div>
            `
            : renderEmptyState(
                'No Budget Set for this Period',
                `You have not created a budget cap or category allocations for ${label}. Create one to enable proactive pacing alerts.`,
                '+ Create Budget for this Month',
                "document.getElementById('open-budget-modal-btn')?.click()"
              )
        }

      </div>

      <!-- Create Budget Modal -->
      <div id="budget-modal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-content max-w-lg">
          <div class="p-5 border-b border-[#E6E1D6] flex items-center justify-between bg-[#F6F3EB]">
            <h3 class="font-serif text-base font-bold text-[#1C1917]">Create Budget for ${label}</h3>
            <button id="close-budget-modal-btn" class="text-[#78716C] hover:text-[#1C1917] p-1">✕</button>
          </div>
          <form id="create-budget-form" class="p-6 space-y-4">
            <div>
              <label class="form-label" for="budget-name-input">Budget Name</label>
              <input type="text" id="budget-name-input" value="${label} Master Budget" required class="form-input text-xs">
            </div>

            <div>
              <label class="form-label" for="budget-limit-input">Overall Monthly Spending Cap (₹)</label>
              <input type="number" step="100" id="budget-limit-input" placeholder="e.g. 70000" required class="form-input text-xs">
            </div>

            <div>
              <p class="form-label">Category Allocations (Optional)</p>
              <div class="max-h-48 overflow-y-auto space-y-2 pr-1 border border-[#E6E1D6] p-3 rounded-lg bg-[#F6F3EB]">
                ${categories
                  .filter((c) => c.category_type === 'expense')
                  .slice(0, 6)
                  .map(
                    (c) => `
                    <div class="flex items-center justify-between gap-2 text-xs">
                      <span class="truncate text-[#1C1917] font-medium">${c.name}</span>
                      <div class="flex items-center gap-1">
                        <span class="text-[#78716C]">₹</span>
                        <input type="number" step="100" data-category-id="${c.id}" class="budget-cat-alloc form-input text-xs w-28 py-1" placeholder="0">
                      </div>
                    </div>
                  `
                  )
                  .join('')}
              </div>
            </div>

            <div class="pt-3 flex items-center justify-end gap-3 border-t border-[#E6E1D6]">
              <button type="button" id="cancel-budget-modal-btn" class="btn btn-secondary text-xs">Cancel</button>
              <button type="submit" class="btn btn-coral text-xs">Save Budget</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // --- Execute Visual Animations ---
    if (perf) {
      requestAnimationFrame(() => {
        animateNumber(container.querySelector('#budget-total-cap'), perf.total_budget_minor, 0, 600);
        animateNumber(container.querySelector('#budget-total-spent'), perf.total_spent_minor, 0, 600);
        animateNumber(container.querySelector('#budget-total-remaining'), perf.total_remaining_minor, 0, 600);

        container.querySelectorAll('.budget-cat-bar').forEach((bar) => {
          const targetPct = bar.getAttribute('data-percent') || '0';
          bar.style.width = `${targetPct}%`;
        });

        init3DTilt(container);
      });
    }

    // --- Wire Events ---
    const budgetModal = container.querySelector('#budget-modal');
    container.querySelector('#open-budget-modal-btn')?.addEventListener('click', () => {
      budgetModal.classList.add('open');
    });

    const closeBudgetModal = () => budgetModal.classList.remove('open');
    container.querySelector('#close-budget-modal-btn')?.addEventListener('click', closeBudgetModal);
    container.querySelector('#cancel-budget-modal-btn')?.addEventListener('click', closeBudgetModal);

    // Save Budget Form Submit
    container.querySelector('#create-budget-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = container.querySelector('#budget-name-input').value;
      const limitVal = container.querySelector('#budget-limit-input').value;
      const limitMinor = parseRupeesToPaise(limitVal);

      // Collect category allocations
      const allocations = [];
      container.querySelectorAll('.budget-cat-alloc').forEach((input) => {
        const catId = parseInt(input.getAttribute('data-category-id'), 10);
        const val = input.value;
        if (val && parseFloat(val) > 0) {
          allocations.push({
            category_id: catId,
            allocated_amount_minor: parseRupeesToPaise(val),
          });
        }
      });

      try {
        await api.createBudget({
          name,
          period_type: 'monthly',
          start_date: startDate,
          end_date: endDate,
          total_limit_minor: limitMinor,
          rollover_enabled: false,
          allocations,
        });

        showToast(`Budget "${name}" saved!`, 'success');
        closeBudgetModal();
        store.setState({ lastUpdated: Date.now() });
      } catch (err) {
        showToast(err.message || 'Failed to create budget.', 'error');
      }
    });

  } catch (err) {
    container.innerHTML = renderErrorBanner(
      err.message || 'Unable to load budget allocations from server.',
      'location.reload()'
    );
  }
}
