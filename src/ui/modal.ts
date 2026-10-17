// ============================================================================
// OMNILAB SCIENCE PROJECTS - MODAL & TAB CONTROLLER
// Handles multi-tab modal navigation, dynamic tab rendering, and toolbar events.
// ============================================================================

import { ScienceProject, FilterState } from '../types.ts';
import { renderCircuitSchematicSVG, adaptWiringForDisplay } from '../renderer/circuit-renderer.ts';

export function openProjectModal(project: ScienceProject, state: FilterState): void {
  state.activeModalProjectId = project.id;

  const modal = document.getElementById('project-modal');
  const title = document.getElementById('modal-title');
  const boardBadge = document.getElementById('modal-board-badge');
  const displayModeBar = document.getElementById('display-mode-bar');

  if (title) title.textContent = project.title;

  const isArduino = project.board.toLowerCase().includes('arduino');
  if (boardBadge) {
    boardBadge.className = `board-tag ${isArduino ? 'arduino' : 'esp32'}`;
    boardBadge.textContent = project.board;
  }

  // Check if project has display capabilities
  const jsonStr = JSON.stringify(project).toLowerCase();
  const hasDisplay = jsonStr.includes('lcd') || jsonStr.includes('oled') || jsonStr.includes('display');
  if (displayModeBar) {
    displayModeBar.style.display = hasDisplay ? 'flex' : 'none';
  }

  // Update circuit toolbar toggle states
  updateCircuitToolbar(state);

  // Render all tabs
  renderCircuitTab(project, state);
  renderWiringTab(project, state);
  renderCodeTab(project, state);
  renderPrincipleTab(project);
  renderAssemblyTab(project);

  // Switch to default circuit tab
  switchModalTab('tab-circuit');

  // Show modal
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeModal(state: FilterState): void {
  const modal = document.getElementById('project-modal');
  if (modal) modal.classList.remove('active');
  
  // If ai-architect-modal is still open, keep background scroll disabled
  const aiModal = document.getElementById('ai-architect-modal');
  if (aiModal && aiModal.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  state.activeModalProjectId = null;
}

export function switchModalTab(tabId: string): void {
  const tabs = document.querySelectorAll<HTMLElement>('.modal-tab-btn');
  const panes = document.querySelectorAll<HTMLElement>('.tab-pane');

  tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabId));
  panes.forEach(p => p.classList.toggle('active', p.id === tabId));
}

// ----------------------------------------------------------------------------
// TAB 1: CIRCUIT SCHEMATIC
// ----------------------------------------------------------------------------
// Circuit Canvas Zoom & Pan State
let circuitZoomLevel = 1.0;
let circuitPanX = 0;
let circuitPanY = 0;

export function setCircuitZoom(level: number): void {
  circuitZoomLevel = Math.max(0.5, Math.min(3.0, level));
  applyCircuitZoomPan();
}

export function resetCircuitZoom(): void {
  circuitZoomLevel = 1.0;
  circuitPanX = 0;
  circuitPanY = 0;
  applyCircuitZoomPan();
}

export function applyCircuitZoomPan(): void {
  const container = document.getElementById('circuit-zoom-container');
  if (container) {
    container.setAttribute('transform', `translate(${circuitPanX}, ${circuitPanY}) scale(${circuitZoomLevel})`);
  }
  const zoomLabel = document.getElementById('circuit-zoom-val');
  if (zoomLabel) {
    zoomLabel.textContent = `${Math.round(circuitZoomLevel * 100)}%`;
  }
}

