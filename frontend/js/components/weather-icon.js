/**
 * KLYRO — Money Weather Hero Illustrations
 * Editorial inline SVGs matching financial weather states:
 * - comfortable: spinning radiant sun with 12 rays & pulsing warm glow
 * - tightening: floating, drifting cloud layers
 * - at_risk: storm cloud with animated falling rain & flickering lightning bolt
 */

export function renderWeatherIllustration(status, size = 'w-20 h-20') {
  const normStatus = String(status || '').toLowerCase().trim();

  if (normStatus === 'tightening') {
    return `
      <div class="weather-icon-wrapper ${size} relative shrink-0 flex items-center justify-center select-none" aria-label="Tightening weather: drifting clouds">
        <svg viewBox="0 0 72 72" fill="none" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <!-- Back cloud (warm amber drift) -->
          <g class="weather-cloud-drift-slow" opacity="0.5">
            <path d="M28 26C28 21.5817 31.5817 18 36 18C39.6819 18 42.7813 20.4887 43.7088 23.9045C44.8391 23.5316 46.0571 23.3333 47.3333 23.3333C52.1208 23.3333 56 27.2125 56 32C56 36.7875 52.1208 40.6667 47.3333 40.6667H26.6667C22.2484 40.6667 18.6667 37.085 18.6667 32.6667C18.6667 28.4897 21.864 25.0603 25.9529 24.7061C26.5102 24.6858 27.2361 24.6858 28 26Z" fill="#D97706"/>
          </g>
          <!-- Front cloud (charcoal & warm stone with subtle stroke) -->
          <g class="weather-cloud-drift">
            <path d="M22 36C22 30.4772 26.4772 26 32 26C36.7018 26 40.6355 29.248 41.671 33.6525C42.9018 33.1779 44.2343 32.875 45.625 32.875C51.2169 32.875 55.75 37.4081 55.75 43C55.75 48.5919 51.2169 53.125 45.625 53.125H20.75C15.2272 53.125 10.75 48.6478 10.75 43.125C10.75 37.8982 14.7474 33.6034 19.8621 33.16C20.5588 33.1346 21.2734 34.5315 22 36Z" fill="#78716C" stroke="#1C1917" stroke-width="1.75" stroke-linejoin="round"/>
            <circle cx="32" cy="37" r="2" fill="#FAF8F5" opacity="0.6"/>
            <circle cx="44" cy="42" r="1.5" fill="#FAF8F5" opacity="0.4"/>
          </g>
        </svg>
      </div>
    `;
  }

  if (normStatus === 'at_risk' || normStatus === 'at-risk' || normStatus === 'risk') {
    return `
      <div class="weather-icon-wrapper ${size} relative shrink-0 flex items-center justify-center select-none" aria-label="At-risk weather: storm cloud with rain and lightning">
        <svg viewBox="0 0 72 72" fill="none" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <!-- Dark Storm Cloud -->
          <path d="M22 30C22 24.4772 26.4772 20 32 20C36.8009 20 40.7969 23.385 41.7496 27.9022C42.9844 27.2774 44.3879 26.875 45.875 26.875C51.3978 26.875 55.875 31.3522 55.875 36.875C55.875 42.3978 51.3978 46.875 45.875 46.875H20.75C15.2272 46.875 10.75 42.3978 10.75 36.875C10.75 31.6146 14.7942 27.2997 19.9695 26.9052C20.6446 26.8786 21.3188 28.3029 22 30Z" fill="#383431" stroke="#1C1917" stroke-width="2" stroke-linejoin="round"/>
          
          <!-- Flickering Lightning Bolt -->
          <polygon points="38,32 30,46 36,46 31,60 46,42 39,42" fill="#F59E0B" stroke="#D97706" stroke-width="1" class="weather-lightning" />

          <!-- Falling Raindrops (Burnt Coral / Amber) -->
          <g class="weather-rain-layer">
            <line x1="20" y1="52" x2="16" y2="60" stroke="#D45644" stroke-width="2.2" stroke-linecap="round" class="weather-rain-drop drop-1" />
            <line x1="28" y1="53" x2="24" y2="62" stroke="#D45644" stroke-width="2.2" stroke-linecap="round" class="weather-rain-drop drop-2" />
            <line x1="44" y1="53" x2="40" y2="61" stroke="#D45644" stroke-width="2.2" stroke-linecap="round" class="weather-rain-drop drop-3" />
            <line x1="52" y1="52" x2="48" y2="59" stroke="#D45644" stroke-width="2.2" stroke-linecap="round" class="weather-rain-drop drop-4" />
          </g>
        </svg>
      </div>
    `;
  }

  // Default: Comfortable (Spinning radiant sun with 12 rays & pulsing warm aura)
  return `
    <div class="weather-icon-wrapper ${size} relative shrink-0 flex items-center justify-center select-none" aria-label="Comfortable weather: soft radiant spinning sun">
      <svg viewBox="0 0 72 72" fill="none" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <!-- Pulsing Warm Aura Background -->
        <circle cx="36" cy="36" r="22" fill="#FEF3C7" class="weather-sun-glow" />

        <!-- Continuously Spinning Sun Rays (12 Rays) -->
        <g class="weather-sun-rays" style="transform-origin: 36px 36px;">
          <!-- Cardinal Rays -->
          <line x1="36" y1="9" x2="36" y2="15" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="36" y1="57" x2="36" y2="63" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="9" y1="36" x2="15" y2="36" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="57" y1="36" x2="63" y2="36" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Diagonal Rays -->
          <line x1="16.9" y1="16.9" x2="21.5" y2="21.5" stroke="#D97706" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="50.5" y1="50.5" x2="55.1" y2="55.1" stroke="#D97706" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="16.9" y1="55.1" x2="21.5" y2="50.5" stroke="#D97706" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="50.5" y1="21.5" x2="55.1" y2="16.9" stroke="#D97706" stroke-width="2.2" stroke-linecap="round"/>
          <!-- 30/60 Degree Accents -->
          <line x1="22.5" y1="12.6" x2="25.5" y2="17.8" stroke="#D97706" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
          <line x1="49.5" y1="59.4" x2="46.5" y2="54.2" stroke="#D97706" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
          <line x1="12.6" y1="49.5" x2="17.8" y2="46.5" stroke="#D97706" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
          <line x1="59.4" y1="22.5" x2="54.2" y2="25.5" stroke="#D97706" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
        </g>

        <!-- Core Radiant Golden Sun -->
        <circle cx="36" cy="36" r="14" fill="#D97706" stroke="#B45309" stroke-width="1.75"/>
        <!-- Inner Specular Reflection -->
        <circle cx="33" cy="33" r="3" fill="#FAF8F5" opacity="0.55"/>
      </svg>
    </div>
  `;
}
