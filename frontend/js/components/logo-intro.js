/**
 * KYLRO — Animated Logo Introduction
 * 
 * Concept:
 * An original animation built around the spelling KYLRO:
 * - Kly the owl glides gracefully across the screen, alighting upon the letters.
 * - The letters K, Y, L, R, O appear sequentially as Kly touches them with his radiant amber wing.
 * - When Kly perches playfully upon the letter 'O' (which turns into a glowing clarity lens/perch),
 *   the wordmark completes with a tactile spring bounce and gentle celebratory spark.
 * - The brand tagline reveals smoothly below: "Clarity you can act on."
 * - Brief, elegant (under 3.2s), non-blocking, with an immediate "Skip ✕" button.
 * - Respects prefers-reduced-motion.
 */

import { renderMascot } from './mascot.js';
import { isReducedMotion } from '../utils/animate.js';

let isIntroPlaying = false;

export function playLogoIntroAnimation({ onComplete, force = false } = {}) {
  if (!force && sessionStorage.getItem('kylro_intro_seen')) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  if (isReducedMotion() && !force) {
    sessionStorage.setItem('kylro_intro_seen', '1');
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  if (isIntroPlaying) return;
  isIntroPlaying = true;

  let overlay = document.getElementById('kylro-logo-intro-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'kylro-logo-intro-overlay';
    document.body.appendChild(overlay);
  }

  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-canvas,#FBF8F1)] transition-opacity duration-500';
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'auto';

  overlay.innerHTML = `
    <div class="relative w-full max-w-xl mx-auto p-6 flex flex-col items-center justify-center select-none text-center">
      
      <!-- Skip Action Button -->
      <button id="skip-logo-intro-btn" class="absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] bg-white/80 border border-[#E6E1D6] rounded-full shadow-xs hover:bg-white transition-all cursor-pointer z-30">
        Skip ✕
      </button>

      <!-- Stage Container -->
      <div class="relative w-full h-64 sm:h-72 flex items-center justify-center overflow-hidden">
        
        <!-- Ambient Warm Glow Center -->
        <div id="intro-ambient-glow" class="absolute w-56 h-56 rounded-full bg-[#FCD34D] opacity-0 blur-3xl pointer-events-none transition-opacity duration-700"></div>

        <!-- The KYLRO Wordmark Stage -->
        <div class="flex items-baseline justify-center font-serif text-5xl sm:text-7xl font-bold tracking-tight text-[#1C1917] relative z-10">
          <span class="intro-letter intro-letter-k inline-block transform translate-y-6 opacity-0 transition-all duration-400 ease-out">K</span>
          <span class="intro-letter intro-letter-y inline-block transform translate-y-6 opacity-0 transition-all duration-400 ease-out">Y</span>
          <span class="intro-letter intro-letter-l inline-block transform translate-y-6 opacity-0 transition-all duration-400 ease-out">L</span>
          <span class="intro-letter intro-letter-r inline-block transform translate-y-6 opacity-0 transition-all duration-400 ease-out">R</span>
          <span class="intro-letter intro-letter-o relative inline-block transform translate-y-6 opacity-0 transition-all duration-400 ease-out">
            O
            <!-- Clarity Lens Dot inside O -->
            <span id="intro-o-gem" class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-500">
              <span class="w-3 h-3 rounded-full bg-[#D45644] animate-ping" style="animation-duration: 2s;"></span>
            </span>
          </span>
        </div>

        <!-- Mascot "Kly" Character Actor (Flying / Gliding Across) -->
        <div id="intro-mascot-actor" class="absolute -top-10 -left-20 transform transition-all duration-900 ease-out z-20">
          <div id="intro-mascot-sprite" class="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-md">
            ${renderMascot('welcoming', 'w-16 h-16 sm:w-20 sm:h-20')}
          </div>
        </div>

      </div>

      <!-- Tagline & Brand Narrative (Fades in on completion) -->
      <div id="intro-tagline-container" class="mt-4 opacity-0 transform translate-y-2 transition-all duration-500 space-y-1">
        <p class="font-serif text-lg sm:text-2xl font-bold text-[#1C1917] tracking-tight">
          Clarity you can <span class="italic text-[#D45644]">act on.</span>
        </p>
        <p class="text-xs text-[#78716C] tracking-wide">
          Financial Intelligence · Safe-to-Spend · Money Weather™
        </p>
      </div>

    </div>
  `;

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  let hasEnded = false;
  const finishIntro = () => {
    if (hasEnded) return;
    hasEnded = true;
    sessionStorage.setItem('kylro_intro_seen', '1');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => {
      overlay.remove();
      isIntroPlaying = false;
      if (typeof onComplete === 'function') onComplete();
    }, 450);
  };

  document.getElementById('skip-logo-intro-btn')?.addEventListener('click', finishIntro);

  // --- Choreographed Timeline Execution ---
  const mascot = document.getElementById('intro-mascot-actor');
  const sprite = document.getElementById('intro-mascot-sprite');
  const letterK = overlay.querySelector('.intro-letter-k');
  const letterY = overlay.querySelector('.intro-letter-y');
  const letterL = overlay.querySelector('.intro-letter-l');
  const letterR = overlay.querySelector('.intro-letter-r');
  const letterO = overlay.querySelector('.intro-letter-o');
  const glow = document.getElementById('intro-ambient-glow');
  const gem = document.getElementById('intro-o-gem');
  const tagline = document.getElementById('intro-tagline-container');

  const revealLetter = (el, color = '#1C1917') => {
    if (!el || hasEnded) return;
    el.classList.remove('translate-y-6', 'opacity-0');
    el.classList.add('translate-y-0', 'opacity-100');
    el.style.color = color;
  };

  // T+200ms: Owl enters gliding from upper-left toward letter K
  setTimeout(() => {
    if (hasEnded || !mascot) return;
    if (sprite) sprite.innerHTML = renderMascot('encouraging', 'w-16 h-16 sm:w-20 sm:h-20');
    mascot.style.transform = 'translateX(calc(50vw - 150px)) translateY(70px)';
    revealLetter(letterK);
  }, 250);

  // T+600ms: Owl glides past Y and L
  setTimeout(() => {
    if (hasEnded || !mascot) return;
    mascot.style.transform = 'translateX(calc(50vw - 60px)) translateY(55px)';
    revealLetter(letterY);
    revealLetter(letterL);
  }, 650);

  // T+1100ms: Owl glides past R and approaches O
  setTimeout(() => {
    if (hasEnded || !mascot) return;
    mascot.style.transform = 'translateX(calc(50vw + 30px)) translateY(65px)';
    revealLetter(letterR);
  }, 1100);

  // T+1500ms: Owl lands gracefully on top of letter O!
  setTimeout(() => {
    if (hasEnded || !mascot) return;
    // Position perched right above letter O
    mascot.style.transform = 'translateX(calc(50vw + 68px)) translateY(35px)';
    revealLetter(letterO, '#D45644');

    if (sprite) sprite.innerHTML = renderMascot('celebrating', 'w-16 h-16 sm:w-20 sm:h-20');
    if (gem) gem.style.opacity = '1';
    if (glow) glow.style.opacity = '0.35';

    // Tactile spring bounce on wordmark
    overlay.querySelectorAll('.intro-letter').forEach(l => {
      l.classList.add('animate-bounce');
      setTimeout(() => l.classList.remove('animate-bounce'), 600);
    });

    if (typeof window.confetti === 'function') {
      try {
        window.confetti({
          particleCount: 26,
          spread: 50,
          origin: { y: 0.52 },
          colors: ['#D45644', '#D97706', '#2D7A58'],
          disableForReducedMotion: true,
        });
      } catch (e) { /* silent */ }
    }
  }, 1500);

  // T+2100ms: Reveal Tagline with smooth editorial fade-up
  setTimeout(() => {
    if (hasEnded || !tagline) return;
    tagline.classList.remove('opacity-0', 'translate-y-2');
    tagline.classList.add('opacity-100', 'translate-y-0');
  }, 2100);

  // T+3200ms: Finish cleanly
  setTimeout(() => {
    finishIntro();
  }, 3200);
}
