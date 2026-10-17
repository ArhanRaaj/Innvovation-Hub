// ============================================================================
// OMNILAB SCIENCE PROJECTS - MAIN APPLICATION ENTRY POINT (TypeScript)
// Orchestrates data hydration, interactive schematics, filters, and UI events.
// ============================================================================

import { PROJECTS_DATA } from './data/projects.ts';
import { FilterState, ScienceProject, DisplayHardwareMode, WireRoutingStyle, CircuitViewMode, WireFilterMode } from './types.ts';
import {
  openProjectModal,
  closeModal,
  switchModalTab,
  renderCircuitTab,
  renderWiringTab,
  renderCodeTab,
  renderPrincipleTab,
  renderAssemblyTab,
  updateCircuitToolbar,
  setCircuitZoom,
  resetCircuitZoom
} from './ui/modal.ts';
import {
  filterAndRender,
  renderCategoryChips,
  syncDynamicCounts,
  getProjectCoverImage
} from './ui/filters.ts';
import {
  createProjectFromPrompt,
  modifyProjectWithPrompt,
  getAISettings,
  saveAISettings,
  AIProvider
} from './services/ai-service.ts';
import {
  fetchSupabaseProjects,
  saveProjectToSupabase,
  syncBookmarkToSupabase,
  logAIGeneration
} from './services/supabase.ts';
// @ts-ignore
import {
  initAeroShardsBackground,
  setGenerationThoughtLine
} from './components/mountReactComponents.tsx';
import {
  initAIStudio,
  renderAIStudioModal,
  registerOmniLabStudioGlobals,
  getAllStudioProjects,
  getStudioProjectById
} from './ui/ai-studio.ts';


// ----------------------------------------------------------------------------
// APPLICATION STATE
// ----------------------------------------------------------------------------
const state: FilterState = {
  currentBoard: 'all',
  currentCategory: 'all',
  currentDifficulty: 'all',
  currentSort: 'featured',
  searchQuery: '',
  bookmarkedIds: new Set<string>(JSON.parse(localStorage.getItem('lab_bookmarks') || '[]')),
  displayHardware: 'oled',
  wireRoutingStyle: 'orthogonal',
  circuitViewMode: 'real',
  wireFilter: 'all',
  activeModalProjectId: null,
  activeModalTab: 'tab-circuit'
};

// Global OmniLab API for HTML onclick attributes & toolbar handlers
declare global {
  interface Window {
    omniLab: {
      openModal: (id: string) => void;
      closeModal: () => void;
      switchTab: (tabId: string) => void;
      toggleBookmark: (id: string) => void;
      setViewMode: (mode: CircuitViewMode) => void;
      setDisplayHardware: (mode: DisplayHardwareMode) => void;
      setWireRoutingStyle: (style: WireRoutingStyle) => void;
      setWireFilter: (filter: WireFilterMode) => void;
      zoomCircuit: (direction: 'in' | 'out' | 'reset') => void;
      toggleCircuitFullscreen: () => void;
      downloadSchematicSVG: () => void;
      resetFilters: () => void;
      // AI Capabilities
      openAIArchitectModal: () => void;
      closeAIArchitectModal: () => void;
      fillHeroPrompt: (prompt: string) => void;
      fillAITextarea: (prompt: string) => void;
      submitHeroAIPrompt: (prompt?: string) => Promise<void>;
      generateProjectFromModal: () => Promise<void>;
      changeAIProvider: (provider: string) => void;
      updateCustomAIKey: (key: string) => void;
      toggleAIModifyBar: () => void;
      fillQuickMod: (text: string) => void;
      submitProjectModification: () => Promise<void>;
      setLayoutView: (mode: 'grid' | 'table') => void;
      toggleSavedFilter: () => void;
      runFilterSync: () => void;
    };
  }
}

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initOmniLab();
});

