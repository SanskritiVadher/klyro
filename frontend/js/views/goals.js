/**
 * KLYRO — View: Financial Goals & Momentum
 * Connected to live backend API (/api/v1/goals) with interactive contributions and completion forecasting.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { formatINR, formatDate, parseRupeesToPaise } from '../utils/formatters.js';
import { renderCardSkeleton, renderErrorBanner, renderEmptyState } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { animateProgressRing, burstCelebration, fireConfetti, init3DTilt } from '../utils/animate.js';

function getGoalEmoji(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('bali') || lower.includes('travel') || lower.includes('trip') || lower.includes('vacation')) return '🏝️';
  if (lower.includes('emergency') || lower.includes('reserve') || lower.includes('rainy') || lower.includes('safety')) return '🛡️';
  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('tech') || lower.includes('gadget') || lower.includes('pc')) return '💻';
  if (lower.includes('car') || lower.includes('bike') || lower.includes('vehicle') || lower.includes('auto')) return '🚗';
  if (lower.includes('house') || lower.includes('home') || lower.includes('flat') || lower.includes('real estate')) return '🏠';
  if (lower.includes('wedding') || lower.includes('gift') || lower.includes('celebrat')) return '🎁';
  if (lower.includes('invest') || lower.includes('stock') || lower.includes('portfolio') || lower.includes('wealth')) return '📈';
  return '🎯';
}

export async function renderGoalsView(container) {
  container.innerHTML = renderCardSkeleton(4);

  try {
    const [goals, accounts] = await Promise.all([
      api.getGoals(),
      api.getAccounts(),
    ]);

    const ringRadius = 22;
    const ringCircumference = 2 * Math.PI * ringRadius;

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="fade-up-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-serif text-2xl font-bold text-[#1C1917]">Financial Goals & Momentum</h3>
            <p class="text-xs text-[#78716C] mt-0.5">Track your savings targets, contribution schedules, and transparent velocity forecasts</p>
          </div>
          <button id="open-create-goal-btn" class="btn btn-coral text-xs">+ Create New Goal</button>
        </div>

        <!-- Goals Grid -->
        ${
          goals.length > 0
            ? `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${goals
                  .map((goal, idx) => {
                    const isAchieved = goal.current_amount_minor >= goal.target_amount_minor;
                    const priorityBadge =
                      goal.priority === 'high'
                        ? '<span class="badge badge-terracotta text-[10px]">High Priority</span>'
                        : goal.priority === 'medium'
                        ? '<span class="badge badge-marigold text-[10px]">Medium Priority</span>'
                        : '<span class="badge badge-neutral text-[10px]">Low Priority</span>';

                    const statusBadge = isAchieved
                      ? '<span class="badge badge-sage text-[10px]">Achieved 🎉</span>'
                      : '<span class="badge badge-sage text-[10px]">In Progress</span>';

                    const barColor = isAchieved ? 'bg-[#2D7A58]' : 'bg-[#D97706]';
                    const strokeColor = isAchieved ? '#2D7A58' : '#D97706';

                    return `
                      <div class="fade-up-card delay-${Math.min(idx + 1, 4)} paper-card p-6 space-y-4 flex flex-col justify-between" id="goal-card-${goal.id}">
                        <div class="space-y-4">
                          
                          <!-- Top Row: Badges, Title, and Animated Progress Ring -->
                          <div class="flex items-start justify-between gap-3">
                            <div class="space-y-1 flex-1">
                              <div class="flex items-center gap-2">
                                ${priorityBadge}
                                ${statusBadge}
                              </div>
                              <h4 class="font-serif text-lg font-bold text-[#1C1917] mt-1 flex items-center gap-2">
                                <span class="text-xl shrink-0">${getGoalEmoji(goal.name)}</span>
                                <span>${goal.name}</span>
                              </h4>
                            </div>

                            <!-- Animated Goal Progress Ring -->
                            <div class="relative w-14 h-14 shrink-0 flex items-center justify-center">
                              <svg class="w-14 h-14 -rotate-90" viewBox="0 0 54 54">
                                <circle cx="27" cy="27" r="${ringRadius}" stroke="#E6E1D6" stroke-width="3.5" fill="none" />
                                <circle class="goal-progress-ring progress-ring-circle"
                                  data-percent="${goal.percent_achieved}"
                                  cx="27" cy="27" r="${ringRadius}"
                                  stroke="${strokeColor}" stroke-width="3.5" stroke-linecap="round" fill="none"
                                  style="stroke-dasharray: ${ringCircumference}; stroke-dashoffset: ${ringCircumference};" />
                              </svg>
                              <div class="absolute inset-0 flex items-center justify-center">
                                <span class="font-serif text-[11px] font-bold text-[#1C1917]">${goal.percent_achieved}%</span>
                              </div>
                            </div>
                          </div>

                          <!-- Metric Progress Bar -->
                          <div>
                            <div class="flex justify-between text-xs font-semibold mb-1.5">
                              <span>Saved: <strong class="text-[#2D7A58]">${formatINR(goal.current_amount_minor)}</strong></span>
                              <span class="text-[#78716C]">Target: ${formatINR(goal.target_amount_minor)}</span>
                            </div>
                            <div class="w-full bg-[#F6F3EB] h-2.5 rounded-full overflow-hidden border border-[#E6E1D6]">
                              <div class="goal-bar-fill ${barColor} h-full rounded-full transition-all duration-500 ease-out"
                                data-percent="${Math.min(100, goal.percent_achieved)}"
                                style="width: 0%; transition-delay: ${idx * 60}ms;"></div>
                            </div>
                          </div>

                        </div>

                        <!-- Card Footer -->
                        <div class="border-t border-[#F6F3EB] pt-3 flex flex-wrap items-center justify-between text-xs text-[#78716C] gap-2">
                          <span class="font-medium text-[#1C1917]">
                            ${
                              isAchieved
                                ? 'Target reached!'
                                : goal.projected_completion_date
                                ? `Projected: ${formatDate(goal.projected_completion_date)}`
                                : `Target: ${formatDate(goal.target_date)}`
                            }
                          </span>
                          <button data-goal-id="${goal.id}" data-goal-name="${goal.name}" class="contribute-goal-btn btn btn-secondary text-xs">
                            + Contribute
                          </button>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
            : renderEmptyState(
                'No Financial Goals Established',
                'Setting milestones for an emergency fund, travel, or education helps protect your monthly budget from impulse spending.',
                '+ Establish First Goal',
                "document.getElementById('open-create-goal-btn')?.click()"
              )
        }

      </div>

      <!-- Goal Contribution Modal -->
      <div id="goal-contribution-modal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-content max-w-md">
          <div class="p-5 border-b border-[#E6E1D6] flex items-center justify-between bg-[#F6F3EB]">
            <div>
              <h3 class="font-serif text-base font-bold text-[#1C1917]">Goal Contribution</h3>
              <p id="contrib-goal-title" class="text-xs text-[#78716C]"></p>
            </div>
            <button id="close-contrib-modal-btn" class="text-[#78716C] hover:text-[#1C1917] p-1">✕</button>
          </div>
          <form id="goal-contrib-form" class="p-6 space-y-4">
            <input type="hidden" id="contrib-goal-id">
            
            <div>
              <label class="form-label" for="contrib-type-select">Action</label>
              <select id="contrib-type-select" class="form-select text-xs">
                <option value="deposit">Deposit (Add to Goal)</option>
                <option value="withdrawal">Withdrawal (Release Funds)</option>
              </select>
            </div>

            <div>
              <label class="form-label" for="contrib-amount-input">Amount (₹)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-lg font-bold text-[#78716C]">₹</span>
                <input type="number" step="0.01" min="1" id="contrib-amount-input" required placeholder="0.00" class="form-input pl-8 font-serif text-xl font-bold">
              </div>
            </div>

            <div>
              <label class="form-label" for="contrib-date-input">Date</label>
              <input type="date" id="contrib-date-input" required class="form-input text-xs">
            </div>

            <div>
              <label class="form-label" for="contrib-notes-input">Notes (Optional)</label>
              <input type="text" id="contrib-notes-input" placeholder="e.g. Monthly automated transfer, festival bonus" class="form-input text-xs">
            </div>

            <div class="pt-3 flex items-center justify-end gap-3 border-t border-[#E6E1D6]">
              <button type="button" id="cancel-contrib-modal-btn" class="btn btn-secondary text-xs">Cancel</button>
              <button type="submit" class="btn btn-coral text-xs">Record Contribution</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create Goal Modal -->
      <div id="create-goal-modal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-content max-w-md">
          <div class="p-5 border-b border-[#E6E1D6] flex items-center justify-between bg-[#F6F3EB]">
            <h3 class="font-serif text-base font-bold text-[#1C1917]">Create Financial Goal</h3>
            <button id="close-create-goal-modal-btn" class="text-[#78716C] hover:text-[#1C1917] p-1">✕</button>
          </div>
          <form id="create-goal-form" class="p-6 space-y-4">
            <div>
              <label class="form-label" for="new-goal-name">Goal Name</label>
              <input type="text" id="new-goal-name" required placeholder="e.g. Emergency Fund (6 Mos), Europe 2027" class="form-input text-xs">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label" for="new-goal-target">Target Amount (₹)</label>
                <input type="number" step="100" min="100" id="new-goal-target" required placeholder="e.g. 300000" class="form-input text-xs">
              </div>
              <div>
                <label class="form-label" for="new-goal-initial">Initial Saved (₹)</label>
                <input type="number" step="100" id="new-goal-initial" value="0" class="form-input text-xs">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label" for="new-goal-date">Target Date (Optional)</label>
                <input type="date" id="new-goal-date" class="form-input text-xs">
              </div>
              <div>
                <label class="form-label" for="new-goal-priority">Priority</label>
                <select id="new-goal-priority" class="form-select text-xs">
                  <option value="high">High Priority</option>
                  <option value="medium" selected>Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label" for="new-goal-account">Linked Account (Optional)</label>
              <select id="new-goal-account" class="form-select text-xs">
                <option value="">None / Unlinked</option>
                ${accounts.map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}
              </select>
            </div>

            <div class="pt-3 flex items-center justify-end gap-3 border-t border-[#E6E1D6]">
              <button type="button" id="cancel-create-goal-btn" class="btn btn-secondary text-xs">Cancel</button>
              <button type="submit" class="btn btn-coral text-xs">Establish Goal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // --- Execute Visual Animations ---
    requestAnimationFrame(() => {
      container.querySelectorAll('.goal-progress-ring').forEach((ring) => {
        const pct = parseFloat(ring.getAttribute('data-percent') || '0');
        animateProgressRing(ring, pct, ringRadius, 600);
      });

      container.querySelectorAll('.goal-bar-fill').forEach((bar) => {
        const targetPercent = bar.getAttribute('data-percent') || '0';
        bar.style.width = `${targetPercent}%`;
      });

      // Enable 3D Tilt on goal cards
      init3DTilt(container);

      // Check if any goals are at 100% on initial load
      const hasCompletedGoal = goals.some((g) => g.current_amount_minor >= g.target_amount_minor);
      if (hasCompletedGoal) {
        setTimeout(() => {
          fireConfetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }, 350);
      }
    });

    // --- Wire Events ---
    const contribModal = container.querySelector('#goal-contribution-modal');
    const createModal = container.querySelector('#create-goal-modal');

    // Open Contribution Modal
    container.querySelectorAll('.contribute-goal-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-goal-id');
        const name = btn.getAttribute('data-goal-name');
        container.querySelector('#contrib-goal-id').value = id;
        container.querySelector('#contrib-goal-title').textContent = name;
        container.querySelector('#contrib-date-input').value = new Date().toISOString().split('T')[0];
        contribModal.classList.add('open');
        container.querySelector('#contrib-amount-input').focus();
      });
    });

    const closeContribModal = () => contribModal.classList.remove('open');
    container.querySelector('#close-contrib-modal-btn')?.addEventListener('click', closeContribModal);
    container.querySelector('#cancel-contrib-modal-btn')?.addEventListener('click', closeContribModal);

    // Contribution Submit
    container.querySelector('#goal-contrib-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const goalId = container.querySelector('#contrib-goal-id').value;
      const amountVal = container.querySelector('#contrib-amount-input').value;
      const type = container.querySelector('#contrib-type-select').value;
      const dateVal = container.querySelector('#contrib-date-input').value;
      const notesVal = container.querySelector('#contrib-notes-input').value;
      const minor = parseRupeesToPaise(amountVal);

      try {
        const targetGoal = goals.find((g) => String(g.id) === String(goalId));
        const wasUnder = targetGoal && targetGoal.current_amount_minor < targetGoal.target_amount_minor;
        const willCross100 = type === 'deposit' && targetGoal && (targetGoal.current_amount_minor + minor) >= targetGoal.target_amount_minor;

        await api.addGoalContribution(goalId, {
          amount_minor: minor,
          contribution_date: dateVal,
          contribution_type: type,
          notes: notesVal || null,
        });

        closeContribModal();

        if (wasUnder && willCross100) {
          const cardEl = container.querySelector(`#goal-card-${goalId}`) || container.querySelector(`[data-goal-id="${goalId}"]`);
          burstCelebration(cardEl);
          fireConfetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
          showToast(`Target Reached! Goal "${targetGoal.name}" is 100% achieved! 🎉`, 'success');
        } else {
          showToast(`Contribution of ₹${(minor / 100).toFixed(2)} recorded!`, 'success');
        }

        store.setState({ lastUpdated: Date.now() });
      } catch (err) {
        showToast(err.message || 'Failed to record goal contribution.', 'error');
      }
    });

    // Create Goal Modal Handlers
    container.querySelector('#open-create-goal-btn')?.addEventListener('click', () => {
      createModal.classList.add('open');
    });

    const closeCreateModal = () => createModal.classList.remove('open');
    container.querySelector('#close-create-goal-modal-btn')?.addEventListener('click', closeCreateModal);
    container.querySelector('#cancel-create-goal-btn')?.addEventListener('click', closeCreateModal);

    // Create Goal Submit
    container.querySelector('#create-goal-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = container.querySelector('#new-goal-name').value;
      const targetVal = container.querySelector('#new-goal-target').value;
      const initialVal = container.querySelector('#new-goal-initial').value || '0';
      const dateVal = container.querySelector('#new-goal-date').value || null;
      const priority = container.querySelector('#new-goal-priority').value;
      const accId = container.querySelector('#new-goal-account').value;

      try {
        await api.createGoal({
          name,
          target_amount_minor: parseRupeesToPaise(targetVal),
          initial_amount_minor: parseRupeesToPaise(initialVal),
          target_date: dateVal,
          priority,
          linked_account_id: accId ? parseInt(accId, 10) : null,
          status: 'in_progress',
        });

        showToast(`Goal "${name}" established!`, 'success');
        closeCreateModal();
        store.setState({ lastUpdated: Date.now() });
      } catch (err) {
        showToast(err.message || 'Failed to create goal.', 'error');
      }
    });

  } catch (err) {
    container.innerHTML = renderErrorBanner(
      err.message || 'Unable to load goal momentum from server.',
      'location.reload()'
    );
  }
}
