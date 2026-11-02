/**
 * KLYRO — View: Welcome & Landing Page (First Page)
 * Displays public brand narrative, value proposition, live feature previews,
 * and primary registration/login call-to-actions.
 */

import { api } from '../api.js';
import { router } from '../router.js';
import { openAuthModal } from '../components/auth-modal.js';
import { showToast } from '../components/toast.js';
import { renderMascot } from '../components/mascot.js';

export function renderWelcomeView(container) {
  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-16 py-6 sm:py-10 px-2 sm:px-4">

      <!-- Hero Section with Mascot Welcome -->
      <section class="text-center space-y-6 max-w-3xl mx-auto pt-4 sm:pt-8">
        <div class="flex items-center justify-center gap-3">
          <div class="cursor-pointer hover:scale-105 transition-transform" id="welcome-mascot-badge" title="Meet Kly, the Klyro financial guide!">
            ${renderMascot('welcoming', 'w-16 h-16 sm:w-20 sm:h-20')}
          </div>
        </div>

        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDEDE8] border border-[#F7C6BE] text-[#D45644] text-xs font-semibold tracking-wide">
          <span class="w-2 h-2 rounded-full bg-[#D45644] animate-pulse"></span>
          Klyro Financial Intelligence · Guided by Kly
        </div>

        <h1 class="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1C1917] leading-tight">
          Clarity you can <span class="italic text-[#D45644]">act on.</span>
        </h1>

        <p class="text-base sm:text-xl text-[#78716C] font-normal leading-relaxed max-w-2xl mx-auto">
          A personal budgeting workspace engineered for clarity. 
          Real-time cash flow forecasting, envelope pulse budgets, zero-leakage tracking, and predictive Money Weather.
        </p>

        <!-- Primary Call to Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button id="welcome-get-started-btn" class="btn btn-coral w-full sm:w-auto px-8 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <span>Create Free Account</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>
          
          <button id="welcome-login-btn" class="btn btn-secondary w-full sm:w-auto px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2">
            <span>Sign In to Workspace</span>
          </button>

          <button id="welcome-demo-btn" class="btn btn-subtle w-full sm:w-auto px-6 py-3 text-sm font-semibold border border-[#E6E1D6] hover:border-[#D5CEBF] flex items-center justify-center gap-2 text-[#44403C]">
            <span>⚡ Try Live Demo</span>
          </button>
        </div>
        <p class="text-[11px] text-[#A8A29E]">No credit card required · Local-first privacy · Zero third-party trackers</p>
      </section>

      <!-- Interactive Preview Card Stage -->
      <section class="paper-card p-6 sm:p-10 shadow-elevated border border-[#E6E1D6] rounded-2xl bg-white max-w-4xl mx-auto">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#E6E1D6]">
          <div>
            <span class="text-[10px] font-mono uppercase tracking-wider text-[#78716C]">Live Feature Preview</span>
            <h2 class="font-serif text-2xl font-bold text-[#1C1917]">Money Weather™ & Daily Safe-to-Spend</h2>
            <p class="text-xs text-[#78716C] mt-0.5">Continuous predictive cash-flow forecasting calibrated for Indian household finances</p>
          </div>
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#2D7A58] text-xs font-semibold">
            <span class="w-2 h-2 rounded-full bg-[#2D7A58]"></span>
            Clear & Stable Forecast
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <!-- Metric 1: Safe-to-Spend -->
          <div class="p-5 rounded-xl bg-[#FBF9F5] border border-[#E6E1D6] space-y-2">
            <span class="text-xs font-medium text-[#78716C]">Daily Safe-to-Spend</span>
            <div class="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">₹2,470<span class="text-xs font-sans text-[#78716C] font-normal"> / day</span></div>
            <p class="text-[11px] text-[#2D7A58] font-medium">₹74,200 available balance after all bills</p>
          </div>

          <!-- Metric 2: Month-End Runway -->
          <div class="p-5 rounded-xl bg-[#FBF9F5] border border-[#E6E1D6] space-y-2">
            <span class="text-xs font-medium text-[#78716C]">Liquidity Safety Cushion</span>
            <div class="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">2.4 <span class="text-xs font-sans text-[#78716C] font-normal">months</span></div>
            <p class="text-[11px] text-[#78716C]">Protects emergency reserve automatically</p>
          </div>

          <!-- Metric 3: Savings Rate -->
          <div class="p-5 rounded-xl bg-[#FBF9F5] border border-[#E6E1D6] space-y-2">
            <span class="text-xs font-medium text-[#78716C]">Projected Savings Rate</span>
            <div class="font-serif text-2xl sm:text-3xl font-bold text-[#2D7A58]">42.5%</div>
            <p class="text-[11px] text-[#2D7A58] font-medium">Exceeds recommended 20% tier</p>
          </div>
        </div>

        <!-- Visual Progress Bars -->
        <div class="pt-6 space-y-4">
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="font-semibold text-[#1C1917]">Groceries & Essentials</span>
              <span class="text-[#78716C]">₹16,400 of ₹25,000 (65%)</span>
            </div>
            <div class="w-full bg-[#E6E1D6] h-2.5 rounded-full overflow-hidden">
              <div class="bg-[#2D7A58] h-full rounded-full transition-all duration-1000" style="width: 65%"></div>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="font-semibold text-[#1C1917]">Dining & Entertainment</span>
              <span class="text-[#78716C]">₹9,800 of ₹12,000 (81%)</span>
            </div>
            <div class="w-full bg-[#E6E1D6] h-2.5 rounded-full overflow-hidden">
              <div class="bg-[#D97706] h-full rounded-full transition-all duration-1000" style="width: 81%"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Four Pillars Feature Grid -->
      <section class="space-y-8">
        <div class="text-center space-y-2 max-w-xl mx-auto">
          <h2 class="font-serif text-3xl font-bold text-[#1C1917]">Built for Real-World Money Management</h2>
          <p class="text-sm text-[#78716C]">Designed to eliminate money anxiety with accurate mathematics and intelligent clarity.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Card 1 -->
          <div class="paper-card p-6 space-y-3 border border-[#E6E1D6] rounded-xl hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-lg bg-[#FDEDE8] text-[#D45644] flex items-center justify-center font-bold text-lg">
              🌤️
            </div>
            <h3 class="font-serif text-base font-bold text-[#1C1917]">Money Weather™</h3>
            <p class="text-xs text-[#78716C] leading-relaxed">
              Looks ahead through your upcoming recurring bills, SIPs, and fixed commitments to calculate how much you can truly spend right now.
            </p>
          </div>

          <!-- Card 2 -->
          <div class="paper-card p-6 space-y-3 border border-[#E6E1D6] rounded-xl hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-lg bg-[#ECFDF5] text-[#2D7A58] flex items-center justify-center font-bold text-lg">
              🎯
            </div>
            <h3 class="font-serif text-base font-bold text-[#1C1917]">Envelope Pulse Budgeting</h3>
            <p class="text-xs text-[#78716C] leading-relaxed">
              All financial values are calculated in integer paise. No floating-point rounding errors or lost change across categories.
            </p>
          </div>

          <!-- Card 3 -->
          <div class="paper-card p-6 space-y-3 border border-[#E6E1D6] rounded-xl hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-lg">
              🔄
            </div>
            <h3 class="font-serif text-base font-bold text-[#1C1917]">Zero Double-Counting</h3>
            <p class="text-xs text-[#78716C] leading-relaxed">
              Internal transfers between your HDFC account, credit cards, UPI wallets, and cash reserves never pollute your income or expense cash flows.
            </p>
          </div>

          <!-- Card 4 -->
          <div class="paper-card p-6 space-y-3 border border-[#E6E1D6] rounded-xl hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-lg bg-[#F6F3EB] text-[#1C1917] flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <h3 class="font-serif text-base font-bold text-[#1C1917]">Strict User Isolation</h3>
            <p class="text-xs text-[#78716C] leading-relaxed">
              Every account, transaction, and goal is isolated behind verified server-side JWT authentication. Your financial data is private and yours alone.
            </p>
          </div>

        </div>
      </section>

      <!-- Bottom Call to Action Banner -->
      <section class="p-8 sm:p-12 rounded-2xl bg-[#1C1917] text-[#FAF8F5] text-center space-y-6 relative overflow-hidden">
        <div class="space-y-2 max-w-xl mx-auto relative z-10">
          <h2 class="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#FAF8F5]">
            Take command of your financial future.
          </h2>
          <p class="text-sm text-[#A8A29E] leading-relaxed">
            Join Klyro today to experience transparent, stress-free personal financial management.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button id="welcome-cta-register-btn" class="btn btn-coral px-8 py-3 text-sm font-semibold shadow-md">
            Get Started Free
          </button>
          <button id="welcome-cta-login-btn" class="px-6 py-3 text-sm font-semibold text-[#FAF8F5] hover:text-white border border-[#44403C] hover:border-[#78716C] rounded-lg transition-colors">
            Existing User? Sign In
          </button>
        </div>
      </section>

    </div>
  `;

  // Attach interactive button listeners
  document.getElementById('welcome-get-started-btn')?.addEventListener('click', () => {
    openAuthModal('register');
  });

  document.getElementById('welcome-login-btn')?.addEventListener('click', () => {
    openAuthModal('login');
  });

  document.getElementById('welcome-cta-register-btn')?.addEventListener('click', () => {
    openAuthModal('register');
  });

  document.getElementById('welcome-cta-login-btn')?.addEventListener('click', () => {
    openAuthModal('login');
  });

  // Quick Demo Login Action
  document.getElementById('welcome-demo-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('welcome-demo-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> Signing in...`;
    }

    try {
      await api.login('sanskriti@klyro.finance', 'DemoPassword123!');
      showToast('Welcome to Sanskriti Vadher\'s demo workspace!');
      router.navigate('home');
    } catch (err) {
      showToast('Failed to sign into demo workspace: ' + err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>⚡ Try Live Demo</span>`;
      }
    }
  });

  // Mascot click triggers animated intro
  document.getElementById('welcome-mascot-badge')?.addEventListener('click', () => {
    if (window.KLYRO_MASCOT && typeof window.KLYRO_MASCOT.playIntro === 'function') {
      window.KLYRO_MASCOT.playIntro(true);
    }
  });
}
