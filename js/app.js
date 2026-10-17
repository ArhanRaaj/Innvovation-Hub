/**
 * Science Lab: ESP32 & Arduino Uno Projects Application Logic
 * High-Precision Circuit Schematic Engine with Exact Pin Alignment
 * Display Mode Selector: 0.96" I2C OLED <-> 16x2 I2C LCD (HD44780)
 */

// State Management
const state = {
  projects: typeof PROJECTS_DATA !== 'undefined' ? PROJECTS_DATA : [],
  currentBoard: 'all',
  currentCategory: 'all',
  currentDifficulty: 'all',
  currentSort: 'featured',
  searchQuery: '',
  bookmarkedIds: new Set(JSON.parse(localStorage.getItem('lab_bookmarks') || '[]')),
  activeModalProjectId: null,
  activeModalTab: 'tab-circuit',
  displayHardware: 'oled', // 'oled' or 'lcd'
  wireRoutingStyle: 'orthogonal', // 'orthogonal' or 'curved'
  circuitViewMode: 'real' // 'real' or 'vector'
};

// Wire Colors for Schematics
const WIRE_COLORS = {
  red: '#EF4444',
  black: '#1E293B',
  blue: '#2563EB',
  amber: '#D97706',
  yellow: '#EAB308',
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F97316',
  cyan: '#06B6D4'
};

// DOM References
const dom = {
  projectsGrid: document.getElementById('projects-grid'),
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  boardBtns: document.querySelectorAll('.board-btn'),
  categoryChips: document.getElementById('category-chips'),
  difficultySelect: document.getElementById('difficulty-select'),
  sortSelect: document.getElementById('sort-select'),
  filteredCount: document.getElementById('filtered-count'),
  bookmarkNavBtn: document.getElementById('btn-nav-bookmarks'),
  navBookmarkCount: document.getElementById('nav-bookmark-count'),
  projectModal: document.getElementById('project-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalBoardBadge: document.getElementById('modal-board-badge'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalBookmarkBtn: document.getElementById('modal-bookmark-btn'),
  modalPrintBtn: document.getElementById('modal-print-btn'),
  modalDownloadInoBtn: document.getElementById('modal-download-ino-btn'),
  modalTabs: document.querySelectorAll('.modal-tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  toast: document.getElementById('toast'),
  btnToggleOled: document.getElementById('btn-toggle-oled'),
  btnToggleLcd: document.getElementById('btn-toggle-lcd'),
  displayModeBar: document.getElementById('display-mode-bar')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  syncDynamicCounts();
  renderCategoryChips();
  updateBookmarkBadges();
  bindEvents();
  filterAndRenderProjects();

  window.omniLab = {
    openModal: window.openProjectModal,
    closeModal: closeModal,
    switchTab: switchModalTab,
    toggleBookmark: window.toggleBookmark,
    setViewMode: function(mode) {
      state.circuitViewMode = mode;
      const project = state.projects.find(p => p.id === state.activeModalProjectId);
      if (!project) return;
      renderFullCircuitSchematic(project);
      showToast(mode === 'real' ? 'Switched to Photorealistic Real Components View!' : 'Switched to Technical Blueprint Schematic!');
    },
    setDisplayHardware: window.setDisplayHardware,
    setWireRoutingStyle: window.setWireRoutingStyle,
    downloadSchematicSVG: window.downloadSchematicSVG,
    resetFilters: window.resetAllFilters
  };

  initScrollReveal();
});

function syncDynamicCounts() {
  const total = state.projects.length;
  const uno = state.projects.filter(p => p.board.toLowerCase().includes('arduino')).length;
  const esp = state.projects.filter(p => p.board.toLowerCase().includes('esp32')).length;

  const statTotal = document.getElementById('stat-total-count');
  const statUno = document.getElementById('stat-uno-count');
  const statEsp = document.getElementById('stat-esp-count');
  const badgeAll = document.getElementById('badge-all-count');
  const badgeUno = document.getElementById('badge-uno-count');
  const badgeEsp = document.getElementById('badge-esp-count');

  if (statTotal) statTotal.textContent = total;
  if (statUno) statUno.textContent = uno;
  if (statEsp) statEsp.textContent = esp;
  if (badgeAll) badgeAll.textContent = total;
  if (badgeUno) badgeUno.textContent = uno;
  if (badgeEsp) badgeEsp.textContent = esp;
}

// Category List
const CATEGORIES = [
  'All Categories',
  'Environmental & Weather',
  'Physics & Acoustics',
  'Biology & Healthcare',
  'Chemistry & Materials',
  'Robotics & Automation',
  'Space & Energy'
];

function renderCategoryChips() {
  if (!dom.categoryChips) return;
  dom.categoryChips.innerHTML = CATEGORIES.map((cat, idx) => `
    <button class="cat-chip ${idx === 0 ? 'active' : ''}" data-category="${cat}">
      ${cat}
    </button>
  `).join('');
}

// Event Bindings
function bindEvents() {
  // Search
  dom.searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    if (dom.searchClearBtn) {
      dom.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
    }
    filterAndRenderProjects();
  });

  dom.searchClearBtn?.addEventListener('click', () => {
    dom.searchInput.value = '';
    state.searchQuery = '';
    dom.searchClearBtn.style.display = 'none';
    filterAndRenderProjects();
    dom.searchInput.focus();
  });

  // Board Filter Switch
  dom.boardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.boardBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentBoard = btn.getAttribute('data-board');
      filterAndRenderProjects();
    });
  });

  // Category Chips Filter
  dom.categoryChips?.addEventListener('click', (e) => {
    const chip = e.target.closest('.cat-chip');
    if (!chip) return;
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.currentCategory = chip.getAttribute('data-category');
    filterAndRenderProjects();
  });

  // Difficulty & Sort
  dom.difficultySelect?.addEventListener('change', (e) => {
    state.currentDifficulty = e.target.value;
    filterAndRenderProjects();
  });

  dom.sortSelect?.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    filterAndRenderProjects();
  });

  // Nav Bookmark Filter Toggle
  dom.bookmarkNavBtn?.addEventListener('click', () => {
    if (state.currentCategory === 'saved_bookmarks') {
      state.currentCategory = 'all';
      document.querySelector('.cat-chip[data-category="All Categories"]')?.classList.add('active');
    } else {
      state.currentCategory = 'saved_bookmarks';
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    }
    filterAndRenderProjects();
  });

  // Modal Close Events
  dom.modalCloseBtn?.addEventListener('click', closeModal);
  dom.projectModal?.addEventListener('click', (e) => {
    if (e.target === dom.projectModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.projectModal?.classList.contains('active')) {
      closeModal();
    }
  });

  // Modal Tabs
  dom.modalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      switchModalTab(targetTab);
    });
  });

  // Modal Actions
  dom.modalBookmarkBtn?.addEventListener('click', () => {
    if (state.activeModalProjectId) {
      toggleBookmark(state.activeModalProjectId);
      updateModalBookmarkState();
    }
  });

  dom.modalPrintBtn?.addEventListener('click', () => {
    window.print();
  });

  dom.modalDownloadInoBtn?.addEventListener('click', () => {
    downloadCurrentProjectIno();
  });
}

// Filter and Render Projects
function filterAndRenderProjects() {
  let list = [...state.projects];

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
    const q = state.searchQuery;
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
    const rank = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
    list.sort((a, b) => (rank[a.difficulty] || 0) - (rank[b.difficulty] || 0));
  } else if (state.currentSort === 'time') {
    list.sort((a, b) => a.estimatedTime.localeCompare(b.estimatedTime));
  }

  // Update counts
  if (dom.filteredCount) {
    dom.filteredCount.textContent = list.length;
  }

  renderProjectsGrid(list);
}

