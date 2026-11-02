/**
 * KYLRO — Original Owl Mascot Component ("Kly")
 * 
 * Distinctive Visual Identity & Character:
 * - Friendly, intelligent, slightly eccentric financial professor persona.
 * - Signature rebellious feather spike/tuft at the crown of the head.
 * - Distinctive round clarity spectacles with bridge, rims, and temple stems.
 * - Charming tiny feathered professor beard beneath the beak.
 * - Elegant golden bowtie accessory at the collar.
 * - Expressive eyebrows tailored to each canonical pose.
 * - Geometric oval/prism body with warm terracotta-coral crest and calm amber glow.
 * 
 * 6 Canonical contextual expressions/poses:
 *   1. 'welcoming'  : friendly wave, bright open eyes, warm inviting smile.
 *   2. 'thinking'   : curious tilted head, quizzical raised brow, glasses adjusted, contemplation spark.
 *   3. 'celebrating': joyous leap, starry happy eyes, arms raised with confetti spark.
 *   4. 'encouraging': gentle nod, thumbs-up wing gesture, supportive warm glow.
 *   5. 'explaining' : holding an editorial financial ledger with professorial clarity.
 *   6. 'resting'    : sleepy calm curved eyes, folded cozy wings, perched peacefully.
 */

export function renderMascot(pose = 'welcoming', size = 'w-16 h-16', customClass = '') {
  const normPose = String(pose || 'welcoming').toLowerCase().trim();

  let eyePupils = '';
  let eyebrows = '';
  let spectacles = '';
  let beakAndMouth = '';
  let wingsAndArms = '';
  let extras = '';

  // Default round spectacles
  const defaultSpectacles = `
    <!-- Distinctive Round Spectacles (Frames, Bridge & Temple Stems) -->
    <g class="kly-spectacles">
      <!-- Temple Stems -->
      <line x1="21.5" y1="38" x2="18.5" y2="37" stroke="#1C1917" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="60.5" y1="38" x2="63.5" y2="37" stroke="#1C1917" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Connecting Nose Bridge -->
      <path d="M38.5 37 Q41 34.5 43.5 37" stroke="#1C1917" stroke-width="2" fill="none"/>
      <!-- Left Round Lens Rim -->
      <circle cx="31" cy="38" r="9.5" fill="url(#klyGlassGrad_${normPose})" stroke="#1C1917" stroke-width="2"/>
      <circle cx="28" cy="35" r="2.5" fill="#FFFFFF" opacity="0.6"/>
      <!-- Right Round Lens Rim -->
      <circle cx="51" cy="38" r="9.5" fill="url(#klyGlassGrad_${normPose})" stroke="#1C1917" stroke-width="2"/>
      <circle cx="48" cy="35" r="2.5" fill="#FFFFFF" opacity="0.6"/>
    </g>
  `;

  spectacles = defaultSpectacles;

  switch (normPose) {
    case 'resting':
      // Calm sleepy curved eyes, soft resting brows, folded cozy wings, gentle zzz
      eyebrows = `
        <path d="M24 29 Q31 27.5 38 29.5" stroke="#78716C" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <path d="M44 29.5 Q51 27.5 58 29" stroke="#78716C" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      `;
      eyePupils = `
        <!-- Calm Happy Closed Eyes -->
        <path d="M26 39 Q31 43 36 39" stroke="#1C1917" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M46 39 Q51 43 56 39" stroke="#1C1917" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
      beakAndMouth = `
        <polygon points="41,41 44,45 38,45" fill="#D97706"/>
        <path d="M39 48 Q41 50 43 48" stroke="#78716C" stroke-width="1.2" stroke-linecap="round" fill="none"/>
      `;
      wingsAndArms = `
        <!-- Cozy Folded Wings -->
        <path class="kly-wing kly-wing-left" d="M22 45 C19 51 22 58 26 59" stroke="#BD4534" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path class="kly-wing kly-wing-right" d="M60 45 C63 51 60 58 56 59" stroke="#BD4534" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      extras = `
        <!-- Subtle Floating Z -->
        <g class="animate-pulse" opacity="0.6">
          <text x="63" y="24" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#D97706">z</text>
          <text x="69" y="16" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="bold" fill="#D45644">z</text>
        </g>
      `;
      break;

    case 'thinking':
      // Curious tilted glance upwards, quizzical brows (left furrowed, right raised high)
      eyebrows = `
        <path d="M24 29.5 Q31 28.5 38 30.5" stroke="#1C1917" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <path d="M44 24.5 Q51 18.5 59 23.5" stroke="#1C1917" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      `;
      // Adjusted tilted spectacles for thinking pose
      spectacles = `
        <g class="kly-spectacles transform rotate-[-3deg] origin-[41px_38px]">
          <line x1="21.5" y1="39" x2="18.5" y2="38.5" stroke="#1C1917" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="60.5" y1="37" x2="63.5" y2="35.5" stroke="#1C1917" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M38.5 37.5 Q41 35 43.5 37" stroke="#1C1917" stroke-width="2" fill="none"/>
          <circle cx="31" cy="39" r="9.5" fill="url(#klyGlassGrad_${normPose})" stroke="#1C1917" stroke-width="2"/>
          <circle cx="28" cy="36" r="2.5" fill="#FFFFFF" opacity="0.6"/>
          <circle cx="51" cy="37" r="9.5" fill="url(#klyGlassGrad_${normPose})" stroke="#1C1917" stroke-width="2"/>
          <circle cx="48" cy="34" r="2.5" fill="#FFFFFF" opacity="0.6"/>
        </g>
      `;
      eyePupils = `
        <ellipse cx="33" cy="35" rx="3" ry="4" fill="#1C1917"/>
        <ellipse cx="53" cy="33" rx="3" ry="4" fill="#1C1917"/>
        <circle cx="34" cy="33" r="1.5" fill="#FAF8F5"/>
        <circle cx="54" cy="31" r="1.5" fill="#FAF8F5"/>
      `;
      beakAndMouth = `
        <polygon points="42,39 45,44 39,44" fill="#D97706"/>
        <path d="M40 46 Q43 45 46 47" stroke="#78716C" stroke-width="1.2" stroke-linecap="round" fill="none"/>
      `;
      wingsAndArms = `
        <!-- Left Wing Resting, Right Wing Tapping Chin/Beard in Contemplation -->
        <path class="kly-wing kly-wing-left" d="M22 45 C20 52 23 58 26 59" stroke="#BD4534" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path class="kly-wing kly-wing-right" d="M60 46 C62 50 54 53 45 50" stroke="#BD4534" stroke-width="3.2" stroke-linecap="round" fill="none"/>
      `;
      extras = `
        <g class="animate-pulse" opacity="0.85">
          <path d="M62 18 L64 22 L68 23 L64 24 L62 28 L60 24 L56 23 L60 22 Z" fill="#D97706"/>
        </g>
      `;
      break;

    case 'celebrating':
      // Starry eyes, raised wings, joyful celebratory spark, high elated arched brows
      eyebrows = `
        <path d="M23 23.5 Q30 18.5 37 22.5" stroke="#1C1917" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <path d="M45 22.5 Q52 18.5 59 23.5" stroke="#1C1917" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      `;
      eyePupils = `
        <path d="M31 35 L33 39 L37 40 L33 41 L31 45 L29 41 L25 40 L29 39 Z" fill="#2D7A58"/>
        <path d="M51 35 L53 39 L57 40 L53 41 L51 45 L49 41 L45 40 L49 39 Z" fill="#2D7A58"/>
      `;
      beakAndMouth = `
        <polygon points="41,40 44,45 38,45" fill="#D97706"/>
        <path d="M37 47 Q41 52 45 47" stroke="#1C1917" stroke-width="1.8" stroke-linecap="round" fill="#FEF2F2"/>
      `;
      wingsAndArms = `
        <path class="kly-wing kly-wing-left" d="M23 44 C16 35 18 28 22 24" stroke="#BD4534" stroke-width="3.5" stroke-linecap="round" fill="none" class="animate-bounce"/>
        <path class="kly-wing kly-wing-right" d="M59 44 C66 35 64 28 60 24" stroke="#BD4534" stroke-width="3.5" stroke-linecap="round" fill="none" class="animate-bounce"/>
      `;
      extras = `
        <circle cx="18" cy="18" r="2" fill="#D45644" class="animate-ping" style="animation-duration: 1.5s;"/>
        <circle cx="66" cy="16" r="2.5" fill="#D97706" class="animate-ping" style="animation-duration: 1.8s;"/>
        <circle cx="41" cy="9" r="1.5" fill="#2D7A58"/>
      `;
      break;

    case 'encouraging':
      // Confident friendly smile, supportive thumbs-up wing, approving warm brows
      eyebrows = `
        <path d="M24 26 Q31 22 38 26" stroke="#1C1917" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M44 26 Q51 22 58 26" stroke="#1C1917" stroke-width="2" stroke-linecap="round" fill="none"/>
      `;
      eyePupils = `
        <ellipse cx="32" cy="38" rx="3.5" ry="4" fill="#1C1917"/>
        <ellipse cx="50" cy="38" rx="3.5" ry="4" fill="#1C1917"/>
        <circle cx="34" cy="36" r="1.5" fill="#FAF8F5"/>
        <circle cx="52" cy="36" r="1.5" fill="#FAF8F5"/>
      `;
      beakAndMouth = `
        <polygon points="41,40 44,45 38,45" fill="#D97706"/>
        <path d="M38 48 Q41 51 44 48" stroke="#1C1917" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      `;
      wingsAndArms = `
        <path class="kly-wing kly-wing-left" d="M23 45 C19 50 20 56 24 58" stroke="#BD4534" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path class="kly-wing kly-wing-right" d="M59 45 C64 43 65 37 63 34" stroke="#BD4534" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <circle cx="63" cy="32" r="2" fill="#D97706"/>
      `;
      extras = `
        <circle cx="41" cy="42" r="32" fill="#FEF3C7" opacity="0.35" class="animate-pulse"/>
      `;
      break;

    case 'explaining':
      // Holding editorial ledger card or pointing forward with clarity, professorial brow
      eyebrows = `
        <path d="M24 26.5 Q31 23.5 38 26.5" stroke="#1C1917" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M44 26.5 Q51 23.5 58 26.5" stroke="#1C1917" stroke-width="2" stroke-linecap="round" fill="none"/>
      `;
      eyePupils = `
        <ellipse cx="31" cy="37" rx="3.5" ry="4" fill="#1C1917"/>
        <ellipse cx="49" cy="37" rx="3.5" ry="4" fill="#1C1917"/>
        <circle cx="33" cy="35" r="1.5" fill="#FAF8F5"/>
        <circle cx="51" cy="35" r="1.5" fill="#FAF8F5"/>
      `;
      beakAndMouth = `
        <polygon points="40,39 43,44 37,44" fill="#D97706"/>
        <path d="M37 47 Q40 50 43 47" stroke="#1C1917" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      `;
      wingsAndArms = `
        <path class="kly-wing kly-wing-left" d="M22 45 C16 48 18 55 24 58" stroke="#BD4534" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path class="kly-wing kly-wing-right" d="M59 45 C67 43 68 40 70 38" stroke="#BD4534" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      `;
      extras = `
        <g transform="translate(14, 46) rotate(-10)">
          <rect width="13" height="16" rx="2" fill="#FFFFFF" stroke="#1C1917" stroke-width="1"/>
          <line x1="3" y1="4" x2="10" y2="4" stroke="#2D7A58" stroke-width="1"/>
          <line x1="3" y1="8" x2="8" y2="8" stroke="#D45644" stroke-width="1"/>
          <line x1="3" y1="12" x2="10" y2="12" stroke="#D97706" stroke-width="1"/>
        </g>
      `;
      break;

    case 'welcoming':
    default:
      // Default: Friendly wave, bright eyes, approachable warm smile
      eyebrows = `
        <path d="M23 27 Q31 23 38 27" stroke="#1C1917" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M44 27 Q51 23 59 27" stroke="#1C1917" stroke-width="2" stroke-linecap="round" fill="none"/>
      `;
      eyePupils = `
        <ellipse cx="32" cy="38" rx="3.5" ry="4" fill="#1C1917"/>
        <ellipse cx="50" cy="38" rx="3.5" ry="4" fill="#1C1917"/>
        <circle cx="34" cy="36" r="1.5" fill="#FAF8F5"/>
        <circle cx="52" cy="36" r="1.5" fill="#FAF8F5"/>
      `;
      beakAndMouth = `
        <polygon points="41,40 44,45 38,45" fill="#D97706"/>
        <path d="M38 48 Q41 51 44 48" stroke="#1C1917" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      `;
      wingsAndArms = `
        <path class="kly-wing kly-wing-left" d="M23 45 C19 50 20 57 24 59" stroke="#BD4534" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path class="kly-wing kly-wing-right" d="M59 45 C66 40 67 33 63 28" stroke="#BD4534" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="63" cy="28" r="2.5" fill="#D45644"/>
      `;
      extras = '';
      break;
  }

  return `
    <div class="klyro-mascot-wrapper ${size} ${customClass} relative inline-flex items-center justify-center select-none" data-mascot-pose="${normPose}" aria-label="Kly, the KYLRO financial guide (${normPose})">
      <svg viewBox="0 0 82 82" fill="none" class="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="klyBodyGrad_${normPose}" x1="20" y1="15" x2="62" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#E87361"/>
            <stop offset="60%" stop-color="#D45644"/>
            <stop offset="100%" stop-color="#B84A39"/>
          </linearGradient>

          <linearGradient id="klyBellyGrad_${normPose}" x1="41" y1="48" x2="41" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FAF8F5"/>
            <stop offset="100%" stop-color="#F2EDE4"/>
          </linearGradient>

          <linearGradient id="klyGlassGrad_${normPose}" x1="25" y1="26" x2="57" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#F3EFE6" stop-opacity="0.75"/>
          </linearGradient>

          <linearGradient id="klyGoldGrad_${normPose}" x1="35" y1="49" x2="47" y2="57" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FBBF24"/>
            <stop offset="60%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#D97706"/>
          </linearGradient>
        </defs>

        ${extras}

        <!-- Feet / Perch Claws -->
        <ellipse cx="34" cy="71" rx="4.5" ry="2.5" fill="#D97706"/>
        <ellipse cx="48" cy="71" rx="4.5" ry="2.5" fill="#D97706"/>

        <!-- Main Body: Elegant Rounded Prism / Teardrop Form -->
        <path d="M41 14 C26 14 20 28 20 45 C20 62 28 70 41 70 C54 70 62 62 62 45 C62 28 56 14 41 14 Z" 
              fill="url(#klyBodyGrad_${normPose})" 
              stroke="#1C1917" 
              stroke-width="2" 
              stroke-linejoin="round"/>

        <!-- Distinctive Stylized Ear Tufts / Feather Crests -->
        <path d="M28 17 C24 10 22 7 19 6 C20 12 24 16 26 19" fill="#B84A39" stroke="#1C1917" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M54 17 C58 10 60 7 63 6 C62 12 58 16 56 19" fill="#B84A39" stroke="#1C1917" stroke-width="1.5" stroke-linejoin="round"/>

        <!-- Signature Rebellious Feather Spike / Tuft at Crown -->
        <g class="kly-rebel-tuft">
          <!-- Main Left-leaning Rebel Plume -->
          <path d="M40 14 C38 8 33 4 30 2 C35 5 38 9 40 14 Z" fill="#D45644" stroke="#1C1917" stroke-width="1.3" stroke-linejoin="round"/>
          <!-- Taller Center Spike Plume -->
          <path d="M41 14 C41 6 43 2 46 0.5 C45 5 44 9 42 14 Z" fill="#B84A39" stroke="#1C1917" stroke-width="1.3" stroke-linejoin="round"/>
          <!-- Small Accent Feather Flick -->
          <path d="M38 14 C35 9 32 7 28 6 C32 8 36 11 38 14 Z" fill="#E87361" stroke="#1C1917" stroke-width="1" stroke-linejoin="round"/>
        </g>

        <!-- Soft Lower Belly Patch with Subtle Ledger Calibration Ticks -->
        <ellipse cx="41" cy="62" rx="13" ry="8" fill="url(#klyBellyGrad_${normPose})" stroke="#E6E1D6" stroke-width="1"/>
        <line x1="38" y1="60" x2="44" y2="60" stroke="#D5CEBF" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="36" y1="63" x2="46" y2="63" stroke="#D5CEBF" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="39" y1="66" x2="43" y2="66" stroke="#D5CEBF" stroke-width="1.5" stroke-linecap="round"/>

        <!-- Expressive Eyebrows, Spectacles, Eyes, Beak and Beard in Head/Face Group -->
        <g class="kly-head-face">
          <!-- Expressive Eyebrows -->
          ${eyebrows}

          <!-- Distinctive Round Spectacles (Lenses, Rims, Bridge & Temple Stems) -->
          ${spectacles}

          <!-- Dynamic Expressive Eye Pupils with Natural Blinking -->
          <g class="kly-eyes">
            ${eyePupils}
          </g>

          <!-- Beak Expression -->
          ${beakAndMouth}

          <!-- Signature Charming Feather Beard (Stylized Professor Tuft) -->
          <g class="kly-feather-beard">
            <path d="M38 45 C37 49 35 52 38 54 C40 52 40 50 41 50 C42 50 42 52 44 54 C47 52 45 49 44 45 Z" 
                  fill="#FAF8F5" 
                  stroke="#D5CEBF" 
                  stroke-width="1" 
                  stroke-linejoin="round"/>
            <path d="M40 47 L41 51 L42 47" stroke="#E6E1D6" stroke-width="1" stroke-linecap="round"/>
          </g>
        </g>

        <!-- Signature Golden Professor Bow Tie Accessory -->
        <g class="kly-golden-bowtie">
          <!-- Left Ribbon Wing -->
          <polygon points="41,53 35,49 35,57" fill="url(#klyGoldGrad_${normPose})" stroke="#1C1917" stroke-width="1" stroke-linejoin="round"/>
          <!-- Right Ribbon Wing -->
          <polygon points="41,53 47,49 47,57" fill="url(#klyGoldGrad_${normPose})" stroke="#1C1917" stroke-width="1" stroke-linejoin="round"/>
          <!-- Golden Center Knot -->
          <circle cx="41" cy="53" r="2.2" fill="#D97706" stroke="#1C1917" stroke-width="0.9"/>
          <!-- Subtle Golden Sheen Spark -->
          <circle cx="40.3" cy="52.3" r="0.7" fill="#FEF3C7"/>
        </g>

        <!-- Expressive Wings / Pose Gesture -->
        ${wingsAndArms}

        <!-- Forehead Gem: Clarity Amber Dot -->
        <circle cx="41" cy="22" r="2" fill="#D97706" stroke="#1C1917" stroke-width="1"/>
      </svg>
    </div>
  `;
}
