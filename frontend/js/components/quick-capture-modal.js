/**
 * KLYRO — Quick-Capture Modal Component
 * Fast, keyboard-first transaction entry with reactive tab switching,
 * smart category suggestions, and atomic transfers.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { parseRupeesToPaise } from '../utils/formatters.js';
import { showToast } from './toast.js';
import { fireConfetti } from '../utils/animate.js';

let accountsCache = [];
let categoriesCache = [];
let currentTab = 'expense';

const MERCHANT_SUGGESTION_MAP = [
  { keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'starbucks', 'mcdonald', 'burger', 'pizza', 'dine', 'food'], categoryType: 'expense', categoryMatch: 'dining' },
  { keywords: ['nature', 'grocer', 'blinkit', 'zepto', 'instamart', 'supermarket', 'bigbasket', 'milk', 'vegetable'], categoryType: 'expense', categoryMatch: 'grocer' },
  { keywords: ['uber', 'ola', 'metro', 'petrol', 'fuel', 'auto', 'diesel', 'toll', 'fastag'], categoryType: 'expense', categoryMatch: 'transport' },
  { keywords: ['netflix', 'spotify', 'prime', 'hotstar', 'cinema', 'pvr', 'movie'], categoryType: 'expense', categoryMatch: 'entertain' },
  { keywords: ['airtel', 'jio', 'electricity', 'power', 'water', 'bescom', 'tata power', 'broadband', 'gas'], categoryType: 'expense', categoryMatch: 'utilit' },
  { keywords: ['salary', 'bonus', 'stipend', 'payroll', 'acme', 'wages'], categoryType: 'income', categoryMatch: 'salary' },
  { keywords: ['freelance', 'contract', 'consulting', 'upwork', 'client'], categoryType: 'income', categoryMatch: 'freelance' },
  { keywords: ['dividend', 'interest', 'stock', 'mutual fund', 'yield'], categoryType: 'income', categoryMatch: 'investment' },
];

/**
 * Preload accounts and categories from backend
 */
async function ensureDataLoaded() {
  try {
    if (accountsCache.length === 0) {
      accountsCache = await api.getAccounts();
    }
    if (categoriesCache.length === 0) {
      categoriesCache = await api.getCategories();
    }
  } catch (err) {
    console.warn('Could not preload accounts/categories for quick capture:', err);
  }
}

/**
 * Render dynamic fields for the selected tab
 */