// Render Card Grid
function renderProjectsGrid(projects) {
  if (!dom.projectsGrid) return;

  if (projects.length === 0) {
    dom.projectsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔬</div>
        <h3 class="empty-title">No matching science projects found</h3>
        <p class="empty-desc">Try clearing your search terms or selecting a different board / scientific category.</p>
        <button class="btn-reset-filters" onclick="resetAllFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  dom.projectsGrid.innerHTML = projects.map(p => {
    const isBookmarked = state.bookmarkedIds.has(p.id);
    const isArduino = p.board.toLowerCase().includes('arduino');
    const boardClass = isArduino ? 'arduino' : 'esp32';

    return `
      <div class="project-card" data-id="${p.id}">
        <div class="card-top-header">
          <span class="board-tag ${boardClass}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
            ${p.board}
          </span>
          <div class="card-actions-top">
            <button class="btn-card-bookmark ${isBookmarked ? 'bookmarked' : ''}" 
                    title="${isBookmarked ? 'Remove Bookmark' : 'Save Project'}"
                    onclick="event.stopPropagation(); toggleBookmark('${p.id}')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="card-preview-banner">
          ${renderMiniCircuitPreview(p)}
          <span class="card-category-tag">${p.category}</span>
        </div>

        <div class="card-body">
          <h3 class="project-title">${p.title}</h3>
          <p class="project-summary">${p.shortDesc}</p>

          <div class="card-tags">
            ${(p.tags || []).slice(0, 4).map(t => `<span class="tag-pill">#${t}</span>`).join('')}
          </div>

          <div class="card-meta-footer">
            <div class="card-badges-left">
              <span class="diff-badge ${p.difficulty}">${p.difficulty}</span>
              <span class="time-indicator">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${p.estimatedTime}
              </span>
            </div>
            <button class="btn-view-project" onclick="openProjectModal('${p.id}')">
              View Circuit & Code
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Mini Circuit SVG Illustration for Card Banner
function renderMiniCircuitPreview(p) {
  const isArduino = p.board.toLowerCase().includes('arduino');
  const boardColor = isArduino ? '#008784' : '#1E293B';
  const boardName = isArduino ? 'UNO R3' : 'ESP32';
  const primaryModule = (p.circuitDiagram?.modules && p.circuitDiagram.modules[0]?.name) || 'Sensor Module';

  return `
    <svg class="schematic-mini-preview" viewBox="0 0 340 110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-${p.id}" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#E2E8F0" stroke-width="0.8"/>
        </pattern>
      </defs>
      <rect width="340" height="110" fill="url(#grid-${p.id})" opacity="0.6" />
      
      <!-- Microcontroller Board Box -->
      <g transform="translate(18, 15)">
        <rect width="110" height="80" rx="8" fill="${boardColor}" />
        <rect x="6" y="6" width="98" height="68" rx="4" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
        <rect x="36" y="24" width="38" height="32" rx="3" fill="#0F172A" />
        <text x="55" y="44" fill="#94A3B8" font-size="8" font-family="monospace" text-anchor="middle" font-weight="bold">MCU</text>
        <text x="55" y="74" fill="#FFFFFF" font-size="10" font-family="sans-serif" text-anchor="middle" font-weight="bold">${boardName}</text>
        <circle cx="110" cy="24" r="3.5" fill="#E2E8F0" />
        <circle cx="110" cy="40" r="3.5" fill="#E2E8F0" />
        <circle cx="110" cy="56" r="3.5" fill="#E2E8F0" />
        <circle cx="110" cy="72" r="3.5" fill="#E2E8F0" />
      </g>

      <!-- Peripheral Sensor Module Box -->
      <g transform="translate(205, 18)">
        <rect width="115" height="74" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
        <rect x="10" y="10" width="95" height="24" rx="3" fill="#EFF6FF" />
        <text x="57" y="26" fill="#1E3A8A" font-size="9" font-family="sans-serif" text-anchor="middle" font-weight="bold">MODULE</text>
        <text x="57" y="52" fill="#334155" font-size="9" font-family="sans-serif" text-anchor="middle" font-weight="600">${truncateString(primaryModule, 14)}</text>
        <circle cx="0" cy="24" r="3.5" fill="#64748B" />
        <circle cx="0" cy="40" r="3.5" fill="#64748B" />
        <circle cx="0" cy="56" r="3.5" fill="#64748B" />
        <circle cx="0" cy="72" r="3.5" fill="#64748B" />
      </g>

      <!-- Curved Colored Jumper Wires -->
      <path d="M 128 39 C 158 39, 175 42, 205 42" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 128 55 C 158 55, 175 58, 205 58" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 128 71 C 162 71, 170 74, 205 74" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 128 87 C 162 87, 170 90, 205 90" fill="none" stroke="#EAB308" stroke-width="2.5" stroke-linecap="round" />
    </svg>
  `;
}

// Truncate helper
function truncateString(str, num) {
  if (!str) return '';
  return str.length > num ? str.slice(0, num) + '...' : str;
}

// Reset filters
window.resetAllFilters = function() {
  state.currentBoard = 'all';
  state.currentCategory = 'all';
  state.currentDifficulty = 'all';
  state.searchQuery = '';
  if (dom.searchInput) dom.searchInput.value = '';
  if (dom.searchClearBtn) dom.searchClearBtn.style.display = 'none';
  if (dom.difficultySelect) dom.difficultySelect.value = 'all';
  if (dom.sortSelect) dom.sortSelect.value = 'featured';

  dom.boardBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-board') === 'all'));
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-category') === 'All Categories'));

  filterAndRenderProjects();
};

// Bookmarks
window.toggleBookmark = function(id) {
  if (state.bookmarkedIds.has(id)) {
    state.bookmarkedIds.delete(id);
    showToast('Removed from saved projects');
  } else {
    state.bookmarkedIds.add(id);
    showToast('Saved to your lab project bookmarks');
  }
  localStorage.setItem('lab_bookmarks', JSON.stringify([...state.bookmarkedIds]));
  updateBookmarkBadges();
  filterAndRenderProjects();
};

function updateBookmarkBadges() {
  const count = state.bookmarkedIds.size;
  if (dom.navBookmarkCount) {
    dom.navBookmarkCount.textContent = count;
  }
}

// Toast message
function showToast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 2600);
}

// --------------------------------------------------------------------------
// DISPLAY HARDWARE SELECTION (OLED vs 16x2 LCD)
// --------------------------------------------------------------------------
window.setDisplayHardware = function(mode) {
  state.displayHardware = mode;
  
  if (dom.btnToggleOled) dom.btnToggleOled.classList.toggle('active', mode === 'oled');
  if (dom.btnToggleLcd) dom.btnToggleLcd.classList.toggle('active', mode === 'lcd');

  const project = state.projects.find(p => p.id === state.activeModalProjectId);
  if (!project) return;

  // Refresh all views to adapt to the chosen display
  renderFullCircuitSchematic(project);
  renderWiringTable(project);
  renderCodeTab(project);
  renderAssemblyTab(project);

  if (mode === 'lcd') {
    showToast('Switched to 16x2 I2C LCD! Schematic, pinout & code updated.');
  } else {
    showToast('Switched to 0.96" I2C OLED! Schematic, pinout & code updated.');
  }
};

// Check if project has display capabilities
function projectHasDisplay(project) {
  const json = JSON.stringify(project).toLowerCase();
  return json.includes('oled') || json.includes('ssd1306') || json.includes('lcd') || json.includes('display');
}

// Modal Details & Interactive Tabs
window.openProjectModal = function(id) {
  const project = state.projects.find(p => p.id === id);
  if (!project) return;

  state.activeModalProjectId = id;
  dom.modalTitle.textContent = project.title;

  const isArduino = project.board.toLowerCase().includes('arduino');
  dom.modalBoardBadge.className = `board-tag ${isArduino ? 'arduino' : 'esp32'}`;
  dom.modalBoardBadge.textContent = project.board;

  // Determine initial display mode for project
  const jsonStr = JSON.stringify(project).toLowerCase();
  if (jsonStr.includes('lcd') && !jsonStr.includes('oled')) {
    state.displayHardware = 'lcd';
  } else {
    state.displayHardware = 'oled';
  }

  // Show or hide display toggle toolbar depending on project
  if (dom.displayModeBar) {
    if (projectHasDisplay(project)) {
      dom.displayModeBar.style.display = 'flex';
      dom.btnToggleOled?.classList.toggle('active', state.displayHardware === 'oled');
      dom.btnToggleLcd?.classList.toggle('active', state.displayHardware === 'lcd');
    } else {
      dom.displayModeBar.style.display = 'none';
    }
  }

  updateModalBookmarkState();

  // Populate Tab 1: Interactive Circuit Schematic
  renderFullCircuitSchematic(project);

  // Populate Tab 2: Wiring Table & Hardware Pinout
  renderWiringTable(project);

  // Populate Tab 3: Complete Firmware Source Code
  renderCodeTab(project);

  // Populate Tab 4: Scientific Working Principle
  renderPrincipleTab(project);

  // Populate Tab 5: Assembly Guide & BOM Checklist
  renderAssemblyTab(project);

  // Switch to default circuit tab
  switchModalTab('tab-circuit');

  // Show modal
  dom.projectModal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

function closeModal() {
  dom.projectModal?.classList.remove('active');
  document.body.style.overflow = '';
  state.activeModalProjectId = null;
}

function switchModalTab(tabId) {
  state.activeModalTab = tabId;
  dom.modalTabs.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
  });
  dom.tabPanes.forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });
}

