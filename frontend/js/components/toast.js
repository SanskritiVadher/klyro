/**
 * KLYRO — Toast Notification System
 */

export function showToast(message, type = 'info', duration = 3200) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast flex items-center gap-2.5 shadow-lg';

  let icon = '';
  if (type === 'success') {
    icon = `<span class="text-sm shrink-0">✨</span>`;
  } else if (type === 'warning') {
    icon = `<span class="text-sm shrink-0">⚠️</span>`;
  } else if (type === 'error') {
    icon = `<span class="text-sm shrink-0">🚨</span>`;
  } else {
    icon = `<span class="text-sm shrink-0">💡</span>`;
  }

  toast.innerHTML = `
    ${icon}
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px) scale(0.95)';
    toast.style.transition = 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => toast.remove(), 260);
  }, duration);
}
