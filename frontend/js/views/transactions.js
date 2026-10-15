/**
 * KLYRO — View: Transactions Ledger
 * Connected to live backend API (/api/v1/transactions) with pagination, search, category filters, and deletion.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { formatINR, formatDate } from '../utils/formatters.js';
import { renderTableSkeleton, renderErrorBanner, renderEmptyState } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { init3DTilt } from '../utils/animate.js';

let currentPage = 1;
const PAGE_LIMIT = 15;
let currentSearch = '';
let currentCategory = '';
let currentSort = 'transaction_date';
let currentSortOrder = 'desc';

export async function renderTransactionsView(container) {
  const { startDate, endDate, label } = store.getPeriodRange();

  container.innerHTML = renderTableSkeleton(6);

  try {
    const [txResponse, categories] = await Promise.all([
      api.getTransactions({
        start_date: startDate,
        end_date: endDate,
        category_id: currentCategory || undefined,
        search: currentSearch || undefined,
        page: currentPage,
        limit: PAGE_LIMIT,
        sort_by: currentSort,
        sort_order: currentSortOrder,
      }),
      api.getCategories(),
    ]);

    const items = txResponse.items;
    const pagination = txResponse.pagination;

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Header & Action Row -->
        <div class="fade-up-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-serif text-2xl font-bold text-[#1C1917]">Transaction Ledger</h3>
            <p class="text-xs text-[#78716C] mt-0.5">Records for <strong>${label}</strong> • ${pagination.total_records} total entries</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <a href="${api.getExportTransactionsUrl()}" target="_blank" class="btn btn-secondary text-xs flex items-center gap-1.5" title="Export Ledger as CSV">
              <svg class="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Export CSV</span>
            </a>
            <button id="add-tx-btn-view" class="btn btn-coral text-xs shrink-0">+ Add Record (Q)</button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="fade-up-card delay-1 paper-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex flex-1 flex-wrap items-center gap-3">
            <!-- Search Bar -->
            <div class="relative w-full sm:w-64">
              <input type="text" id="tx-search-input" value="${currentSearch}" placeholder="Search payee, notes..." class="form-input text-xs pl-8">
              <svg class="w-4 h-4 text-[#78716C] absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>

            <!-- Category Filter -->
            <select id="tx-category-filter" class="form-select text-xs w-full sm:w-48">
              <option value="">All Categories</option>
              ${categories
                .map((c) => `<option value="${c.id}" ${currentCategory == c.id ? 'selected' : ''}>${c.name}</option>`)
                .join('')}
            </select>
          </div>

          <!-- Sorting Controls -->
          <div class="flex items-center gap-2 text-xs">
            <span class="text-[#78716C] hidden sm:inline">Sort by:</span>
            <select id="tx-sort-select" class="form-select text-xs w-36">
              <option value="transaction_date_desc" ${currentSort === 'transaction_date' && currentSortOrder === 'desc' ? 'selected' : ''}>Date: Newest</option>
              <option value="transaction_date_asc" ${currentSort === 'transaction_date' && currentSortOrder === 'asc' ? 'selected' : ''}>Date: Oldest</option>
              <option value="amount_minor_desc" ${currentSort === 'amount_minor' && currentSortOrder === 'desc' ? 'selected' : ''}>Amount: High to Low</option>
              <option value="amount_minor_asc" ${currentSort === 'amount_minor' && currentSortOrder === 'asc' ? 'selected' : ''}>Amount: Low to High</option>
            </select>
          </div>
        </div>

        <!-- Ledger Table Container -->
        <div class="fade-up-card delay-2 paper-card overflow-hidden">
          ${
            items.length > 0
              ? `
                <div class="overflow-x-auto">
                  <table class="ledger-table" aria-label="Transaction Ledger Table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Payee / Description</th>
                        <th>Category</th>
                        <th>Account</th>
                        <th>Type</th>
                        <th class="text-right">Amount</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="transactions-table-body">
                      ${items
                        .map((tx) => {
                          const isIncome = tx.transaction_type === 'income';
                          const isTransfer = tx.transaction_type === 'transfer';
                          const sign = isIncome ? '+' : isTransfer ? '' : '-';
                          const color = isIncome ? 'text-[#2D7A58]' : isTransfer ? 'text-[#78716C]' : 'text-[#D45644]';
                          const badge = isIncome
                            ? '<span class="badge badge-sage text-[10px]">Income</span>'
                            : isTransfer
                            ? '<span class="badge badge-neutral text-[10px]">Transfer</span>'
                            : '<span class="badge badge-terracotta text-[10px]">Expense</span>';

                          return `
                            <tr data-id="${tx.id}">
                              <td class="font-mono text-xs whitespace-nowrap">${formatDate(tx.transaction_date)}</td>
                              <td>
                                <span class="font-semibold text-[#1C1917]">${tx.merchant || tx.description || 'Transaction'}</span>
                                ${tx.notes ? `<p class="text-[11px] text-[#78716C] truncate max-w-xs">${tx.notes}</p>` : ''}
                              </td>
                              <td><span class="badge badge-neutral">${tx.category_name || 'General'}</span></td>
                              <td class="text-xs text-[#44403C]">${tx.account_name || 'Account'}</td>
                              <td>${badge}</td>
                              <td class="text-right font-serif font-bold text-sm ${color} num">${sign}${formatINR(tx.amount_minor)}</td>
                              <td class="text-right whitespace-nowrap">
                                <button data-delete-id="${tx.id}" class="delete-tx-btn text-xs text-[#B84A39] hover:underline p-1 ml-2">Delete</button>
                              </td>
                            </tr>
                          `;
                        })
                        .join('')}
                    </tbody>
                  </table>
                </div>

                <!-- Pagination Footer -->
                <div class="p-4 border-t border-[#E6E1D6] flex items-center justify-between text-xs bg-[#F6F3EB]">
                  <span class="text-[#78716C]">
                    Showing Page <strong>${pagination.page}</strong> of <strong>${pagination.total_pages}</strong>
                  </span>
                  <div class="flex items-center gap-2">
                    <button id="prev-page-btn" ${!pagination.has_prev ? 'disabled' : ''} class="btn btn-secondary text-xs px-3 py-1 ${!pagination.has_prev ? 'opacity-40 cursor-not-allowed' : ''}">Previous</button>
                    <button id="next-page-btn" ${!pagination.has_next ? 'disabled' : ''} class="btn btn-secondary text-xs px-3 py-1 ${!pagination.has_next ? 'opacity-40 cursor-not-allowed' : ''}">Next</button>
                  </div>
                </div>
              `
              : renderEmptyState(
                  'No transactions found',
                  `No records match the active criteria in ${label}. Try adjusting filters or record a new transaction.`,
                  '+ Record First Transaction',
                  "document.getElementById('quick-capture-btn')?.click()",
                  '🧾'
                )
          }
        </div>

      </div>
    `;

    requestAnimationFrame(() => {
      init3DTilt(container);
    });

    // --- Wire Events ---
    // Record Button
    container.querySelector('#add-tx-btn-view')?.addEventListener('click', () => {
      document.getElementById('quick-capture-btn')?.click();
    });

    // Empty state action
    container.querySelector('#empty-state-action')?.addEventListener('click', () => {
      document.getElementById('quick-capture-btn')?.click();
    });

    // Search Input (debounce)
    let searchTimeout = null;
    const searchInput = container.querySelector('#tx-search-input');
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        renderTransactionsView(container);
      }, 350);
    });

    // Category Filter
    container.querySelector('#tx-category-filter')?.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      currentPage = 1;
      renderTransactionsView(container);
    });

    // Sorting
    container.querySelector('#tx-sort-select')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'transaction_date_desc') {
        currentSort = 'transaction_date';
        currentSortOrder = 'desc';
      } else if (val === 'transaction_date_asc') {
        currentSort = 'transaction_date';
        currentSortOrder = 'asc';
      } else if (val === 'amount_minor_desc') {
        currentSort = 'amount_minor';
        currentSortOrder = 'desc';
      } else if (val === 'amount_minor_asc') {
        currentSort = 'amount_minor';
        currentSortOrder = 'asc';
      }
      currentPage = 1;
      renderTransactionsView(container);
    });

    // Pagination
    container.querySelector('#prev-page-btn')?.addEventListener('click', () => {
      if (pagination.has_prev) {
        currentPage -= 1;
        renderTransactionsView(container);
      }
    });

    container.querySelector('#next-page-btn')?.addEventListener('click', () => {
      if (pagination.has_next) {
        currentPage += 1;
        renderTransactionsView(container);
      }
    });

    // Delete Transaction with Confirmation
    container.querySelectorAll('.delete-tx-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-delete-id');
        if (confirm('Are you sure you want to delete this transaction entry? This will adjust all dependent balances.')) {
          try {
            await api.deleteTransaction(id);
            showToast('Transaction deleted successfully.', 'info');
            store.setState({ lastUpdated: Date.now() });
          } catch (err) {
            showToast(err.message || 'Failed to delete transaction.', 'error');
          }
        }
      });
    });

  } catch (err) {
    container.innerHTML = renderErrorBanner(
      err.message || 'Failed to load transaction ledger from the backend.',
      'location.reload()'
    );
  }
}
