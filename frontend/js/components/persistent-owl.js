/**
 * KYLRO — Persistent Interactive Owl Mascot Companion ("Professor Kly")
 * 
 * Purposeful, Natural & Context-Aware Movement System:
 * 1. Living character behavior with genuine awareness of user activity.
 * 2. Permanent resting corner perch; NO continuous cursor chasing.
 * 3. Proximity awareness: acknowledges cursor approaching within ~180px with subtle gaze & attentive perk.
 * 4. Context-based reactions to dashboard sections, Money Weather, transactions, and goals.
 * 5. Quick, light, fluid aerodynamic flights with banking and natural landing settle.
 * 6. Natural eyelid blinks (~5.2s) and occasional micro-idles; completely still otherwise (zero CPU waste).
 * 7. Finite State Machine (FSM): 'entering', 'resting', 'observing', 'reacting', 'flying', 'celebrating', 'interacting'.
 * 8. Zero-dependency Browser Web Speech API text-to-speech with persistent localStorage mute toggle.
 * 9. Respects prefers-reduced-motion and touch devices.
 */

import { renderMascot } from './mascot.js';
import { isReducedMotion } from '../utils/animate.js';
import { playLogoIntroAnimation } from './logo-intro.js';
import { store } from '../state.js';

export const OWL_STATES = {
  ENTERING: 'entering',
  RESTING: 'resting',
  OBSERVING: 'observing',
  REACTING: 'reacting',
  FLYING: 'flying',
  CELEBRATING: 'celebrating',
  INTERACTING: 'interacting',
};

// Speech Synthesis Voice Cache & Selection for Warm Indian English
let _cachedVoices = [];
function _refreshVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    _cachedVoices = window.speechSynthesis.getVoices() || [];
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  _refreshVoices();
  window.speechSynthesis.addEventListener('voiceschanged', _refreshVoices);
}

function getWarmCompanionVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = _cachedVoices.length > 0 ? _cachedVoices : (window.speechSynthesis.getVoices() || []);
  if (!voices || voices.length === 0) return null;

  // 1. Prefer warm en-IN female voice (Google or Microsoft en-IN female)
  const enInFemale = voices.find(v => {
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return lang === 'en-in' && (name.includes('female') || name.includes('heera') || name.includes('neerja') || name.includes('swara') || name.includes('google') || name.includes('natural'));
  });
  if (enInFemale) return enInFemale;

  // Fall back to any en-IN voice
  const anyEnIn = voices.find(v => (v.lang || '').replace('_', '-').toLowerCase() === 'en-in');
  if (anyEnIn) return anyEnIn;

  // 2. Fall back to any en-GB or en-US voice
  const enGbUs = voices.find(v => {
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    return lang === 'en-gb' || lang === 'en-us' || lang.startsWith('en-');
  });
  if (enGbUs) return enGbUs;

  // 3. Fall back to default
  return voices.find(v => v.default) || voices[0] || null;
}

class PersistentOwlCompanion {
  constructor() {
    this.container = null;
    this.sprite = null;
    this.speechBubble = null;
    this.state = OWL_STATES.RESTING;
    this.currentPose = 'resting';

    this.restingX = 0;
    this.restingY = 0;
    this.currentX = 0;
    this.currentY = 0;

    this.isTouch = false;
    this.isPanelOpen = false;
    this.isMuted = localStorage.getItem('klyro_owl_muted') === 'true';

    this._currentSpeechText = "Hi again! Let's take a quick look at your money.";
    this._speakTimeout = null;
    this._reactionTimeout = null;
    this._flightReturnTimeout = null;
    this._idleMicroTimer = null;
    this._proximityTimer = null;

    this._isCursorNear = false;
    this._lastSectionId = null;
    this._sectionObserver = null;
  }

