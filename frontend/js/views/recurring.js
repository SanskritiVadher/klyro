/**
 * KLYRO — View: Recurring Commitments & Financial Timeline
 * Editorial calendar & recurring rules management for Indian personal finances.
 */

import { api } from '../api.js';
import { formatINR, formatDate } from '../utils/formatters.js';
import { renderCardSkeleton, renderErrorBanner } from '../components/loading.js';
import { animateNumber, init3DTilt } from '../utils/animate.js';

export async function renderRecurringView(container) {
  container.innerHTML = renderCardSkeleton(3);

  try {
    const [rules, upcoming, accounts, categories] = await Promise.all([
      api.getRecurringRules(),
      api.getUpcomingCommitments(30),
      api.getAccounts().catch(() => []),
      api.getCategories().catch(() => []),
    ]);

    // Calculate monthly metrics
    let totalMonthlyOutflow = 0;
    let totalMonthlyInflow = 0;

    rules.forEach((r) => {
      if (r.status === 'active') {
        const amount = r.expected_amount_minor || 0;
        // Normalize frequency to monthly equivalent
        let monthlyEquiv = amount;
        if (r.frequency === 'quarterly') monthlyEquiv = Math.round(amount / 3);
        else if (r.frequency === 'yearly') monthlyEquiv = Math.round(amount / 12);
        else if (r.frequency === 'weekly') monthlyEquiv = Math.round(amount * 4.33);

        if (r.rule_type === 'income') {
          totalMonthlyInflow += monthlyEquiv;
        } else {
          totalMonthlyOutflow += monthlyEquiv;
        }
      }
    });

    const netCommitted = totalMonthlyInflow - totalMonthlyOutflow;

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Header & Action -->
        <div class="fade-up-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-serif text-2xl font-bold text-[#1C1917]">Recurring Commitments & Timeline</h3>
            <p class="text-xs text-[#78716C] mt-0.5">Automated commitments, loan EMIs, SIPs, and periodic cash flows</p>
          </div>
          <button id="add-recurring-btn" class="btn btn-coral text-xs shadow-sm hover:shadow transition-all">
            + Add Recurring Rule
          </button>
        </div>

        <!-- 3 Commitment Metrics Pillars -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="fade-up-card delay-1 paper-card p-5 border-l-4 border-l-[#B84A39]">
            <span class="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">Monthly Committed Outflow</span>
            <div id="recurring-monthly-outflow" class="font-serif text-2xl font-bold text-[#B84A39] mt-1.5 num">
              ₹0.00
            </div>
            <p class="text-[11px] text-[#78716C] mt-1">EMIs, SIPs, rent, and subscriptions</p>
          </div>

          <div class="fade-up-card delay-2 paper-card p-5 border-l-4 border-l-[#2D7A58]">
            <span class="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">Expected Monthly Inflow</span>
            <div id="recurring-monthly-inflow" class="font-serif text-2xl font-bold text-[#2D7A58] mt-1.5 num">
              ₹0.00
            </div>
            <p class="text-[11px] text-[#78716C] mt-1">Salary, retainers, and scheduled deposits</p>
          </div>

          <div class="fade-up-card delay-3 paper-card p-5 border-l-4 border-l-[#D97706]">
            <span class="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider block">Active Rules Registered</span>
            <div class="font-serif text-2xl font-bold text-[#1C1917] mt-1.5">
              ${rules.filter((r) => r.status === 'active').length} <span class="text-xs font-sans font-normal text-[#78716C]">rules</span>
            </div>
            <p class="text-[11px] text-[#78716C] mt-1">Upcoming radar horizon: next 30 days</p>
          </div>
        </div>

        <!-- Financial Timeline Radar (Next 30 Days) -->
        <div class="fade-up-card delay-3 paper-card p-6">
          <div class="flex items-center justify-between mb-4 border-b border-[#E6E1D6] pb-3">
            <div>
              <h4 class="font-serif text-base font-bold text-[#1C1917]">30-Day Cash Flow Radar</h4>
              <p class="text-xs text-[#78716C]">Chronological schedule of upcoming payments and deposits</p>
            </div>
            <span class="badge badge-marigold text-xs font-semibold px-2.5 py-1">
              ${upcoming.length} events scheduled
            </span>
          </div>

          ${
            upcoming.length === 0
              ? `
              <div class="text-center py-8">
                <p class="text-xs text-[#78716C]">No recurring commitments due in the next 30 days.</p>
              </div>
            `
              : `
              <div class="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E6E1D6]">
                ${upcoming
                  .map((ev) => {
                    const isIncome = ev.rule_type === 'income';
                    const isDueWithin3 = ev.days_until_due <= 3;
                    const bulletColor = isIncome
                      ? 'bg-[#2D7A58]'
                      : isDueWithin3
                      ? 'bg-[#D45644] pulsing-dot-urgent'
                      : 'bg-[#D97706]';
                    const cardBg = isDueWithin3 && !isIncome
                      ? 'bg-[#FFF9F8] border border-[#F7C6BE]'
                      : 'bg-[#FDFBF7] border border-[#E6E1D6]/70';

                    let relativeText = '';
                    if (ev.days_until_due < 0) {
                      relativeText = `<span class="text-[#B84A39] font-bold">Overdue by ${Math.abs(ev.days_until_due)} days</span>`;
                    } else if (ev.days_until_due === 0) {
                      relativeText = `<span class="text-[#D97706] font-bold">Due today</span>`;
                    } else if (ev.days_until_due === 1) {
                      relativeText = `<span class="text-[#D97706] font-semibold">Due tomorrow</span>`;
                    } else {
                      relativeText = `In ${ev.days_until_due} days`;
                    }

                    return `
                      <div class="relative commitment-item">
                        <div class="absolute -left-6 top-2 w-3.5 h-3.5 rounded-full ${bulletColor} ring-4 ring-white"></div>
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg ${cardBg} gap-2">
                          <div>
                            <div class="flex items-center gap-2">
                              <span class="font-bold text-xs text-[#1C1917]">${ev.name}</span>
                              <span class="badge ${isIncome ? 'badge-sage' : 'badge-neutral'} text-[10px] uppercase font-semibold">
                                ${ev.rule_type}
                              </span>
                            </div>
                            <p class="text-[11px] text-[#78716C] mt-0.5">
                              Due ${formatDate(ev.due_date)} • ${relativeText}
                              ${ev.account_name ? `• ${ev.account_name}` : ''}
                            </p>
                          </div>
                          <div class="text-right">
                            <span class="font-serif font-bold text-sm ${isIncome ? 'text-[#2D7A58]' : 'text-[#B84A39]'}">
                              ${isIncome ? '+' : '-'}${formatINR(ev.expected_amount_minor)}
                            </span>
                            ${ev.category_name ? `<p class="text-[10px] text-[#A8A29E]">${ev.category_name}</p>` : ''}
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
          }
        </div>

        <!-- All Recurring Rules Management Table -->
        <div class="paper-card overflow-hidden">
          <div class="p-5 border-b border-[#E6E1D6] flex items-center justify-between">
            <div>
              <h4 class="font-serif text-base font-bold text-[#1C1917]">Registered Recurring Commitments</h4>
              <p class="text-xs text-[#78716C]">Rules governing automated cash outflows, subscriptions, and income schedules</p>
            </div>
          </div>

          ${
            rules.length === 0
              ? `
              <div class="p-8 text-center text-xs text-[#78716C]">
                No recurring rules created yet. Click "+ Add Recurring Rule" above to register an EMI, SIP, or subscription.
              </div>
            `
              : `
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-[#E6E1D6] bg-[#F6F3EB]/60 text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                      <th class="py-3 px-4">Commitment</th>
                      <th class="py-3 px-4">Type</th>
                      <th class="py-3 px-4 text-right">Amount</th>
                      <th class="py-3 px-4">Frequency</th>
                      <th class="py-3 px-4">Next Due Date</th>
                      <th class="py-3 px-4">Linked Account</th>
                      <th class="py-3 px-4 text-center">Status</th>
                      <th class="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#E6E1D6] text-xs">
                    ${rules
                      .map((r) => {
                        const isIncome = r.rule_type === 'income';
                        return `
                          <tr class="hover:bg-[#FDFBF7] transition-colors">
                            <td class="py-3.5 px-4 font-semibold text-[#1C1917]">
                              ${r.name}
                              ${r.category_name ? `<span class="block text-[10px] font-normal text-[#78716C]">${r.category_name}</span>` : ''}
                            </td>
                            <td class="py-3.5 px-4">
                              <span class="badge ${isIncome ? 'badge-sage' : 'badge-neutral'} text-[10px] capitalize">
                                ${r.rule_type}
                              </span>
                            </td>
                            <td class="py-3.5 px-4 text-right font-serif font-bold ${isIncome ? 'text-[#2D7A58]' : 'text-[#1C1917]'}">
                              ${isIncome ? '+' : ''}${formatINR(r.expected_amount_minor)}
                            </td>
                            <td class="py-3.5 px-4 capitalize text-[#78716C]">
                              ${r.frequency}
                            </td>
                            <td class="py-3.5 px-4 text-[#44403C]">
                              ${formatDate(r.next_due_date)}
                            </td>
                            <td class="py-3.5 px-4 text-[#78716C]">
                              ${r.account_name || '—'}
                            </td>
                            <td class="py-3.5 px-4 text-center">
                              <span class="badge ${r.status === 'active' ? 'badge-sage' : 'badge-neutral'} text-[10px] uppercase font-semibold">
                                ${r.status}
                              </span>
                            </td>
                            <td class="py-3.5 px-4 text-right">
                              <button data-rule-id="${r.id}" class="delete-rule-btn text-[#B84A39] hover:underline font-medium text-[11px]">
                                Delete
                              </button>
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
          }
        </div>

      </div>

      <!-- Add Recurring Rule Modal -->
      <div id="add-recurring-modal" class="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex items-center justify-center p-4 hidden">
        <div class="paper-card w-full max-w-lg p-6 shadow-2xl relative">
          <div class="flex items-center justify-between border-b border-[#E6E1D6] pb-3 mb-4">
            <h4 class="font-serif text-lg font-bold text-[#1C1917]">Add Recurring Commitment</h4>
            <button id="close-recurring-modal" class="text-[#78716C] hover:text-[#1C1917] text-lg font-bold">&times;</button>
          </div>

          <form id="add-recurring-form" class="space-y-4">
            <div>
              <label class="form-label" for="rule-name">Commitment / Payee Name *</label>
              <input type="text" id="rule-name" required placeholder="e.g. HDFC Home Loan EMI, Netflix, Salary" class="form-input text-xs">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label" for="rule-type">Commitment Type</label>
                <select id="rule-type" class="form-select text-xs">
                  <option value="expense" selected>Expense / Bill / EMI / SIP</option>
                  <option value="income">Income / Salary</option>
                  <option value="transfer">Account Transfer</option>
                </select>
              </div>

              <div>
                <label class="form-label" for="rule-frequency">Frequency</label>
                <select id="rule-frequency" class="form-select text-xs">
                  <option value="monthly" selected>Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly / Annual</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label" for="rule-amount">Expected Amount (₹) *</label>
                <input type="number" id="rule-amount" step="0.01" min="1" required placeholder="e.g. 15000" class="form-input text-xs font-mono">
              </div>

              <div>
                <label class="form-label" for="rule-due-date">Next Due Date *</label>
                <input type="date" id="rule-due-date" required class="form-input text-xs">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label" for="rule-account">Payment Account *</label>
                <select id="rule-account" required class="form-select text-xs">
                  ${accounts.map((a, i) => `<option value="${a.id}" ${i === 0 ? 'selected' : ''}>${a.name} (${a.account_type})</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="form-label" for="rule-category">Budget Category</label>
                <select id="rule-category" class="form-select text-xs">
                  <option value="">None / Unassigned</option>
                  ${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
              </div>
            </div>

            <div id="rule-modal-error" class="hidden text-xs text-[#B84A39] bg-[#FEF2F2] p-2.5 rounded border border-[#FECACA]"></div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E1D6]">
              <button type="button" id="cancel-recurring-modal" class="btn btn-secondary text-xs">Cancel</button>
              <button type="submit" id="save-recurring-btn" class="btn btn-coral text-xs">Save Commitment</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Set default date to today
    const dateInput = document.getElementById('rule-due-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Trigger count-up numbers and 3D card tilt
    requestAnimationFrame(() => {
      animateNumber(document.getElementById('recurring-monthly-outflow'), totalMonthlyOutflow, 0, 600);
      animateNumber(document.getElementById('recurring-monthly-inflow'), totalMonthlyInflow, 0, 600);
      init3DTilt(container);
    });

    // Modal Triggers
    const modal = document.getElementById('add-recurring-modal');
    const openBtn = document.getElementById('add-recurring-btn');
    const closeBtn = document.getElementById('close-recurring-modal');
    const cancelBtn = document.getElementById('cancel-recurring-modal');

    const openModal = () => modal.classList.remove('hidden');
    const closeModal = () => {
      modal.classList.add('hidden');
      document.getElementById('rule-modal-error').classList.add('hidden');
    };

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Form Submit Handler
    const form = document.getElementById('add-recurring-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-recurring-btn');
        const errBox = document.getElementById('rule-modal-error');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        errBox.classList.add('hidden');

        try {
          const name = document.getElementById('rule-name').value.trim();
          const ruleType = document.getElementById('rule-type').value;
          const frequency = document.getElementById('rule-frequency').value;
          const amountRupees = parseFloat(document.getElementById('rule-amount').value);
          const nextDueDate = document.getElementById('rule-due-date').value;
          const accountIdVal = document.getElementById('rule-account').value;
          const categoryIdVal = document.getElementById('rule-category').value;

          if (!accountIdVal) {
            throw new Error('Please select an account for this commitment.');
          }

          const payload = {
            name,
            rule_type: ruleType,
            frequency,
            expected_amount_minor: Math.round(amountRupees * 100),
            start_date: nextDueDate,
            next_due_date: nextDueDate,
            account_id: parseInt(accountIdVal, 10),
            category_id: categoryIdVal ? parseInt(categoryIdVal, 10) : null,
            status: 'active',
          };

          await api.createRecurringRule(payload);
          closeModal();
          await renderRecurringView(container);
        } catch (err) {
          errBox.textContent = err.message || 'Failed to save recurring commitment.';
          errBox.classList.remove('hidden');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Commitment';
        }
      });
    }

    // Delete Rule Buttons
    container.querySelectorAll('.delete-rule-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const ruleId = e.currentTarget.dataset.ruleId;
        if (confirm('Are you sure you want to delete this recurring commitment rule?')) {
          try {
            await api.deleteRecurringRule(ruleId);
            await renderRecurringView(container);
          } catch (err) {
            alert('Failed to delete rule: ' + err.message);
          }
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="paper-card p-8 text-center text-xs text-[#B84A39]">
          <p class="font-bold text-sm">Failed to load recurring commitments</p>
          <p class="mt-1">${err.message}</p>
          <button id="retry-recurring-btn" class="btn btn-secondary mt-4 text-xs">Retry</button>
        </div>
      </div>
    `;
    const retryBtn = document.getElementById('retry-recurring-btn');
    if (retryBtn) retryBtn.addEventListener('click', () => renderRecurringView(container));
  }
}
