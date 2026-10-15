/**
 * KLYRO — Loading Skeletons & Friendly Empty State Components
 * Shimmer placeholders and calm, approachable editorial empty illustrations.
 */

export function renderLoadingSpinner(message = 'Consulting financial records...') {
  return `
    <div class="flex flex-col items-center justify-center py-16 space-y-4 text-center">
      <div class="relative w-10 h-10">
        <div class="w-10 h-10 rounded-full border-2 border-[#E6E1D6] border-t-[#D45644] animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center font-serif text-xs font-bold text-[#1C1917]">
          K
        </div>
      </div>
      <p class="font-serif text-sm text-[#78716C] tracking-wide animate-pulse">${message}</p>
    </div>
  `;
}

/**
 * Shimmer skeleton loader for the dashboard (Money Weather hero + 4 KPIs + Pulse preview).
 */
export function renderDashboardSkeleton() {
  return `
    <div class="max-w-7xl mx-auto space-y-6 animate-pulse">
      <!-- Brand Bar Skeleton -->
      <div class="flex items-center justify-between pb-3 border-b border-[#E6E1D6]">
        <div class="h-4 w-48 skeleton-shimmer"></div>
        <div class="h-4 w-28 skeleton-shimmer"></div>
      </div>

      <!-- Weather Banner Skeleton -->
      <div class="paper-card p-6 border border-[#E6E1D6] bg-white">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-3 flex-1">
            <div class="h-4 w-32 skeleton-shimmer"></div>
            <div class="h-7 w-3/4 skeleton-shimmer"></div>
            <div class="h-4 w-5/6 skeleton-shimmer"></div>
          </div>
          <div class="w-72 h-24 skeleton-shimmer rounded-xl"></div>
        </div>
      </div>

      <!-- 4 KPI Cards Skeleton -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${[1, 2, 3, 4]
          .map(
            () => `
          <div class="paper-card p-5 space-y-3">
            <div class="h-3 w-24 skeleton-shimmer"></div>
            <div class="h-7 w-36 skeleton-shimmer"></div>
            <div class="h-3 w-28 skeleton-shimmer pt-2 border-t border-[#F6F3EB]"></div>
          </div>
        `
          )
          .join('')}
      </div>

      <!-- 2 Columns Workspace Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="paper-card p-6 space-y-4">
            <div class="h-5 w-40 skeleton-shimmer"></div>
            <div class="space-y-3">
              <div class="h-10 w-full skeleton-shimmer"></div>
              <div class="h-10 w-full skeleton-shimmer"></div>
              <div class="h-10 w-full skeleton-shimmer"></div>
            </div>
          </div>
        </div>
        <div class="space-y-6">
          <div class="paper-card p-6 space-y-4">
            <div class="h-5 w-36 skeleton-shimmer"></div>
            <div class="h-16 w-full skeleton-shimmer"></div>
            <div class="h-16 w-full skeleton-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generic Shimmer skeleton loader for card grids (Accounts, Goals, Budgets).
 */
export function renderCardSkeleton(count = 4) {
  return `
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div class="h-7 w-48 skeleton-shimmer"></div>
        <div class="h-8 w-32 skeleton-shimmer"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(count, 3)} gap-4">
        ${Array.from({ length: count })
          .map(
            () => `
          <div class="paper-card p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div class="h-5 w-32 skeleton-shimmer"></div>
              <div class="h-4 w-16 skeleton-shimmer"></div>
            </div>
            <div class="h-8 w-40 skeleton-shimmer"></div>
            <div class="h-3 w-full skeleton-shimmer"></div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/**
 * Table Shimmer skeleton loader (Transactions ledger).
 */
export function renderTableSkeleton(rows = 6) {
  return `
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div class="h-7 w-44 skeleton-shimmer"></div>
        <div class="h-8 w-36 skeleton-shimmer"></div>
      </div>
      <div class="paper-card p-4 h-12 skeleton-shimmer"></div>
      <div class="paper-card overflow-hidden">
        <div class="p-4 border-b border-[#E6E1D6] h-10 skeleton-shimmer"></div>
        <div class="p-4 space-y-3">
          ${Array.from({ length: rows })
            .map(() => `<div class="h-9 w-full skeleton-shimmer"></div>`)
            .join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderErrorBanner(errorMessage, onRetryFnName = 'location.reload()') {
  return `
    <div class="paper-card p-6 border-l-4 border-l-[#B84A39] bg-[#FEF2F2] max-w-xl mx-auto my-8 space-y-3">
      <div class="flex items-center gap-2">
        <span class="badge badge-terracotta text-xs font-bold">Connection Notice</span>
      </div>
      <h4 class="font-serif text-base font-bold text-[#1C1917]">Unable to load financial data</h4>
      <p class="text-xs text-[#44403C] leading-relaxed">${errorMessage}</p>
      <div class="pt-2">
        <button onclick="${onRetryFnName}" class="btn btn-secondary text-xs">Try Again</button>
      </div>
    </div>
  `;
}

/**
 * Friendly Empty State with a calm, tactile editorial vector illustration
 */
export function renderEmptyState(title, description, actionText = null, actionHandler = null, emoji = '🌱') {
  return `
    <div class="fade-up-card paper-card p-10 md:p-14 text-center max-w-md mx-auto my-8 space-y-4 border border-[#E6E1D6]">
      <!-- Friendly Editorial Vector / Emoji Container -->
      <div class="w-16 h-16 rounded-2xl bg-[#F6F3EB] border border-[#E6E1D6] mx-auto flex items-center justify-center text-3xl shadow-xs">
        <span>${emoji}</span>
      </div>
      <div>
        <h4 class="font-serif text-lg font-bold text-[#1C1917] tracking-tight">${title}</h4>
        <p class="text-xs text-[#78716C] leading-relaxed max-w-sm mx-auto mt-1">${description}</p>
      </div>
      ${
        actionText
          ? `<div class="pt-2">
              <button onclick="${actionHandler || ''}" class="btn btn-coral text-xs shadow-xs hover:shadow-sm">
                ${actionText}
              </button>
            </div>`
          : ''
      }
    </div>
  `;
}
