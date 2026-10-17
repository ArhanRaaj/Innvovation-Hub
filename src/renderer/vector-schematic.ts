import type { ScienceProject, DisplayHardwareMode } from '../types.ts';
import { projectRequiresDisplay } from './circuit-renderer.ts';

export function renderVectorSchematic(
  project: ScienceProject,
  displayMode: DisplayHardwareMode
): string {
  const isArduino = project.board.toLowerCase().includes('arduino');
  const allModules = project.circuitDiagram?.modules || [];
  const needsDisplay = projectRequiresDisplay(project);
  
  // Filter out display modules if project does not require a display
  const modules = allModules.filter(m => {
    if (m.type === 'display') return needsDisplay;
    return true;
  });

  let svg = `
    <!-- Technical Blueprint Schematic Grid -->
    <g class="blueprint-base">
      <!-- Grid Markings -->
      <line x1="40" y1="45" x2="960" y2="45" stroke="#262626" stroke-width="1.2" stroke-dasharray="6,4"/>
      <line x1="40" y1="560" x2="960" y2="560" stroke="#262626" stroke-width="1.2" stroke-dasharray="6,4"/>
      <text x="50" y="38" fill="#737373" font-size="9" font-family="'JetBrains Mono', monospace" font-weight="bold">LAB CAD SCHEMATIC BLUEPRINT // ${project.id.toUpperCase()}</text>
      <text x="820" y="38" fill="#525252" font-size="8.5" font-family="'JetBrains Mono', monospace">REV 3.4 // IEEE COMPLIANT</text>
    </g>
  `;

  // 1. Vector MCU Block
  if (isArduino) {
    svg += `
      <!-- Vector Arduino Uno R3 Symbol Block -->
      <g transform="translate(50, 100)" class="vector-mcu-box">
        <rect width="360" height="340" rx="6" fill="#0D0D0D" stroke="#333333" stroke-width="2"/>
        <rect x="0" y="0" width="360" height="36" rx="5" fill="#171717" stroke="#262626" stroke-width="1"/>
        <text x="18" y="23" fill="#FFFFFF" font-size="11.5" font-weight="bold" font-family="'JetBrains Mono', monospace">ARDUINO UNO R3 [ATMEGA328P]</text>
        
        <!-- Internal Microcontroller Symbol -->
        <rect x="100" y="110" width="160" height="120" rx="4" fill="#050505" stroke="#262626" stroke-width="1.5"/>
        <text x="180" y="155" fill="#FFFFFF" font-size="11" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">ATMEGA328P-PU</text>
        <text x="180" y="175" fill="#737373" font-size="8.5" font-family="'JetBrains Mono', monospace" text-anchor="middle">16MHz AVR RISC</text>

        <!-- Digital Header Pin Sockets (Top) -->
        <g transform="translate(20, 60)">
          <text x="0" y="-8" fill="#A3A3A3" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="bold">DIGITAL (PWM ~)</text>
          ${[
            'SCL', 'SDA', 'ARF', 'GND', '13', '12', '11~', '10~', '9~', '8', '7', '6~', '5~', '4', '3~', '2', 'TX', 'RX'
          ].map((p, i) => `
            <g transform="translate(${i * 18}, 0)">
              <circle cx="0" cy="0" r="4" fill="#141414" stroke="#525252" stroke-width="1.2"/>
              <text x="0" y="14" fill="#D4D4D4" font-size="7" font-family="'JetBrains Mono', monospace" text-anchor="middle">${p}</text>
            </g>
          `).join('')}
        </g>

        <!-- Power & Analog Pin Sockets (Bottom) -->
        <g transform="translate(40, 290)">
          <text x="0" y="22" fill="#A3A3A3" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="bold">POWER / ANALOG</text>
          ${[
            '3V3', '5V', 'GND', 'GND', 'VIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'
          ].map((p, i) => `
            <g transform="translate(${i * 26}, 0)">
              <circle cx="0" cy="0" r="4" fill="#141414" stroke="#525252" stroke-width="1.2"/>
              <text x="0" y="-8" fill="#D4D4D4" font-size="7" font-family="'JetBrains Mono', monospace" text-anchor="middle">${p}</text>
            </g>
          `).join('')}
        </g>
      </g>
    `;
  } else {
    svg += `
      <!-- Vector ESP32 DevKit Symbol Block -->
      <g transform="translate(50, 75)" class="vector-mcu-box">
        <rect width="270" height="470" rx="6" fill="#0D0D0D" stroke="#333333" stroke-width="2"/>
        <rect x="0" y="0" width="270" height="36" rx="5" fill="#171717" stroke="#262626" stroke-width="1"/>
        <text x="18" y="23" fill="#FFFFFF" font-size="11.5" font-weight="bold" font-family="'JetBrains Mono', monospace">ESP32 WROOM-32 [240MHz]</text>

        <!-- Central MCU Core Box -->
        <rect x="50" y="90" width="170" height="230" rx="4" fill="#050505" stroke="#262626" stroke-width="1.5"/>
        <text x="135" y="190" fill="#FFFFFF" font-size="12" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">ESP32-D0WDQ6</text>
        <text x="135" y="210" fill="#737373" font-size="9" font-family="'JetBrains Mono', monospace" text-anchor="middle">Dual Tensilica LX6</text>
        <text x="135" y="228" fill="#A3A3A3" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">Wi-Fi + BLE 4.2</text>

        <!-- Left Pins -->
        ${[
          '3V3', 'EN', 'VP', 'VN', '34', '35', '32', '33', '25', '26', '27', '14', '12', 'GND'
        ].map((p, i) => `
          <g transform="translate(18, ${68 + i * 26})">
            <circle cx="0" cy="0" r="4" fill="#141414" stroke="#525252" stroke-width="1.2"/>
            <text x="10" y="3" fill="#D4D4D4" font-size="7.5" font-family="'JetBrains Mono', monospace" font-weight="bold">${p}</text>
          </g>
        `).join('')}

        <!-- Right Pins -->
        ${[
          'VIN', 'GND', '13', '9', '10', '11', '23', '22', 'TX0', 'RX0', '21', '19', '18', '5'
        ].map((p, i) => `
          <g transform="translate(252, ${68 + i * 26})">
            <circle cx="0" cy="0" r="4" fill="#141414" stroke="#525252" stroke-width="1.2"/>
            <text x="-10" y="3" fill="#D4D4D4" font-size="7.5" font-family="'JetBrains Mono', monospace" font-weight="bold" text-anchor="end">${p}</text>
          </g>
        `).join('')}
      </g>
    `;
  }

  // 2. Vector Modular Component Blocks on Right
  const startX = 540;
  modules.forEach((mod, idx) => {
    const isDisplay = mod.type === 'display';
    const modTitle = isDisplay ? (displayMode === 'lcd' ? '16x2 I2C Character LCD' : '0.96" I2C Monochrome OLED') : mod.name;
    const blockY = 65 + idx * 115;

    svg += `
      <!-- Vector Component Block #${idx + 1}: ${mod.name} -->
      <g transform="translate(${startX}, ${blockY})" class="vector-mod-block">
        <rect width="410" height="95" rx="6" fill="#0D0D0D" stroke="#262626" stroke-width="1.5"/>
        <rect x="0" y="0" width="410" height="26" rx="5" fill="#171717" stroke="#262626" stroke-width="1"/>
        <text x="14" y="17" fill="#FFFFFF" font-size="10.5" font-weight="bold" font-family="'JetBrains Mono', monospace">${modTitle.toUpperCase()}</text>
        <rect x="330" y="4" width="70" height="18" rx="3" fill="#262626" stroke="#404040" stroke-width="0.8"/>
        <text x="365" y="16" fill="#A3A3A3" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="bold" text-anchor="middle">${mod.type.toUpperCase()}</text>

        <!-- Left Wire Entry Solder Eyelets -->
        <g class="vector-wire-terminals">
          ${(mod.pins || []).slice(0, 6).map((_, pi) => `
            <circle cx="0" cy="${32 + pi * 14}" r="4" fill="#141414" stroke="#737373" stroke-width="1.2"/>
          `).join('')}
        </g>

        <!-- Pin Terminals on Face of Module -->
        <g transform="translate(18, 40)">
          ${(mod.pins || []).slice(0, 8).map((p, pi) => {
            const px = (pi % 4) * 98;
            const py = Math.floor(pi / 4) * 24;
            return `
              <g transform="translate(${px}, ${py})">
                <circle cx="6" cy="6" r="3.5" fill="#141414" stroke="#525252" stroke-width="1"/>
                <text x="16" y="9.5" fill="#D4D4D4" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="bold">${p}</text>
              </g>
            `;
          }).join('')}
        </g>
      </g>
    `;
  });

  return svg;
}