export function renderCircuitTab(project: ScienceProject, state: FilterState): void {
  const container = document.getElementById('schematic-svg-mount');
  if (!container) return;

  container.innerHTML = renderCircuitSchematicSVG(
    project,
    state.circuitViewMode,
    state.displayHardware,
    state.wireRoutingStyle,
    state.wireFilter || 'all'
  );

  applyCircuitZoomPan();

  // Setup pan/drag & scroll zoom on SVG
  const svgEl = container.querySelector<SVGSVGElement>('#main-circuit-svg');
  if (svgEl) {
    svgEl.style.cursor = 'grab';
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    svgEl.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('.interactive-wire')) return;
      isDragging = true;
      startX = e.clientX - circuitPanX;
      startY = e.clientY - circuitPanY;
      svgEl.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      circuitPanX = e.clientX - startX;
      circuitPanY = e.clientY - startY;
      applyCircuitZoomPan();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        if (svgEl) svgEl.style.cursor = 'grab';
      }
    });

    svgEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      circuitZoomLevel = Math.max(0.5, Math.min(3.0, circuitZoomLevel * zoomFactor));
      applyCircuitZoomPan();
    }, { passive: false });
  }

  // Bind interactive wire hover events
  const wiresGroup = container.querySelector('#wires-group');
  const wireNodes = container.querySelectorAll('.interactive-wire');

  wireNodes.forEach(wn => {
    wn.addEventListener('mouseenter', () => {
      const idx = wn.getAttribute('data-wire-idx');
      wiresGroup?.classList.add('has-active');
      wn.classList.add('active-wire');
      highlightWiringRow(idx, true);
    });
    wn.addEventListener('mouseleave', () => {
      const idx = wn.getAttribute('data-wire-idx');
      wiresGroup?.classList.remove('has-active');
      wn.classList.remove('active-wire');
      highlightWiringRow(idx, false);
    });
  });
}

