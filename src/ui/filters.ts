// ============================================================================
// OMNILAB SCIENCE PROJECTS - SEARCH, FILTER & CARD GRID CONTROLLER
// Manages instant search, board badges, category chips, sort, and bookmarks.
// ============================================================================

import { ScienceProject, FilterState } from '../types.ts';
import { openProjectModal } from './modal.ts';

export const CATEGORIES = [
  'All Categories',
  'Environmental & Weather',
  'Physics & Acoustics',
  'Robotics & Automation',
  'Space & Energy'
];

export function getProjectCoverImage(projectOrId: ScienceProject | string): string {
  const id = typeof projectOrId === 'string' ? projectOrId : (projectOrId?.id || '');

  // 1. Direct standard static photography mapping
  const standardIds = [
    'diy-digital-watch',
    'drone-esp32-s3-mini',
    'electronic-drumset-7-piezo-python-esp32',
    'face-recognition-esp32-cam',
    'flight-simulator-mpu6050',
    'music-player-dfplayer-i2s',
    'obstacle-avoiding-robot-car',
    'reverse-car-parking-sensor',
    'rfid-smart-access-system',
    'soil-moisture-auto-watering',
    'ultrasonic-radar-system',
    'under-voltage-protection-system'
  ];

  if (standardIds.includes(id)) {
    return `assets/projects/${id}.jpg`;
  }

  // 2. Intelligent semantic fallback for AI-generated and custom hardware builds
  let text = id.toLowerCase();
  if (typeof projectOrId === 'object' && projectOrId) {
    text += ' ' + (projectOrId.title || '') + ' ' +
            (projectOrId.shortDesc || '') + ' ' +
            (projectOrId.tags ? projectOrId.tags.join(' ') : '') + ' ' +
            (projectOrId.category || '') + ' ' +
            (projectOrId.components ? projectOrId.components.map(c => c.name).join(' ') : '');
    text = text.toLowerCase();
  }

  // A. Drone / Flight / Quadcopter / Aviation / UAV
  if (text.includes('drone') || text.includes('quadcopter') || text.includes('flight') || text.includes('propeller') || text.includes('aerial') || text.includes('uav')) {
    return 'assets/projects/drone-esp32-s3-mini.jpg';
  }

  // B. Robot rover / car / vehicle / steering / balancing / follower / wheels / locomotion
  if (text.includes('car') || text.includes('rover') || text.includes('robot car') || text.includes('vehicle') || text.includes('follower') || text.includes('obstacle') || text.includes('balancing') || text.includes('differential') || text.includes('wheels')) {
    return 'assets/projects/obstacle-avoiding-robot-car.jpg';
  }

  // C. Voice assistant / Alexa / Companion / Emotion / Robot / Face / Camera / Vision / Eyes
  if (text.includes('voice') || text.includes('alexa') || text.includes('assistant') || text.includes('face') || text.includes('vision') || text.includes('camera') || text.includes('emotion') || text.includes('companion') || text.includes('iris') || text.includes('nemo') || text.includes('desk robot') || text.includes('pan-tilt') || text.includes('head')) {
    return 'assets/projects/face-recognition-esp32-cam.jpg';
  }

  // D. Radar / Sonar / Ultrasonic distance / detection
  if (text.includes('radar') || text.includes('sonar') || text.includes('ultrasonic') || text.includes('rangefinder') || text.includes('echolocation') || text.includes('hc-sr04')) {
    return 'assets/projects/ultrasonic-radar-system.jpg';
  }

  // E. Plant / Soil / Watering / Pump / Greenhouse / Agriculture / Hydroponics
  if (text.includes('soil') || text.includes('plant') || text.includes('water') || text.includes('pump') || text.includes('irrigation') || text.includes('greenhouse') || text.includes('garden') || text.includes('moisture') || text.includes('agriculture')) {
    return 'assets/projects/soil-moisture-auto-watering.jpg';
  }

  // F. Audio / Music / Sound / Speaker / DFPlayer / MP3 / Piezo Drum
  if (text.includes('drum') || text.includes('velocity') || text.includes('percussion') || text.includes('beat')) {
    return 'assets/projects/electronic-drumset-7-piezo-python-esp32.jpg';
  }
  if (text.includes('music') || text.includes('audio') || text.includes('speaker') || text.includes('sound') || text.includes('dfplayer') || text.includes('melody') || text.includes('i2s')) {
    return 'assets/projects/music-player-dfplayer-i2s.jpg';
  }

  // G. IMU / Gyro / Accelerometer / Gesture / Flight simulator / Attitude / Tilt
  if (text.includes('imu') || text.includes('mpu') || text.includes('gyro') || text.includes('accelerometer') || text.includes('gesture') || text.includes('joystick') || text.includes('tilt')) {
    return 'assets/projects/flight-simulator-mpu6050.jpg';
  }

  // H. RFID / Access / Smart Door / Security / Keypad / NFC / Badge
  if (text.includes('rfid') || text.includes('rc522') || text.includes('access') || text.includes('security') || text.includes('door') || text.includes('keycard') || text.includes('nfc') || text.includes('lock')) {
    return 'assets/projects/rfid-smart-access-system.jpg';
  }

  // I. Parking / Dustbin / Contactless / Proximity / Waste
  if (text.includes('parking') || text.includes('reverse') || text.includes('dustbin') || text.includes('trash') || text.includes('contactless') || text.includes('bin') || text.includes('sanitation')) {
    return 'assets/projects/reverse-car-parking-sensor.jpg';
  }

  // J. Solar tracker / Heliostat / Voltage / Battery / Protection / Power / Solar Panel
  if (text.includes('solar') || text.includes('voltage') || text.includes('heliodon') || text.includes('battery') || text.includes('power') || text.includes('tracker') || text.includes('protection') || text.includes('current') || text.includes('ldr')) {
    return 'assets/projects/under-voltage-protection-system.jpg';
  }

  // K. Watch / Clock / RTC / Wearable / Display / Chrono
  if (text.includes('watch') || text.includes('clock') || text.includes('time') || text.includes('rtc') || text.includes('ds3231') || text.includes('wearable') || text.includes('timer')) {
    return 'assets/projects/diy-digital-watch.jpg';
  }

  // Default fallback for general robotics & embedded builds
  return 'assets/projects/face-recognition-esp32-cam.jpg';
}