function initOmniLab(): void {
  // Ensure curated repository stays pristine
  try {
    const savedSessions = localStorage.getItem('omnilab_studio_sessions');
    if (savedSessions) {
      let sessions = JSON.parse(savedSessions);
      sessions = sessions.filter((s: any) => !s.title?.toLowerCase().includes('uhm') && !s.title?.toLowerCase().includes('edition'));
      localStorage.setItem('omnilab_studio_sessions', JSON.stringify(sessions));
    }
  } catch {}

  // Sync statistics counters
  syncDynamicCounts(PROJECTS_DATA);

  // Render category chips
  renderCategoryChips(PROJECTS_DATA, state, () => {
    filterAndRender(PROJECTS_DATA, state);
  });

  // Initial grid render
  filterAndRender(PROJECTS_DATA, state);

  // Background hydration of community & AI projects from Supabase
  fetchSupabaseProjects().then(cloudProjects => {
    if (cloudProjects && cloudProjects.length > 0) {
      let added = false;
      for (const cp of cloudProjects) {
        if (!PROJECTS_DATA.some(p => p.id === cp.id)) {
          PROJECTS_DATA.push(cp);
          added = true;
        }
      }
      if (added) {
        syncDynamicCounts(PROJECTS_DATA);
        filterAndRender(PROJECTS_DATA, state);
      }
    }
  }).catch(() => {});

  // Bind UI event listeners
  bindFilterEvents();
  bindModalToolbarEvents();

  // Initialize AI Studio (Antigravity & ChatGPT UI)
  initAIStudio();
  registerOmniLabStudioGlobals(
    PROJECTS_DATA,
    state,
    () => {
      syncDynamicCounts(PROJECTS_DATA);
      filterAndRender(PROJECTS_DATA, state);
    },
    showToast
  );
  if (document.getElementById('ai-architect-modal')) {
    renderAIStudioModal('ai-architect-modal');
  }
  if (document.getElementById('dedicated-studio-mount')) {
    renderAIStudioModal('dedicated-studio-mount');
  }

  // Render home page featured projects
  renderHomeFeaturedProjects();

  // Initialize smooth scroll-driven entrance animations
  initScrollRevealAnimations();

  // Single project page hydration
  const isProjectPage = window.location.pathname.includes('project.html') || document.getElementById('single-project-view') !== null;
  if (isProjectPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const projId = urlParams.get('id') || 'ultrasonic-radar-system';
    initSingleProjectPage(projId);
  }

  // Initialize dynamic WebGPU background
  initAeroShardsBackground();

  // Expose global bridge
  window.omniLab = {
    openModal: (id: string) => {
      let p = PROJECTS_DATA.find(item => item.id === id);
      if (!p) {
        p = getStudioProjectById(id);
        if (p && !PROJECTS_DATA.some(x => x.id === p!.id)) {
          PROJECTS_DATA.unshift(p);
        }
      }
      if (p) openProjectModal(p, state);
      else showToast('Could not find hardware project specifications');
    },
    closeModal: () => closeModal(state),
    switchTab: (tabId: string) => switchModalTab(tabId),
    toggleBookmark: (id: string) => {
      const isBookmarked = state.bookmarkedIds.has(id);
      if (isBookmarked) {
        state.bookmarkedIds.delete(id);
        showToast('Removed from saved projects');
        syncBookmarkToSupabase(id, false);
      } else {
        state.bookmarkedIds.add(id);
        showToast('Saved to lab bookmarks');
        syncBookmarkToSupabase(id, true);
      }
      localStorage.setItem('lab_bookmarks', JSON.stringify([...state.bookmarkedIds]));
      updateNavBookmarkBadge();
      filterAndRender(PROJECTS_DATA, state);
    },
    setViewMode: (mode: CircuitViewMode) => {
      state.circuitViewMode = mode;
      updateCircuitToolbar(state);
      refreshActiveModalSchematic();
      showToast(mode === 'real' ? 'Switched to Photorealistic Real Components View!' : 'Switched to Technical Blueprint Schematic!');
    },
    setDisplayHardware: (mode: DisplayHardwareMode) => {
      state.displayHardware = mode;
      updateCircuitToolbar(state);
      refreshActiveModalSchematic();
      showToast(mode === 'lcd' ? 'Switched to 16x2 I2C LCD! Schematic, pins & code updated.' : 'Switched to 0.96" I2C OLED! Schematic, pins & code updated.');
    },
    setWireRoutingStyle: (style: WireRoutingStyle) => {
      state.wireRoutingStyle = style;
      updateCircuitToolbar(state);
      refreshActiveModalSchematic();
      showToast(style === 'orthogonal' ? 'Switched to Clean Orthogonal Conduit routing!' : 'Switched to S-Curve Cable Harness routing!');
    },
    setWireFilter: (filter: WireFilterMode) => {
      state.wireFilter = filter;
      updateCircuitToolbar(state);
      refreshActiveModalSchematic();
      showToast(filter === 'all' ? 'Displaying all conductor nets' : (filter === 'power' ? 'Isolating Power (VCC & GND) rails' : 'Isolating Signal (GPIO, I2C, SPI) traces'));
    },
    zoomCircuit: (direction: 'in' | 'out' | 'reset') => {
      if (direction === 'reset') {
        resetCircuitZoom();
        showToast('Zoom reset to 100%');
      } else {
        const zoomLabel = document.getElementById('circuit-zoom-val');
        const currentZoom = zoomLabel ? parseInt(zoomLabel.textContent || '100', 10) / 100 : 1.0;
        const nextZoom = direction === 'in' ? currentZoom + 0.2 : currentZoom - 0.2;
        setCircuitZoom(nextZoom);
      }
    },
    toggleCircuitFullscreen: () => {
      const box = document.querySelector('.schematic-box') as HTMLElement | null;
      if (!box) return;
      if (!document.fullscreenElement) {
        box.requestFullscreen?.().catch(() => {});
        box.classList.add('fullscreen-schematic');
      } else {
        document.exitFullscreen?.().catch(() => {});
        box.classList.remove('fullscreen-schematic');
      }
    },
    downloadSchematicSVG: () => {
      const svgEl = document.querySelector('#schematic-svg-mount svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.activeModalProjectId || 'circuit'}_${state.circuitViewMode}_schematic.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded high-precision circuit schematic (SVG)!');
    },
    resetFilters: () => {
      state.currentBoard = 'all';
      state.currentCategory = 'all';
      state.currentDifficulty = 'all';
      state.currentSort = 'featured';
      state.searchQuery = '';
      
      const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
      const searchClear = document.getElementById('search-clear-btn');
      const diffSelect = document.getElementById('difficulty-select') as HTMLSelectElement | null;
      const sortSelect = document.getElementById('sort-select') as HTMLSelectElement | null;

      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.style.display = 'none';
      if (diffSelect) diffSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'featured';

      document.querySelectorAll('.board-btn, .board-seg-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-board') === 'all'));
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-category') === 'All Categories'));
      document.getElementById('hero-bookmark-btn')?.classList.remove('active');

      filterAndRender(PROJECTS_DATA, state);
    },
    setLayoutView: (mode: 'grid' | 'table') => {
      state.viewLayout = mode;
      document.getElementById('btn-view-grid')?.classList.toggle('active', mode === 'grid');
      document.getElementById('btn-view-table')?.classList.toggle('active', mode === 'table');
      filterAndRender(PROJECTS_DATA, state);
      showToast(mode === 'table' ? 'Switched to High-Density Engineering Table View' : 'Switched to Grid Blueprint View');
    },
    toggleSavedFilter: () => {
      if (state.currentCategory === 'saved_bookmarks') {
        state.currentCategory = 'all';
        document.querySelector('.cat-chip[data-category="All Categories"]')?.classList.add('active');
        document.getElementById('hero-bookmark-btn')?.classList.remove('active');
      } else {
        state.currentCategory = 'saved_bookmarks';
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        document.getElementById('hero-bookmark-btn')?.classList.add('active');
      }
      filterAndRender(PROJECTS_DATA, state);
    },
    runFilterSync: () => {
      filterAndRender(PROJECTS_DATA, state);
    },

    // AI Functions (Antigravity & ChatGPT Studio Engine)
    openAIArchitectModal: () => {
      const modal = document.getElementById('ai-architect-modal');
      if (modal) {
        renderAIStudioModal('ai-architect-modal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      setTimeout(() => {
        const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | null;
        input?.focus();
      }, 100);
    },
    closeAIArchitectModal: () => {
      const modal = document.getElementById('ai-architect-modal');
      if (modal) modal.classList.remove('active');
      document.body.style.overflow = '';
    },
    fillHeroPrompt: (prompt: string) => {
      const input = document.getElementById('hero-ai-input') as HTMLInputElement | null;
      if (input) {
        input.value = prompt;
        input.focus();
      }
    },
    fillAITextarea: (prompt: string) => {
      const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | null;
      if (input) {
        input.value = prompt;
        input.focus();
      }
    },
    submitHeroAIPrompt: async (customPrompt?: string) => {
      const input = document.getElementById('hero-ai-input') as HTMLInputElement | null;
      const prompt = (customPrompt || input?.value || '').trim();
      if (!prompt) {
        showToast('Please type a robotics project prompt first!');
        input?.focus();
        return;
      }
      window.omniLab.openAIArchitectModal();
      window.omniLab.fillAITextarea(prompt);
      await window.omniLabStudio.handleSend();
    },
    generateProjectFromModal: async () => {
      await window.omniLabStudio.handleSend();
    },
    changeAIProvider: (provider: string) => {
      saveAISettings({ provider: provider as AIProvider });
      showToast(`Switched AI Engine to: ${provider.toUpperCase()}`);
    },
    updateCustomAIKey: (key: string) => {
      saveAISettings({ apiKey: key.trim() });
      showToast('Custom API key saved securely in browser storage.');
    },
    toggleAIModifyBar: () => {
      const drawer = document.getElementById('ai-modify-drawer');
      if (drawer) {
        const isHidden = drawer.style.display === 'none';
        drawer.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
          document.getElementById('ai-modify-input')?.focus();
        }
      }
    },
    fillQuickMod: (text: string) => {
      const input = document.getElementById('ai-modify-input') as HTMLInputElement | null;
      if (input) {
        input.value = text;
        input.focus();
      }
    },
    submitProjectModification: async () => {
      if (!state.activeModalProjectId) return;
      const currentProject = PROJECTS_DATA.find(p => p.id === state.activeModalProjectId);
      if (!currentProject) return;

      const input = document.getElementById('ai-modify-input') as HTMLInputElement | null;
      const instruction = input?.value.trim();
      if (!instruction) {
        showToast('Please type what you want to modify (e.g. replace buzzer with vibration motor)');
        input?.focus();
        return;
      }

      const submitBtn = document.getElementById('ai-modify-submit-btn') as HTMLButtonElement | null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Applying AI Changes...</span>`;
      }

      try {
        const updatedProject = await modifyProjectWithPrompt(currentProject, instruction);
        
        const idx = PROJECTS_DATA.findIndex(p => p.id === currentProject.id);
        if (idx !== -1) {
          PROJECTS_DATA[idx] = updatedProject;
        }

        openProjectModal(updatedProject, state);
        filterAndRender(PROJECTS_DATA, state);

        if (input) input.value = '';
        const drawer = document.getElementById('ai-modify-drawer');
        if (drawer) drawer.style.display = 'none';

        showToast('✨ Hardware schematic, wiring, and code updated by AI!');
      } catch (err: any) {
        console.error('Modification error:', err);
        showToast('Failed to modify project. Please check network/key.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Apply AI Changes</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
        }
      }
    }
  };

  updateNavBookmarkBadge();
}

function refreshActiveModalSchematic(): void {
  const p = PROJECTS_DATA.find(item => item.id === state.activeModalProjectId);
  if (!p) return;
  renderCircuitTab(p, state);
  renderWiringTab(p, state);
  renderCodeTab(p, state);
  renderAssemblyTab(p);
}

function bindFilterEvents(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const searchClear = document.getElementById('search-clear-btn');
  const boardBtns = document.querySelectorAll<HTMLButtonElement>('.board-btn, .board-seg-btn');
  const diffSelect = document.getElementById('difficulty-select') as HTMLSelectElement | null;
  const sortSelect = document.getElementById('sort-select') as HTMLSelectElement | null;
  const navBookmarkBtn = document.getElementById('bookmark-nav-btn');

  // Search input with smooth debounce
  let searchDebounceTimer: number;
  searchInput?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (searchClear) searchClear.style.display = val.trim() ? 'block' : 'none';
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => {
      state.searchQuery = val.trim();
      filterAndRender(PROJECTS_DATA, state);
    }, 75);
  });

  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    state.searchQuery = '';
    searchClear.style.display = 'none';
    clearTimeout(searchDebounceTimer);
    filterAndRender(PROJECTS_DATA, state);
    searchInput?.focus();
  });

  // Global '/' keyboard shortcut to focus search input
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      searchInput?.focus();
    }
  });

  // Board switch buttons (supports both board-btn and board-seg-btn)
  boardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll<HTMLButtonElement>('.board-btn, .board-seg-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-board') === btn.getAttribute('data-board'));
      });
      state.currentBoard = btn.getAttribute('data-board') || 'all';
      filterAndRender(PROJECTS_DATA, state);
    });
  });

  // Difficulty & Sort Selects
  diffSelect?.addEventListener('change', (e) => {
    state.currentDifficulty = (e.target as HTMLSelectElement).value;
    filterAndRender(PROJECTS_DATA, state);
  });

  sortSelect?.addEventListener('change', (e) => {
    state.currentSort = (e.target as HTMLSelectElement).value;
    filterAndRender(PROJECTS_DATA, state);
  });

  // Nav bookmark filter
  navBookmarkBtn?.addEventListener('click', () => {
    window.omniLab.toggleSavedFilter();
  });
}

function bindModalToolbarEvents(): void {
  const modal = document.getElementById('project-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const tabs = document.querySelectorAll<HTMLButtonElement>('.modal-tab-btn');

  closeBtn?.addEventListener('click', () => closeModal(state));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(state);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
      closeModal(state);
    }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      if (tabId) switchModalTab(tabId);
    });
  });

  // Print button
  document.getElementById('modal-print-btn')?.addEventListener('click', () => {
    window.print();
  });
}

function updateNavBookmarkBadge(): void {
  const count = state.bookmarkedIds.size.toString();
  const el = document.getElementById('nav-bookmark-count');
  const heroEl = document.getElementById('hero-bookmark-count');
  if (el) el.textContent = count;
  if (heroEl) heroEl.textContent = count;
}

function showToast(message: string): void {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function renderHomeFeaturedProjects(): void {
  const mount = document.getElementById('home-featured-grid');
  if (!mount) return;

  const featuredIds = ['ultrasonic-radar-system', 'obstacle-avoiding-robot-car', 'drone-esp32-s3-mini'];
  const featured = PROJECTS_DATA.filter(p => featuredIds.includes(p.id));

  mount.innerHTML = featured.map(p => {
    const isArduino = p.board.toLowerCase().includes('arduino');
    return `
      <div class="project-card" data-project-id="${p.id}">
        <div class="card-top-bar">
          <span class="board-pill ${isArduino ? 'arduino' : 'esp32'}">
            <span class="board-indicator-dot"></span>
            ${p.board}
          </span>
          <span class="card-category-tag">${p.category}</span>
        </div>

        <div class="card-preview-banner" onclick="window.omniLab.openModal('${p.id}')">
          <img src="${getProjectCoverImage(p)}" alt="${p.title}" class="card-project-cover-img" loading="lazy" onerror="this.onerror=null; this.src='assets/projects/obstacle-avoiding-robot-car.jpg';" />
          <div class="card-image-overlay"></div>
          <span class="card-inspect-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            Inspect Blueprint
          </span>
        </div>

        <div class="card-body">
          <h3 class="project-title" onclick="window.omniLab.openModal('${p.id}')">${p.title}</h3>
          <p class="project-summary">${p.shortDesc}</p>

          <div class="card-meta-footer" style="margin-top:auto; padding-top:14px; display:flex; gap:8px;">
            <button class="btn-view-project" onclick="window.omniLab.openModal('${p.id}')" style="flex:1;">
              Quick View
            </button>
            <a href="project.html?id=${p.id}" class="nav-cta-glass-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-size:0.8rem; padding:8px 14px;">
              <span>Full Blueprint</span>
              &rarr;
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initSingleProjectPage(id: string): void {
  const p = PROJECTS_DATA.find(item => item.id === id) || PROJECTS_DATA[0];
  state.activeModalProjectId = p.id;

  const titleEl = document.getElementById('project-page-title');
  const summaryEl = document.getElementById('project-page-summary');
  const boardBadge = document.getElementById('project-page-board');
  const diffBadge = document.getElementById('project-page-diff');
  const breadcrumbEl = document.getElementById('project-breadcrumb-title');

  if (titleEl) titleEl.textContent = p.title;
  if (summaryEl) summaryEl.textContent = p.shortDesc;
  if (breadcrumbEl) breadcrumbEl.textContent = p.title;
  if (boardBadge) {
    const isArduino = p.board.toLowerCase().includes('arduino');
    boardBadge.className = `board-pill ${isArduino ? 'arduino' : 'esp32'}`;
    boardBadge.textContent = p.board;
  }
  if (diffBadge) {
    diffBadge.className = `diff-badge ${p.difficulty}`;
    diffBadge.textContent = p.difficulty;
  }

  // Display hardware toggle bar visibility
  const displayModeBar = document.getElementById('display-mode-bar');
  const jsonStr = JSON.stringify(p).toLowerCase();
  const hasDisplay = jsonStr.includes('lcd') || jsonStr.includes('oled') || jsonStr.includes('display');
  if (displayModeBar) {
    displayModeBar.style.display = hasDisplay ? 'flex' : 'none';
  }

  updateCircuitToolbar(state);
  renderCircuitTab(p, state);
  renderWiringTab(p, state);
  renderCodeTab(p, state);
  renderPrincipleTab(p);
  renderAssemblyTab(p);

  // Tab switching for single project page
  const pageTabs = document.querySelectorAll<HTMLButtonElement>('.project-tab-btn');
  pageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      if (!tabId) return;
      pageTabs.forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll<HTMLElement>('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === tabId);
      });
    });
  });
}

export function initScrollRevealAnimations(): void {
  if (typeof IntersectionObserver === 'undefined') return;

  const targets = document.querySelectorAll<HTMLElement>(
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


