/**
 * KLYRO — Main Application Bootstrap & UI Controller
 */

import { store } from './state.js';
import { router } from './router.js';
import { api } from './api.js';
import { showToast } from './components/toast.js';
import { initThemeManager } from './theme.js';
import { initQuickCaptureModal, openQuickCaptureModal } from './components/quick-capture-modal.js';
import { initAuthModal, openAuthModal } from './components/auth-modal.js';
import { renderMascot } from './components/mascot.js';
import { playLogoIntroAnimation } from './components/logo-intro.js';
import { persistentOwl } from './components/persistent-owl.js';

import { renderWelcomeView } from './views/welcome.js';
import { renderHomeView } from './views/home.js';
import { renderTransactionsView } from './views/transactions.js';
import { renderBudgetsView } from './views/budgets.js';
import { renderAccountsView } from './views/accounts.js';
import { renderInsightsView } from './views/insights.js';
import { renderGoalsView } from './views/goals.js';
import { renderRecurringView } from './views/recurring.js';
import { renderSettingsView } from './views/settings.js';

function updateUserProfileUI(user) {
  const initialsEl = document.getElementById('sidebar-user-initials');
  const nameEl = document.getElementById('sidebar-user-name');
  const metaEl = document.getElementById('sidebar-user-meta');

  if (user && user.name) {
    const names = user.name.trim().split(' ');
    const initials = names.length > 1 
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : user.name.substring(0, 2).toUpperCase();

    if (initialsEl) initialsEl.textContent = initials;
    if (nameEl) nameEl.textContent = user.name;
    if (metaEl) metaEl.textContent = `${user.email || 'Klyro Workspace'} · ${user.default_currency || 'INR'}`;
  } else {
    if (initialsEl) initialsEl.textContent = 'KY';
    if (nameEl) nameEl.textContent = 'Guest User';
    if (metaEl) metaEl.textContent = 'Not Signed In';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Klyro Design System Theme Manager (Sunrise / Sunset)
  initThemeManager();

  const container = document.getElementById('main-view-container');
  const periodLabel = document.getElementById('period-display-label');
  const quickCaptureModal = document.getElementById('quick-capture-modal');
  const shortcutsModal = document.getElementById('shortcuts-modal');

  // Register all public and authenticated views with router
  router.register('welcome', renderWelcomeView);
  router.register('home', renderHomeView);
  router.register('transactions', renderTransactionsView);
  router.register('budgets', renderBudgetsView);
  router.register('accounts', renderAccountsView);
  router.register('insights', renderInsightsView);
  router.register('goals', renderGoalsView);
  router.register('recurring', renderRecurringView);
  router.register('settings', renderSettingsView);

  // Initialize auth modal component
  initAuthModal();

  // Public Nav triggers
  document.getElementById('public-login-btn')?.addEventListener('click', () => {
    openAuthModal('login');
  });
  document.getElementById('public-register-btn')?.addEventListener('click', () => {
    openAuthModal('register');
  });

  // Global Logout Handlers
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout error ignored:', err);
    }
    store.setState({ user: null });
    localStorage.removeItem('klyro_user');
    updateUserProfileUI(null);
    showToast('Signed out of Klyro workspace.');
    router.navigate('welcome');
  };

  document.getElementById('sidebar-logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('header-logout-btn')?.addEventListener('click', handleLogout);

  // Session expired event listener
  window.addEventListener('klyro:session-expired', (e) => {
    store.setState({ user: null });
    localStorage.removeItem('klyro_user');
    updateUserProfileUI(null);
    showToast(e.detail?.message || 'Your session has expired. Please sign in.', 'error');
    router.navigate('welcome');
    openAuthModal('login');
  });

  // Reactive listener when user store updates
  store.subscribe('user', (newUser) => {
    updateUserProfileUI(newUser);
  });

  // Load cached or remote profile if authenticated
  if (api.isAuthenticated()) {
    try {
      const cached = localStorage.getItem('klyro_user');
      if (cached) {
        store.setState({ user: JSON.parse(cached) });
      }
      // Refresh user profile from backend in background
      api.getMe().then((remoteUser) => {
        store.setState({ user: remoteUser });
        localStorage.setItem('klyro_user', JSON.stringify(remoteUser));
      }).catch((err) => {
        console.warn('Could not refresh user profile:', err);
      });
    } catch (e) {
      console.warn('Failed to parse cached user:', e);
    }
  } else {
    store.setState({ user: null });
    updateUserProfileUI(null);
  }

  // Initialize router (dispatches initial view based on auth state & hash)
  router.init(container);

  // Synchronize period display with store
  const syncPeriodDisplay = () => {
    const { label } = store.getPeriodRange();
    if (periodLabel) periodLabel.textContent = label;
  };
  syncPeriodDisplay();

  // Listen to period changes to update UI
  store.subscribe('activePeriod', () => {
    syncPeriodDisplay();
    // Re-render current view with new period context
    router.handleHashChange();
    showToast(`Switched period to ${store.getPeriodRange().label}`);
  });

  // Listen to theme changes to adapt charts reactively without wiping DOM or resetting view
  window.addEventListener('klyro:theme-changed', (e) => {
    const isSunset = e.detail?.theme === 'sunset';
    if (typeof Chart !== 'undefined') {
      const canvases = container?.querySelectorAll('canvas');
      if (canvases && canvases.length > 0) {
        canvases.forEach(c => {
          const chart = Chart.getChart(c);
          if (chart) {
            const chartType = chart.config?.type;
            const isRadial = ['doughnut', 'pie', 'polarArea', 'radar'].includes(chartType);

            // Update cartesian scales only for bar / line / cartesian charts
            if (!isRadial && chart.options?.scales) {
              if (chart.options.scales.x?.grid) chart.options.scales.x.grid.color = isSunset ? '#332B24' : '#E6E1D6';
              if (chart.options.scales.y?.grid) chart.options.scales.y.grid.color = isSunset ? '#332B24' : '#E6E1D6';
              if (chart.options.scales.x?.ticks) chart.options.scales.x.ticks.color = isSunset ? '#9E9486' : '#78716C';
              if (chart.options.scales.y?.ticks) chart.options.scales.y.ticks.color = isSunset ? '#9E9486' : '#78716C';
            }

            // Adapt tooltip theme for all chart types
            if (chart.options?.plugins?.tooltip) {
              chart.options.plugins.tooltip.backgroundColor = isSunset ? '#27211C' : '#1C1917';
              chart.options.plugins.tooltip.titleColor = isSunset ? '#F8F4EC' : '#FAF8F5';
              chart.options.plugins.tooltip.bodyColor = isSunset ? '#D6CEC3' : '#F6F3EB';
              chart.options.plugins.tooltip.borderColor = isSunset ? '#473C32' : 'transparent';
              chart.options.plugins.tooltip.borderWidth = isSunset ? 1 : 0;
            }

            // Adapt legend text color for all chart types
            if (chart.options?.plugins?.legend?.labels) {
              chart.options.plugins.legend.labels.color = isSunset ? '#D6CEC3' : '#44403C';
            }

            try {
              chart.update('none');
            } catch (err) {
              console.warn('Chart update non-critical notice:', err);
            }
          }
        });
      }
    }
  });

  // Listen to transaction/transfer state updates to reload the active view automatically
  store.subscribe('lastUpdated', () => {
    router.handleHashChange();
  });

  // Global Period Controls (< and >)
  document.getElementById('prev-period-btn')?.addEventListener('click', () => {
    store.shiftPeriod(-1);
  });
  document.getElementById('next-period-btn')?.addEventListener('click', () => {
    store.shiftPeriod(1);
  });

  // Modal Open / Close Handlers
  const openQuickCapture = () => {
    openQuickCaptureModal();
  };

  const closeModals = () => {
    quickCaptureModal?.classList.remove('open');
    shortcutsModal?.classList.remove('open');
  };

  document.getElementById('quick-capture-btn')?.addEventListener('click', openQuickCapture);
  document.getElementById('mobile-record-btn')?.addEventListener('click', openQuickCapture);
  document.getElementById('close-modal-btn')?.addEventListener('click', closeModals);
  document.getElementById('cancel-capture-btn')?.addEventListener('click', closeModals);

  // Keyboard Shortcuts Modal Toggle
  document.getElementById('keyboard-help-btn')?.addEventListener('click', () => {
    shortcutsModal?.classList.add('open');
  });
  document.getElementById('close-shortcuts-btn')?.addEventListener('click', closeModals);

  // Global Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    const isTyping = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    if (e.key === 'Escape') {
      closeModals();
    } else if (!isTyping) {
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        if (api.isAuthenticated()) {
          openQuickCapture();
        } else {
          openAuthModal('login');
        }
      } else if (e.key === '[') {
        e.preventDefault();
        store.shiftPeriod(-1);
      } else if (e.key === ']') {
        e.preventDefault();
        store.shiftPeriod(1);
      } else if (e.key === '?') {
        e.preventDefault();
        shortcutsModal?.classList.toggle('open');
      }
    }
  });

  // Initialize live Quick-Capture Modal controller
  initQuickCaptureModal();

  // Wire interactive replay of Klyro Logo Intro when clicking brand headers
  const triggerLogoIntro = () => {
    playLogoIntroAnimation({ force: true });
  };
  document.querySelectorAll('[data-brand-logo], #app-logo-btn, #sidebar-brand-btn, #public-brand-logo').forEach((el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', triggerLogoIntro);
    el.setAttribute('title', 'Play Klyro Animated Logo Intro');
  });

  // Play introductory animation on first visit of session
  playLogoIntroAnimation();

  // Initialize Persistent Owl Companion ("Professor Kly")
  persistentOwl.init();

  // Expose mascot, companion, and logo intro helpers on window
  window.KYLRO_OWL = {
    companion: persistentOwl,
    render: renderMascot,
    playIntro: (force = true) => playLogoIntroAnimation({ force }),
    setPose: (pose) => persistentOwl.setPose(pose),
    speak: (text, opts) => persistentOwl.speak(text, typeof opts === 'number' ? { duration: opts } : opts),
    speakText: (text) => persistentOwl.speakText(text),
    toggleMute: () => persistentOwl.toggleMute(),
    isMuted: () => persistentOwl.isMuted,
    flyToElement: (el, opts) => persistentOwl.flyToElement(el, opts),
    celebrateAchievement: (msg) => persistentOwl.celebrateAchievement(msg),
    acknowledgeTransaction: (data) => persistentOwl.acknowledgeTransaction(data),
  };
  window.KLYRO_MASCOT = window.KYLRO_OWL; // Backward alias

  console.log('KYLRO Financial Intelligence Workspace initialized successfully.');
});