export function getHardwareHighlights(p: ScienceProject): string[] {
  const highlights: string[] = [];
  const compNames = (p.components || []).map(c => c.name);
  const modNames = (p.circuitDiagram?.modules || []).map(m => m.name);
  const allNames = [...compNames, ...modNames];

  for (const name of allNames) {
    const n = name.toLowerCase();
    if (n.includes('oled') && !highlights.includes('0.96" OLED')) highlights.push('0.96" OLED');
    else if (n.includes('lcd') && !highlights.includes('1602 LCD')) highlights.push('1602 LCD');
    else if ((n.includes('sg90') || n.includes('servo')) && !highlights.some(h => h.includes('Servo'))) {
      highlights.push(n.includes('pan') || n.includes('dual') ? 'Dual Servos' : 'SG90 Servo');
    }
    else if ((n.includes('sr04') || n.includes('ultrasonic') || n.includes('sonar')) && !highlights.includes('HC-SR04')) highlights.push('HC-SR04 Sonar');
    else if ((n.includes('soil') || n.includes('capacitive')) && !highlights.includes('Soil Probe')) highlights.push('Soil Probe');
    else if (n.includes('mpu') && !highlights.includes('MPU-6050')) highlights.push('MPU-6050 IMU');
    else if (n.includes('relay') && !highlights.includes('Opto Relay')) highlights.push('Opto Relay');
    else if ((n.includes('rc522') || n.includes('rfid')) && !highlights.includes('RC522 RFID')) highlights.push('RC522 RFID');
    else if ((n.includes('touch') || n.includes('ttp223')) && !highlights.includes('Touch Sensor')) highlights.push('Touch Sensor');
    else if (n.includes('l298n') && !highlights.includes('L298N Driver')) highlights.push('L298N Driver');
    else if (n.includes('buzzer') && !highlights.includes('Piezo Buzzer')) highlights.push('Piezo Buzzer');
    else if (n.includes('dfplayer') && !highlights.includes('DFPlayer Mini')) highlights.push('DFPlayer Mini');
    else if (n.includes('voltage') && !highlights.includes('Voltage Sensor')) highlights.push('Voltage Sensor');
    else if (n.includes('piezo') && n.includes('drum') && !highlights.includes('7x Piezo')) highlights.push('7x Piezo Array');
    else if (n.includes('ldr') && !highlights.includes('LDR Cells')) highlights.push('Dual LDRs');
    if (highlights.length >= 3) break;
  }

  if (highlights.length === 0) {
    highlights.push('I2C Sensors', 'GPIO Bus');
  }
  return highlights.slice(0, 3);
}

