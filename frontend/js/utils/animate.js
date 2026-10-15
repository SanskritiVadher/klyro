/**
 * KLYRO — Visual Animation & Motion Utilities
 * Respects `prefers-reduced-motion` strictly.
 * Count-up numbers with bounce, 3D card tilt, progress rings, and brand canvas confetti.
 */

import { formatINR } from './formatters.js';

export function isReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Cubic ease-out curve: fast start, soft deceleration
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animate a numeric integer paise value from start to target, formatting with formatINR.
 * Adds a subtle scale bounce animation when the counter finishes.
 * @param {HTMLElement} element - Target DOM element
 * @param {number} targetMinor - Target amount in paise
 * @param {number} [startMinor=0] - Initial amount in paise
 * @param {number} [duration=600] - Animation duration in ms
 * @param {Function} [formatter=formatINR] - Formatter function
 */
export function animateNumber(element, targetMinor, startMinor = 0, duration = 600, formatter = formatINR) {
  if (!element) return;

  if (isReducedMotion() || duration <= 0) {
    element.textContent = formatter(targetMinor);
    return;
  }

  const startTime = performance.now();
  const diff = targetMinor - startMinor;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const currentVal = Math.round(startMinor + diff * eased);

    element.textContent = formatter(currentVal);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatter(targetMinor);
      // Rupee number slight bounce at the end
      element.classList.remove('number-bounce');
      void element.offsetWidth; // Trigger reflow
      element.classList.add('number-bounce');
    }
  }

  requestAnimationFrame(update);
}

/**
 * Animate an integer percentage from start to target with a slight end bounce.
 * @param {HTMLElement} element
 * @param {number} targetPct
 * @param {number} [startPct=0]
 * @param {number} [duration=600]
 * @param {string} [suffix='%']
 */
export function animatePercent(element, targetPct, startPct = 0, duration = 600, suffix = '%') {
  if (!element) return;

  if (isReducedMotion() || duration <= 0) {
    element.textContent = `${targetPct}${suffix}`;
    return;
  }

  const startTime = performance.now();
  const diff = targetPct - startPct;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const currentVal = Math.round(startPct + diff * eased);

    element.textContent = `${currentVal}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = `${targetPct}${suffix}`;
      element.classList.remove('number-bounce');
      void element.offsetWidth;
      element.classList.add('number-bounce');
    }
  }

  requestAnimationFrame(update);
}

/**
 * Animate an SVG circular stroke progress ring.
 * @param {SVGCircleElement} circleElement
 * @param {number} percent - 0 to 100+
 * @param {number} radius - Circle radius
 * @param {number} [duration=600]
 */
export function animateProgressRing(circleElement, percent, radius = 38, duration = 600) {
  if (!circleElement) return;
  const circumference = 2 * Math.PI * radius;
  circleElement.style.strokeDasharray = `${circumference} ${circumference}`;

  const clamped = Math.min(100, Math.max(0, percent));
  const targetOffset = circumference - (clamped / 100) * circumference;

  if (isReducedMotion() || duration <= 0) {
    circleElement.style.strokeDashoffset = targetOffset;
    return;
  }

  circleElement.style.strokeDashoffset = circumference;
  circleElement.getBoundingClientRect(); // Reflow
  circleElement.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  circleElement.style.strokeDashoffset = targetOffset;
}

/**
 * Fire canvas-confetti in Klyro brand palette (burnt coral, sage, marigold, gold).
 * @param {object} [options={}]
 */
export function fireConfetti(options = {}) {
  if (isReducedMotion()) return;

  const brandColors = ['#D45644', '#2D7A58', '#D97706', '#FCD34D', '#C87D55'];

  if (typeof window.confetti === 'function') {
    window.confetti({
      particleCount: options.particleCount || 75,
      spread: options.spread || 70,
      origin: options.origin || { y: 0.6 },
      colors: options.colors || brandColors,
      disableForReducedMotion: true,
      ...options,
    });
  }
}

/**
 * Trigger a celebration burst (used for goals reaching 100% and major milestones).
 * Combines canvas-confetti with micro-particles.
 * @param {HTMLElement} [originElement=null]
 */
export function burstCelebration(originElement = null) {
  if (isReducedMotion()) return;

  let origin = { y: 0.5 };
  if (originElement) {
    const rect = originElement.getBoundingClientRect();
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  }

  fireConfetti({
    particleCount: 85,
    spread: 80,
    origin,
  });
}

/**
 * Attach 3D tilt interaction to `.paper-card` elements within rootElement.
 * Tilts smoothly based on mouse position; resets on mouseleave.
 * @param {HTMLElement} rootElement
 */
export function init3DTilt(rootElement) {
  if (!rootElement || isReducedMotion()) return;

  const cards = rootElement.querySelectorAll('.paper-card');
  cards.forEach((card) => {
    // Avoid double attaching
    if (card._hasTiltHandler) return;
    card._hasTiltHandler = true;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Max tilt degrees: +/- 4 degrees for subtle premium tactile feel
      const rotateX = ((centerY - y) / centerY) * 4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = '';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
  });
}
