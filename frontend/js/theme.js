/**
 * KLYRO — Theme Manager (Phase 5 Design System)
 * Manages two distinctive, cohesive themes:
 * - Sunrise: Warm, optimistic early-morning sunlight (cream, soft gold, vibrant coral)
 * - Sunset: Sophisticated evening (warm charcoal, burgundy, amber highlights)
 *
 * Persists theme preference across page reloads and avoids flash-of-unstyled-theme.
 */

const STORAGE_KEY = 'klyro_theme';
const DEFAULT_THEME = 'sunrise';

import { api } from './api.js';

/**
 * Get currently active theme ('sunrise' | 'sunset')
 */
export function getTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  return document.documentElement.getAttribute('data-theme') || localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
}

/**
 * Apply theme to document, persist to localStorage, and dispatch change event
 * @param {'sunrise' | 'sunset'} theme 
 */
export function setTheme(theme) {
  const targetTheme = (theme === 'sunset') ? 'sunset' : 'sunrise';
  document.documentElement.setAttribute('data-theme', targetTheme);
  if (document.body) {
    document.body.setAttribute('data-theme', targetTheme);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, targetTheme);
  } catch (e) {
    console.warn('LocalStorage unavailable for theme persistence', e);
  }

  // Also persist to backend user settings if authenticated
  try {
    if (api && api.isAuthenticated && api.isAuthenticated()) {
      api.updateSettings({ theme: targetTheme }).catch(() => {});
    }
  } catch (e) {
    // Non-blocking
  }

  updateToggleButtonsUI(targetTheme);

  // Dispatch custom event for reactive chart/canvas adaptation
  window.dispatchEvent(new CustomEvent('klyro:theme-changed', {
    detail: { theme: targetTheme }
  }));
}

/**
 * Toggle between Sunrise and Sunset themes
 */
export function toggleTheme() {
  const current = getTheme();
  const next = current === 'sunrise' ? 'sunset' : 'sunrise';
  setTheme(next);
  return next;
}

/**
 * Update active state of all theme toggle buttons across the UI
 */
export function updateToggleButtonsUI(activeTheme = getTheme()) {
  const isSunset = activeTheme === 'sunset';

  // 1. Update all header / sidebar toggle buttons
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  buttons.forEach(btn => {
    btn.setAttribute('aria-pressed', isSunset ? 'true' : 'false');
    btn.setAttribute('title', isSunset ? 'Current: Sunset Theme (Click for Sunrise)' : 'Current: Sunrise Theme (Click for Sunset)');
    
    // If it has inner icons or label
    const label = btn.querySelector('.theme-toggle-label');
    if (label) {
      label.textContent = isSunset ? 'Sunset' : 'Sunrise';
    }

    const iconSunrise = btn.querySelector('.theme-icon-sunrise');
    const iconSunset = btn.querySelector('.theme-icon-sunset');
    if (iconSunrise && iconSunset) {
      if (isSunset) {
        iconSunrise.classList.add('hidden');
        iconSunset.classList.remove('hidden');
      } else {
        iconSunrise.classList.remove('hidden');
        iconSunset.classList.add('hidden');
      }
    }
  });

  // 2. Update radio-style theme selectors
  const sunriseRadio = document.getElementById('theme-radio-sunrise');
  const sunsetRadio = document.getElementById('theme-radio-sunset');
  if (sunriseRadio) sunriseRadio.checked = !isSunset;
  if (sunsetRadio) sunsetRadio.checked = isSunset;

  // 3. Update Settings view active theme badge
  const themeLabel = document.getElementById('settings-active-theme-label');
  if (themeLabel) {
    themeLabel.textContent = activeTheme;
  }

  // 4. Update Settings view theme cards border and background highlights
  const sunriseCard = document.getElementById('select-theme-sunrise');
  const sunsetCard = document.getElementById('select-theme-sunset');
  if (sunriseCard && sunsetCard) {
    if (isSunset) {
      sunriseCard.className = 'theme-choice-card p-4 rounded-xl border-2 transition-all cursor-pointer border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)]';
      sunsetCard.className = 'theme-choice-card p-4 rounded-xl border-2 transition-all cursor-pointer border-[#F59E0B] bg-[var(--bg-surface-subtle)] shadow-sm';
    } else {
      sunriseCard.className = 'theme-choice-card p-4 rounded-xl border-2 transition-all cursor-pointer border-[#D45644] bg-[#FDEDE8]/40 shadow-sm';
      sunsetCard.className = 'theme-choice-card p-4 rounded-xl border-2 transition-all cursor-pointer border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)]';
    }
  }
}

/**
 * Wire click event handlers to all theme toggles in the document
 */
export function initThemeManager() {
  // Ensure the document has attribute set from storage
  const current = getTheme();
  document.documentElement.setAttribute('data-theme', current);

  // Delegate click for any theme toggle button
  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('[data-theme-toggle]');
    if (toggleBtn) {
      e.preventDefault();
      toggleTheme();
    }
  });

  updateToggleButtonsUI(current);
}

/**
 * Render standard HTML for an accessible theme toggle button
 * @param {boolean} compact - Compact icon-only or with label
 */
export function renderThemeToggleHTML(compact = false) {
  const current = getTheme();
  const isSunset = current === 'sunset';

  return `
    <button 
      type="button" 
      data-theme-toggle 
      class="theme-toggle-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-all text-xs font-medium shadow-xs"
      aria-label="Toggle between Sunrise and Sunset theme"
      aria-pressed="${isSunset ? 'true' : 'false'}"
      title="${isSunset ? 'Current: Sunset Theme (Click for Sunrise)' : 'Current: Sunrise Theme (Click for Sunset)'}"
    >
      <span class="theme-icon-sunrise ${isSunset ? 'hidden' : ''} text-[#D97706] flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </span>
      <span class="theme-icon-sunset ${isSunset ? '' : 'hidden'} text-[#F59E0B] flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </span>
      ${compact ? '' : `<span class="theme-toggle-label capitalize">${current}</span>`}
    </button>
  `;
}