export function renderProjectsGrid(
  projects: ScienceProject[],
  state: FilterState
): void {
  const grid = document.getElementById('projects-grid');
  const tableView = document.getElementById('projects-table-view');
  const emptyState = document.getElementById('empty-state');
  const isTableLayout = state.viewLayout === 'table';

  if (projects.length === 0) {
    if (grid) grid.innerHTML = '';
    if (tableView) tableView.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    updateActiveFiltersSummary(state);
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  if (isTableLayout && tableView) {
    if (grid) grid.style.display = 'none';
    tableView.style.display = 'block';

    tableView.innerHTML = `
      <div class="engineering-table-wrap">
        <table class="engineering-table">
          <thead>
            <tr>
              <th>PROJECT SCHEMATIC</th>
              <th>ARCHITECTURE</th>
              <th>CATEGORY</th>
              <th>HARDWARE SPEC</th>
              <th>LEVEL</th>
              <th>BUILD TIME</th>
              <th style="text-align: right;">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(p => {
              const isArduino = p.board.toLowerCase().includes('arduino');
              const isBookmarked = state.bookmarkedIds.has(p.id);
              const hardwareHighlights = getHardwareHighlights(p);

              return `
                <tr class="table-project-row">
                  <td>
                    <div class="table-proj-cell" onclick="window.location.href='project.html?id=${p.id}'">
                      <div class="table-thumb-wrap">
                        <img src="${getProjectCoverImage(p)}" class="table-thumb" alt="${p.title}" onerror="this.onerror=null; this.src='assets/projects/obstacle-avoiding-robot-car.jpg';"/>
                      </div>
                      <div>
                        <div class="table-title">${p.title}</div>
                        <div class="table-sub">${p.shortDesc.slice(0, 85)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="board-pill ${isArduino ? 'arduino' : 'esp32'}">
                      <span class="board-indicator-dot"></span>
                      ${p.board}
                    </span>
                  </td>
                  <td class="table-cat-cell">${p.category}</td>
                  <td>
                    <div class="table-specs-row">
                      ${hardwareHighlights.map(h => `<span class="spec-chip"><span class="spec-dot"></span>${h}</span>`).join('')}
                    </div>
                  </td>
                  <td><span class="diff-badge ${p.difficulty}">${p.difficulty}</span></td>
                  <td class="table-time-cell">${p.estimatedTime}</td>
                  <td style="text-align: right;">
                    <div class="table-actions-cell">
                      <button class="btn-table-bookmark ${isBookmarked ? 'bookmarked' : ''}" 
                              onclick="window.omniLab.toggleBookmark('${p.id}')" 
                              title="${isBookmarked ? 'Remove' : 'Save'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                      <button class="btn-table-quick" onclick="window.omniLab.openModal('${p.id}')" title="Quick Blueprint Preview">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                      </button>
                      <a href="project.html?id=${p.id}" class="btn-card-explore-table">
                        <span>Open</span>
                        &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (grid) {
    grid.style.display = 'grid';
    if (tableView) tableView.style.display = 'none';

    grid.innerHTML = projects.map(p => {
      const isArduino = p.board.toLowerCase().includes('arduino');
      const isBookmarked = state.bookmarkedIds.has(p.id);
      const hardwareHighlights = getHardwareHighlights(p);

      return `
        <div class="project-card" data-project-id="${p.id}">
          <!-- Top Board & Bookmark Header -->
          <div class="card-top-bar">
            <span class="board-pill ${isArduino ? 'arduino' : 'esp32'}">
              <span class="board-indicator-dot"></span>
              ${p.board}
            </span>
            <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                    onclick="window.omniLab.toggleBookmark('${p.id}')" 
                    title="${isBookmarked ? 'Remove Bookmark' : 'Save Project'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>

          <!-- Authentic Real Hardware Workbench Project Cover Photo -->
          <div class="card-preview-banner" onclick="window.location.href='project.html?id=${p.id}'">
            <img src="${getProjectCoverImage(p)}" alt="${p.title}" class="card-project-cover-img" loading="lazy" onerror="this.onerror=null; this.src='assets/projects/obstacle-avoiding-robot-car.jpg';" />
            <div class="card-image-overlay"></div>
            ${p.id.startsWith('ai-') ? `<span class="card-ai-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> AI ARCHITECT</span>` : ''}
            <span class="card-category-tag">${p.category}</span>
            <span class="card-inspect-badge" onclick="event.stopPropagation(); window.omniLab.openModal('${p.id}');">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              Quick Blueprint
            </span>
          </div>

          <!-- Body & Details -->
          <div class="card-body">
            <h3 class="project-title" onclick="window.location.href='project.html?id=${p.id}'">${p.title}</h3>
            <p class="project-summary">${p.shortDesc}</p>

            <!-- Hardware Highlights Chips Row -->
            <div class="card-hardware-specs">
              ${hardwareHighlights.map(h => `<span class="spec-chip"><span class="spec-dot"></span>${h}</span>`).join('')}
            </div>

            <!-- Tags -->
            <div class="card-tags">
              ${(p.tags || []).slice(0, 3).map(t => `<span class="tag-pill">#${t}</span>`).join('')}
            </div>

            <!-- Card Meta Footer -->
            <div class="card-meta-footer">
              <div class="card-badges-left">
                <span class="diff-badge ${p.difficulty}">${p.difficulty}</span>
                <span class="time-indicator">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  ${p.estimatedTime}
                </span>
              </div>
              <div class="card-actions-group">
                <button class="btn-card-quick-modal" onclick="window.omniLab.openModal('${p.id}')" title="Quick Blueprint Preview">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </button>
                <a href="project.html?id=${p.id}" class="btn-card-primary-explore">
                  <span>Open Lab</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateActiveFiltersSummary(state);
}

export function updateActiveFiltersSummary(state: FilterState): void {
  const bar = document.getElementById('active-filters-bar');
  const chipsMount = document.getElementById('active-filters-chips');
  if (!bar || !chipsMount) return;

  const activeFilters: Array<{ label: string; clear: () => void }> = [];

  if (state.searchQuery) {
    activeFilters.push({
      label: `Search: "${state.searchQuery}"`,
      clear: () => {
        state.searchQuery = '';
        const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
        const searchClear = document.getElementById('search-clear-btn');
        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.style.display = 'none';
        window.omniLab.runFilterSync();
      }
    });
  }

  if (state.currentBoard !== 'all') {
    activeFilters.push({
      label: `Board: ${state.currentBoard === 'arduino' ? 'Arduino Uno' : 'ESP32'}`,
      clear: () => {
        state.currentBoard = 'all';
        document.querySelectorAll('.board-seg-btn, .board-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-board') === 'all');
        });
        window.omniLab.runFilterSync();
      }
    });
  }

  if (state.currentCategory !== 'all' && state.currentCategory !== 'All Categories') {
    const isBookmark = state.currentCategory === 'saved_bookmarks';
    activeFilters.push({
      label: isBookmark ? 'Saved Bookmarks' : `Category: ${state.currentCategory}`,
      clear: () => {
        state.currentCategory = 'all';
        document.querySelectorAll('.cat-chip').forEach(c => {
          c.classList.toggle('active', c.getAttribute('data-category') === 'All Categories');
        });
        window.omniLab.runFilterSync();
      }
    });
  }

  if (state.currentDifficulty !== 'all') {
    activeFilters.push({
      label: `Difficulty: ${state.currentDifficulty}`,
      clear: () => {
        state.currentDifficulty = 'all';
        const diffSelect = document.getElementById('difficulty-select') as HTMLSelectElement | null;
        if (diffSelect) diffSelect.value = 'all';
        window.omniLab.runFilterSync();
      }
    });
  }

  if (activeFilters.length > 0) {
    bar.style.display = 'flex';
    chipsMount.innerHTML = activeFilters.map((f, i) => `
      <span class="active-filter-pill">
        <span>${f.label}</span>
        <button type="button" class="btn-remove-filter" data-idx="${i}" title="Remove filter">&times;</button>
      </span>
    `).join('');

    chipsMount.querySelectorAll('.btn-remove-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        activeFilters[idx]?.clear();
      });
    });
  } else {
    bar.style.display = 'none';
    chipsMount.innerHTML = '';
  }
}