  init() {
    if (document.getElementById('kylro-persistent-owl')) return;

    this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.updateRestingBounds();

    // Create companion container
    this.container = document.createElement('div');
    this.container.id = 'kylro-persistent-owl';
    this.container.className = 'fixed z-40 select-none pointer-events-none kly-state-resting';
    
    // Position initial state slightly offscreen bottom-right for graceful entry swoop
    const startX = this.restingX + 45;
    const startY = this.restingY + 45;
    this.currentX = this.restingX;
    this.currentY = this.restingY;

    this.container.style.left = '0px';
    this.container.style.top = '0px';
    this.container.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;

    this.container.innerHTML = `
      <div class="relative flex flex-col items-center">
        <!-- Floating Speech / Professor Clarity Caption Bubble -->
        <div id="owl-speech-bubble" class="opacity-0 transform translate-y-2 transition-all duration-300 pointer-events-auto mb-1 max-w-[230px] bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-[var(--border-subtle,#E6E1D6)] shadow-elevated text-left text-[11px] text-[#44403C] space-y-1.5 select-none">
          <div class="flex items-center justify-between gap-1.5 border-b border-[#F6F3EB] pb-1">
            <span class="font-serif font-bold text-[10px] text-[#1C1917] flex items-center gap-1">
              <span>🦉</span> <span>Professor Kly</span>
            </span>
            <div class="flex items-center gap-1 shrink-0">
              <button id="owl-bubble-audio-btn" class="p-1 rounded text-[11px] text-[#78716C] hover:text-[#1C1917] hover:bg-[#F6F3EB] cursor-pointer" title="${this.isMuted ? 'Voice is Muted (Click to Unmute & Listen)' : 'Click to Listen Aloud'}">
                ${this.isMuted ? '🔇' : '🔊'}
              </button>
              <button id="owl-bubble-close-btn" class="p-1 rounded text-[10px] text-[#78716C] hover:text-[#1C1917] hover:bg-[#F6F3EB] cursor-pointer" title="Dismiss caption">✕</button>
            </div>
          </div>
          <p id="owl-speech-text" class="leading-relaxed font-sans text-[11px] text-[#292524]">${this._currentSpeechText}</p>
        </div>

        <!-- Interactive Owl Sprite Container -->
        <div id="owl-sprite-actor" class="w-14 h-14 sm:w-16 sm:h-16 cursor-pointer pointer-events-auto filter drop-shadow-md hover:scale-105 active:scale-95 transition-transform" title="Meet Professor Kly! Click for financial advice, voice controls, and intro replay.">
          ${renderMascot('resting', 'w-14 h-14 sm:w-16 sm:h-16')}
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.sprite = this.container.querySelector('#owl-sprite-actor');
    this.speechBubble = this.container.querySelector('#owl-speech-bubble');

    // Speech bubble button event handlers
    const audioBtn = this.speechBubble.querySelector('#owl-bubble-audio-btn');
    audioBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isMuted) {
        this.toggleMute();
      }
      this.speakText(this._currentSpeechText);
    });

    const closeBubbleBtn = this.speechBubble.querySelector('#owl-bubble-close-btn');
    closeBubbleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismissSpeech();
    });

    // Click handler on owl opens companion panel with immediate tactile perk
    this.sprite.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleOwlClick();
    });

    // Window resize handler updates resting corner coordinates
    window.addEventListener('resize', () => {
      this.updateRestingBounds();
      if (this.state === OWL_STATES.RESTING) {
        this.currentX = this.restingX;
        this.currentY = this.restingY;
        this.container.style.transform = `translate3d(${this.restingX}px, ${this.restingY}px, 0)`;
      }
    });

    // Proximity awareness: Detect cursor approaching near the owl without chasing
    if (!this.isTouch && !isReducedMotion()) {
      window.addEventListener('mousemove', (e) => this.handleCursorProximity(e), { passive: true });
    }

    // Set up context awareness for dashboard sections and transactions
    this.setupContextObservers();

    // Perform purposeful initial flight into resting position
    requestAnimationFrame(() => {
      this.enterDashboard();
    });
  }

  updateRestingBounds() {
    const isMobile = window.innerWidth < 640;
    const padding = isMobile ? 18 : 26;
    const size = isMobile ? 56 : 64;
    this.restingX = Math.round(window.innerWidth - size - padding);
    this.restingY = Math.round(window.innerHeight - size - padding);
  }

  setState(newState) {
    if (this.state === newState) return;
    this.container?.classList.remove(
      `kly-state-${this.state}`,
      'kly-bank-left',
      'kly-bank-right',
      'kly-settle',
      'kly-gaze-left',
      'kly-gaze-right',
      'kly-gaze-up',
      'kly-spectacle-nudge'
    );
    this.state = newState;
    this.container?.classList.add(`kly-state-${newState}`);
  }

  setPose(pose) {
    if (this.currentPose === pose || !this.sprite) return;
    this.currentPose = pose;
    this.sprite.innerHTML = renderMascot(pose, 'w-14 h-14 sm:w-16 sm:h-16');
  }

  /**
   * Purpose 1: Dashboard Opens
   * Flies swiftly into designated resting perch, lands with settle bounce, and greets user.
   */
  enterDashboard() {
    if (isReducedMotion()) {
      this.currentX = this.restingX;
      this.currentY = this.restingY;
      this.container.style.transform = `translate3d(${this.restingX}px, ${this.restingY}px, 0)`;
      this.setState(OWL_STATES.RESTING);
      this.setPose('welcoming');
      return;
    }

    this.setState(OWL_STATES.FLYING);
    this.setPose('welcoming');

    setTimeout(() => {
      if (!this.container) return;
      this.container.classList.add('kly-bank-left');
      this.currentX = this.restingX;
      this.currentY = this.restingY;
      this.container.style.transform = `translate3d(${this.restingX}px, ${this.restingY}px, 0)`;

      // When flight arrives: settle naturally
      setTimeout(() => {
        this.container?.classList.remove('kly-bank-left');
        this.container?.classList.add('kly-settle');
        this.setState(OWL_STATES.RESTING);

        // Greet user
        this.speak("Hi again! Let's take a quick look at your money.", {
          pose: 'welcoming',
          duration: 3800,
          speakAloud: false, // Never play unprompted audio automatically on load
        });

        // After greeting, relax to calm resting perch and start idle cycle
        setTimeout(() => {
          this.container?.classList.remove('kly-settle');
          if (this.state === OWL_STATES.RESTING && !this.isPanelOpen) {
            this.setPose('resting');
            this.scheduleIdleMicroAction();
          }
        }, 4000);
      }, 380);
    }, 150);
  }

  /**
   * Purpose 2 & 3: Replace Continuous Cursor Chasing with Subtle Proximity Awareness
   * When cursor is within ~180px, owl turns towards it and looks attentively.
   * When cursor moves away, returns to peaceful resting after a brief moment.
   */
  handleCursorProximity(e) {
    if (this.state === OWL_STATES.FLYING || this.state === OWL_STATES.CELEBRATING || this.isPanelOpen) {
      return;
    }

    const owlCenterX = this.currentX + 32;
    const owlCenterY = this.currentY + 32;
    const dx = e.clientX - owlCenterX;
    const dy = e.clientY - owlCenterY;
    const distance = Math.hypot(dx, dy);

    // Near proximity threshold (< 180px)
    if (distance < 180) {
      if (!this._isCursorNear) {
        this._isCursorNear = true;
        clearTimeout(this._proximityTimer);

        if (this.state === OWL_STATES.RESTING) {
          this.setState(OWL_STATES.OBSERVING);
          this.setPose('encouraging');

          // Turn gaze towards cursor location
          if (dx < -20) {
            this.container?.classList.add('kly-gaze-left');
          } else if (dx > 20) {
            this.container?.classList.add('kly-gaze-right');
          }
          if (dy < -20) {
            this.container?.classList.add('kly-gaze-up');
          }
        }
      }
    } else if (distance > 230 && this._isCursorNear) {
      // Cursor moved away
      this._isCursorNear = false;
      clearTimeout(this._proximityTimer);
      this._proximityTimer = setTimeout(() => {
        if (this.state === OWL_STATES.OBSERVING && !this.isPanelOpen) {
          this.container?.classList.remove('kly-gaze-left', 'kly-gaze-right', 'kly-gaze-up');
          this.setState(OWL_STATES.RESTING);
          this.setPose('resting');
        }
      }, 1200);
    }
  }

  /**
   * Purpose 4: Dashboard Section Observation
   * Detects active section user is viewing and turns towards it.
   */
  setupContextObservers() {
    // Listen for transaction creations to give immediate acknowledging reaction
    store.subscribe('lastUpdated', () => {
      this.acknowledgeTransaction();
    });

    // Set up section intersection observer
    const observeSections = () => {
      const sectionSelectors = [
        '#money-weather-widget',
        '#dashboard-kpis',
        '#dashboard-charts',
        '#dashboard-budgets',
        '#dashboard-goals',
        '#dashboard-activity',
      ];

      if (this._sectionObserver) {
        this._sectionObserver.disconnect();
      }

      this._sectionObserver = new IntersectionObserver((entries) => {
        if (this.state === OWL_STATES.FLYING || this.state === OWL_STATES.CELEBRATING || this.isPanelOpen) {
          return;
        }

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            const sectionId = entry.target.id;
            if (sectionId !== this._lastSectionId) {
              this._lastSectionId = sectionId;
              this.reactToSection(sectionId);
            }
          }
        });
      }, { threshold: 0.4 });

      sectionSelectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) this._sectionObserver.observe(el);
      });
    };

    // Initialize observer when view mounts / hash changes
    window.addEventListener('hashchange', () => {
      setTimeout(observeSections, 400);
    });
    setTimeout(observeSections, 600);
  }

  /**
   * Purpose 5: Moving between sections / viewing Money Weather
   */
  reactToSection(sectionId) {
    if (this.state !== OWL_STATES.RESTING && this.state !== OWL_STATES.OBSERVING) return;

    this.setState(OWL_STATES.OBSERVING);
    this.container?.classList.add('kly-gaze-left');

    if (sectionId === 'money-weather-widget') {
      // Check actual weather status
      const weatherWidget = document.getElementById('money-weather-widget');
      const isTightening = weatherWidget?.classList.contains('weather-tightening');
      const isAtRisk = weatherWidget?.classList.contains('weather-at-risk');

      if (isAtRisk) {
        this.setPose('explaining');
      } else if (isTightening) {
        this.setPose('thinking');
        this.container?.classList.add('kly-spectacle-nudge');
      } else {
        this.setPose('encouraging');
      }
    } else if (sectionId === 'dashboard-goals') {
      this.setPose('encouraging');
    } else {
      this.setPose('thinking');
    }

    clearTimeout(this._reactionTimeout);
    this._reactionTimeout = setTimeout(() => {
      if (this.state === OWL_STATES.OBSERVING && !this.isPanelOpen) {
        this.container?.classList.remove('kly-gaze-left', 'kly-spectacle-nudge');
        this.setState(OWL_STATES.RESTING);
        this.setPose('resting');
      }
    }, 2200);
  }

  /**
   * Purpose 6: User Adds a Transaction
   * Brief acknowledging nod and reassurance, then settles.
   */
  acknowledgeTransaction(data = null) {
    if (this.state === OWL_STATES.FLYING || this.isPanelOpen) return;

    this.setState(OWL_STATES.REACTING);
    this.setPose('encouraging');
    let message = "Done! I've noted your spend.";
    if (data && data.amount !== undefined && data.category) {
      const formattedAmount = (typeof data.amount === 'number' ? Math.round(data.amount) : data.amount).toLocaleString('en-IN');
      message = `Done! I've noted ₹${formattedAmount} on ${data.category}.`;
    }
    this.speak(message, {
      pose: 'encouraging',
      duration: 3000,
      speakAloud: false,
    });