function renderFields(tabType, initialValues = {}) {
  const fieldsContainer = document.getElementById('quick-capture-fields');
  const saveBtn = document.getElementById('save-capture-btn');
  if (!fieldsContainer) return;

  const activeAccounts = accountsCache.filter((a) => a.is_active);
  const expenseCategories = categoriesCache.filter((c) => !c.is_archived && c.category_type === 'expense');
  const incomeCategories = categoriesCache.filter((c) => !c.is_archived && c.category_type === 'income');

  const today = new Date().toISOString().split('T')[0];
  const amountVal = initialValues.amount || '';
  const dateVal = initialValues.date || today;
  const notesVal = initialValues.notes || '';
  const merchantVal = initialValues.merchant || '';

  if (tabType === 'expense') {
    if (saveBtn) saveBtn.textContent = 'Save Expense';

    const categoryOptions = expenseCategories
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join('');

    const accountOptions = activeAccounts
      .map((a) => `<option value="${a.id}">${a.name} (${a.account_type})</option>`)
      .join('');

    fieldsContainer.innerHTML = `
      <!-- Amount -->
      <div>
        <label class="form-label" for="tx-amount">Amount (₹)</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-xl font-bold text-[#78716C]">₹</span>
          <input type="number" step="0.01" min="0.01" id="tx-amount" required placeholder="0.00" value="${amountVal}" class="form-input pl-8 font-serif text-2xl font-bold text-[#1C1917]">
        </div>
      </div>

      <!-- Merchant & Date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label" for="tx-merchant">Merchant / Payee</label>
          <input type="text" id="tx-merchant" required placeholder="e.g. Swiggy, Metro, Reliance" value="${merchantVal}" class="form-input">
        </div>
        <div>
          <label class="form-label" for="tx-date">Date</label>
          <input type="date" id="tx-date" required value="${dateVal}" class="form-input">
        </div>
      </div>

      <!-- Category & Account -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label" for="tx-category">Category</label>
          <select id="tx-category" class="form-select">
            ${categoryOptions}
          </select>
        </div>
        <div>
          <label class="form-label" for="tx-account">Account / Payment</label>
          <select id="tx-account" class="form-select">
            ${accountOptions}
          </select>
        </div>
      </div>

      <!-- Payment Method -->
      <div>
        <label class="form-label" for="tx-payment-method">Payment Method</label>
        <select id="tx-payment-method" class="form-select">
          <option value="upi">UPI / QR</option>
          <option value="credit_card">Credit Card</option>
          <option value="debit_card">Debit Card</option>
          <option value="net_banking">Net Banking</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </select>
      </div>

      <!-- Notes -->
      <div>
        <label class="form-label" for="tx-notes">Notes (Optional)</label>
        <input type="text" id="tx-notes" placeholder="Add additional context or tags" value="${notesVal}" class="form-input">
      </div>
    `;

    attachMerchantSuggester('expense');
  } else if (tabType === 'income') {
    if (saveBtn) saveBtn.textContent = 'Save Income';

    const categoryOptions = incomeCategories
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join('');

    const accountOptions = activeAccounts
      .map((a) => `<option value="${a.id}">${a.name} (${a.account_type})</option>`)
      .join('');

    fieldsContainer.innerHTML = `
      <!-- Amount -->
      <div>
        <label class="form-label" for="tx-amount">Amount (₹)</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-xl font-bold text-[#78716C]">₹</span>
          <input type="number" step="0.01" min="0.01" id="tx-amount" required placeholder="0.00" value="${amountVal}" class="form-input pl-8 font-serif text-2xl font-bold text-[#1C1917]">
        </div>
      </div>

      <!-- Source & Date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label" for="tx-merchant">Source / Payer</label>
          <input type="text" id="tx-merchant" required placeholder="e.g. Acme Corp, Freelance, Dividend" value="${merchantVal}" class="form-input">
        </div>
        <div>
          <label class="form-label" for="tx-date">Date</label>
          <input type="date" id="tx-date" required value="${dateVal}" class="form-input">
        </div>
      </div>

      <!-- Category & Account -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label" for="tx-category">Income Category</label>
          <select id="tx-category" class="form-select">
            ${categoryOptions}
          </select>
        </div>
        <div>
          <label class="form-label" for="tx-account">Deposit Account</label>
          <select id="tx-account" class="form-select">
            ${accountOptions}
          </select>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="form-label" for="tx-notes">Notes (Optional)</label>
        <input type="text" id="tx-notes" placeholder="Add additional context or tags" value="${notesVal}" class="form-input">
      </div>
    `;

    attachMerchantSuggester('income');
  } else if (tabType === 'transfer') {
    if (saveBtn) saveBtn.textContent = 'Save Transfer';

    const fromOptions = activeAccounts
      .map((a, idx) => `<option value="${a.id}" ${idx === 0 ? 'selected' : ''}>${a.name} (${a.account_type})</option>`)
      .join('');

    const toOptions = activeAccounts
      .map((a, idx) => {
        const isDefaultTo = activeAccounts.length > 1 ? idx === 1 : idx === 0;
        return `<option value="${a.id}" ${isDefaultTo ? 'selected' : ''}>${a.name} (${a.account_type})</option>`;
      })
      .join('');

    fieldsContainer.innerHTML = `
      <!-- Amount -->
      <div>
        <label class="form-label" for="tx-amount">Amount (₹)</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-xl font-bold text-[#78716C]">₹</span>
          <input type="number" step="0.01" min="0.01" id="tx-amount" required placeholder="0.00" value="${amountVal}" class="form-input pl-8 font-serif text-2xl font-bold text-[#1C1917]">
        </div>
      </div>

      <!-- From Account & To Account -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label" for="tx-from-account">From Account</label>
          <select id="tx-from-account" class="form-select">
            ${fromOptions}
          </select>
        </div>
        <div>
          <label class="form-label" for="tx-to-account">To Account</label>
          <select id="tx-to-account" class="form-select">
            ${toOptions}
          </select>
        </div>
      </div>

      <!-- Date -->
      <div>
        <label class="form-label" for="tx-date">Date</label>
        <input type="date" id="tx-date" required value="${dateVal}" class="form-input">
      </div>

      <!-- Notes -->
      <div>
        <label class="form-label" for="tx-notes">Notes (Optional)</label>
        <input type="text" id="tx-notes" placeholder="Add transfer reference or note" value="${notesVal}" class="form-input">
      </div>
    `;

    // Ensure To Account does not match From Account by default or on change
    const fromSelect = document.getElementById('tx-from-account');
    const toSelect = document.getElementById('tx-to-account');

    if (fromSelect && toSelect) {
      const handleAccountConflict = () => {
        if (fromSelect.value === toSelect.value) {
          const alternate = activeAccounts.find((a) => String(a.id) !== fromSelect.value);
          if (alternate) {
            toSelect.value = String(alternate.id);
          }
        }
      };

      fromSelect.addEventListener('change', handleAccountConflict);
      toSelect.addEventListener('change', () => {
        if (fromSelect.value === toSelect.value) {
          showToast('Source and destination accounts must be different.', 'warning');
        }
      });
    }
  }
}