// Mini Circuit Preview Illustration for Project Cards (Authentic CAD Vector)
export function renderMiniCardSchematic(p: ScienceProject): string {
  const isArduino = p.board.toLowerCase().includes('arduino');
  const boardColor = isArduino ? '#006461' : '#0F172A';
  const boardStroke = isArduino ? '#008784' : '#1E293B';
  const boardName = isArduino ? 'UNO R3' : 'ESP32';
  const mcuChip = isArduino ? 'ATmega328P' : 'Xtensa Dual';
  const primaryModule = (p.circuitDiagram?.modules && p.circuitDiagram.modules[0]?.name) || 'Sensor Module';
  const wireCount = p.wiringTable?.length || 4;

  return `
    <svg class="schematic-mini-preview" viewBox="0 0 340 145" xmlns="http://www.w3.org/2000/svg" style="background:#090514; width:100%; height:100%; display:block;">
      <defs>
        <pattern id="grid-mini-${p.id}" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="#C084FC" opacity="0.16" />
        </pattern>
        <linearGradient id="mcu-grad-${p.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${boardColor}" />
          <stop offset="100%" stop-color="#05030B" />
        </linearGradient>
      </defs>
      
      <rect width="340" height="145" fill="url(#grid-mini-${p.id})" />

      <!-- Top Status Banner -->
      <g transform="translate(14, 10)">
        <rect width="312" height="16" rx="3" fill="#140A28" stroke="#3B1D6E" stroke-width="1" />
        <circle cx="10" cy="8" r="3" fill="#10B981" />
        <text x="18" y="11" fill="#94A3B8" font-size="7.5" font-family="monospace" font-weight="bold">CAD SCHEMATIC • ${wireCount} WIRES VERIFIED</text>
        <text x="302" y="11" fill="#C084FC" font-size="7" font-family="monospace" text-anchor="end">READY</text>
      </g>
      
      <!-- Microcontroller Board CAD Unit (Left) -->
      <g transform="translate(14, 34)">
        <rect width="112" height="98" rx="7" fill="url(#mcu-grad-${p.id})" stroke="${boardStroke}" stroke-width="1.6" />
        <rect x="5" y="5" width="102" height="88" rx="4" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="3,2" />
        
        <!-- USB / Power Socket -->
        <rect x="-4" y="12" width="10" height="20" rx="2" fill="#94A3B8" stroke="#475569" stroke-width="1.2" />
        <rect x="2" y="16" width="3" height="12" fill="#0F172A" />

        <!-- ATmega328P / ESP32 SoC Chip -->
        <rect x="28" y="24" width="48" height="42" rx="3" fill="#020617" stroke="#334155" stroke-width="1.2" />
        <circle cx="34" cy="30" r="1.5" fill="#64748B" />
        <text x="52" y="44" fill="#E2E8F0" font-size="7.5" font-family="monospace" text-anchor="middle" font-weight="bold">${boardName}</text>
        <text x="52" y="55" fill="#64748B" font-size="6" font-family="monospace" text-anchor="middle">${mcuChip}</text>

        <!-- Right Header Sockets -->
        ${[16, 32, 48, 64, 80].map(y => `
          <circle cx="107" cy="${y}" r="3" fill="#0F172A" stroke="#CA8A04" stroke-width="1" />
        `).join('')}
      </g>

      <!-- Peripheral Hardware Module CAD Unit (Right) -->
      <g transform="translate(214, 34)">
        <rect width="112" height="98" rx="7" fill="#110926" stroke="#6B21A8" stroke-width="1.6" />
        <rect x="5" y="5" width="102" height="88" rx="4" fill="none" stroke="rgba(192,132,252,0.18)" stroke-width="1" stroke-dasharray="3,2" />

        <!-- Module Header Badge -->
        <rect x="10" y="12" width="92" height="22" rx="3" fill="#1C0D38" stroke="#3B1D6E" stroke-width="1" />
        <text x="56" y="26" fill="#F8FAFC" font-size="8" font-family="sans-serif" text-anchor="middle" font-weight="bold">${truncateString(primaryModule, 14)}</text>

        <!-- Sensor Functional Symbol -->
        <circle cx="56" cy="58" r="15" fill="#0F172A" stroke="#A855F7" stroke-width="1.5" />
        <circle cx="56" cy="58" r="6" fill="#C084FC" />
        <text x="56" y="86" fill="#94A3B8" font-size="6.5" font-family="monospace" text-anchor="middle">ACTIVE SENSOR</text>

        <!-- Left Header Sockets -->
        ${[16, 32, 48, 64, 80].map(y => `
          <circle cx="5" cy="${y}" r="3" fill="#0F172A" stroke="#CA8A04" stroke-width="1" />
        `).join('')}
      </g>

      <!-- High-Tech Interconnect Wire Harness -->
      <path d="M 121 50 C 155 50, 180 50, 219 50" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="121" cy="50" r="2.5" fill="#EF4444" />
      <circle cx="219" cy="50" r="2.5" fill="#EF4444" />

      <path d="M 121 66 C 155 66, 180 66, 219 66" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="121" cy="66" r="2.5" fill="#1E293B" />
      <circle cx="219" cy="66" r="2.5" fill="#1E293B" />

      <path d="M 121 82 C 155 82, 180 82, 219 82" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="121" cy="82" r="2.5" fill="#2563EB" />
      <circle cx="219" cy="82" r="2.5" fill="#2563EB" />

      <path d="M 121 98 C 155 98, 180 98, 219 98" fill="none" stroke="#EAB308" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="121" cy="98" r="2.5" fill="#EAB308" />
      <circle cx="219" cy="98" r="2.5" fill="#EAB308" />
    </svg>
  `;
}

