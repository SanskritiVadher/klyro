/**
 * KLYRO — Client-Side Hash Router
 * Connects the navigation rail to views with clean transitions.
 */

import { store } from './state.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.container = null;

    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  init(containerElement) {
    this.container = containerElement;
    // Initial route dispatch
    this.handleHashChange();
  }

  register(routeName, viewHandler) {
    this.routes.set(routeName, viewHandler);
  }

  navigate(routeName) {
    window.location.hash = `#${routeName}`;
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '').trim();
    const route = hash || 'home';

    if (this.routes.has(route)) {
      this.currentRoute = route;
      store.setState({ activeView: route });
      this.updateActiveNavLinks(route);

      const handler = this.routes.get(route);
      if (this.container && typeof handler === 'function') {
        this.container.classList.remove('view-enter');
        // Trigger reflow to restart animation
        void this.container.offsetWidth;
        this.container.classList.add('view-enter');
        this.container.innerHTML = '';
        handler(this.container);
      }
    } else {
      // Fallback to home
      this.navigate('home');
    }
  }

  updateActiveNavLinks(activeRoute) {
    document.querySelectorAll('[data-route]').forEach((el) => {
      if (el.getAttribute('data-route') === activeRoute) {
        el.classList.add('active');
        el.setAttribute('aria-current', 'page');
      } else {
        el.classList.remove('active');
        el.removeAttribute('aria-current');
      }
    });

    // Update Topbar View Title
    const titleMap = {
      home: 'Financial Home & Weather',
      transactions: 'Transaction Ledger',
      budgets: 'Budget Pulse & Allocations',
      accounts: 'Accounts & Net Cash Flow',
      insights: 'Spending DNA & Analytics',
      goals: 'Financial Goals & Momentum',
      recurring: 'Recurring Commitments & Timeline',
      settings: 'Settings & Data Management',
    };

    const headerTitleEl = document.getElementById('view-header-title');
    if (headerTitleEl) {
      headerTitleEl.textContent = titleMap[activeRoute] || 'Overview';
    }
    document.title = `${titleMap[activeRoute] || 'Overview'} — Klyro`;
  }
}

export const router = new Router();