/**
 * Attach smart category auto-suggester on typing merchant or source
 */
function attachMerchantSuggester(type) {
  const merchantInput = document.getElementById('tx-merchant');
  const categorySelect = document.getElementById('tx-category');
  if (!merchantInput || !categorySelect) return;

  merchantInput.addEventListener('input', (e) => {
    const text = e.target.value.toLowerCase().trim();
    if (!text) return;

    for (const rule of MERCHANT_SUGGESTION_MAP) {
      if (rule.categoryType === type && rule.keywords.some((k) => text.includes(k))) {
        const match = categoriesCache.find(
          (c) => c.category_type === type && c.name.toLowerCase().includes(rule.categoryMatch)
        );
        if (match) {
          categorySelect.value = String(match.id);
          break;
        }
      }
    }
  });
}

/**
 * Switch the active tab, highlight active button, and render corresponding fields
 */
export function setTab(tabType) {
  currentTab = tabType;
  const txTypeInput = document.getElementById('tx-type-input');
  if (txTypeInput) txTypeInput.value = tabType;

  // Update tab button styles
  const buttons = document.querySelectorAll('.tx-type-btn');
  buttons.forEach((btn) => {
    const btnType = btn.getAttribute('data-type');
    if (btnType === tabType) {
      btn.className = 'tx-type-btn py-1.5 text-xs font-semibold rounded bg-[#1C1917] text-white shadow-xs transition-all';
    } else {
      btn.className = 'tx-type-btn py-1.5 text-xs font-semibold rounded text-[#78716C] hover:text-[#1C1917] bg-transparent transition-all';
    }
  });

  // Preserve existing inputs if any
  const currentAmount = document.getElementById('tx-amount')?.value || '';
  const currentDate = document.getElementById('tx-date')?.value || '';
  const currentNotes = document.getElementById('tx-notes')?.value || '';
  const currentMerchant = document.getElementById('tx-merchant')?.value || '';

  renderFields(tabType, {
    amount: currentAmount,
    date: currentDate,
    notes: currentNotes,
    merchant: currentMerchant,
  });
}

/**
 * Open the Quick Record modal and reset to Expense tab
 */