export function filterAndRender(
  allProjects: ScienceProject[],
  state: FilterState
): void {
  let list = [...allProjects];

  // Board Filter
  if (state.currentBoard !== 'all') {
    list = list.filter(p => p.board.toLowerCase().includes(state.currentBoard.toLowerCase()));
  }

  // Category Filter
  if (state.currentCategory === 'saved_bookmarks') {
    list = list.filter(p => state.bookmarkedIds.has(p.id));
  } else if (state.currentCategory !== 'all' && state.currentCategory !== 'All Categories') {
    list = list.filter(p => p.category === state.currentCategory);
  }

  // Difficulty Filter
  if (state.currentDifficulty !== 'all') {
    list = list.filter(p => p.difficulty === state.currentDifficulty);
  }

  // Search Filter
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p => {
      const inTitle = p.title.toLowerCase().includes(q);
      const inDesc = p.shortDesc.toLowerCase().includes(q);
      const inPrinciple = p.workingPrinciple.toLowerCase().includes(q);
      const inTags = p.tags && p.tags.some(t => t.toLowerCase().includes(q));
      const inComponents = p.components && p.components.some(c => c.name.toLowerCase().includes(q));
      return inTitle || inDesc || inPrinciple || inTags || inComponents;
    });
  }

  // Sort
  if (state.currentSort === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (state.currentSort === 'difficulty') {
    const rank: Record<string, number> = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
    list.sort((a, b) => (rank[a.difficulty] || 0) - (rank[b.difficulty] || 0));
  } else if (state.currentSort === 'time') {
    list.sort((a, b) => a.estimatedTime.localeCompare(b.estimatedTime));
  }

  // Update filtered counter
  const filteredCountEl = document.getElementById('filtered-count');
  if (filteredCountEl) filteredCountEl.textContent = list.length.toString();

  renderProjectsGrid(list, state);
}

