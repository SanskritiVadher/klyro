/**
 * KLYRO — Client-Side Hash Router
 * Connects the navigation rail to views with clean transitions and auth route guarding.
 */

import { store } from './state.js';
import { api } from './api.js';
import { openAuthModal } from './components/auth-modal.js';

const PUBLIC_ROUTES = new Set(['welcome']);

export function syncShellVisibility(isAuthenticated, route) {
  const isPublicRoute = PUBLIC_ROUTES.has(route);
  const showPublicShell = !isAuthenticated || isPublicRoute;

  const publicNav = document.getElementById('public-nav');
  const appSidebar = document.getElementById('app-sidebar');
  const appHeader = document.getElementById('app-header');
  const appMobileNav = document.getElementById('app-mobile-nav');

  if (showPublicShell) {
    publicNav?.classList.remove('hidden');
    publicNav?.classList.add('flex');

    appSidebar?.classList.remove('md:flex');
    appSidebar?.classList.add('hidden');

    appHeader?.classList.add('hidden');
    appMobileNav?.classList.add('hidden');
  } else {
    publicNav?.classList.add('hidden');
    publicNav?.classList.remove('flex');

    appSidebar?.classList.remove('hidden');
    appSidebar?.classList.add('md:flex');

    appHeader?.classList.remove('hidden');
    appMobileNav?.classList.remove('hidden');
  }
}

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
    const rawHash = window.location.hash.replace('#', '').trim();
    const isAuthed = api.isAuthenticated();

    // Route alias handling: #login or #register opens modal on welcome page
    if (rawHash === 'login' || rawHash === 'register') {
      if (isAuthed) {
        this.navigate('home');
        return;
      }
      this.currentRoute = 'welcome';
      store.setState({ activeView: 'welcome' });
      syncShellVisibility(false, 'welcome');
      const welcomeHandler = this.routes.get('welcome');
      if (this.container && welcomeHandler) {
        this.container.innerHTML = '';
        welcomeHandler(this.container);
      }
      openAuthModal(rawHash);
      return;
    }

    // Determine target route
    let route = rawHash;
    if (!route) {
      route = isAuthed ? 'home' : 'welcome';
    }

    // Enforce Route Protection for unauthenticated visitors
    if (!isAuthed && !PUBLIC_ROUTES.has(route)) {
      sessionStorage.setItem('klyro_redirect', route);
      this.navigate('welcome');
      return;
    }

    // Authenticated user landing on welcome can view welcome or proceed to dashboard
    if (this.routes.has(route)) {
      this.currentRoute = route;
      store.setState({ activeView: route });
      syncShellVisibility(isAuthed, route);
      this.updateActiveNavLinks(route);

      const handler = this.routes.get(route);
      if (this.container && typeof handler === 'function') {
        // Destroy existing Chart.js instances inside container to prevent memory leaks
        if (typeof Chart !== 'undefined' && Chart.getChart) {
          const canvases = this.container.querySelectorAll('canvas');
          canvases.forEach(c => {
            const chart = Chart.getChart(c);
            if (chart) chart.destroy();
          });
        }

        this.container.classList.remove('view-enter');
        void this.container.offsetWidth; // Trigger reflow
        this.container.classList.add('view-enter');
        this.container.innerHTML = '';
        handler(this.container);
      }
    } else {
      // Fallback
      this.navigate(isAuthed ? 'home' : 'welcome');
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
      welcome: 'Welcome to Klyro',
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