export async function openQuickCaptureModal() {
  const modal = document.getElementById('quick-capture-modal');
  if (!modal) return;

  await ensureDataLoaded();
  setTab('expense');

  modal.classList.add('open');
  const amountInput = document.getElementById('tx-amount');
  if (amountInput) {
    amountInput.value = '';
    amountInput.focus();
  }
}

/**
 * Initialize Quick Record modal listeners and submission logic
 */
export async function initQuickCaptureModal() {
  const modal = document.getElementById('quick-capture-modal');
  const form = document.getElementById('quick-capture-form');

  // Preload data
  await ensureDataLoaded();

  // Initialize with Expense tab
  setTab('expense');

  // Wire tab switcher buttons
  document.querySelectorAll('.tx-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      if (type) setTab(type);
    });
  });

  // Form Submit Handler
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = currentTab;
    const amountVal = document.getElementById('tx-amount')?.value;
    const amountMinor = parseRupeesToPaise(amountVal);
    const dateVal = document.getElementById('tx-date')?.value;
    const notesVal = document.getElementById('tx-notes')?.value?.trim() || '';

    if (!amountMinor || amountMinor <= 0) {
      showToast('Please enter an amount greater than zero.', 'error');
      return;
    }
    if (!dateVal) {
      showToast('Please select a valid date.', 'error');
      return;
    }

    const submitBtn = document.getElementById('save-capture-btn') || form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Save Transaction';

    try {
      if (type === 'transfer') {
        const fromAccountId = parseInt(document.getElementById('tx-from-account')?.value, 10);
        const toAccountId = parseInt(document.getElementById('tx-to-account')?.value, 10);

        if (!fromAccountId || !toAccountId) {
          showToast('Please select both from and to accounts.', 'warning');
          return;
        }

        if (fromAccountId === toAccountId) {
          showToast('Source and destination accounts must be different.', 'warning');
          return;
        }

        await api.createTransfer({
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount_minor: amountMinor,
          transaction_date: dateVal,
          description: notesVal || 'Internal Transfer',
          notes: notesVal || null,
        });

        fireConfetti({ particleCount: 75, spread: 70, origin: { y: 0.55 } });
        showToast(`Logged ₹${(amountMinor / 100).toFixed(2)} 🎉`, 'success');
      } else {
        const accountId = parseInt(document.getElementById('tx-account')?.value, 10);
        const categoryId = parseInt(document.getElementById('tx-category')?.value, 10) || null;
        const merchantVal = document.getElementById('tx-merchant')?.value?.trim() || (type === 'income' ? 'Income' : 'Expense');
        const paymentMethodEl = document.getElementById('tx-payment-method');
        const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'upi';

        if (!accountId) {
          showToast('Please select an account.', 'warning');
          return;
        }

        await api.createTransaction({
          account_id: accountId,
          category_id: categoryId,
          transaction_type: type,
          amount_minor: amountMinor,
          transaction_date: dateVal,
          merchant: merchantVal,
          description: merchantVal,
          payment_method: paymentMethod,
          notes: notesVal || null,
        });

        fireConfetti({ particleCount: 75, spread: 70, origin: { y: 0.55 } });
        showToast(`Logged ₹${(amountMinor / 100).toFixed(2)} 🎉`, 'success');
      }

      // Checkmark delight feedback
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="inline-flex items-center gap-1.5 text-white font-bold">
            <svg class="w-4 h-4 checkmark-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span>Saved!</span>
          </span>
        `;
      }

      await new Promise((resolve) => setTimeout(resolve, 280));

      // Close modal and reset
      modal?.classList.remove('open');
      form.reset();
      setTab('expense');

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }

      // Invalidate caches and trigger store refresh
      accountsCache = [];
      categoriesCache = [];
      store.setState({ lastUpdated: Date.now() });
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
      showToast(err.message || 'Failed to save transaction.', 'error');
    }
  });
}