export function renderCategoryChips(
  allProjects: ScienceProject[],
  state: FilterState,
  onSelect: () => void
): void {
  const mount = document.getElementById('category-chips');
  if (!mount) return;

  mount.innerHTML = CATEGORIES.map(cat => {
    const isActive = state.currentCategory === cat;
    const count = cat === 'All Categories'
      ? allProjects.length
      : allProjects.filter(p => p.category === cat).length;

    return `
      <button class="cat-chip ${isActive ? 'active' : ''}" data-category="${cat}">
        ${cat} <span class="chip-count">${count}</span>
      </button>
    `;
  }).join('');

  mount.querySelectorAll<HTMLButtonElement>('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      mount.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentCategory = chip.getAttribute('data-category') || 'all';
      onSelect();
    });
  });
}

export function syncDynamicCounts(allProjects: ScienceProject[]): void {
  const total = allProjects.length;
  const uno = allProjects.filter(p => p.board.toLowerCase().includes('arduino')).length;
  const esp = allProjects.filter(p => p.board.toLowerCase().includes('esp32')).length;

  const statTotal = document.getElementById('stat-total-count');
  const statUno = document.getElementById('stat-uno-count');
  const statEsp = document.getElementById('stat-esp-count');
  const badgeAll = document.getElementById('badge-all-count');
  const badgeUno = document.getElementById('badge-uno-count');
  const badgeEsp = document.getElementById('badge-esp-count');

  if (statTotal) statTotal.textContent = total.toString();
  if (statUno) statUno.textContent = uno.toString();
  if (statEsp) statEsp.textContent = esp.toString();
  if (badgeAll) badgeAll.textContent = total.toString();
  if (badgeUno) badgeUno.textContent = uno.toString();
  if (badgeEsp) badgeEsp.textContent = esp.toString();
}

function truncateString(str: string, num: number): string {
  if (!str) return '';
  return str.length > num ? str.slice(0, num) + '...' : str;
}
