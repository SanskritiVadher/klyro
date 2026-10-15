/**
 * KLYRO — View: Accounts & Cash Flow
 * Connected to live backend API (/api/v1/accounts) with real-time balance reconciliation
 * and reserve / emergency fund segregation.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { formatINR, formatCompactINR, parseRupeesToPaise } from '../utils/formatters.js';
import { renderCardSkeleton, renderErrorBanner } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { animateNumber, isReducedMotion, init3DTilt } from '../utils/animate.js';

let accountsChartInstance = null;

export async function renderAccountsView(container) {
  container.innerHTML = renderCardSkeleton(4);

  try {
    const accounts = await api.getAccounts();

    // Compute Net Assets, Reserves, Liabilities, and True Position
    let totalLiquidity = 0;
    let totalReserves = 0;
    let totalLiabilities = 0;

    accounts.forEach((acc) => {
      const bal = acc.current_balance_minor || 0;
      if (acc.account_type === 'credit_card') {
        if (bal < 0) totalLiabilities += Math.abs(bal);
      } else if (acc.is_reserve) {
        if (bal > 0) totalReserves += bal;
      } else {
        if (bal > 0) totalLiquidity += bal;
      }
    });

    const netPosition = totalLiquidity + totalReserves - totalLiabilities;

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="fade-up-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-serif text-2xl font-bold text-[#1C1917]">Accounts & True Net Position</h3>
            <p class="text-xs text-[#78716C] mt-0.5">Asset accounts, credit card liabilities, and liquidity overview</p>
          </div>
          <button id="add-account-btn" class="btn btn-coral text-xs">+ Connect / Add Account</button>
        </div>

        <!-- 4 Summary Pillars -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="fade-up-card delay-1 paper-card p-5">
            <p class="text-xs font-semibold text-[#78716C] uppercase">Total Liquid Assets</p>
            <p id="acc-total-liquidity" class="font-serif text-2xl font-bold text-[#2D7A58] mt-1 num">₹0.00</p>
            <p class="text-[11px] text-[#78716C] mt-1">Spendable checking, wallets, & cash</p>
          </div>
          <div class="fade-up-card delay-2 paper-card p-5">
            <p class="text-xs font-semibold text-[#78716C] uppercase">Reserves</p>
            <p id="acc-total-reserves" class="font-serif text-2xl font-bold text-[#1C1917] mt-1 num">₹0.00</p>
            <p class="text-[11px] text-[#78716C] mt-1">Emergency funds & protected reserves</p>
          </div>
          <div class="fade-up-card delay-3 paper-card p-5">
            <p class="text-xs font-semibold text-[#78716C] uppercase">Credit Card Liabilities</p>
            <p id="acc-total-liabilities" class="font-serif text-2xl font-bold text-[#D45644] mt-1 num">₹0.00</p>
            <p class="text-[11px] text-[#78716C] mt-1">Outstanding debt due to banks</p>
          </div>
          <div class="fade-up-card delay-4 paper-card p-5">
            <p class="text-xs font-semibold text-[#78716C] uppercase">True Net Position</p>
            <p id="acc-net-position" class="font-serif text-2xl font-bold ${netPosition >= 0 ? 'text-[#1C1917]' : 'text-[#B84A39]'} mt-1 num">₹0.00</p>
            <p class="text-[11px] text-[#2D7A58] mt-1">Net worth across all accounts</p>
          </div>
        </div>

        <!-- Chart.js Account Distribution Visualization -->
        <div class="fade-up-card delay-3 paper-card p-6 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-serif text-base font-bold text-[#1C1917]">Account Liquidity & Liabilities Breakdown</h4>
              <p class="text-xs text-[#78716C]">Balances formatted in Indian financial units</p>
            </div>
            <span class="badge badge-neutral text-xs">${accounts.filter((a) => a.is_active).length} Active Ledgers</span>
          </div>
          <div class="h-56 relative">
            <canvas id="accounts-distribution-chart"></canvas>
          </div>
        </div>

        <!-- Accounts Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${accounts
            .map((acc, idx) => {
              const bal = acc.current_balance_minor || 0;
              const isCredit = acc.account_type === 'credit_card';
              let icon = '🏦';
              if (isCredit) icon = '💳';
              else if (acc.account_type === 'wallet') icon = '📱';
              else if (acc.account_type === 'cash') icon = '💵';

              const balanceColor = isCredit
                ? bal < 0
                  ? 'text-[#D45644]'
                  : 'text-[#2D7A58]'
                : bal >= 0
                ? 'text-[#1C1917]'
                : 'text-[#D45644]';

              return `
                <div class="fade-up-card delay-${Math.min(idx + 1, 4)} paper-card p-5 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-[#F6F3EB] border border-[#E6E1D6] text-[#1C1917] flex items-center justify-center font-bold text-base">
                          ${icon}
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <h4 class="font-semibold text-sm text-[#1C1917]">${acc.name}</h4>
                            ${acc.is_reserve ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FDEEEB] text-[#D45644] border border-[#F6D5CE]">Reserve</span>' : ''}
                          </div>
                          <p class="text-[11px] text-[#78716C] capitalize">${acc.account_type} • ${acc.institution_name || 'Personal'}</p>
                        </div>
                      </div>
                      <span class="badge ${acc.is_active ? 'badge-sage' : 'badge-neutral'} text-[10px]">
                        ${acc.is_active ? 'Active' : 'Archived'}
                      </span>
                    </div>

                    <div class="border-t border-[#F6F3EB] py-3 flex justify-between items-baseline">
                      <span class="text-xs text-[#78716C]">${isCredit ? 'Outstanding Balance' : acc.is_reserve ? 'Reserve Balance' : 'Current Liquidity'}</span>
                      <span class="font-serif text-2xl font-bold ${balanceColor} num">${formatINR(bal)}</span>
                    </div>
                  </div>

                  <div class="border-t border-[#F6F3EB] pt-3 flex items-center justify-between text-xs">
                    <span class="text-[#78716C]">Opening: ${formatINR(acc.opening_balance_minor)}</span>
                    <div class="flex items-center gap-3">
                      <button data-edit-id="${acc.id}" class="edit-acc-btn text-xs font-semibold text-[#78716C] hover:text-[#1C1917] hover:underline">
                        Edit
                      </button>
                      <button data-reconcile-id="${acc.id}" data-acc-name="${acc.name}" data-current-bal="${bal}" class="reconcile-btn text-xs font-semibold text-[#D45644] hover:underline">
                        Reconcile →
                      </button>
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

      </div>

      <!-- Balance Reconciliation Modal -->
      <div id="reconcile-modal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-content max-w-md">
          <div class="p-5 border-b border-[#E6E1D6] flex items-center justify-between bg-[#F6F3EB]">
            <div>
              <h3 class="font-serif text-base font-bold text-[#1C1917]">Balance Reconciliation</h3>
              <p id="reconcile-acc-name" class="text-xs text-[#78716C]"></p>
            </div>
            <button id="close-reconcile-modal-btn" class="text-[#78716C] hover:text-[#1C1917] p-1">✕</button>
          </div>
          <form id="reconcile-form" class="p-6 space-y-4">
            <input type="hidden" id="reconcile-acc-id">
            <div>
              <label class="form-label" for="reconcile-target-amount">Actual Statement Balance (₹)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-lg font-bold text-[#78716C]">₹</span>
                <input type="number" step="0.01" id="reconcile-target-amount" required class="form-input pl-8 font-serif text-xl font-bold">
              </div>
              <p class="text-[11px] text-[#78716C] mt-1">Klyro will create a balancing adjustment transaction to align records.</p>
            </div>

            <div>
              <label class="form-label" for="reconcile-notes">Adjustment Reason</label>
              <input type="text" id="reconcile-notes" placeholder="e.g. Bank statement reconciliation, physical cash recount" class="form-input text-xs">
            </div>

            <div class="pt-3 flex items-center justify-end gap-3 border-t border-[#E6E1D6]">
              <button type="button" id="cancel-reconcile-btn" class="btn btn-secondary text-xs">Cancel</button>
              <button type="submit" class="btn btn-coral text-xs">Save Adjustment</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Account Modal -->
      <div id="new-account-modal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-content max-w-md">
          <div class="p-5 border-b border-[#E6E1D6] flex items-center justify-between bg-[#F6F3EB]">
            <h3 class="font-serif text-base font-bold text-[#1C1917]">Add New Account</h3>
            <button id="close-acc-modal-btn" class="text-[#78716C] hover:text-[#1C1917] p-1">✕</button>
          </div>
          <form id="new-account-form" class="p-6 space-y-4">
            <div>
              <label class="form-label" for="new-acc-name">Account Name</label>
              <input type="text" id="new-acc-name" required placeholder="e.g. Axis Salary Bank, SBI Card" class="form-input text-xs">
            </div>

            <div>
              <label class="form-label" for="new-acc-type">Account Type</label>
              <select id="new-acc-type" class="form-select text-xs">
                <option value="bank">Bank Checking / Savings</option>
                <option value="credit_card">Credit Card (Liability)</option>
                <option value="wallet">Digital Wallet / UPI</option>
                <option value="cash">Physical Cash</option>
              </select>
            </div>

            <div>
              <label class="form-label" for="new-acc-institution">Institution Name (Optional)</label>
              <input type="text" id="new-acc-institution" placeholder="e.g. Axis Bank, Paytm" class="form-input text-xs">
            </div>

            <div>
              <label class="form-label" for="new-acc-balance">Opening Balance (₹)</label>
              <input type="number" step="0.01" id="new-acc-balance" required placeholder="0.00" class="form-input text-xs">
              <p class="text-[11px] text-[#78716C] mt-1">For credit cards with debt, enter as negative (e.g. -5000).</p>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="new-acc-reserve" class="rounded border-[#E6E1D6] text-[#D45644] focus:ring-[#D45644] h-4 w-4">
              <label for="new-acc-reserve" class="text-xs text-[#1C1917] font-medium cursor-pointer">Reserve / emergency fund (not counted as spendable)</label>
            </div>

            <div class="pt-3 flex items-center justify-end gap-3 border-t border-[#E6E1D6]">
              <button type="button" id="cancel-acc-btn" class="btn btn-secondary text-xs">Cancel</button>
              <button type="submit" class="btn btn-coral text-xs">Create Account</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Account Modal -->
      <div id="edit-account-modal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-content max-w-md">
          <div class="p-5 border-b border-[#E6E1D6] flex items-center justify-between bg-[#F6F3EB]">
            <h3 class="font-serif text-base font-bold text-[#1C1917]">Edit Account</h3>
            <button id="close-edit-acc-modal-btn" class="text-[#78716C] hover:text-[#1C1917] p-1">✕</button>
          </div>
          <form id="edit-account-form" class="p-6 space-y-4">
            <input type="hidden" id="edit-acc-id">
            <div>
              <label class="form-label" for="edit-acc-name">Account Name</label>
              <input type="text" id="edit-acc-name" required class="form-input text-xs">
            </div>

            <div>
              <label class="form-label" for="edit-acc-institution">Institution Name (Optional)</label>
              <input type="text" id="edit-acc-institution" class="form-input text-xs">
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="edit-acc-reserve" class="rounded border-[#E6E1D6] text-[#D45644] focus:ring-[#D45644] h-4 w-4">
              <label for="edit-acc-reserve" class="text-xs text-[#1C1917] font-medium cursor-pointer">Reserve / emergency fund (not counted as spendable)</label>
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" id="edit-acc-active" class="rounded border-[#E6E1D6] text-[#2D7A58] focus:ring-[#2D7A58] h-4 w-4">
              <label for="edit-acc-active" class="text-xs text-[#1C1917] font-medium cursor-pointer">Active Account</label>
            </div>

            <div class="pt-3 flex items-center justify-end gap-3 border-t border-[#E6E1D6]">
              <button type="button" id="cancel-edit-acc-btn" class="btn btn-secondary text-xs">Cancel</button>
              <button type="submit" class="btn btn-coral text-xs">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // --- Visual Animations & Chart Initialization ---
    requestAnimationFrame(() => {
      animateNumber(container.querySelector('#acc-total-liquidity'), totalLiquidity, 0, 600);
      animateNumber(container.querySelector('#acc-total-reserves'), totalReserves, 0, 600);
      animateNumber(container.querySelector('#acc-total-liabilities'), totalLiabilities, 0, 600);
      animateNumber(container.querySelector('#acc-net-position'), netPosition, 0, 600);

      if (typeof Chart !== 'undefined') {
        if (accountsChartInstance) accountsChartInstance.destroy();

        const ctxAccounts = container.querySelector('#accounts-distribution-chart')?.getContext('2d');
        if (ctxAccounts && accounts.length > 0) {
          const accLabels = accounts.map((a) => (a.is_reserve ? `${a.name} (Reserve)` : a.name));
          const accBalances = accounts.map((a) => (a.current_balance_minor || 0) / 100);
          const accColors = accounts.map((a) => {
            if (a.account_type === 'credit_card') {
              return (a.current_balance_minor || 0) < 0 ? '#D45644' : '#2D7A58';
            }
            if (a.is_reserve) return '#C87D55'; // Burnt coral / amber tint for reserve
            return (a.current_balance_minor || 0) >= 0 ? '#2D7A58' : '#D45644';
          });

          accountsChartInstance = new Chart(ctxAccounts, {
            type: 'bar',
            data: {
              labels: accLabels,
              datasets: [
                {
                  label: 'Balance (₹)',
                  data: accBalances,
                  backgroundColor: accColors,
                  borderRadius: 8,
                  borderSkipped: false,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: isReducedMotion() ? false : { duration: 600, easing: 'easeOutQuart' },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1C1917',
                  padding: 10,
                  cornerRadius: 8,
                  titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
                  bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                  callbacks: {
                    label: (ctx) => {
                      const minor = Math.round(ctx.parsed.y * 100);
                      return ` Balance: ${formatCompactINR(minor)} (${formatINR(minor)})`;
                    },
                  },
                },
              },
              scales: {
                y: {
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
                    color: '#1C1917',
                  },
                },
              },
            },
          });
        }
      }

      init3DTilt(container);
    });

    // --- Wire Events ---
    const reconcileModal = container.querySelector('#reconcile-modal');
    const accModal = container.querySelector('#new-account-modal');
    const editModal = container.querySelector('#edit-account-modal');

    // Open Reconcile Modal
    container.querySelectorAll('.reconcile-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-reconcile-id');
        const name = btn.getAttribute('data-acc-name');
        const currentBalMinor = parseInt(btn.getAttribute('data-current-bal'), 10);

        container.querySelector('#reconcile-acc-id').value = id;
        container.querySelector('#reconcile-acc-name').textContent = `${name} (Current: ${formatINR(currentBalMinor)})`;
        container.querySelector('#reconcile-target-amount').value = (currentBalMinor / 100).toFixed(2);
        reconcileModal.classList.add('open');
      });
    });

    // Close Reconcile Modal
    const closeReconcile = () => reconcileModal.classList.remove('open');
    container.querySelector('#close-reconcile-modal-btn')?.addEventListener('click', closeReconcile);
    container.querySelector('#cancel-reconcile-btn')?.addEventListener('click', closeReconcile);

    // Reconcile Submit
    container.querySelector('#reconcile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = container.querySelector('#reconcile-acc-id').value;
      const amountVal = container.querySelector('#reconcile-target-amount').value;
      const notesVal = container.querySelector('#reconcile-notes').value;
      const minor = parseRupeesToPaise(amountVal);

      try {
        await api.adjustAccountBalance(id, minor, notesVal);
        showToast('Account balance reconciled successfully!', 'success');
        closeReconcile();
        store.setState({ lastUpdated: Date.now() });
      } catch (err) {
        showToast(err.message || 'Failed to adjust balance.', 'error');
      }
    });

    // Add Account Modal Handlers
    container.querySelector('#add-account-btn')?.addEventListener('click', () => {
      accModal.classList.add('open');
    });
    const closeAccModal = () => accModal.classList.remove('open');
    container.querySelector('#close-acc-modal-btn')?.addEventListener('click', closeAccModal);
    container.querySelector('#cancel-acc-btn')?.addEventListener('click', closeAccModal);

    // New Account Submit
    container.querySelector('#new-account-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = container.querySelector('#new-acc-name').value;
      const type = container.querySelector('#new-acc-type').value;
      const institution = container.querySelector('#new-acc-institution').value;
      const balVal = container.querySelector('#new-acc-balance').value;
      const isReserve = container.querySelector('#new-acc-reserve').checked;
      const minor = parseRupeesToPaise(balVal);

      try {
        await api.createAccount({
          name,
          account_type: type,
          institution_name: institution || null,
          opening_balance_minor: minor,
          is_reserve: isReserve,
        });
        showToast(`Account "${name}" added!`, 'success');
        closeAccModal();
        store.setState({ lastUpdated: Date.now() });
      } catch (err) {
        showToast(err.message || 'Failed to create account.', 'error');
      }
    });

    // Edit Account Handlers
    const closeEditModal = () => editModal.classList.remove('open');
    container.querySelector('#close-edit-acc-modal-btn')?.addEventListener('click', closeEditModal);
    container.querySelector('#cancel-edit-acc-btn')?.addEventListener('click', closeEditModal);

    container.querySelectorAll('.edit-acc-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-edit-id'), 10);
        const targetAcc = accounts.find((a) => a.id === id);
        if (!targetAcc) return;

        container.querySelector('#edit-acc-id').value = targetAcc.id;
        container.querySelector('#edit-acc-name').value = targetAcc.name;
        container.querySelector('#edit-acc-institution').value = targetAcc.institution_name || '';
        container.querySelector('#edit-acc-reserve').checked = Boolean(targetAcc.is_reserve);
        container.querySelector('#edit-acc-active').checked = Boolean(targetAcc.is_active);

        editModal.classList.add('open');
      });
    });

    container.querySelector('#edit-account-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = container.querySelector('#edit-acc-id').value;
      const name = container.querySelector('#edit-acc-name').value;
      const institution = container.querySelector('#edit-acc-institution').value;
      const isReserve = container.querySelector('#edit-acc-reserve').checked;
      const isActive = container.querySelector('#edit-acc-active').checked;

      try {
        await api.updateAccount(id, {
          name,
          institution_name: institution || null,
          is_reserve: isReserve,
          is_active: isActive,
        });
        showToast(`Account "${name}" updated!`, 'success');
        closeEditModal();
        store.setState({ lastUpdated: Date.now() });
      } catch (err) {
        showToast(err.message || 'Failed to update account.', 'error');
      }
    });

  } catch (err) {
    container.innerHTML = renderErrorBanner(
      err.message || 'Failed to retrieve accounts from server.',
      'location.reload()'
    );
  }
}
