/**
 * KLYRO — Main Application Bootstrap & UI Controller
 */

import { store } from './state.js';
import { router } from './router.js';
import { showToast } from './components/toast.js';
import { initQuickCaptureModal, openQuickCaptureModal } from './components/quick-capture-modal.js';

import { renderHomeView } from './views/home.js';
import { renderTransactionsView } from './views/transactions.js';
import { renderBudgetsView } from './views/budgets.js';
import { renderAccountsView } from './views/accounts.js';
import { renderInsightsView } from './views/insights.js';
import { renderGoalsView } from './views/goals.js';
import { renderRecurringView } from './views/recurring.js';
import { renderSettingsView } from './views/settings.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('main-view-container');
  const periodLabel = document.getElementById('period-display-label');
  const quickCaptureModal = document.getElementById('quick-capture-modal');
  const shortcutsModal = document.getElementById('shortcuts-modal');

  // Register views with the client router
  router.register('home', renderHomeView);
  router.register('transactions', renderTransactionsView);
  router.register('budgets', renderBudgetsView);
  router.register('accounts', renderAccountsView);
  router.register('insights', renderInsightsView);
  router.register('goals', renderGoalsView);
  router.register('recurring', renderRecurringView);
  router.register('settings', renderSettingsView);

  // Initialize router
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
        openQuickCapture();
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

  console.log('Klyro Financial Intelligence Workspace initialized successfully.');
});

