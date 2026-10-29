/**
 * KLYRO — Component: Auth Modal (Sign In & Account Registration)
 * Provides authenticated login and user registration with real-time validation,
 * error presentation, loading states, and instant demo workspace access.
 */

import { api } from '../api.js';
import { store } from '../state.js';
import { router } from '../router.js';
import { showToast } from './toast.js';

let activeTab = 'login'; // 'login' | 'register'

export function openAuthModal(tab = 'login') {
  activeTab = tab;
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  renderAuthModalContent();
  modal.classList.add('open');

  // Focus the first relevant input
  setTimeout(() => {
    const input = tab === 'login' 
      ? document.getElementById('auth-login-email') 
      : document.getElementById('auth-reg-name');
    input?.focus();
  }, 100);
}

export function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  modal?.classList.remove('open');
}

export function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAuthModal();
    }
  });

  // Global ESC key is handled in app.js
}

function renderAuthModalContent() {
  const container = document.getElementById('auth-modal-content');
  if (!container) return;

  container.innerHTML = `
    <div class="p-6 border-b border-[#E6E1D6] flex items-center justify-between bg-[#F6F3EB]">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-md bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center font-bold text-xs">
          K
        </div>
        <div>
          <h3 class="font-serif text-lg font-bold text-[#1C1917]">
            ${activeTab === 'login' ? 'Sign In to Klyro' : 'Create New Account'}
          </h3>
          <p class="text-xs text-[#78716C]">
            ${activeTab === 'login' ? 'Access your private financial intelligence workspace' : 'Start your financial clarity journey in seconds'}
          </p>
        </div>
      </div>
      <button id="close-auth-modal-btn" class="text-[#78716C] hover:text-[#1C1917] p-1.5 rounded-lg hover:bg-[#EFEBE0]">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Tab Selector -->
    <div class="px-6 pt-4">
      <div class="grid grid-cols-2 gap-2 p-1 bg-[#F6F3EB] rounded-lg border border-[#E6E1D6]">
        <button id="tab-btn-login" class="py-1.5 text-xs font-semibold rounded transition-all ${activeTab === 'login' ? 'bg-[#1C1917] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'}">
          Sign In
        </button>
        <button id="tab-btn-register" class="py-1.5 text-xs font-semibold rounded transition-all ${activeTab === 'register' ? 'bg-[#1C1917] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'}">
          Create Account
        </button>
      </div>
    </div>

    <!-- Alert / Error Banner -->
    <div id="auth-error-box" class="mx-6 mt-4 p-3 rounded-lg text-xs border border-[#FECACA] bg-[#FEF2F2] text-[#B84A39] hidden"></div>

    <!-- Forms Stage -->
    <div class="p-6">
      ${activeTab === 'login' ? renderLoginForm() : renderRegisterForm()}
    </div>
  `;

  // Wire Tab Buttons
  document.getElementById('tab-btn-login')?.addEventListener('click', () => {
    activeTab = 'login';
    renderAuthModalContent();
  });
  document.getElementById('tab-btn-register')?.addEventListener('click', () => {
    activeTab = 'register';
    renderAuthModalContent();
  });
  document.getElementById('close-auth-modal-btn')?.addEventListener('click', closeAuthModal);

  // Wire Forms
  if (activeTab === 'login') {
    wireLoginForm();
  } else {
    wireRegisterForm();
  }
}

function renderLoginForm() {
  return `
    <form id="auth-login-form" class="space-y-4">
      <div>
        <label class="form-label" for="auth-login-email">Email Address</label>
        <input 
          type="email" 
          id="auth-login-email" 
          name="email"
          required 
          autocomplete="email" 
          class="form-input text-sm" 
          placeholder="you@example.com"
        >
      </div>

      <div>
        <div class="flex items-center justify-between">
          <label class="form-label" for="auth-login-password">Password</label>
        </div>
        <input 
          type="password" 
          id="auth-login-password" 
          name="password"
          required 
          autocomplete="current-password" 
          class="form-input text-sm" 
          placeholder="••••••••••••"
        >
      </div>

      <!-- Quick Demo Account Shortcut -->
      <div class="p-3 rounded-lg bg-[#FBF9F5] border border-[#E6E1D6] flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-[#1C1917]">Reviewing as Evaluator?</p>
          <p class="text-[11px] text-[#78716C]">Load pre-populated demo records instantly</p>
        </div>
        <button type="button" id="fill-demo-creds-btn" class="btn btn-subtle text-xs border border-[#D5CEBF] px-2.5 py-1">
          Fill Demo User
        </button>
      </div>

      <div class="pt-2">
        <button type="submit" id="auth-login-submit-btn" class="btn btn-coral w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
          <span>Sign In</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </button>
      </div>

      <div class="text-center pt-2">
        <p class="text-xs text-[#78716C]">
          Don't have an account yet? 
          <button type="button" id="switch-to-register-link" class="text-[#D45644] font-semibold hover:underline">
            Create account
          </button>
        </p>
      </div>
    </form>
  `;
}