function updateModalBookmarkState() {
  if (!dom.modalBookmarkBtn || !state.activeModalProjectId) return;
  const isBookmarked = state.bookmarkedIds.has(state.activeModalProjectId);
  dom.modalBookmarkBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
    ${isBookmarked ? 'Bookmarked' : 'Save Project'}
  `;
  dom.modalBookmarkBtn.style.color = isBookmarked ? '#E11D48' : '';
}

// --------------------------------------------------------------------------
// HIGH PRECISION PIN COORDINATES MAPPING ENGINE
// --------------------------------------------------------------------------

// Returns exact (x, y) coordinates for an Arduino Uno pin
function getArduinoPinCoord(pinStr) {
  const norm = pinStr.toUpperCase().replace(/\s+/g, '');
  
  // Top Header pins (y = 124)
  if (norm.includes('SCL')) return { x: 132, y: 124, name: 'SCL' };
  if (norm.includes('SDA')) return { x: 148, y: 124, name: 'SDA' };
  if (norm.includes('AREF')) return { x: 164, y: 124, name: 'AREF' };
  if (norm.includes('GND') && (norm.includes('TOP') || norm.includes('DIGITAL') || norm.includes('13'))) return { x: 180, y: 124, name: 'GND' };
  if (norm.includes('13') || norm.includes('PIN13') || norm.includes('D13')) return { x: 196, y: 124, name: 'D13' };
  if (norm.includes('12') || norm.includes('PIN12') || norm.includes('D12')) return { x: 212, y: 124, name: 'D12' };
  if (norm.includes('11') || norm.includes('PIN11') || norm.includes('D11')) return { x: 228, y: 124, name: 'D11' };
  if (norm.includes('10') || norm.includes('PIN10') || norm.includes('D10')) return { x: 244, y: 124, name: 'D10' };
  if (norm.includes('9') || norm.includes('PIN9') || norm.includes('D9')) return { x: 260, y: 124, name: 'D9' };
  if (norm.includes('8') || norm.includes('PIN8') || norm.includes('D8')) return { x: 276, y: 124, name: 'D8' };
  if (norm.includes('7') || norm.includes('PIN7') || norm.includes('D7')) return { x: 304, y: 124, name: 'D7' };
  if (norm.includes('6') || norm.includes('PIN6') || norm.includes('D6')) return { x: 320, y: 124, name: 'D6' };
  if (norm.includes('5') || norm.includes('PIN5') || norm.includes('D5')) return { x: 336, y: 124, name: 'D5' };
  if (norm.includes('4') || norm.includes('PIN4') || norm.includes('D4')) return { x: 352, y: 124, name: 'D4' };
  if (norm.includes('3') || norm.includes('PIN3') || norm.includes('D3')) return { x: 368, y: 124, name: 'D3' };
  if (norm.includes('2') || norm.includes('PIN2') || norm.includes('D2')) return { x: 384, y: 124, name: 'D2' };
  if (norm.includes('1') && !norm.includes('A1')) return { x: 400, y: 124, name: 'TX/1' };
  if (norm.includes('0') && !norm.includes('A0')) return { x: 416, y: 124, name: 'RX/0' };

  // Bottom Header pins (y = 408)
  if (norm.includes('3.3V') || norm.includes('3V3')) return { x: 174, y: 408, name: '3.3V' };
  if (norm.includes('5V')) return { x: 190, y: 408, name: '5V' };
  if (norm.includes('GND')) return { x: 206, y: 408, name: 'GND' };
  if (norm.includes('VIN')) return { x: 238, y: 408, name: 'VIN' };
  if (norm.includes('A0')) return { x: 280, y: 408, name: 'A0' };
  if (norm.includes('A1')) return { x: 296, y: 408, name: 'A1' };
  if (norm.includes('A2')) return { x: 312, y: 408, name: 'A2' };
  if (norm.includes('A3')) return { x: 328, y: 408, name: 'A3' };
  if (norm.includes('A4')) return { x: 344, y: 408, name: 'A4' };
  if (norm.includes('A5')) return { x: 360, y: 408, name: 'A5' };

  // Default fallback
  return { x: 190, y: 408, name: '5V' };
}

// Returns exact (x, y) coordinates for an ESP32 pin
function getESP32PinCoord(pinStr) {
  const norm = pinStr.toUpperCase().replace(/\s+/g, '');

  // Left Pin Header (x = 88, y from 135 to 495, step 28)
  if (norm.includes('3V3') || norm.includes('3.3V')) return { x: 88, y: 135, name: '3V3' };
  if (norm.includes('EN') && !norm.includes('GREEN')) return { x: 88, y: 163, name: 'EN' };
  if (norm.includes('36') || norm.includes('VP')) return { x: 88, y: 191, name: 'GPIO36' };
  if (norm.includes('39') || norm.includes('VN')) return { x: 88, y: 219, name: 'GPIO39' };
  if (norm.includes('34')) return { x: 88, y: 247, name: 'GPIO34' };
  if (norm.includes('35')) return { x: 88, y: 275, name: 'GPIO35' };
  if (norm.includes('32')) return { x: 88, y: 303, name: 'GPIO32' };
  if (norm.includes('33')) return { x: 88, y: 331, name: 'GPIO33' };
  if (norm.includes('25')) return { x: 88, y: 359, name: 'GPIO25' };
  if (norm.includes('26')) return { x: 88, y: 387, name: 'GPIO26' };
  if (norm.includes('27')) return { x: 88, y: 415, name: 'GPIO27' };
  if (norm.includes('14')) return { x: 88, y: 443, name: 'GPIO14' };
  if (norm.includes('12')) return { x: 88, y: 471, name: 'GPIO12' };
  if (norm.includes('GND') && norm.includes('LEFT')) return { x: 88, y: 499, name: 'GND' };

  // Right Pin Header (x = 332, y from 135 to 495, step 28)
  if (norm.includes('5V') || norm.includes('VIN')) return { x: 332, y: 135, name: 'VIN(5V)' };
  if (norm.includes('GND')) return { x: 332, y: 163, name: 'GND' };
  if (norm.includes('13')) return { x: 332, y: 191, name: 'GPIO13' };
  if (norm.includes('9')) return { x: 332, y: 219, name: 'GPIO9' };
  if (norm.includes('10')) return { x: 332, y: 247, name: 'GPIO10' };
  if (norm.includes('11')) return { x: 332, y: 275, name: 'GPIO11' };
  if (norm.includes('23')) return { x: 332, y: 303, name: 'GPIO23' };
  if (norm.includes('22') || (norm.includes('SCL') && !norm.includes('OLED') && !norm.includes('LCD'))) return { x: 332, y: 331, name: 'GPIO22(SCL)' };
  if (norm.includes('TX0') || norm.includes('TX')) return { x: 332, y: 359, name: 'TX0' };
  if (norm.includes('RX0') || norm.includes('RX')) return { x: 332, y: 387, name: 'RX0' };
  if (norm.includes('21') || (norm.includes('SDA') && !norm.includes('OLED') && !norm.includes('LCD'))) return { x: 332, y: 415, name: 'GPIO21(SDA)' };
  if (norm.includes('19')) return { x: 332, y: 443, name: 'GPIO19' };
  if (norm.includes('18')) return { x: 332, y: 471, name: 'GPIO18' };
  if (norm.includes('5') && !norm.includes('3V3')) return { x: 332, y: 499, name: 'GPIO5' };
  if (norm.includes('4')) return { x: 88, y: 303, name: 'GPIO4' };
  if (norm.includes('16')) return { x: 88, y: 331, name: 'GPIO16' };
  if (norm.includes('17')) return { x: 88, y: 359, name: 'GPIO17' };

  // Fallback
  return { x: 88, y: 135, name: '3V3' };
}

// Returns exact (x, y) coordinates for target peripheral module pin
function getTargetModulePinCoord(targetStr, isDisplaySlot, displayMode, pinIndex) {
  const norm = targetStr.toUpperCase().replace(/\s+/g, '');

  if (isDisplaySlot) {
    // 16x2 I2C LCD Display Mode
    if (displayMode === 'lcd') {
      if (norm.includes('GND')) return { x: 600, y: 350, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 600, y: 385, name: 'VCC' };
      if (norm.includes('SDA')) return { x: 600, y: 420, name: 'SDA' };
      if (norm.includes('SCL')) return { x: 600, y: 455, name: 'SCL' };
      // By pin index order
      const lcdPins = [
        { x: 600, y: 350, name: 'GND' },
        { x: 600, y: 385, name: 'VCC' },
        { x: 600, y: 420, name: 'SDA' },
        { x: 600, y: 455, name: 'SCL' }
      ];
      return lcdPins[pinIndex % lcdPins.length];
    }
    
    // 0.96" I2C OLED Display Mode
    if (norm.includes('GND')) return { x: 660, y: 330, name: 'GND' };
    if (norm.includes('VCC') || norm.includes('3V3')) return { x: 720, y: 330, name: 'VCC' };
    if (norm.includes('SCL')) return { x: 780, y: 330, name: 'SCL' };
    if (norm.includes('SDA')) return { x: 840, y: 330, name: 'SDA' };

    const oledPins = [
      { x: 660, y: 330, name: 'GND' },
      { x: 720, y: 330, name: 'VCC' },
      { x: 780, y: 330, name: 'SCL' },
      { x: 840, y: 330, name: 'SDA' }
    ];
    return oledPins[pinIndex % oledPins.length];
  }

  // Upper Slot Sensor / Actuator Module
  // Header pins arranged neatly along left edge (x = 590, y = 80 + i * 32)
  const sensorY = 75 + (pinIndex * 32);
  let pinName = targetStr.split(' ').pop() || `P${pinIndex + 1}`;
  return { x: 590, y: sensorY, name: pinName };
}

// --------------------------------------------------------------------------
// TAB 1: RENDER FULL HIGH-PRECISION CIRCUIT SCHEMATIC SVG
// --------------------------------------------------------------------------
function renderFullCircuitSchematic(project) {
  const container = document.getElementById('schematic-svg-mount');
  if (!container) return;

  const isArduino = project.board.toLowerCase().includes('arduino');
  const hasDisplay = projectHasDisplay(project);
  const displayMode = state.displayHardware;

  // Adapt wiring table if user selected 16x2 LCD instead of OLED
  const rawWiring = project.wiringTable || [];
  const wiring = adaptWiringForDisplay(rawWiring, displayMode);

  // Separate wiring into sensor module wires and display wires
  const sensorWires = [];
  const displayWires = [];

  wiring.forEach(w => {
    const toLower = w.to.toLowerCase();
    if (toLower.includes('oled') || toLower.includes('lcd') || toLower.includes('display')) {
      displayWires.push(w);
    } else {
      sensorWires.push(w);
    }
  });

  const primaryModule = (project.circuitDiagram?.modules && project.circuitDiagram.modules[0]?.name) || 'Sensor Module';

  // SVG Dimension
  const svgW = 1000;
  const svgH = 600;

  let svg = `
    <svg width="100%" height="540" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="background:#FDFEFE; border-radius:12px; font-family:'Plus Jakarta Sans', sans-serif;">
      <defs>
        <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#CBD5E1" opacity="0.75" />
        </pattern>
        <filter id="pcb-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.12"/>
        </filter>
        <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#3B82F6" flood-opacity="0.6"/>
        </filter>
      </defs>

      <!-- Background Grid -->
      <rect width="100%" height="100%" fill="#F8FAFC" />
      <rect width="100%" height="100%" fill="url(#dot-grid)" />

      <!-- Top Power Distribution Breadboard Rail -->
      <g transform="translate(40, 18)">
        <rect width="920" height="34" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
        <line x1="20" y1="11" x2="900" y2="11" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" />
        <line x1="20" y1="23" x2="900" y2="23" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" />
        <text x="25" y="9" fill="#DC2626" font-size="9" font-family="monospace" font-weight="bold">+ POSITIVE RAIL (${isArduino ? '5V' : '3.3V'})</text>
        <text x="760" y="31" fill="#1E293B" font-size="9" font-family="monospace" font-weight="bold">- COMMON GROUND (GND)</text>
      </g>
  `;

  // ------------------------------------------------------------------------
  // RENDER MICROCONTROLLER BOARD (LEFT SIDE)
  // ------------------------------------------------------------------------
  if (isArduino) {
    // ARDUINO UNO R3
    svg += `
      <!-- Arduino Uno R3 PCB -->
      <g transform="translate(50, 110)" filter="url(#pcb-shadow)">
        <rect width="380" height="320" rx="16" fill="#008784" />
        <rect x="6" y="6" width="368" height="308" rx="12" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.8" />
        
        <!-- Mounting Holes -->
        <circle cx="24" cy="24" r="8" fill="#F8FAFC" stroke="#D97706" stroke-width="2.5" />
        <circle cx="356" cy="24" r="8" fill="#F8FAFC" stroke="#D97706" stroke-width="2.5" />
        <circle cx="24" cy="296" r="8" fill="#F8FAFC" stroke="#D97706" stroke-width="2.5" />
        <circle cx="356" cy="296" r="8" fill="#F8FAFC" stroke="#D97706" stroke-width="2.5" />

        <!-- USB Type-B Port -->
        <rect x="-18" y="28" width="56" height="52" rx="4" fill="#94A3B8" stroke="#475569" stroke-width="1.5" />
        <rect x="-14" y="34" width="48" height="40" rx="2" fill="#E2E8F0" />
        <text x="10" y="58" fill="#0F172A" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">USB</text>

        <!-- DC Power Barrel Jack -->
        <rect x="-16" y="210" width="52" height="64" rx="4" fill="#1E293B" stroke="#0F172A" stroke-width="1.5" />
        <circle cx="10" cy="242" r="10" fill="#64748B" />
        <circle cx="10" cy="242" r="4" fill="#E2E8F0" />

        <!-- ATmega328P DIP IC -->
        <rect x="130" y="125" width="160" height="52" rx="5" fill="#0F172A" stroke="#334155" stroke-width="1.5" />
        <path d="M 130 145 A 6 6 0 0 1 130 157" fill="none" stroke="#64748B" stroke-width="2" />
        <text x="210" y="152" fill="#F8FAFC" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">ATMEGA328P-PU</text>
        <text x="210" y="167" fill="#64748B" font-size="8.5" font-family="monospace" text-anchor="middle">16MHz 8-BIT MCU</text>

        <!-- 16MHz Crystal Oscillator -->
        <rect x="80" y="138" width="34" height="24" rx="8" fill="#CBD5E1" stroke="#64748B" stroke-width="1.2" />
        <text x="97" y="154" fill="#0F172A" font-size="7" font-weight="bold" text-anchor="middle">16.000</text>

        <!-- Reset Button -->
        <circle cx="58" cy="35" r="9" fill="#DC2626" stroke="#991B1B" stroke-width="2" />
        <circle cx="58" cy="35" r="4" fill="#EF4444" />
        <text x="58" y="56" fill="#FFFFFF" font-size="7.5" font-weight="bold" text-anchor="middle">RESET</text>

        <!-- Silkscreen Text -->
        <text x="210" y="65" fill="#FFFFFF" font-size="16" font-weight="800" text-anchor="middle" letter-spacing="1.5">ARDUINO</text>
        <text x="210" y="85" fill="#A7F3D0" font-size="12" font-weight="700" text-anchor="middle">UNO R3</text>
        <text x="210" y="225" fill="rgba(255,255,255,0.7)" font-size="10" font-weight="600" text-anchor="middle">OPEN HARDWARE SCIENCE</text>

        <!-- Top Digital Header Socket Bar (y = 12) -->
        <rect x="70" y="4" width="298" height="20" rx="3" fill="#1E293B" />
        <text x="145" y="-3" fill="#334155" font-size="8.5" font-weight="bold">DIGITAL (PWM ~)</text>

        <!-- Bottom Power / Analog Socket Bar (y = 296) -->
        <rect x="78" y="296" width="290" height="20" rx="3" fill="#1E293B" />
        <text x="110" y="328" fill="#334155" font-size="8.5" font-weight="bold">POWER</text>
        <text x="280" y="328" fill="#334155" font-size="8.5" font-weight="bold">ANALOG IN</text>

        <!-- Top Header Pins Labels -->
        ${[
          {name: 'SCL', x: 82}, {name: 'SDA', x: 98}, {name: 'AREF', x: 114}, {name: 'GND', x: 130},
          {name: '13', x: 146}, {name: '12', x: 162}, {name: '11', x: 178}, {name: '10', x: 194},
          {name: '9', x: 210}, {name: '8', x: 226}, {name: '7', x: 254}, {name: '6', x: 270},
          {name: '5', x: 286}, {name: '4', x: 302}, {name: '3', x: 318}, {name: '2', x: 334},
          {name: '1', x: 350}, {name: '0', x: 366}
        ].map(p => `
          <circle cx="${p.x}" cy="14" r="4.5" fill="#E2E8F0" stroke="#0F172A" stroke-width="1.5" />
          <text x="${p.x}" y="32" fill="#FFFFFF" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}

        <!-- Bottom Header Pins Labels -->
        ${[
          {name: '3V3', x: 124}, {name: '5V', x: 140}, {name: 'GND', x: 156}, {name: 'GND', x: 172}, {name: 'VIN', x: 188},
          {name: 'A0', x: 230}, {name: 'A1', x: 246}, {name: 'A2', x: 262}, {name: 'A3', x: 278}, {name: 'A4', x: 294}, {name: 'A5', x: 310}
        ].map(p => `
          <circle cx="${p.x}" cy="306" r="4.5" fill="#E2E8F0" stroke="#0F172A" stroke-width="1.5" />
          <text x="${p.x}" y="290" fill="#FFFFFF" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
    `;
  } else {
    // ESP32 NODEMCU DEVKIT
    svg += `
      <!-- ESP32 NodeMCU PCB -->
      <g transform="translate(60, 65)" filter="url(#pcb-shadow)">
        <rect width="280" height="500" rx="16" fill="#1E293B" />
        <rect x="6" y="6" width="268" height="488" rx="12" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />

        <!-- Gold PCB Antenna at top -->
        <rect x="65" y="14" width="150" height="36" rx="4" fill="#0F172A" stroke="#D97706" stroke-width="1.5" />
        <path d="M 75 32 L 85 22 L 95 32 L 105 22 L 115 32 L 125 22 L 135 32 L 145 22 L 155 32 L 165 22 L 175 32 L 185 22 L 195 32 L 205 22" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" />
        <text x="140" y="46" fill="#D97706" font-size="7.5" font-weight="bold" text-anchor="middle">2.4GHz ANT</text>

        <!-- Metal Shield Box -->
        <rect x="45" y="65" width="190" height="235" rx="8" fill="#334155" stroke="#64748B" stroke-width="1.8" />
        <circle cx="140" cy="120" r="18" fill="#1E293B" stroke="#94A3B8" stroke-width="1.5" />
        <text x="140" y="125" fill="#FFFFFF" font-size="12" font-weight="bold" text-anchor="middle">ESP</text>
        <text x="140" y="170" fill="#FFFFFF" font-size="14" font-weight="800" text-anchor="middle">ESP-WROOM-32</text>
        <text x="140" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Dual-Core 240MHz Wi-Fi/BLE</text>
        <text x="140" y="210" fill="#64748B" font-size="8" font-family="monospace" text-anchor="middle">FCC ID: 2AC7Z-ESPWROOM32</text>

        <!-- Micro-USB Jack -->
        <rect x="110" y="476" width="60" height="30" rx="4" fill="#94A3B8" stroke="#475569" stroke-width="1.5" />
        <rect x="115" y="482" width="50" height="22" rx="2" fill="#E2E8F0" />
        <text x="140" y="497" fill="#0F172A" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">USB</text>

        <!-- Push Buttons: EN and BOOT -->
        <rect x="25" y="450" width="28" height="24" rx="3" fill="#475569" />
        <circle cx="39" cy="462" r="5" fill="#EF4444" />
        <text x="39" y="485" fill="#FFFFFF" font-size="7.5" font-weight="bold" text-anchor="middle">EN</text>

        <rect x="227" y="450" width="28" height="24" rx="3" fill="#475569" />
        <circle cx="241" cy="462" r="5" fill="#3B82F6" />
        <text x="241" y="485" fill="#FFFFFF" font-size="7.5" font-weight="bold" text-anchor="middle">BOOT</text>

        <!-- Left Header Pins (x = 28, step = 28px from y = 70) -->
        ${[
          '3V3', 'EN', 'VP', 'VN', '34', '35', '32', '33', '25', '26', '27', '14', '12', 'GND'
        ].map((pin, i) => `
          <circle cx="28" cy="${70 + i * 28}" r="4.5" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.5" />
          <text x="40" y="${74 + i * 28}" fill="#94A3B8" font-size="8" font-family="monospace" font-weight="bold">${pin}</text>
        `).join('')}

        <!-- Right Header Pins (x = 252, step = 28px from y = 70) -->
        ${[
          'VIN', 'GND', '13', '9', '10', '11', '23', '22', 'TX0', 'RX0', '21', '19', '18', '5'
        ].map((pin, i) => `
          <circle cx="252" cy="${70 + i * 28}" r="4.5" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.5" />
          <text x="240" y="${74 + i * 28}" fill="#94A3B8" font-size="8" font-family="monospace" font-weight="bold" text-anchor="end">${pin}</text>
        `).join('')}
      </g>
    `;
  }

  // ------------------------------------------------------------------------
  // RENDER PERIPHERAL MODULES (RIGHT SIDE)
  // ------------------------------------------------------------------------

  // SLOT 1: PRIMARY SENSOR / ACTUATOR MODULE (Upper Right: x=580, y=60)
  svg += `
    <!-- Primary Sensor / Actuator Module -->
    <g transform="translate(580, 60)" filter="url(#pcb-shadow)">
      <rect width="380" height="220" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" />
      <rect x="0" y="0" width="380" height="38" rx="10" fill="#EFF6FF" />
      <text x="18" y="24" fill="#1E3A8A" font-size="12" font-weight="bold">MODULE 1: ${primaryModule.toUpperCase()}</text>
      
      <!-- Sensor Graphic (HC-SR04, BME280, or Generic) -->
      ${renderSensorGraphic(primaryModule)}

      <!-- Header Pins on Left Edge of Sensor Module -->
      <g transform="translate(10, 50)">
        ${sensorWires.map((w, idx) => `
          <g transform="translate(0, ${idx * 32})">
            <circle cx="0" cy="10" r="5" fill="#F8FAFC" stroke="#475569" stroke-width="1.8" />
            <text x="16" y="14" fill="#1E293B" font-size="10" font-family="monospace" font-weight="bold">${w.to}</text>
            <text x="16" y="25" fill="#64748B" font-size="7.5">${w.desc.split(' ')[0]}</text>
          </g>
        `).join('')}
      </g>
    </g>
  `;

  // SLOT 2: DISPLAY MODULE (Lower Right: x=580, y=310)
  if (hasDisplay) {
    if (displayMode === 'lcd') {
      // 16x2 I2C CHARACTER LCD MODULE
      svg += `
        <!-- 16x2 I2C Character LCD Display Module -->
        <g transform="translate(580, 310)" filter="url(#pcb-shadow)">
          <!-- Main Green PCB -->
          <rect width="380" height="250" rx="12" fill="#047857" stroke="#065F46" stroke-width="2" />
          <rect x="6" y="6" width="368" height="238" rx="8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />

          <!-- LCD Bezel Frame -->
          <rect x="80" y="30" width="280" height="180" rx="8" fill="#0F172A" />
          <!-- Active Yellow-Green Backlit Screen -->
          <rect x="95" y="45" width="250" height="150" rx="4" fill="#A7F3D0" stroke="#059669" stroke-width="1.5" />
          
          <!-- Character Matrix Text Lines -->
          <g font-family="monospace" font-size="13.5" font-weight="bold" fill="#064E3B" letter-spacing="1.2">
            <text x="110" y="105">INNOVATION HUB</text>
            <text x="110" y="145">READY: ACTIVE OK</text>
          </g>

          <text x="190" y="235" fill="rgba(255,255,255,0.85)" font-size="10" font-weight="700" text-anchor="middle">16x2 CHARACTER LCD (I2C 0x27)</text>

          <!-- I2C PCF8574 Backpack Header on Left Edge -->
          <rect x="10" y="25" width="55" height="190" rx="6" fill="#1E3A8A" stroke="#3B82F6" stroke-width="1.2" />
          <text x="37" y="42" fill="#93C5FD" font-size="8" font-weight="bold" text-anchor="middle">I2C BUS</text>

          <!-- Blue Trimmer Potentiometer -->
          <rect x="20" y="170" width="35" height="30" rx="3" fill="#2563EB" />
          <circle cx="37" cy="185" r="7" fill="#F8FAFC" />
          <line x1="33" y1="185" x2="41" y2="185" stroke="#64748B" stroke-width="2" />

          <!-- 4 Gold Solder Pins -->
          ${[
            {name: 'GND', y: 65},
            {name: 'VCC', y: 95},
            {name: 'SDA', y: 125},
            {name: 'SCL', y: 155}
          ].map(p => `
            <g transform="translate(20, ${p.y})">
              <circle cx="0" cy="0" r="5" fill="#F59E0B" stroke="#78350F" stroke-width="1.5" />
              <text x="12" y="4" fill="#FFFFFF" font-size="8.5" font-family="monospace" font-weight="bold">${p.name}</text>
            </g>
          `).join('')}
        </g>
      `;
    } else {
      // 0.96" I2C MONOCHROME OLED (SSD1306)
      svg += `
        <!-- 0.96" I2C OLED (SSD1306) Display Module -->
        <g transform="translate(580, 310)" filter="url(#pcb-shadow)">
          <!-- Blue PCB -->
          <rect width="380" height="250" rx="12" fill="#1E3A8A" stroke="#1D4ED8" stroke-width="2" />
          <rect x="6" y="6" width="368" height="238" rx="8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />

          <!-- OLED Screen Area -->
          <rect x="60" y="65" width="260" height="150" rx="6" fill="#050811" stroke="#334155" stroke-width="2" />
          
          <!-- Sample Cyan OLED UI Output -->
          <text x="75" y="90" fill="#38BDF8" font-size="10" font-weight="bold" font-family="monospace">INNOVATION HUB [128x64]</text>
          <line x1="75" y1="96" x2="305" y2="96" stroke="#38BDF8" stroke-width="1" />
          <path d="M 75 160 Q 110 120, 150 160 T 225 160 T 300 150" fill="none" stroke="#38BDF8" stroke-width="1.8" />
          <text x="75" y="130" fill="#E0F2FE" font-size="13" font-weight="bold" font-family="monospace">24.5 C  1013 hPa</text>
          <text x="75" y="195" fill="#38BDF8" font-size="9" font-family="monospace">Status: CALIBRATED OK</text>

          <text x="190" y="235" fill="rgba(255,255,255,0.85)" font-size="10" font-weight="700" text-anchor="middle">0.96" MONOCHROME OLED (SSD1306)</text>

          <!-- Top Header Pins: GND, VCC, SCL, SDA -->
          <rect x="65" y="12" width="250" height="26" rx="4" fill="#0F172A" />
          ${[
            {name: 'GND', x: 80},
            {name: 'VCC', x: 140},
            {name: 'SCL', x: 200},
            {name: 'SDA', x: 260}
          ].map(p => `
            <g transform="translate(${p.x}, 25)">
              <circle cx="0" cy="0" r="5" fill="#F59E0B" stroke="#78350F" stroke-width="1.5" />
              <text x="0" y="-12" fill="#FFFFFF" font-size="8.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
            </g>
          `).join('')}
        </g>
      `;
    }
  }

  // Wire Routing Style & Toolbar State
  const routingStyle = state.wireRoutingStyle || 'orthogonal';
  const btnOrtho = document.getElementById('btn-route-ortho');
  const btnCurved = document.getElementById('btn-route-curved');
  if (btnOrtho) btnOrtho.classList.toggle('active', routingStyle === 'orthogonal');
  if (btnCurved) btnCurved.classList.toggle('active', routingStyle === 'curved');

  // ------------------------------------------------------------------------
  // DRAW CLEAN CONDUIT TRUNK JUMPER WIRES BETWEEN MCU AND MODULES
  // ------------------------------------------------------------------------
  svg += `<g id="wires-group">`;

  const allWires = [...sensorWires, ...(hasDisplay ? displayWires : [])];
  const totalWiresCount = allWires.length;

  allWires.forEach((w, wi) => {
    const wireColor = WIRE_COLORS[w.color] || '#2563EB';
    const startPt = isArduino ? getArduinoPinCoord(w.from) : getESP32PinCoord(w.from);

    const isDisplayWire = wi >= sensorWires.length;
    const di = wi - sensorWires.length;

    let endPt;
    if (isDisplayWire) {
      if (displayMode === 'lcd') {
        const norm = w.to.toUpperCase();
        if (norm.includes('GND')) endPt = { x: 600, y: 375 };
        else if (norm.includes('VCC') || norm.includes('5V')) endPt = { x: 600, y: 405 };
        else if (norm.includes('SDA')) endPt = { x: 600, y: 435 };
        else if (norm.includes('SCL')) endPt = { x: 600, y: 465 };
        else endPt = { x: 600, y: 375 + (di * 30) };
      } else {
        const norm = w.to.toUpperCase();
        if (norm.includes('GND')) endPt = { x: 660, y: 335 };
        else if (norm.includes('VCC') || norm.includes('3V3')) endPt = { x: 720, y: 335 };
        else if (norm.includes('SCL')) endPt = { x: 780, y: 335 };
        else if (norm.includes('SDA')) endPt = { x: 840, y: 335 };
        else endPt = { x: 660 + (di * 60), y: 335 };
      }
    } else {
      endPt = { x: 590, y: 110 + (wi * 32) };
    }

    const sx = startPt.x;
    const sy = startPt.y;
    const ex = endPt.x;
    const ey = endPt.y;

    // Distinct Conduit Lane X: each wire gets a dedicated parallel vertical track (never overlaps!)
    const laneStep = Math.min(13, Math.max(8, 100 / Math.max(1, totalWiresCount)));
    const conduitX = 450 + (wi * laneStep);

    let pathD = '';
    let badgeX = conduitX;
    let badgeY = (sy + ey) / 2;

    const isFromBottom = isArduino && sy > 250;
    const isFromTop = isArduino && sy < 160;

    if (routingStyle === 'orthogonal') {
      const r = 7; // Smooth corner fillet radius

      if (isFromBottom) {
        // Wire drops down into clean bottom horizontal conduit, travels to conduitX, then rises up to ey
        const bottomDropY = 445 + (wi * 8);
        pathD = `M ${sx} ${sy} 
                 L ${sx} ${bottomDropY - r} 
                 Q ${sx} ${bottomDropY}, ${sx + r} ${bottomDropY} 
                 L ${conduitX - r} ${bottomDropY} 
                 Q ${conduitX} ${bottomDropY}, ${conduitX} ${bottomDropY - r} 
                 L ${conduitX} ${ey + r} 
                 Q ${conduitX} ${ey}, ${conduitX + r} ${ey} 
                 L ${ex} ${ey}`;
        badgeY = bottomDropY;
        badgeX = (sx + conduitX) / 2;
      } else if (isFromTop) {
        // Wire rises up into top horizontal conduit, travels to conduitX, then drops down to ey
        const topExitY = 92 - (wi * 6);
        pathD = `M ${sx} ${sy} 
                 L ${sx} ${topExitY + r} 
                 Q ${sx} ${topExitY}, ${sx + r} ${topExitY} 
                 L ${conduitX - r} ${topExitY} 
                 Q ${conduitX} ${topExitY}, ${conduitX} ${topExitY + r} 
                 L ${conduitX} ${ey - r} 
                 Q ${conduitX} ${ey}, ${conduitX + r} ${ey} 
                 L ${ex} ${ey}`;
        badgeY = topExitY;
        badgeX = (sx + conduitX) / 2;
      } else {
        // ESP32 or middle pin: horizontal exit to conduitX, vertical run to ey, horizontal entry into module
        const dy = ey - sy;
        const dirY = dy >= 0 ? 1 : -1;
        pathD = `M ${sx} ${sy} 
                 L ${conduitX - r} ${sy} 
                 Q ${conduitX} ${sy}, ${conduitX} ${sy + r * dirY} 
                 L ${conduitX} ${ey - r * dirY} 
                 Q ${conduitX} ${ey}, ${conduitX + r} ${ey} 
                 L ${ex} ${ey}`;
        badgeY = (sy + ey) / 2;
        badgeX = conduitX;
      }
    } else {
      // S-Curve Cable Harness Mode
      const dx = Math.abs(ex - sx);
      const cx1 = sx + Math.max(50, dx * 0.45);
      const cx2 = ex - Math.max(50, dx * 0.45);
      pathD = `M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ey}, ${ex} ${ey}`;
      badgeX = (sx + ex) / 2;
      badgeY = (sy + ey) / 2;
    }

    // Short net identifier tag (e.g. 5V, GND, D9, A4, SCL)
    const netTag = (w.to.split(' ')[0] || w.color).substring(0, 6).toUpperCase();

    svg += `
      <g class="interactive-wire" data-wire-idx="${wi}" title="${w.from} -> ${w.to} (${w.desc})">
        <!-- Main Wire Path -->
        <path d="${pathD}" fill="none" stroke="${wireColor}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        
        <!-- Solder Pad Eyelets -->
        <circle cx="${sx}" cy="${sy}" r="5.5" fill="${wireColor}" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="${ex}" cy="${ey}" r="5.5" fill="${wireColor}" stroke="#FFFFFF" stroke-width="2" />

        <!-- Wire Net Badge Pill Tag -->
        <g class="wire-badge-group">
          <rect x="${badgeX - 16}" y="${badgeY - 7}" width="32" height="14" rx="3" fill="#FFFFFF" stroke="${wireColor}" stroke-width="1.2" />
          <text x="${badgeX}" y="${badgeY + 3.5}" fill="${wireColor}" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">${netTag}</text>
        </g>
      </g>
    `;
  });

  svg += `
      </g>
    </svg>
  `;

  container.innerHTML = svg;

  // Add interactive hover highlights with full isolation dimming
  const wiresGroup = container.querySelector('#wires-group');
  const wireNodes = container.querySelectorAll('.interactive-wire');

  wireNodes.forEach(wn => {
    wn.addEventListener('mouseenter', () => {
      const idx = wn.getAttribute('data-wire-idx');
      wiresGroup?.classList.add('has-active');
      wn.classList.add('active-wire');
      highlightWiringTableRow(idx, true);
    });
    wn.addEventListener('mouseleave', () => {
      const idx = wn.getAttribute('data-wire-idx');
      wiresGroup?.classList.remove('has-active');
      wn.classList.remove('active-wire');
      highlightWiringTableRow(idx, false);
    });
  });
}

// Wire routing style switcher
window.setWireRoutingStyle = function(style) {
  state.wireRoutingStyle = style;
  const project = state.projects.find(p => p.id === state.activeModalProjectId);
  if (!project) return;
  renderFullCircuitSchematic(project);
  showToast(`Switched to ${style === 'orthogonal' ? 'Clean Orthogonal Conduit' : 'S-Curve Cable Harness'} routing!`);
};

// Export schematic diagram as SVG file
window.downloadSchematicSVG = function() {
  const svgEl = document.querySelector('#schematic-svg-mount svg');
  if (!svgEl) return;
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.activeModalProjectId || 'circuit'}_schematic.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded high-precision circuit schematic (SVG)!');
};

// Render dynamic visual graphics for specific sensors inside the module box
function renderSensorGraphic(sensorName) {
  const name = sensorName.toLowerCase();
  
  if (name.includes('ultrasonic') || name.includes('hc-sr04')) {
    return `
      <!-- Dual Ultrasonic Transducers -->
      <g transform="translate(180, 75)">
        <circle cx="45" cy="55" r="38" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2" />
        <circle cx="45" cy="55" r="28" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5" />
        <circle cx="45" cy="55" r="10" fill="#1E293B" />
        <text x="45" y="115" fill="#475569" font-size="10" font-weight="bold" text-anchor="middle">T (40kHz Tx)</text>

        <circle cx="140" cy="55" r="38" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2" />
        <circle cx="140" cy="55" r="28" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5" />
        <circle cx="140" cy="55" r="10" fill="#1E293B" />
        <text x="140" y="115" fill="#475569" font-size="10" font-weight="bold" text-anchor="middle">R (40kHz Rx)</text>
      </g>
    `;
  }

  if (name.includes('bme280') || name.includes('barometer')) {
    return `
      <!-- BME280 Metal Can & Pressure Port -->
      <g transform="translate(190, 80)">
        <rect width="130" height="90" rx="8" fill="#7C3AED" stroke="#5B21B6" stroke-width="2" />
        <rect x="35" y="20" width="60" height="50" rx="4" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5" />
        <circle cx="50" cy="45" r="4" fill="#1E293B" />
        <text x="65" y="85" fill="#EDE9FE" font-size="9" font-weight="bold" text-anchor="middle">MEMS SENSOR</text>
      </g>
    `;
  }

  if (name.includes('mpu') || name.includes('seismograph') || name.includes('gyro')) {
    return `
      <!-- MPU-6050 Accelerometer Chip -->
      <g transform="translate(190, 80)">
        <rect width="130" height="90" rx="8" fill="#2563EB" stroke="#1D4ED8" stroke-width="2" />
        <rect x="40" y="20" width="50" height="50" rx="3" fill="#0F172A" />
        <text x="65" y="48" fill="#93C5FD" font-size="8" font-family="monospace" text-anchor="middle">MPU-6050</text>
        <path d="M 65 30 L 65 15 M 65 30 L 80 30" stroke="#F59E0B" stroke-width="2" />
        <text x="65" y="12" fill="#F59E0B" font-size="7">Y</text>
        <text x="84" y="33" fill="#F59E0B" font-size="7">X</text>
      </g>
    `;
  }

  // Generic Sensor Graphic
  return `
    <g transform="translate(190, 80)">
      <rect width="140" height="90" rx="8" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
      <circle cx="70" cy="45" r="22" fill="#DBEAFE" stroke="#2563EB" stroke-width="2" />
      <text x="70" y="50" fill="#1E3A8A" font-size="11" font-weight="bold" text-anchor="middle">ACTIVE</text>
    </g>
  `;
}

// Adapt wiring table according to selected display mode
function adaptWiringForDisplay(wiring, displayMode) {
  if (displayMode === 'lcd') {
    return wiring.map(w => {
      const toLower = w.to.toLowerCase();
      if (toLower.includes('oled') || toLower.includes('ssd1306')) {
        if (toLower.includes('vcc')) return { ...w, to: '1602 LCD VCC (5V)', desc: 'LCD Logic & Backlight 5V Power' };
        if (toLower.includes('gnd')) return { ...w, to: '1602 LCD GND', desc: 'System Ground' };
        if (toLower.includes('sda')) return { ...w, to: '1602 LCD SDA', desc: 'I2C Serial Data line' };
        if (toLower.includes('scl')) return { ...w, to: '1602 LCD SCL', desc: 'I2C Serial Clock line' };
      }
      return w;
    });
  }
  return wiring;
}

function highlightWiringTableRow(idx, active) {
  const row = document.querySelector(`.wiring-table-row[data-idx="${idx}"]`);
  if (row) {
    row.style.backgroundColor = active ? '#EFF6FF' : '';
    row.style.outline = active ? '2px solid #3B82F6' : '';
  }
}

// --------------------------------------------------------------------------
// TAB 2: RENDER PINOUT WIRING TABLE
// --------------------------------------------------------------------------
function renderWiringTable(project) {
  const container = document.getElementById('wiring-table-mount');
  if (!container) return;

  const rawWiring = project.wiringTable || [];
  const wiring = adaptWiringForDisplay(rawWiring, state.displayHardware);

  container.innerHTML = `
    <div class="table-wrap">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Wire Color</th>
            <th>Source Pin (${project.board})</th>
            <th>Direction</th>
            <th>Target Module Pin</th>
            <th>Signal Description / Voltage</th>
          </tr>
        </thead>
        <tbody>
          ${wiring.map((w, idx) => {
            const hex = WIRE_COLORS[w.color] || '#2563EB';
            return `
              <tr class="wiring-table-row" data-idx="${idx}" onmouseenter="highlightSchematicWire(${idx}, true)" onmouseleave="highlightSchematicWire(${idx}, false)">
                <td>
                  <span class="wire-badge" style="background:${hex}1A; color:${hex}; border: 1px solid ${hex}4D;">
                    <span style="width:8px; height:8px; border-radius:50%; background:${hex}; display:inline-block;"></span>
                    ${w.color.toUpperCase()}
                  </span>
                </td>
                <td><b>${w.from}</b></td>
                <td style="color:#64748B;">➔</td>
                <td><b style="color:#1E3A8A;">${w.to}</b></td>
                <td>${w.desc}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.highlightSchematicWire = function(idx, active) {
  const wiresGroup = document.querySelector('#wires-group');
  const wire = document.querySelector(`.interactive-wire[data-wire-idx="${idx}"]`);
  if (wiresGroup) {
    wiresGroup.classList.toggle('has-active', active);
  }
  if (wire) {
    wire.classList.toggle('active-wire', active);
  }
};

// --------------------------------------------------------------------------
// TAB 3: RENDER FIRMWARE SOURCE CODE (WITH DYNAMIC LCD CONVERSION)
// --------------------------------------------------------------------------
function renderCodeTab(project) {
  const container = document.getElementById('code-mount');
  if (!container) return;

  const displayMode = state.displayHardware;
  const code = getAdaptedCode(project, displayMode);
  const lines = code.split('\n').length;
  const isLcdMode = displayMode === 'lcd';

  container.innerHTML = `
    <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:10px 16px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
      <div style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:#1E3A8A; font-weight:600;">
        <span>${isLcdMode ? '📟 Display Target: 16x2 Character LCD (LiquidCrystal_I2C)' : '📺 Display Target: 0.96" OLED (Adafruit_SSD1306)'}</span>
      </div>
      <span style="font-size:0.75rem; color:#3B82F6;">Code automatically adapts to your chosen hardware above</span>
    </div>

    <div class="code-header-bar">
      <div class="code-window-dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span style="margin-left: 10px; color: #94A3B8;">${project.id}_${displayMode}.ino (${lines} lines)</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-copy-code" onclick="copyProjectCode()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Code
        </button>
        <button class="btn-copy-code" onclick="downloadCurrentProjectIno()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download .ino
        </button>
      </div>
    </div>
    <pre class="code-pre-box"><code>${escapeHtml(code)}</code></pre>
  `;
}

// Generate code adapted to chosen display mode
function getAdaptedCode(project, displayMode) {
  let code = project.code || '// No code provided';

  // If LCD mode is selected and project originally used SSD1306 OLED:
  if (displayMode === 'lcd' && (code.includes('Adafruit_SSD1306') || code.includes('SSD1306'))) {
    // Replace SSD1306 includes with LiquidCrystal_I2C
    code = `// =========================================================================
// OMNILAB ADAPTED FIRMWARE: 16x2 I2C LCD VARIANT (HD44780 + PCF8574)
// I2C Address: 0x27 or 0x3F | SDA: A4/GPIO 21 | SCL: A5/GPIO 22
// =========================================================================

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
` + code;

    code = code.replace(/#include <Adafruit_GFX.h>\n/g, '');
    code = code.replace(/#include <Adafruit_SSD1306.h>\n/g, '');
    code = code.replace(/#define SCREEN_WIDTH 128\n#define SCREEN_HEIGHT 64\n#define OLED_RESET -1\nAdafruit_SSD1306 display\(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET\);/g, 'LiquidCrystal_I2C lcd(0x27, 16, 2);');
    code = code.replace(/Adafruit_SSD1306 display\(128, 64, &Wire, -1\);/g, 'LiquidCrystal_I2C lcd(0x27, 16, 2);');
    code = code.replace(/display\.begin\(SSD1306_SWITCHCAPVCC, 0x3C\);/g, 'lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print("Innovation Hub");');
    code = code.replace(/display\.clearDisplay\(\);/g, 'lcd.clear();');
    code = code.replace(/display\.display\(\);/g, '// lcd updated');
    code = code.replace(/display\.setTextColor\(WHITE\);/g, '');
    code = code.replace(/display\.setTextColor\(SSD1306_WHITE\);/g, '');
    code = code.replace(/display\.setTextSize\(\d\);/g, '');
    code = code.replace(/display\.drawLine\(.+?\);/g, '');
    code = code.replace(/display\.setCursor\(0, 0\);/g, 'lcd.setCursor(0, 0);');
    code = code.replace(/display\.setCursor\(0, \d+\);/g, 'lcd.setCursor(0, 1);');
    code = code.replace(/display\.print\(/g, 'lcd.print(');
    code = code.replace(/display\.println\(/g, 'lcd.print(');
    code = code.replace(/display\.printf\("(.+?)"/g, 'lcd.print("$1"');
  }

  return code;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.copyProjectCode = function() {
  const project = state.projects.find(p => p.id === state.activeModalProjectId);
  if (!project) return;
  const code = getAdaptedCode(project, state.displayHardware);
  navigator.clipboard.writeText(code).then(() => {
    showToast('Source code copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy code to clipboard.');
  });
};

window.downloadCurrentProjectIno = function() {
  const project = state.projects.find(p => p.id === state.activeModalProjectId);
  if (!project) return;
  const code = getAdaptedCode(project, state.displayHardware);
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.id}_${state.displayHardware}.ino`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${project.id}_${state.displayHardware}.ino`);
};

// --------------------------------------------------------------------------
// TAB 4: RENDER SCIENTIFIC WORKING PRINCIPLE & THEORY
// --------------------------------------------------------------------------
function renderPrincipleTab(project) {
  const container = document.getElementById('principle-mount');
  if (!container) return;

  container.innerHTML = `
    <div class="principle-card">
      <h4 class="section-h4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        Scientific Working Mechanism & Underlying Physics
      </h4>
      <p class="principle-prose">${project.workingPrinciple}</p>

      <div class="callout-box">
        <b>Core Scientific Formula & Law:</b><br/>
        This experiment directly proves empirical fundamental physical relationships. Microcontroller ADC registers and communication buses translate continuous analog physical phenomena into digitized SI metric quantities calibrated against reference voltages.
      </div>

      <div class="app-ideas-box">
        <b>Real-World & Laboratory Applications:</b><br/>
        ${project.scientificApplications || 'Standard scientific sensing and industrial automation.'}
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// TAB 5: RENDER ASSEMBLY GUIDE & COMPONENTS BOM
// --------------------------------------------------------------------------
function renderAssemblyTab(project) {
  const container = document.getElementById('assembly-mount');
  if (!container) return;

  const steps = project.assemblySteps || [
    "Insert microcontroller board into breadboard.",
    "Wire 5V/3.3V power rails and Ground.",
    "Connect sensors according to pinout table.",
    "Flash Arduino sketch and verify Serial outputs."
  ];

  let components = project.components || [];

  // Adapt components list if user selected 16x2 LCD
  if (state.displayHardware === 'lcd') {
    components = components.map(c => {
      if (c.name.toLowerCase().includes('oled')) {
        return {
          name: '16x2 Character LCD with I2C Backpack (PCF8574)',
          qty: '1',
          note: 'HD44780 compatible, I2C address 0x27 or 0x3F'
        };
      }
      return c;
    });
  }

  container.innerHTML = `
    <div class="principle-card">
      <h4 class="section-h4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Bill of Materials (BOM Checklist)
      </h4>
      <p style="font-size:0.875rem; color:#64748B; margin-bottom:12px;">
        ${state.displayHardware === 'lcd' ? 'Updated to include 16x2 I2C LCD display' : 'Check off parts as you gather them from your laboratory or maker kit:'}
      </p>
      
      <div class="bom-checklist">
        ${components.map((c, i) => `
          <label class="bom-item" style="cursor:pointer;">
            <div class="bom-left">
              <input type="checkbox" id="bom-chk-${i}">
              <span style="font-weight:600; color:#1E293B;">${c.name}</span>
              ${c.note ? `<span style="font-size:0.8rem; color:#64748B;">(${c.note})</span>` : ''}
            </div>
            <span class="bom-qty">Qty: ${c.qty}</span>
          </label>
        `).join('')}
      </div>
    </div>

    <div class="principle-card" style="margin-top:24px;">
      <h4 class="section-h4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
        Step-by-Step Lab Assembly Guide
      </h4>
      <ol class="step-list">
        ${steps.map(step => `
          <li class="step-item">${step}</li>
        `).join('')}
      </ol>
    </div>
  `;
}

function initScrollReveal() {
  if (typeof IntersectionObserver === 'undefined') return;

  const targets = document.querySelectorAll(
    '.home-section, .stat-item, .pillar-card, .section-header-center, .stats-bar'
  );

  targets.forEach((el, index) => {
    el.classList.add('reveal-on-scroll');
    if (el.classList.contains('stat-item') || el.classList.contains('pillar-card')) {
      el.style.transitionDelay = `${(index % 4) * 0.08}s`;
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  });

  targets.forEach(el => observer.observe(el));
}

