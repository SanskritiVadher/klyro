/**
 * KLYRO — View: Settings & Data Management
 * Studio preferences, Indian financial conventions, data export, and demo re-seed.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { router } from '../router.js';
import { showToast } from '../components/toast.js';
import { renderCardSkeleton } from '../components/loading.js';
import { init3DTilt } from '../utils/animate.js';
import { getTheme, setTheme } from '../theme.js';
import { renderMascot } from '../components/mascot.js';

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

        <!-- Visual Appearance & Theme Selection -->
        <div class="fade-up-card delay-1 paper-card p-6 space-y-4">
          <div class="border-b border-[#E6E1D6] pb-3 flex items-center justify-between">
            <div>
              <h4 class="font-serif text-base font-bold text-[#1C1917]">Visual Theme & Atmosphere</h4>
              <p class="text-xs text-[#78716C]">Choose between Klyro's two signature color palettes</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
              Active: <span id="settings-active-theme-label" class="capitalize font-bold text-[var(--color-brand)]">${getTheme()}</span>
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <!-- Sunrise Theme Option Card -->
            <div id="select-theme-sunrise" role="button" tabindex="0" aria-label="Select Sunrise Theme" class="theme-choice-card p-4 rounded-xl border-2 transition-all cursor-pointer ${getTheme() === 'sunrise' ? 'border-[#D45644] bg-[#FDEDE8]/40 shadow-sm' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)]'}">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-sm shadow-xs">
                    🌅
                  </div>
                  <h5 class="font-serif font-bold text-sm text-[var(--text-primary)]">Sunrise Theme</h5>
                </div>
                <input type="radio" name="klyro-theme-select" id="theme-radio-sunrise" value="sunrise" ${getTheme() === 'sunrise' ? 'checked' : ''} class="w-4 h-4 text-[#D45644] focus:ring-[#D45644] cursor-pointer">
              </div>
              <p class="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
                Early-morning warmth with soft cream canvas, warm parchment, gold highlights, and vibrant burnt coral. High-clarity editorial feel.
              </p>
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-[#FBF8F1] border border-[#E8E2D5] inline-block shadow-xs" title="Cream Canvas"></span>
                <span class="w-5 h-5 rounded-full bg-[#D45644] inline-block shadow-xs" title="Burnt Coral"></span>
                <span class="w-5 h-5 rounded-full bg-[#D97706] inline-block shadow-xs" title="Honey Gold"></span>
                <span class="w-5 h-5 rounded-full bg-[#2D7A58] inline-block shadow-xs" title="Sage Green"></span>
                <span class="w-5 h-5 rounded-full bg-[#1C1917] inline-block shadow-xs" title="Warm Ink"></span>
              </div>
            </div>

            <!-- Sunset Theme Option Card -->
            <div id="select-theme-sunset" role="button" tabindex="0" aria-label="Select Sunset Theme" class="theme-choice-card p-4 rounded-xl border-2 transition-all cursor-pointer ${getTheme() === 'sunset' ? 'border-[#F59E0B] bg-[var(--bg-surface-subtle)] shadow-sm' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)]'}">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-sm shadow-xs">
                    🌇
                  </div>
                  <h5 class="font-serif font-bold text-sm text-[var(--text-primary)]">Sunset Theme</h5>
                </div>
                <input type="radio" name="klyro-theme-select" id="theme-radio-sunset" value="sunset" ${getTheme() === 'sunset' ? 'checked' : ''} class="w-4 h-4 text-[#F59E0B] focus:ring-[#F59E0B] cursor-pointer">
              </div>
              <p class="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
                Sophisticated evening mood with deep warm charcoal surfaces, rich wine-burgundy accents, and glowing amber highlights.
              </p>
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-[#151210] border border-[#332B24] inline-block shadow-xs" title="Deep Charcoal"></span>
                <span class="w-5 h-5 rounded-full bg-[#E05D52] inline-block shadow-xs" title="Burgundy Coral"></span>
                <span class="w-5 h-5 rounded-full bg-[#F59E0B] inline-block shadow-xs" title="Glowing Amber"></span>
                <span class="w-5 h-5 rounded-full bg-[#34D399] inline-block shadow-xs" title="Emerald Glow"></span>
                <span class="w-5 h-5 rounded-full bg-[#F8F4EC] inline-block shadow-xs" title="Warm Off-White"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Klyro Brand Mascot & Intro Experience Showcase -->
        <div class="fade-up-card delay-1 paper-card p-6 space-y-5">
          <div class="border-b border-[var(--border-subtle,#E6E1D6)] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-serif text-base font-bold text-[#1C1917]">Meet "Kly" — Klyro's Original Mascot</h4>
                <span class="badge badge-sage text-[10px]">Brand Character</span>
              </div>
              <p class="text-xs text-[#78716C] mt-0.5">The clairvoyant owl representing financial clarity, foresight, and disciplined progress</p>
            </div>
            <button type="button" id="settings-replay-intro-btn" class="btn btn-secondary text-xs flex items-center gap-1.5 shadow-xs shrink-0">
              <span>▶ Play Logo Intro Animation</span>
            </button>
          </div>

          <!-- 6 Canonical Reusable Poses Display Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            <div class="pose-demo-card p-3 rounded-xl bg-[#FBF9F5] border border-[var(--border-subtle,#E6E1D6)] flex flex-col items-center text-center space-y-2 hover:border-[#D5CEBF] transition-all cursor-pointer" data-pose="welcoming" data-phrase="Hi again! Let's take a quick look at your money.">
              ${renderMascot('welcoming', 'w-14 h-14')}
              <div>
                <p class="text-xs font-semibold text-[#1C1917]">Welcoming</p>
                <p class="text-[10px] text-[#78716C]">Greeting & onboarding</p>
              </div>
            </div>

            <div class="pose-demo-card p-3 rounded-xl bg-[#FBF9F5] border border-[var(--border-subtle,#E6E1D6)] flex flex-col items-center text-center space-y-2 hover:border-[#D5CEBF] transition-all cursor-pointer" data-pose="thinking" data-phrase="Looking over your spend so we can plan your next steps.">
              ${renderMascot('thinking', 'w-14 h-14')}
              <div>
                <p class="text-xs font-semibold text-[#1C1917]">Thinking</p>
                <p class="text-[10px] text-[#78716C]">Reviewing spend</p>
              </div>
            </div>

            <div class="pose-demo-card p-3 rounded-xl bg-[#FBF9F5] border border-[var(--border-subtle,#E6E1D6)] flex flex-col items-center text-center space-y-2 hover:border-[#D5CEBF] transition-all cursor-pointer" data-pose="celebrating" data-phrase="You did it! That's a big win. Keep up the great work!">
              ${renderMascot('celebrating', 'w-14 h-14')}
              <div>
                <p class="text-xs font-semibold text-[#1C1917]">Celebrating</p>
                <p class="text-[10px] text-[#78716C]">Goal & savings win</p>
              </div>
            </div>

            <div class="pose-demo-card p-3 rounded-xl bg-[#FBF9F5] border border-[var(--border-subtle,#E6E1D6)] flex flex-col items-center text-center space-y-2 hover:border-[#D5CEBF] transition-all cursor-pointer" data-pose="encouraging" data-phrase="Saving a little bit each week really adds up over time.">
              ${renderMascot('encouraging', 'w-14 h-14')}
              <div>
                <p class="text-xs font-semibold text-[#1C1917]">Encouraging</p>
                <p class="text-[10px] text-[#78716C]">Friendly guidance</p>
              </div>
            </div>

            <div class="pose-demo-card p-3 rounded-xl bg-[#FBF9F5] border border-[var(--border-subtle,#E6E1D6)] flex flex-col items-center text-center space-y-2 hover:border-[#D5CEBF] transition-all cursor-pointer" data-pose="explaining" data-phrase="You can spend without worry. I've already kept money aside for your bills.">
              ${renderMascot('explaining', 'w-14 h-14')}
              <div>
                <p class="text-xs font-semibold text-[#1C1917]">Explaining</p>
                <p class="text-[10px] text-[#78716C]">Money advice</p>
              </div>
            </div>

            <div class="pose-demo-card p-3 rounded-xl bg-[#FBF9F5] border border-[var(--border-subtle,#E6E1D6)] flex flex-col items-center text-center space-y-2 hover:border-[#D5CEBF] transition-all cursor-pointer" data-pose="resting" data-phrase="Resting right here. I'm ready whenever you want to check your money.">
              ${renderMascot('resting', 'w-14 h-14')}
              <div>
                <p class="text-xs font-semibold text-[#1C1917]">Resting</p>
                <p class="text-[10px] text-[#78716C]">Calm corner perch</p>
              </div>
            </div>
          </div>

          <!-- Voice Guidance & Web Speech API Preferences Strip -->
          <div class="pt-3 border-t border-[var(--border-subtle,#E6E1D6)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 class="font-serif font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
                <span>🔊</span> <span>Spoken Voice Guidance (Browser Web Speech API)</span>
              </h5>
              <p class="text-[11px] text-[#78716C] mt-0.5">Zero paid APIs or external network calls. Offline, on-demand text-to-speech companion.</p>
            </div>
            <button type="button" id="settings-voice-toggle-btn" class="btn btn-secondary text-xs flex items-center gap-2 shrink-0 cursor-pointer">
              <span id="settings-voice-icon">${localStorage.getItem('klyro_owl_muted') === 'true' ? '🔇' : '🔊'}</span>
              <span id="settings-voice-label">${localStorage.getItem('klyro_owl_muted') === 'true' ? 'Voice Muted (Click to Enable)' : 'Voice Active (Click to Mute)'}</span>
            </button>
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

        <!-- Account Profile & Security -->
        <div class="paper-card p-6 space-y-4">
          <div class="border-b border-[#E6E1D6] pb-3 flex items-center justify-between">
            <div>
              <h4 class="font-serif text-base font-bold text-[#1C1917]">Account & Authentication</h4>
              <p class="text-xs text-[#78716C]">Session controls, user identity, and workspace security</p>
            </div>
            <button type="button" id="settings-logout-btn" class="btn btn-secondary text-xs text-[#B84A39] border-[#FECACA] hover:bg-[#FEF2F2] flex items-center gap-1.5">
              <span>Sign Out</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-[#78716C] block">Workspace Owner</span>
              <span id="settings-user-name" class="font-semibold text-[#1C1917]">Loading...</span>
            </div>
            <div>
              <span class="text-[#78716C] block">Registered Email</span>
              <span id="settings-user-email" class="font-mono text-[#1C1917]">Loading...</span>
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

    // Populate user profile info in settings
    const currentUser = store.getState().user;
    const nameEl = document.getElementById('settings-user-name');
    const emailEl = document.getElementById('settings-user-email');
    if (currentUser) {
      if (nameEl) nameEl.textContent = currentUser.name;
      if (emailEl) emailEl.textContent = currentUser.email;
    } else {
      api.getMe().then(u => {
        if (nameEl) nameEl.textContent = u.name;
        if (emailEl) emailEl.textContent = u.email;
      }).catch(() => {});
    }

    // Interactive Theme Selection Handlers
    const sunriseCard = document.getElementById('select-theme-sunrise');
    const sunsetCard = document.getElementById('select-theme-sunset');
    const sunriseRadio = document.getElementById('theme-radio-sunrise');
    const sunsetRadio = document.getElementById('theme-radio-sunset');

    const handleThemeSwitch = (newTheme, e) => {
      if (e) {
        // Do not call preventDefault on native radio input clicks to allow normal state toggle
        if (e.target?.tagName !== 'INPUT') {
          e.preventDefault();
        }
        e.stopPropagation();
      }
      setTheme(newTheme);
      showToast(`Switched theme to ${newTheme === 'sunrise' ? '🌅 Sunrise' : '🌇 Sunset'}`);
    };

    sunriseCard?.addEventListener('click', (e) => handleThemeSwitch('sunrise', e));
    sunsetCard?.addEventListener('click', (e) => handleThemeSwitch('sunset', e));

    sunriseRadio?.addEventListener('change', (e) => {
      if (e.target.checked) handleThemeSwitch('sunrise', e);
    });
    sunsetRadio?.addEventListener('change', (e) => {
      if (e.target.checked) handleThemeSwitch('sunset', e);
    });

    // Keyboard accessibility: Enter or Space triggers choice
    const handleKeyNav = (theme, e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleThemeSwitch(theme, e);
      }
    };
    sunriseCard?.addEventListener('keydown', (e) => handleKeyNav('sunrise', e));
    sunsetCard?.addEventListener('keydown', (e) => handleKeyNav('sunset', e));

    // Replay Animated Logo Intro from Settings
    document.getElementById('settings-replay-intro-btn')?.addEventListener('click', () => {
      if (window.KLYRO_MASCOT && typeof window.KLYRO_MASCOT.playIntro === 'function') {
        window.KLYRO_MASCOT.playIntro(true);
      }
    });

    // Pose Demonstration Cards Click Listener
    container.querySelectorAll('.pose-demo-card').forEach((card) => {
      card.addEventListener('click', () => {
        const pose = card.getAttribute('data-pose');
        const phrase = card.getAttribute('data-phrase');
        if (window.KYLRO_OWL && typeof window.KYLRO_OWL.speak === 'function') {
          window.KYLRO_OWL.speak(phrase, { pose, duration: 4500, speakAloud: true });
        }
      });
    });

    // Voice Toggle Button Listener in Settings
    const voiceBtn = document.getElementById('settings-voice-toggle-btn');
    const voiceIcon = document.getElementById('settings-voice-icon');
    const voiceLabel = document.getElementById('settings-voice-label');

    voiceBtn?.addEventListener('click', () => {
      if (window.KYLRO_OWL && typeof window.KYLRO_OWL.toggleMute === 'function') {
        const isMuted = window.KYLRO_OWL.toggleMute();
        if (voiceIcon) voiceIcon.textContent = isMuted ? '🔇' : '🔊';
        if (voiceLabel) voiceLabel.textContent = isMuted ? 'Voice Muted (Click to Enable)' : 'Voice Active (Click to Mute)';
        showToast(isMuted ? 'Professor Kly voice muted.' : 'Professor Kly voice enabled.');
        if (!isMuted) {
          window.KYLRO_OWL.speak("Voice turned on! Ready whenever you want to check your money.", { pose: 'encouraging', duration: 3500, speakAloud: true });
        }
      }
    });

    // Settings Sign Out Button
    document.getElementById('settings-logout-btn')?.addEventListener('click', async () => {
      try {
        await api.logout();
      } catch (e) {
        console.warn('Logout error:', e);
      }
      store.setState({ user: null });
      localStorage.removeItem('klyro_user');
      showToast('Signed out of Klyro workspace.');
      router.navigate('welcome');
    });

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
            theme: getTheme(),
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