    clearTimeout(this._reactionTimeout);
    this._reactionTimeout = setTimeout(() => {
      this.returnToPerch();
    }, 2800);
  }

  /**
   * Purpose 7: User Completes an Achievement
   * Celebratory hop and wing flutter, then gracefully returns.
   */
  celebrateAchievement(customMessage = null) {
    if (this.isPanelOpen) return;

    const message = customMessage || "You did it! That's a big win.";
    this.setState(OWL_STATES.CELEBRATING);
    this.setPose('celebrating');
    this.speak(message, {
      pose: 'celebrating',
      duration: 4000,
      speakAloud: !this.isMuted,
    });

    clearTimeout(this._reactionTimeout);
    this._reactionTimeout = setTimeout(() => {
      this.returnToPerch();
    }, 3800);
  }

  /**
   * Purpose 8: Short Purposeful Flight to a Specific UI Element
   * Flies swiftly with aerodynamic bank, settles beside element, presents insight, then returns.
   */
  flyToElement(targetElOrSelector, { pose = 'explaining', text = null, returnAfterMs = 4500, speakAloud = false } = {}) {
    if (isReducedMotion()) {
      if (text) this.speak(text, { pose, duration: returnAfterMs, speakAloud });
      return;
    }

    const targetEl = typeof targetElOrSelector === 'string'
      ? document.querySelector(targetElOrSelector)
      : targetElOrSelector;

    if (!targetEl) {
      if (text) this.speak(text, { pose, duration: returnAfterMs, speakAloud });
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const owlSize = isMobile ? 56 : 64;

    // Position owl neatly adjacent to target without covering content (e.g. top right corner of card)
    const padding = 12;
    let targetX = rect.right - owlSize - padding;
    let targetY = rect.top - (owlSize / 2);

    // Clamp coordinates safely within viewport
    targetX = Math.min(window.innerWidth - owlSize - 16, Math.max(16, targetX));
    targetY = Math.min(window.innerHeight - owlSize - 16, Math.max(60, targetY));

    // Determine banking direction
    const isFlyingLeft = targetX < this.currentX;
    this.setState(OWL_STATES.FLYING);
    this.setPose(pose || 'encouraging');

    this.container?.classList.add(isFlyingLeft ? 'kly-bank-left' : 'kly-bank-right');
    this.currentX = targetX;
    this.currentY = targetY;
    this.container.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

    clearTimeout(this._flightReturnTimeout);

    // Settle on arrival
    setTimeout(() => {
      this.container?.classList.remove('kly-bank-left', 'kly-bank-right');
      this.container?.classList.add('kly-settle');
      this.setState(OWL_STATES.OBSERVING);
      this.setPose(pose);

      if (text) {
        this.speak(text, { pose, duration: returnAfterMs, speakAloud });
      }

      // Automatically return to permanent resting perch after purposeful visit
      this._flightReturnTimeout = setTimeout(() => {
        this.container?.classList.remove('kly-settle');
        this.returnToPerch();
      }, returnAfterMs);
    }, 360);
  }

  /**
   * Return swiftly to designated corner perch
   */
  returnToPerch() {
    if (this.currentX === this.restingX && this.currentY === this.restingY) {
      this.setState(OWL_STATES.RESTING);
      this.setPose('resting');
      return;
    }

    if (isReducedMotion()) {
      this.currentX = this.restingX;
      this.currentY = this.restingY;
      this.container.style.transform = `translate3d(${this.restingX}px, ${this.restingY}px, 0)`;
      this.setState(OWL_STATES.RESTING);
      this.setPose('resting');
      return;
    }

    this.setState(OWL_STATES.FLYING);
    const isFlyingRight = this.restingX > this.currentX;
    this.container?.classList.add(isFlyingRight ? 'kly-bank-right' : 'kly-bank-left');

    this.currentX = this.restingX;
    this.currentY = this.restingY;
    this.container.style.transform = `translate3d(${this.restingX}px, ${this.restingY}px, 0)`;

    setTimeout(() => {
      this.container?.classList.remove('kly-bank-left', 'kly-bank-right');
      this.container?.classList.add('kly-settle');
      this.setState(OWL_STATES.RESTING);
      this.setPose('resting');

      setTimeout(() => {
        this.container?.classList.remove('kly-settle');
      }, 420);
    }, 380);
  }

  /**
   * Purpose 9: Idle Application Behavior
   * Subtle micro-looks and shifts every ~12s while perched; completely calm otherwise.
   */
  scheduleIdleMicroAction() {
    clearTimeout(this._idleMicroTimer);
    this._idleMicroTimer = setTimeout(() => {
      if (this.state === OWL_STATES.RESTING && !this.isPanelOpen && !this._isCursorNear) {
        // Subtle micro-head turn
        this.container?.classList.add('kly-gaze-left');
        setTimeout(() => {
          this.container?.classList.remove('kly-gaze-left');
          this.scheduleIdleMicroAction();
        }, 1100);
      } else {
        this.scheduleIdleMicroAction();
      }
    }, 12000 + Math.random() * 4000);
  }

  /**
   * Purpose 10: User Clicks the Owl
   * Immediate tactile perk animation, then opens assistant panel.
   */
  handleOwlClick() {
    if (this.isPanelOpen) {
      this.toggleAssistantPanel();
      return;
    }

    // Quick responsive perk
    this.sprite?.classList.add('scale-110');
    this.setPose('welcoming');
    setTimeout(() => {
      this.sprite?.classList.remove('scale-110');
      this.toggleAssistantPanel();
    }, 150);
  }

  speak(text, { pose = null, duration = 4500, speakAloud = false } = {}) {
    if (!this.speechBubble) return;
    this._currentSpeechText = text;

    if (pose) this.setPose(pose);

    const textEl = this.speechBubble.querySelector('#owl-speech-text');
    if (textEl) textEl.textContent = text;

    this.speechBubble.classList.remove('opacity-0', 'translate-y-2');
    this.speechBubble.classList.add('opacity-100', 'translate-y-0');

    if (speakAloud && !this.isMuted) {
      this.speakText(text);
    }

    clearTimeout(this._speakTimeout);
    this._speakTimeout = setTimeout(() => {
      this.dismissSpeech();
    }, duration);
  }

  dismissSpeech() {
    if (!this.speechBubble) return;
    this.speechBubble.classList.remove('opacity-100', 'translate-y-0');
    this.speechBubble.classList.add('opacity-0', 'translate-y-2');
  }

  speakText(text) {
    if (this.isMuted) return;
    if (!('speechSynthesis' in window)) {
      console.info('[Professor Kly] Web Speech API not supported on this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[₹•~—]/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      const warmVoice = getWarmCompanionVoice();
      if (warmVoice) {
        utterance.voice = warmVoice;
        utterance.lang = warmVoice.lang;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[Professor Kly Voice] Speech synthesis notice:', err);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('klyro_owl_muted', this.isMuted ? 'true' : 'false');

    if (this.isMuted && ('speechSynthesis' in window)) {
      window.speechSynthesis.cancel();
    }

    this.updateMuteUI();
    return this.isMuted;
  }

  updateMuteUI() {
    const bubbleAudioBtn = this.speechBubble?.querySelector('#owl-bubble-audio-btn');
    if (bubbleAudioBtn) {
      bubbleAudioBtn.textContent = this.isMuted ? '🔇' : '🔊';
      bubbleAudioBtn.setAttribute('title', this.isMuted ? 'Voice is Muted (Click to Unmute & Listen)' : 'Click to Listen Aloud');
    }

    const panelVoiceStatus = document.getElementById('companion-voice-status-text');
    const panelVoiceSub = document.getElementById('companion-voice-subtext');
    if (panelVoiceStatus) {
      panelVoiceStatus.textContent = this.isMuted ? '🔇 Voice: Muted' : '🔊 Voice: Active';
    }
    if (panelVoiceSub) {
      panelVoiceSub.textContent = this.isMuted ? 'Click to Unmute' : 'Click to Mute';
    }
  }

  getRandomAdvice() {
    const tips = [
      "Hi again! Let's take a quick look at your money.",
      "Check your Safe-to-Spend before shopping so you know what is free to use.",
      "All your bills are covered for now. Great job keeping things on track!",
      "Saving a little bit each week really adds up over time. Keep going!",
      "Nice work checking in! Staying on top of everyday spends helps you save.",
      "Planning your spending helps you buy things you truly care about.",
      "Nothing here yet. Add your first spend and I'll keep track for you.",
      "KYLRO is here to give you clarity you can act on every day."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  toggleAssistantPanel() {
    let panel = document.getElementById('kylro-companion-panel');
    if (panel) {
      panel.remove();
      this.isPanelOpen = false;
      this.returnToPerch();
      return;
    }

    this.isPanelOpen = true;
    this.setState(OWL_STATES.INTERACTING);
    this.setPose('thinking');

    const advice = this.getRandomAdvice();

    panel = document.createElement('div');
    panel.id = 'kylro-companion-panel';
    panel.className = 'fixed bottom-24 right-5 sm:right-8 z-50 w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-[var(--border-subtle,#E6E1D6)] shadow-elevated p-4 text-xs space-y-3';
    
    panel.innerHTML = `
      <div class="flex items-center justify-between border-b border-[#E6E1D6] pb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 flex items-center justify-center shrink-0">
            ${renderMascot('explaining', 'w-8 h-8')}
          </div>
          <div>
            <h5 class="font-serif font-bold text-[#1C1917] flex items-center gap-1.5">
              <span>Professor Kly</span>
              <span class="badge badge-sage text-[9px]">Guide</span>
            </h5>
            <p class="text-[10px] text-[#78716C]">Clarity you can act on.</p>
          </div>
        </div>
        <button id="close-owl-panel-btn" class="text-[#78716C] hover:text-[#1C1917] p-1 rounded hover:bg-[#F6F3EB] cursor-pointer">✕</button>
      </div>

      <div class="space-y-2 text-[#44403C] leading-relaxed">
        <div id="companion-advice-card" class="p-2.5 rounded-xl bg-[#FBF9F5] border border-[var(--border-subtle,#E6E1D6)] space-y-1">
          <p class="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider flex items-center gap-1">
            <span>🦉</span> <span>Professor's Observation</span>
          </p>
          <p id="companion-advice-text" class="text-[11px] text-[#1C1917] italic leading-snug">
            "${advice}"
          </p>
        </div>
      </div>

      <div class="pt-2 border-t border-[#E6E1D6] space-y-2">
        <button id="companion-speak-advice-btn" class="btn btn-secondary text-xs w-full flex items-center justify-between py-1.5 cursor-pointer">
          <span>💬 Consult Professor Kly</span>
          <span class="text-[10px] text-[#D45644] font-medium">New Insight →</span>
        </button>

        <button id="companion-voice-toggle-btn" class="btn btn-secondary text-xs w-full flex items-center justify-between py-1.5 cursor-pointer">
          <span id="companion-voice-status-text">${this.isMuted ? '🔇 Voice: Muted' : '🔊 Voice: Active'}</span>
          <span id="companion-voice-subtext" class="text-[10px] text-[#78716C]">${this.isMuted ? 'Click to Unmute' : 'Click to Mute'}</span>
        </button>

        <button id="companion-replay-intro-btn" class="btn btn-secondary text-xs w-full flex items-center justify-center gap-1.5 py-1.5 cursor-pointer">
          <span>▶ Watch KYLRO Logo Intro</span>
        </button>

        <button id="companion-record-tx-btn" class="btn btn-coral text-xs w-full flex items-center justify-center gap-1.5 py-1.5 cursor-pointer">
          <span>+ Record Transaction (Q)</span>
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector('#close-owl-panel-btn')?.addEventListener('click', () => {
      panel.remove();
      this.isPanelOpen = false;
      this.returnToPerch();
    });

    panel.querySelector('#companion-speak-advice-btn')?.addEventListener('click', () => {
      const newAdvice = this.getRandomAdvice();
      const textEl = panel.querySelector('#companion-advice-text');
      if (textEl) textEl.textContent = `"${newAdvice}"`;
      this.speak(newAdvice, { pose: 'explaining', duration: 5000, speakAloud: true });
    });

    panel.querySelector('#companion-voice-toggle-btn')?.addEventListener('click', () => {
      this.toggleMute();
    });

    panel.querySelector('#companion-replay-intro-btn')?.addEventListener('click', () => {
      panel.remove();
      this.isPanelOpen = false;
      playLogoIntroAnimation({ force: true });
    });

    panel.querySelector('#companion-record-tx-btn')?.addEventListener('click', () => {
      panel.remove();
      this.isPanelOpen = false;
      document.getElementById('quick-capture-btn')?.click();
    });

    // Close on outside click
    const outsideListener = (e) => {
      if (!panel.contains(e.target) && e.target !== this.sprite) {
        panel.remove();
        this.isPanelOpen = false;
        this.returnToPerch();
        document.removeEventListener('click', outsideListener);
      }
    };
    setTimeout(() => document.addEventListener('click', outsideListener), 50);
  }
}

export const persistentOwl = new PersistentOwlCompanion();