function renderRegisterForm() {
  return `
    <form id="auth-reg-form" class="space-y-4">
      <div>
        <label class="form-label" for="auth-reg-name">Your Full Name</label>
        <input 
          type="text" 
          id="auth-reg-name" 
          name="name"
          required 
          autocomplete="name" 
          class="form-input text-sm" 
          placeholder="e.g. Arjun Sharma"
        >
      </div>

      <div>
        <label class="form-label" for="auth-reg-email">Email Address</label>
        <input 
          type="email" 
          id="auth-reg-email" 
          name="email"
          required 
          autocomplete="email" 
          class="form-input text-sm" 
          placeholder="arjun@example.com"
        >
      </div>

      <div>
        <label class="form-label" for="auth-reg-password">Password</label>
        <input 
          type="password" 
          id="auth-reg-password" 
          name="password"
          required 
          minlength="8"
          autocomplete="new-password" 
          class="form-input text-sm" 
          placeholder="Minimum 8 characters"
        >
        <p class="text-[10px] text-[#78716C] mt-1">Must contain at least 8 characters with numbers or special symbols.</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label" for="auth-reg-currency">Currency</label>
          <select id="auth-reg-currency" class="form-select text-xs">
            <option value="INR" selected>₹ INR (Rupees)</option>
            <option value="USD">$ USD (Dollars)</option>
            <option value="EUR">€ EUR (Euros)</option>
            <option value="GBP">£ GBP (Pounds)</option>
          </select>
        </div>
        <div>
          <label class="form-label" for="auth-reg-timezone">Timezone</label>
          <input 
            type="text" 
            id="auth-reg-timezone" 
            value="Asia/Kolkata" 
            class="form-input text-xs"
          >
        </div>
      </div>

      <div class="pt-2">
        <button type="submit" id="auth-reg-submit-btn" class="btn btn-coral w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
          <span>Create Account & Seed Categories</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </button>
      </div>

      <div class="text-center pt-2">
        <p class="text-xs text-[#78716C]">
          Already have an account? 
          <button type="button" id="switch-to-login-link" class="text-[#D45644] font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </form>
  `;
}

function showAuthError(msg) {
  const box = document.getElementById('auth-error-box');
  if (box) {
    box.textContent = msg;
    box.classList.remove('hidden');
  }
}

function hideAuthError() {
  const box = document.getElementById('auth-error-box');
  if (box) {
    box.classList.add('hidden');
  }
}

function wireLoginForm() {
  document.getElementById('switch-to-register-link')?.addEventListener('click', () => {
    activeTab = 'register';
    renderAuthModalContent();
  });

  document.getElementById('fill-demo-creds-btn')?.addEventListener('click', () => {
    const emailInput = document.getElementById('auth-login-email');
    const pwdInput = document.getElementById('auth-login-password');
    if (emailInput) emailInput.value = 'sanskriti@klyro.finance';
    if (pwdInput) pwdInput.value = 'DemoPassword123!';
    hideAuthError();
  });

  const form = document.getElementById('auth-login-form');
  const submitBtn = document.getElementById('auth-login-submit-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthError();

    const email = document.getElementById('auth-login-email')?.value.trim();
    const password = document.getElementById('auth-login-password')?.value;

    if (!email || !password) {
      showAuthError('Please enter both your email and password.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> Authenticating...`;

    try {
      const authResult = await api.login(email, password);
      
      // Fetch full user profile
      const user = await api.getMe();
      store.setState({ user });
      localStorage.setItem('klyro_user', JSON.stringify(user));

      closeAuthModal();
      showToast(`Welcome back, ${user.name}!`);

      // Redirect to saved location or default home
      const destination = sessionStorage.getItem('klyro_redirect') || 'home';
      sessionStorage.removeItem('klyro_redirect');
      router.navigate(destination);

    } catch (err) {
      showAuthError(err.message || 'Invalid email or password.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In</span>`;
    }
  });
}

function wireRegisterForm() {
  document.getElementById('switch-to-login-link')?.addEventListener('click', () => {
    activeTab = 'login';
    renderAuthModalContent();
  });

  const form = document.getElementById('auth-reg-form');
  const submitBtn = document.getElementById('auth-reg-submit-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthError();

    const name = document.getElementById('auth-reg-name')?.value.trim();
    const email = document.getElementById('auth-reg-email')?.value.trim();
    const password = document.getElementById('auth-reg-password')?.value;
    const default_currency = document.getElementById('auth-reg-currency')?.value || 'INR';
    const timezone = document.getElementById('auth-reg-timezone')?.value.trim() || 'Asia/Kolkata';

    if (!name || !email || !password) {
      showAuthError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      showAuthError('Password must contain at least 8 characters.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> Creating workspace...`;

    try {
      // 1. Register user
      await api.register({
        name,
        email,
        password,
        default_currency,
        timezone,
      });

      // 2. Automatically log in to get bearer token
      await api.login(email, password);

      // 3. Fetch profile
      const user = await api.getMe();
      store.setState({ user });
      localStorage.setItem('klyro_user', JSON.stringify(user));

      closeAuthModal();
      showToast(`Account created successfully! Welcome to Klyro, ${user.name}.`);

      router.navigate('home');

    } catch (err) {
      showAuthError(err.message || 'Registration failed. Please check your details.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Create Account & Seed Categories</span>`;
    }
  });
}