function highlightWiringRow(idx: string | null, active: boolean): void {
  if (!idx) return;
  const row = document.querySelector(`.wiring-table-row[data-idx="${idx}"]`);
  if (row) {
    row.classList.toggle('highlighted-row', active);
    if (active) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// Update circuit toolbar buttons active states
export function updateCircuitToolbar(state: FilterState): void {
  const btnReal = document.getElementById('btn-view-real');
  const btnVector = document.getElementById('btn-view-vector');
  const btnOled = document.getElementById('btn-toggle-oled');
  const btnLcd = document.getElementById('btn-toggle-lcd');
  const btnOrtho = document.getElementById('btn-route-ortho');
  const btnCurved = document.getElementById('btn-route-curved');

  const btnFilterAll = document.getElementById('btn-wire-all');
  const btnFilterPower = document.getElementById('btn-wire-power');
  const btnFilterSignals = document.getElementById('btn-wire-signals');

  btnReal?.classList.toggle('active', state.circuitViewMode === 'real');
  btnVector?.classList.toggle('active', state.circuitViewMode === 'vector');
  btnOled?.classList.toggle('active', state.displayHardware === 'oled');
  btnLcd?.classList.toggle('active', state.displayHardware === 'lcd');
  btnOrtho?.classList.toggle('active', state.wireRoutingStyle === 'orthogonal');
  btnCurved?.classList.toggle('active', state.wireRoutingStyle === 'curved');

  const currFilter = state.wireFilter || 'all';
  btnFilterAll?.classList.toggle('active', currFilter === 'all');
  btnFilterPower?.classList.toggle('active', currFilter === 'power');
  btnFilterSignals?.classList.toggle('active', currFilter === 'signals');
}

// ----------------------------------------------------------------------------
// TAB 2: WIRING TABLE
// ----------------------------------------------------------------------------
export function renderWiringTab(project: ScienceProject, state: FilterState): void {
  const mount = document.getElementById('wiring-table-mount');
  if (!mount) return;

  const wiring = adaptWiringForDisplay(project.wiringTable || [], state.displayHardware);

  mount.innerHTML = `
    <div class="table-responsive-wrapper">
      <table class="premium-table">
        <thead>
          <tr>
            <th style="width: 60px;">Wire #</th>
            <th style="width: 200px;">Microcontroller Pin</th>
            <th style="width: 220px;">Target Component Terminal</th>
            <th style="width: 140px;">Wire Color</th>
            <th>Functional Net Description</th>
          </tr>
        </thead>
        <tbody>
          ${wiring.map((w, idx) => `
            <tr class="wiring-table-row" data-idx="${idx}">
              <td><span class="wire-index-pill">${idx + 1}</span></td>
              <td><code class="pin-code from-pin">${w.from}</code></td>
              <td><code class="pin-code to-pin">${w.to}</code></td>
              <td>
                <span class="wire-color-tag ${w.color}">
                  <span class="color-dot" style="background:var(--wire-${w.color}, #3B82F6)"></span>
                  ${w.color.toUpperCase()}
                </span>
              </td>
              <td class="wire-desc">${w.desc}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// TAB 3: SOURCE CODE TAB
// ----------------------------------------------------------------------------
export function renderCodeTab(project: ScienceProject, state: FilterState): void {
  const mount = document.getElementById('code-tab-mount') || document.getElementById('code-block-mount');
  if (!mount) return;

  let codeText = project.code || '// Source code loading...';

  // Automatically adapt code if LCD vs OLED is selected
  if (state.displayHardware === 'oled' && codeText.includes('LiquidCrystal_I2C')) {
    codeText = `// ============================================================================
// OMNILAB FIRMWARE - ADAPTED FOR 0.96" I2C OLED (SSD1306 128x64)
// ============================================================================
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

` + codeText;
  }

  mount.innerHTML = `
    <div class="code-editor-header">
      <div class="code-header-left">
        <span class="code-lang-pill">C++ / Arduino (.ino)</span>
        <span class="code-file-name">${project.id}_firmware.ino</span>
      </div>
      <div class="code-header-actions">
        <button class="btn-code-action" id="btn-copy-code" title="Copy Full Code">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy Code
        </button>
        <button class="btn-code-action" id="btn-download-code" title="Download .ino">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download .ino
        </button>
      </div>
    </div>
    <pre class="code-editor-block"><code id="code-content">${escapeHtml(codeText)}</code></pre>
  `;

  // Bind copy button
  document.getElementById('btn-copy-code')?.addEventListener('click', () => {
    navigator.clipboard.writeText(codeText);
    showModalToast('Source code copied to clipboard!');
  });

  // Bind download button
  document.getElementById('btn-download-code')?.addEventListener('click', () => {
    const blob = new Blob([codeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}_firmware.ino`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showModalToast('Downloaded firmware (.ino)!');
  });
}

// ----------------------------------------------------------------------------
// TAB 4: WORKING PRINCIPLE TAB
// ----------------------------------------------------------------------------
export function renderPrincipleTab(project: ScienceProject): void {
  const mount = document.getElementById('principle-tab-mount');
  if (!mount) return;

  mount.innerHTML = `
    <div class="principle-content-card">
      <div class="principle-section-header">
        <div class="principle-icon-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 2v7.31L4.15 19.3A2 2 0 0 0 5.86 22h12.28a2 2 0 0 0 1.71-2.7L14 9.31V2"/>
            <path d="M8.5 2h7"/>
            <path d="M7 16h10"/>
          </svg>
        </div>
        <div>
          <h3>Scientific Working Principle & Theoretical Physics</h3>
          <p class="section-subtext">Fundamental physics laws, transduction mechanisms, and closed-loop control mathematics</p>
        </div>
      </div>
      
      <div class="principle-body-text">
        <p>${project.workingPrinciple}</p>
      </div>

      <div class="science-apps-box">
        <h4>Real-World & Industrial Scientific Applications</h4>
        <p>${project.scientificApplications}</p>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// TAB 5: ASSEMBLY & BOM TAB
// ----------------------------------------------------------------------------
export function renderAssemblyTab(project: ScienceProject): void {
  const mount = document.getElementById('assembly-tab-mount');
  if (!mount) return;

  const bom = project.components || [];
  const steps = project.assemblySteps || [];

  mount.innerHTML = `
    <div class="assembly-grid">
      <!-- Left Column: Bill of Materials Checklist -->
      <div class="bom-card">
        <div class="card-header-clean">
          <h4>Bill of Materials (BOM Checklist)</h4>
          <span class="badge-counter">${bom.length} Items</span>
        </div>
        <ul class="bom-list">
          ${bom.map((c, i) => `
            <li class="bom-item">
              <input type="checkbox" id="bom-chk-${i}" class="bom-checkbox">
              <label for="bom-chk-${i}" class="bom-label">
                <span class="bom-name">${c.name}</span>
                <span class="bom-qty">Qty: ${c.qty}</span>
                <span class="bom-note">${c.note}</span>
              </label>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Right Column: Step-by-Step Laboratory Assembly -->
      <div class="steps-card">
        <div class="card-header-clean">
          <h4>Step-by-Step Laboratory Assembly Guide</h4>
          <span class="badge-counter">${steps.length} Steps</span>
        </div>
        <ol class="assembly-steps-list">
          ${steps.map((s, idx) => `
            <li class="assembly-step-item">
              <div class="step-num">${idx + 1}</div>
              <div class="step-desc">${s}</div>
            </li>
          `).join('')}
        </ol>
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function showModalToast(msg: string): void {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}
