/**
 * KLYRO — View: Settings & Data Management
 * Studio preferences, Indian financial conventions, data export, and demo re-seed.
 */

import { api } from '../api.js';
import { renderCardSkeleton } from '../components/loading.js';
import { init3DTilt } from '../utils/animate.js';

export async function renderSettingsView(container) {
  container.innerHTML = renderCardSkeleton(2);

  try {
    const settings = await api.getSettings().catch(() => ({
      default_currency: 'INR',
      financial_year_start: '4',
      safe_to_spend_buffer_pct: '10',
      timezone: 'Asia/Kolkata',
    }));

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="fade-up-card flex items-center justify-between">
          <div>
            <h3 class="font-serif text-2xl font-bold text-[#1C1917]">Studio Settings</h3>
            <p class="text-xs text-[#78716C] mt-0.5">Preferences, regional Indian conventions, security, and data ownership</p>
          </div>
        </div>

        <!-- Regional & Financial Preferences Form -->
        <div class="fade-up-card delay-1 paper-card p-6 space-y-5">
          <div class="border-b border-[#E6E1D6] pb-3">
            <h4 class="font-serif text-base font-bold text-[#1C1917]">Regional & Financial Configuration</h4>
            <p class="text-xs text-[#78716C]">Configure currency, financial calendar boundaries, and liquidity cushions</p>
          </div>
          
          <form id="settings-form" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label" for="setting-currency">Base Currency</label>
                <select id="setting-currency" class="form-select text-xs">
                  <option value="INR" ${settings.default_currency === 'INR' ? 'selected' : ''}>Indian Rupee (₹ INR)</option>
                  <option value="USD" ${settings.default_currency === 'USD' ? 'selected' : ''}>US Dollar ($ USD)</option>
                  <option value="EUR" ${settings.default_currency === 'EUR' ? 'selected' : ''}>Euro (€ EUR)</option>
                </select>
                <p class="text-[10px] text-[#78716C] mt-1">Lakhs / Crores notation active under INR</p>
              </div>

              <div>
                <label class="form-label" for="setting-fy">Financial Year Period</label>
                <select id="setting-fy" class="form-select text-xs">
                  <option value="4" ${settings.financial_year_start === '4' ? 'selected' : ''}>Indian Financial Year (April 1 – March 31)</option>
                  <option value="1" ${settings.financial_year_start === '1' ? 'selected' : ''}>Calendar Year (January 1 – December 31)</option>
                </select>
                <p class="text-[10px] text-[#78716C] mt-1">Determines FY run-rate and annual summaries</p>
              </div>

              <div>
                <label class="form-label" for="setting-buffer">Safe-to-Spend Safety Cushion Buffer</label>
                <select id="setting-buffer" class="form-select text-xs">
                  <option value="5" ${settings.safe_to_spend_buffer_pct === '5' ? 'selected' : ''}>5% of available liquidity</option>
                  <option value="10" ${settings.safe_to_spend_buffer_pct === '10' ? 'selected' : ''}>10% of available liquidity (Standard)</option>
                  <option value="15" ${settings.safe_to_spend_buffer_pct === '15' ? 'selected' : ''}>15% of available liquidity (Conservative)</option>
                  <option value="20" ${settings.safe_to_spend_buffer_pct === '20' ? 'selected' : ''}>20% of available liquidity (Strict)</option>
                </select>
                <p class="text-[10px] text-[#78716C] mt-1">Reserved emergency liquidity held back from discretionary spend</p>
              </div>

              <div>
                <label class="form-label" for="setting-timezone">Timezone</label>
                <input type="text" id="setting-timezone" value="${settings.timezone || 'Asia/Kolkata'}" class="form-input text-xs bg-[#F6F3EB]">
                <p class="text-[10px] text-[#78716C] mt-1">Standard Indian Standard Time (IST UTC+05:30)</p>
              </div>
            </div>

            <div id="settings-status-box" class="hidden text-xs p-2.5 rounded"></div>

            <div class="flex justify-end pt-2">
              <button type="submit" id="save-settings-btn" class="btn btn-coral text-xs">
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        <!-- Data Management & Portability -->
        <div class="paper-card p-6 space-y-4">
          <div class="border-b border-[#E6E1D6] pb-3">
            <h4 class="font-serif text-base font-bold text-[#1C1917]">Data Ownership & Export</h4>
            <p class="text-xs text-[#78716C]">
              Your financial data remains strictly on your machine. Export full ledgers or download structured backup archives anytime.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-1">
            <a id="export-csv-btn" href="${api.getExportTransactionsUrl()}" download="klyro_transactions_export.csv" class="btn btn-secondary text-xs inline-flex items-center gap-1.5">
              <span>📥</span> Export Transactions (CSV)
            </a>
            <a id="export-json-btn" href="${api.getExportBackupUrl()}" download="klyro_backup_export.json" class="btn btn-secondary text-xs inline-flex items-center gap-1.5">
              <span>💾</span> Download Full JSON Backup
            </a>
            <button id="import-btn" class="btn btn-subtle text-xs border border-[#E6E1D6] inline-flex items-center gap-1.5">
              <span>📤</span> Statement Import Guide
            </button>
          </div>
        </div>

        <!-- Import Modal Guide -->
        <div id="import-guide-modal" class="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex items-center justify-center p-4 hidden">
          <div class="paper-card w-full max-w-lg p-6 shadow-2xl relative">
            <div class="flex items-center justify-between border-b border-[#E6E1D6] pb-3 mb-4">
              <h4 class="font-serif text-base font-bold text-[#1C1917]">Bank Statement & CSV Import Format</h4>
              <button id="close-import-guide" class="text-[#78716C] hover:text-[#1C1917] text-lg font-bold">&times;</button>
            </div>
            <div class="space-y-3 text-xs text-[#44403C]">
              <p>Klyro accepts standard CSV transaction exports from HDFC, ICICI, SBI, and Axis Bank. Standard required column headers are:</p>
              <div class="bg-[#F6F3EB] p-3 rounded font-mono text-[11px] text-[#1C1917] overflow-x-auto">
                Date, Type, Amount (INR), Merchant, Category, Account, Description
              </div>
              <p>For custom statement mapping or batch ingestion, use the Command Palette (<kbd class="px-1.5 py-0.5 bg-white border border-[#E6E1D6] rounded font-mono text-[10px]">Ctrl+K</kbd>) or the Quick-Capture modal (<kbd class="px-1.5 py-0.5 bg-white border border-[#E6E1D6] rounded font-mono text-[10px]">Q</kbd>).</p>
            </div>
            <div class="mt-5 flex justify-end">
              <button id="ok-import-guide" class="btn btn-secondary text-xs">Got it</button>
            </div>
          </div>
        </div>

        <!-- Demo State Reset & Portability -->
        <div class="paper-card p-6 space-y-3 border border-[#FECACA] bg-[#FEF2F2]">
          <h4 class="font-serif text-base font-bold text-[#B84A39]">Reset or Re-seed Isolated Demo Data</h4>
          <p class="text-xs text-[#78716C] leading-relaxed">
            Need to restore the authentic demonstration portfolio for Klyro (salary, HDFC accounts, Swiggy, SIPs, EMIs, and budgets)?
            Clicking below re-seeds sample Indian personal finance data cleanly.
          </p>
          <div class="pt-1">
            <button id="reseed-demo-btn" class="btn btn-secondary text-xs border-[#FECACA] text-[#B84A39] hover:bg-white transition-colors">
              Re-seed Demo Records
            </button>
            <span id="reseed-status" class="ml-3 text-xs text-[#78716C] hidden"></span>
          </div>
        </div>

      </div>
    `;

    // Form Save
    const form = document.getElementById('settings-form');
    const statusBox = document.getElementById('settings-status-box');
    const saveBtn = document.getElementById('save-settings-btn');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        statusBox.classList.add('hidden');

        try {
          const payload = {
            default_currency: document.getElementById('setting-currency').value,
            financial_year_start: document.getElementById('setting-fy').value,
            safe_to_spend_buffer_pct: document.getElementById('setting-buffer').value,
            timezone: document.getElementById('setting-timezone').value.trim(),
          };

          await api.updateSettings(payload);

          statusBox.className = 'text-xs p-2.5 rounded bg-[#DCFCE7] text-[#2D7A58] border border-[#BBF7D0] block';
          statusBox.textContent = '✓ Preferences updated successfully.';
        } catch (err) {
          statusBox.className = 'text-xs p-2.5 rounded bg-[#FEF2F2] text-[#B84A39] border border-[#FECACA] block';
          statusBox.textContent = 'Failed to save settings: ' + err.message;
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Preferences';
        }
      });
    }

    // Import Guide Modal
    const importModal = document.getElementById('import-guide-modal');
    const openImportBtn = document.getElementById('import-btn');
    const closeImportBtn = document.getElementById('close-import-guide');
    const okImportBtn = document.getElementById('ok-import-guide');

    if (openImportBtn && importModal) {
      openImportBtn.addEventListener('click', () => importModal.classList.remove('hidden'));
    }
    if (closeImportBtn && importModal) {
      closeImportBtn.addEventListener('click', () => importModal.classList.add('hidden'));
    }
    if (okImportBtn && importModal) {
      okImportBtn.addEventListener('click', () => importModal.classList.add('hidden'));
    }

    // Reseed Demo Data Handler
    const reseedBtn = document.getElementById('reseed-demo-btn');
    const reseedStatus = document.getElementById('reseed-status');

    if (reseedBtn) {
      reseedBtn.addEventListener('click', async () => {
        const confirmed = confirm(
          'Are you sure you want to re-seed the demo database? This will refresh all demonstration transactions, accounts, and budgets.'
        );
        if (!confirmed) return;

        reseedBtn.disabled = true;
        reseedBtn.textContent = 'Re-seeding...';
        reseedStatus.textContent = 'Rebuilding demonstration records...';
        reseedStatus.classList.remove('hidden');

        try {
          await api.reseedDemoData();
          reseedStatus.className = 'ml-3 text-xs text-[#2D7A58] font-semibold';
          reseedStatus.textContent = '✓ Demo data successfully restored! Reloading...';
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (err) {
          reseedStatus.className = 'ml-3 text-xs text-[#B84A39] font-semibold';
          reseedStatus.textContent = 'Failed: ' + err.message;
          reseedBtn.disabled = false;
          reseedBtn.textContent = 'Re-seed Demo Records';
        }
      });
    }

    requestAnimationFrame(() => {
      init3DTilt(container);
    });

  } catch (err) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="paper-card p-8 text-center text-xs text-[#B84A39]">
          <p class="font-bold text-sm">Failed to load studio settings</p>
          <p class="mt-1">${err.message}</p>
          <button id="retry-settings-btn" class="btn btn-secondary mt-4 text-xs">Retry</button>
        </div>
      </div>
    `;
    const retryBtn = document.getElementById('retry-settings-btn');
    if (retryBtn) retryBtn.addEventListener('click', () => renderSettingsView(container));
  }
}
