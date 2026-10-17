// ============================================================================
// OMNILAB SCIENCE PROJECTS - PHOTOREALISTIC COMPONENT SVG GRAPHICS
// Renders realistic physical components with metallic finishes, textured PCBs,
// wire leads, screws, heatsinks, transducers, and authentic hardware detailing.
// ============================================================================

import type { ScienceProject } from '../types.ts';

// ----------------------------------------------------------------------------
// 1. ARDUINO UNO R3 (Real Photorealistic Board)
// ----------------------------------------------------------------------------
export function renderRealArduinoUno(x: number, y: number): string {
  return `
    <!-- Arduino Uno R3 Physical Board -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Board Base / Blue-Teal FR4 Substrate -->
      <path d="M 0 16 
               L 16 0 
               L 370 0 
               Q 380 0, 380 10 
               L 380 290 
               Q 380 300, 370 300 
               L 10 300 
               Q 0 300, 0 290 
               Z" fill="#008784" stroke="#006361" stroke-width="2"/>
      
      <!-- PCB Ground Plane Chamfer Edge Accent -->
      <rect x="5" y="5" width="370" height="290" rx="8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>

      <!-- 4 Gold Mounting Holes -->
      <circle cx="22" cy="50" r="7" fill="#F8FAFC" stroke="#CA8A04" stroke-width="3"/>
      <circle cx="360" cy="50" r="7" fill="#F8FAFC" stroke="#CA8A04" stroke-width="3"/>
      <circle cx="22" cy="280" r="7" fill="#F8FAFC" stroke="#CA8A04" stroke-width="3"/>
      <circle cx="360" cy="280" r="7" fill="#F8FAFC" stroke="#CA8A04" stroke-width="3"/>

      <!-- USB Type-B Metal Jack -->
      <g transform="translate(-18, 30)">
        <rect width="55" height="52" rx="4" fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        <rect x="6" y="8" width="43" height="36" rx="2" fill="#CBD5E1"/>
        <path d="M 12 14 L 38 14 L 38 38 L 12 38 Z" fill="#475569"/>
        <rect x="18" y="20" width="16" height="12" fill="#F8FAFC" rx="1"/>
        <!-- USB Metallic Highlights -->
        <line x1="2" y1="2" x2="53" y2="2" stroke="#FFFFFF" stroke-width="1.5" opacity="0.6"/>
      </g>

      <!-- DC Barrel Power Jack -->
      <g transform="translate(-15, 195)">
        <rect width="52" height="65" rx="4" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
        <rect x="4" y="6" width="44" height="53" rx="2" fill="#0F172A"/>
        <circle cx="26" cy="32" r="14" fill="#334155"/>
        <circle cx="26" cy="32" r="6" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5"/>
        <!-- Center Positive Pin -->
        <circle cx="26" cy="32" r="2.5" fill="#E2E8F0"/>
      </g>

      <!-- ATmega328P DIP-28 Microcontroller IC Socket & Chip -->
      <g transform="translate(130, 115)">
        <!-- Socket -->
        <rect x="-4" y="-4" width="168" height="58" rx="4" fill="#0B0F19" stroke="#1E293B" stroke-width="1.5"/>
        <!-- Chip Body -->
        <rect width="160" height="50" rx="3" fill="#1E293B" stroke="#334155" stroke-width="1.2"/>
        <!-- Orientation Half-Moon Notch -->
        <path d="M 0 18 A 7 7 0 0 1 0 32" fill="none" stroke="#64748B" stroke-width="2"/>
        <!-- Pin 1 Dot -->
        <circle cx="14" cy="12" r="2.5" fill="#64748B"/>
        <!-- Laser-Etched Text -->
        <text x="85" y="26" fill="#F1F5F9" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">ATMEGA328P-PU</text>
        <text x="85" y="40" fill="#94A3B8" font-size="8.5" font-family="monospace" text-anchor="middle">16MHz / AVR 8-BIT</text>
        <!-- 28 Metallic DIP Leads -->
        ${Array.from({length: 14}).map((_, i) => `
          <rect x="${10 + i * 10.5}" y="-8" width="5" height="5" fill="#CBD5E1" stroke="#64748B" stroke-width="0.5"/>
          <rect x="${10 + i * 10.5}" y="53" width="5" height="5" fill="#CBD5E1" stroke="#64748B" stroke-width="0.5"/>
        `).join('')}
      </g>

      <!-- 16.000 MHz Metal Can Crystal Oscillator -->
      <g transform="translate(78, 126)">
        <rect width="36" height="24" rx="10" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
        <line x1="4" y1="4" x2="32" y2="4" stroke="#FFFFFF" stroke-width="1.5"/>
        <text x="18" y="16" fill="#334155" font-size="7.5" font-weight="bold" font-family="monospace" text-anchor="middle">16.000</text>
      </g>

      <!-- Tactile Reset Pushbutton -->
      <g transform="translate(56, 26)">
        <rect x="-3" y="-3" width="24" height="24" rx="3" fill="#64748B" stroke="#334155" stroke-width="1"/>
        <circle cx="9" cy="9" r="8" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
        <circle cx="9" cy="9" r="4.5" fill="#EF4444"/>
        <text x="9" y="30" fill="#FFFFFF" font-size="7" font-weight="bold" text-anchor="middle">RESET</text>
      </g>

      <!-- 5V Voltage Regulator (AMS1117 / MC33269) -->
      <g transform="translate(48, 168)">
        <rect width="26" height="22" rx="2" fill="#0F172A"/>
        <rect x="6" y="-5" width="14" height="6" fill="#CBD5E1"/>
        <rect x="2" y="21" width="5" height="6" fill="#CBD5E1"/>
        <rect x="10" y="21" width="5" height="6" fill="#CBD5E1"/>
        <rect x="19" y="21" width="5" height="6" fill="#CBD5E1"/>
      </g>

      <!-- Arduino Uno Silkscreen Branding -->
      <text x="210" y="60" fill="#FFFFFF" font-size="16" font-weight="800" text-anchor="middle" letter-spacing="1">ARDUINO</text>
      <text x="210" y="80" fill="#A7F3D0" font-size="12" font-weight="bold" text-anchor="middle">UNO R3</text>
      <path d="M 175 42 Q 185 34, 195 42 T 215 42" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      <path d="M 205 42 Q 215 50, 225 42 T 245 42" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>

      <!-- Top Header Socket Strip: DIGITAL PWM (y = 8) -->
      <rect x="74" y="6" width="296" height="20" rx="3" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
      <text x="145" y="-2" fill="#334155" font-size="8" font-weight="bold">DIGITAL (PWM ~)</text>

      <!-- Bottom Header Socket Strip: POWER & ANALOG (y = 274) -->
      <rect x="78" y="274" width="292" height="20" rx="3" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
      <text x="110" y="306" fill="#334155" font-size="8" font-weight="bold">POWER</text>
      <text x="280" y="306" fill="#334155" font-size="8" font-weight="bold">ANALOG IN</text>

      <!-- Individual Top Header Sockets & Pin Markings -->
      ${[
        {name: 'SCL', x: 84}, {name: 'SDA', x: 100}, {name: 'AREF', x: 116}, {name: 'GND', x: 132},
        {name: '13', x: 148}, {name: '12', x: 164}, {name: '11~', x: 180}, {name: '10~', x: 196},
        {name: '9~', x: 212}, {name: '8', x: 228}, {name: '7', x: 256}, {name: '6~', x: 272},
        {name: '5~', x: 288}, {name: '4', x: 304}, {name: '3~', x: 320}, {name: '2', x: 336},
        {name: 'TX', x: 352}, {name: 'RX', x: 368}
      ].map(p => `
        <circle cx="${p.x}" cy="16" r="4.2" fill="#1E293B" stroke="#0F172A" stroke-width="1.5"/>
        <circle cx="${p.x}" cy="16" r="2.2" fill="#E2E8F0"/>
        <text x="${p.x}" y="32" fill="#FFFFFF" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
      `).join('')}

      <!-- Individual Bottom Header Sockets & Pin Markings -->
      ${[
        {name: 'IOREF', x: 92}, {name: 'RESET', x: 108}, {name: '3V3', x: 124}, {name: '5V', x: 140},
        {name: 'GND', x: 156}, {name: 'GND', x: 172}, {name: 'VIN', x: 188},
        {name: 'A0', x: 232}, {name: 'A1', x: 248}, {name: 'A2', x: 264}, {name: 'A3', x: 280},
        {name: 'A4', x: 296}, {name: 'A5', x: 312}
      ].map(p => `
        <circle cx="${p.x}" cy="284" r="4.2" fill="#1E293B" stroke="#0F172A" stroke-width="1.5"/>
        <circle cx="${p.x}" cy="284" r="2.2" fill="#E2E8F0"/>
        <text x="${p.x}" y="268" fill="#FFFFFF" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
      `).join('')}
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 2. ESP32 NODEMCU DEVKIT V1 (Real Photorealistic Board)
// ----------------------------------------------------------------------------
export function renderRealESP32(x: number, y: number): string {
  return `
    <!-- ESP32 NodeMCU 30-Pin Physical Board -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Black Matte Double-Layer PCB -->
      <rect width="270" height="490" rx="14" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="5" y="5" width="260" height="480" rx="10" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

      <!-- 4 Mounting Screws -->
      <circle cx="18" cy="18" r="5" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>
      <circle cx="252" cy="18" r="5" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>
      <circle cx="18" cy="472" r="5" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>
      <circle cx="252" cy="472" r="5" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>

      <!-- 2.4GHz Gold Meandered PCB Antenna -->
      <g transform="translate(60, 14)">
        <rect width="150" height="38" rx="4" fill="#020617" stroke="#D97706" stroke-width="1.5"/>
        <path d="M 12 30 L 22 15 L 32 30 L 42 15 L 52 30 L 62 15 L 72 30 L 82 15 L 92 30 L 102 15 L 112 30 L 122 15 L 132 30" 
              fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
        <text x="75" y="34" fill="#FCD34D" font-size="7.5" font-weight="bold" font-family="monospace" text-anchor="middle">2.4GHz INVERTED-F ANTENNA</text>
      </g>

      <!-- ESP-WROOM-32 Metallic RF Shield Canister -->
      <g transform="translate(42, 66)">
        <!-- Brushed Silver Metallic Case -->
        <rect width="186" height="230" rx="8" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
        <line x1="8" y1="8" x2="178" y2="8" stroke="#FFFFFF" stroke-width="2" opacity="0.8"/>
        
        <!-- Engraved Logo & Silkscreen Details -->
        <circle cx="93" cy="50" r="22" fill="#0F172A"/>
        <text x="93" y="56" fill="#FFFFFF" font-size="14" font-weight="900" font-family="sans-serif" text-anchor="middle">ESP</text>
        
        <text x="93" y="105" fill="#0F172A" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="1">ESP-WROOM-32</text>
        <text x="93" y="126" fill="#334155" font-size="9.5" font-weight="700" text-anchor="middle">Dual-Core Tensilica LX6 240MHz</text>
        <text x="93" y="144" fill="#475569" font-size="8.5" text-anchor="middle">Wi-Fi 802.11 b/g/n & Bluetooth v4.2 BR/EDR</text>
        
        <!-- Regulatory Silkscreen -->
        <rect x="25" y="160" width="136" height="48" rx="4" fill="#CBD5E1"/>
        <text x="93" y="177" fill="#1E293B" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">FCC ID: 2AC7Z-ESPWROOM32</text>
        <text x="93" y="195" fill="#1E293B" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">CE 0700 / TELEC / RoHS</text>
      </g>

      <!-- CP2102 USB-to-UART Bridge IC -->
      <g transform="translate(112, 330)">
        <rect width="46" height="46" rx="3" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="2" fill="#64748B"/>
        <text x="23" y="27" fill="#94A3B8" font-size="8" font-family="monospace" text-anchor="middle">CP2102</text>
      </g>

      <!-- Micro-USB Interface Port at Bottom Edge -->
      <g transform="translate(105, 465)">
        <rect width="60" height="28" rx="4" fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        <rect x="6" y="6" width="48" height="18" rx="2" fill="#CBD5E1"/>
        <rect x="14" y="10" width="32" height="10" rx="1" fill="#0F172A"/>
        <text x="30" y="24" fill="#F8FAFC" font-size="7" font-weight="bold" font-family="monospace" text-anchor="middle">USB</text>
      </g>

      <!-- Pushbuttons: EN (Reset) & BOOT -->
      <g transform="translate(22, 442)">
        <rect width="28" height="24" rx="3" fill="#334155" stroke="#1E293B" stroke-width="1.5"/>
        <circle cx="14" cy="12" r="6" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <text x="14" y="32" fill="#FFFFFF" font-size="7.5" font-weight="bold" text-anchor="middle">EN</text>
      </g>

      <g transform="translate(220, 442)">
        <rect width="28" height="24" rx="3" fill="#334155" stroke="#1E293B" stroke-width="1.5"/>
        <circle cx="14" cy="12" r="6" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5"/>
        <text x="14" y="32" fill="#FFFFFF" font-size="7.5" font-weight="bold" text-anchor="middle">BOOT</text>
      </g>

      <!-- Left Header Pins (x = 24, 15 pins, step = 26) -->
      ${[
        '3V3', 'EN', 'VP', 'VN', '34', '35', '32', '33', '25', '26', '27', '14', '12', 'GND'
      ].map((p, i) => `
        <circle cx="24" cy="${70 + i * 26}" r="4.2" fill="#E2E8F0" stroke="#0F172A" stroke-width="1.5"/>
        <circle cx="24" cy="${70 + i * 26}" r="1.8" fill="#F8FAFC"/>
        <text x="36" y="${74 + i * 26}" fill="#94A3B8" font-size="8" font-family="monospace" font-weight="bold">${p}</text>
      `).join('')}

      <!-- Right Header Pins (x = 246, 15 pins, step = 26) -->
      ${[
        'VIN', 'GND', '13', '9', '10', '11', '23', '22', 'TX0', 'RX0', '21', '19', '18', '5'
      ].map((p, i) => `
        <circle cx="246" cy="${70 + i * 26}" r="4.2" fill="#E2E8F0" stroke="#0F172A" stroke-width="1.5"/>
        <circle cx="246" cy="${70 + i * 26}" r="1.8" fill="#F8FAFC"/>
        <text x="234" y="${74 + i * 26}" fill="#94A3B8" font-size="8" font-family="monospace" font-weight="bold" text-anchor="end">${p}</text>
      `).join('')}
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 3. CAPACITIVE SOIL MOISTURE SENSOR V1.2
// ----------------------------------------------------------------------------
export function renderRealCapacitiveSoilProbe(x: number, y: number): string {
  return `
    <!-- Capacitive Soil Sensor Probe Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Upper Handle & Electronics PCB -->
      <path d="M 0 0 
               L 160 0 
               Q 165 0, 165 5 
               L 165 95 
               L 125 110 
               L 125 240 
               Q 80 270, 35 240 
               L 35 110 
               L 0 95 
               Z" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      
      <!-- Immersion Limit Silk Indicator -->
      <line x1="35" y1="130" x2="125" y2="130" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4,3"/>
      <text x="80" y="125" fill="#FFFFFF" font-size="7.5" font-weight="bold" font-family="sans-serif" text-anchor="middle">SOIL IMMERSION LINE</text>

      <!-- Insulated Planar Capacitive Traces (Gold Finish) -->
      <path d="M 50 145 L 50 230 Q 80 250, 110 230 L 110 145" fill="none" stroke="#CA8A04" stroke-width="4" stroke-linecap="round"/>
      <path d="M 68 150 L 68 220 Q 80 230, 92 220 L 92 150" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>

      <!-- TLC555 Precision Timer IC -->
      <rect x="60" y="38" width="40" height="30" rx="3" fill="#0F172A" stroke="#334155" stroke-width="1.2"/>
      <text x="80" y="56" fill="#94A3B8" font-size="7.5" font-family="monospace" text-anchor="middle">555 OSC</text>

      <!-- 3-Pin White JST Terminal Block (Top Edge) -->
      <g transform="translate(45, 6)">
        <rect width="70" height="22" rx="3" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
        ${[
          {name: 'AOUT', x: 12, c: '#3B82F6'},
          {name: 'GND', x: 35, c: '#1E293B'},
          {name: 'VCC', x: 58, c: '#EF4444'}
        ].map(p => `
          <circle cx="${p.x}" cy="11" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="28" fill="#CBD5E1" font-size="6.5" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="80" y="88" fill="#F8FAFC" font-size="9" font-weight="bold" text-anchor="middle">CAPACITIVE SOIL v1.2</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 4. 5V OPTOCOUPLED RELAY MODULE (Songle Blue Cube)
// ----------------------------------------------------------------------------
export function renderRealRelayModule(x: number, y: number): string {
  return `
    <!-- 5V Optocoupled Relay Module Physical Board -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Blue PCB Carrier -->
      <rect width="180" height="150" rx="8" fill="#1D4ED8" stroke="#1E40AF" stroke-width="2"/>
      <rect x="4" y="4" width="172" height="142" rx="6" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

      <!-- Songle Blue Power Relay Cube -->
      <g transform="translate(15, 20)">
        <rect width="95" height="110" rx="4" fill="#2563EB" stroke="#1E40AF" stroke-width="2"/>
        <!-- Shiny Plastic Cube Highlight -->
        <line x1="2" y1="4" x2="93" y2="4" stroke="#60A5FA" stroke-width="2"/>
        <text x="47" y="32" fill="#FFFFFF" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle">SONGLE</text>
        <text x="47" y="52" fill="#DBEAFE" font-size="8.5" font-weight="bold" text-anchor="middle">SRD-05VDC-SL-C</text>
        <text x="47" y="72" fill="#BFDBFE" font-size="7.5" font-family="monospace" text-anchor="middle">10A 250VAC</text>
        <text x="47" y="88" fill="#BFDBFE" font-size="7.5" font-family="monospace" text-anchor="middle">10A 30VDC</text>
        <circle cx="47" cy="100" r="3" fill="#F59E0B"/>
      </g>

      <!-- Green High-Voltage Screw Terminal Blocks (Right Edge) -->
      <g transform="translate(125, 20)">
        <rect width="45" height="110" rx="4" fill="#15803D" stroke="#166534" stroke-width="2"/>
        ${[
          {name: 'NO', y: 25},
          {name: 'COM', y: 55},
          {name: 'NC', y: 85}
        ].map(p => `
          <!-- Terminal Chamber & Brass Screw -->
          <rect x="6" y="${p.y - 12}" width="33" height="24" rx="3" fill="#166534"/>
          <circle cx="22" cy="${p.y}" r="8" fill="#CA8A04" stroke="#713F12" stroke-width="1.5"/>
          <line x1="16" y1="${p.y}" x2="28" y2="${p.y}" stroke="#451A03" stroke-width="2"/>
          <text x="2" y="${p.y + 4}" fill="#DCFCE7" font-size="7.5" font-weight="bold" text-anchor="end">${p.name}</text>
        `).join('')}
      </g>

      <!-- Logic Header Pins (VCC, GND, IN) on Left Edge -->
      <g transform="translate(6, 45)">
        ${[
          {name: 'IN', y: 15, c: '#22C55E'},
          {name: 'GND', y: 35, c: '#0F172A'},
          {name: 'VCC', y: 55, c: '#EF4444'}
        ].map(p => `
          <circle cx="0" cy="${p.y}" r="4" fill="#E2E8F0" stroke="#475569" stroke-width="1.5"/>
          <circle cx="0" cy="${p.y}" r="2" fill="${p.c}"/>
          <text x="8" y="${p.y + 3}" fill="#FFFFFF" font-size="7" font-family="monospace" font-weight="bold">${p.name}</text>
        `).join('')}
      </g>

      <!-- Optocoupler EL817 SMD & Status LEDs -->
      <rect x="42" y="6" width="24" height="12" rx="2" fill="#0F172A"/>
      <circle cx="80" cy="12" r="3" fill="#EF4444" stroke="#991B1B" stroke-width="1"/>
      <circle cx="95" cy="12" r="3" fill="#22C55E" stroke="#15803D" stroke-width="1"/>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 5. MINI SUBMERSIBLE WATER PUMP & CLEAR TUBING
// ----------------------------------------------------------------------------
export function renderRealWaterPump(x: number, y: number): string {
  return `
    <!-- Mini Submersible DC Water Pump Physical Unit -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Pump Motor Cylindrical Black Housing -->
      <rect width="110" height="75" rx="10" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      <line x1="4" y1="10" x2="106" y2="10" stroke="#475569" stroke-width="2"/>

      <!-- Water Impeller Volute Snout -->
      <path d="M 110 25 L 140 25 L 140 50 L 110 50 Z" fill="#334155" stroke="#0F172A" stroke-width="2"/>

      <!-- Transparent Flexible Silicone Tubing -->
      <path d="M 140 37 Q 180 37, 195 70 T 220 120" fill="none" stroke="rgba(147, 197, 253, 0.65)" stroke-width="14" stroke-linecap="round"/>
      <path d="M 140 37 Q 180 37, 195 70 T 220 120" fill="none" stroke="#60A5FA" stroke-width="2" stroke-dasharray="8,6"/>

      <!-- Rubber Suction Mounting Feet -->
      <circle cx="20" cy="78" r="8" fill="#0F172A"/>
      <circle cx="90" cy="78" r="8" fill="#0F172A"/>

      <!-- Power Leads (Red +5V, Black GND) -->
      <path d="M 0 30 Q -25 30, -35 50" fill="none" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
      <path d="M 0 45 Q -25 45, -35 65" fill="none" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
      <circle cx="-35" cy="50" r="3.5" fill="#EF4444"/>
      <circle cx="-35" cy="65" r="3.5" fill="#0F172A"/>

      <text x="55" y="42" fill="#F8FAFC" font-size="9" font-weight="bold" font-family="sans-serif" text-anchor="middle">DC 3-6V PUMP</text>
      <text x="55" y="56" fill="#94A3B8" font-size="7.5" text-anchor="middle">SUBMERSIBLE 120L/H</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 6. SG90 MICRO SERVO MOTOR (Translucent Blue Body & White Horn)
// ----------------------------------------------------------------------------
export function renderRealSG90Servo(x: number, y: number): string {
  return `
    <!-- SG90 Micro Servo Physical Actuator -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Translucent Blue Casing -->
      <rect width="120" height="90" rx="6" fill="#2563EB" opacity="0.9" stroke="#1D4ED8" stroke-width="2"/>
      <!-- Mounting Flanges on Sides -->
      <rect x="-14" y="24" width="14" height="20" rx="2" fill="#1D4ED8"/>
      <circle cx="-7" cy="34" r="3" fill="#F8FAFC"/>
      <rect x="120" y="24" width="14" height="20" rx="2" fill="#1D4ED8"/>
      <circle cx="127" cy="34" r="3" fill="#F8FAFC"/>

      <!-- Geared Output Spindle Cylinder -->
      <circle cx="88" cy="45" r="22" fill="#1E40AF" stroke="#1D4ED8" stroke-width="2"/>
      <circle cx="88" cy="45" r="14" fill="#3B82F6"/>

      <!-- White Nylon Double-Arm Horn / Lever -->
      <g transform="translate(88, 45) rotate(25)">
        <path d="M -10 -8 L 50 -5 Q 56 0, 50 5 L -10 8 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="9" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
        <!-- Brass Center Attachment Screw -->
        <circle cx="0" cy="0" r="4" fill="#CA8A04" stroke="#713F12" stroke-width="1"/>
        <line x1="-2" y1="-2" x2="2" y2="2" stroke="#451A03" stroke-width="1.5"/>
        <!-- Horn Linkage Holes -->
        <circle cx="18" cy="0" r="2" fill="#94A3B8"/>
        <circle cx="30" cy="0" r="2" fill="#94A3B8"/>
        <circle cx="42" cy="0" r="2" fill="#94A3B8"/>
      </g>

      <!-- Label Sticker -->
      <rect x="12" y="24" width="56" height="42" rx="3" fill="#1E3A8A"/>
      <text x="40" y="42" fill="#FFFFFF" font-size="10" font-weight="900" text-anchor="middle">TowerPro</text>
      <text x="40" y="56" fill="#FDE047" font-size="9" font-weight="bold" text-anchor="middle">SG90 9g</text>

      <!-- 3-Wire Ribbon Cable (Orange Signal, Red 5V, Brown GND) -->
      <g transform="translate(0, 68)">
        <path d="M 0 0 Q -20 0, -35 15" fill="none" stroke="#F97316" stroke-width="3"/>
        <path d="M 0 5 Q -20 5, -35 20" fill="none" stroke="#DC2626" stroke-width="3"/>
        <path d="M 0 10 Q -20 10, -35 25" fill="none" stroke="#78350F" stroke-width="3"/>
        <circle cx="-35" cy="15" r="3" fill="#F97316"/>
        <circle cx="-35" cy="20" r="3" fill="#DC2626"/>
        <circle cx="-35" cy="25" r="3" fill="#78350F"/>
      </g>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 7. RC522 13.56MHz RFID READER MODULE
// ----------------------------------------------------------------------------
export function renderRealRC522Module(x: number, y: number): string {
  return `
    <!-- RC522 13.56MHz RFID Module Physical Board -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Royal Blue PCB -->
      <rect width="180" height="240" rx="10" fill="#1E3A8A" stroke="#1D4ED8" stroke-width="2"/>
      <rect x="5" y="5" width="170" height="230" rx="8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>

      <!-- Concentric PCB Loop Antenna Traces (Gold) -->
      <g transform="translate(15, 15)">
        <rect width="150" height="120" rx="12" fill="#172554" stroke="#F59E0B" stroke-width="2.5"/>
        <rect x="8" y="8" width="134" height="104" rx="8" fill="none" stroke="#F59E0B" stroke-width="1.8"/>
        <rect x="16" y="16" width="118" height="88" rx="6" fill="none" stroke="#F59E0B" stroke-width="1.8"/>
        <rect x="24" y="24" width="102" height="72" rx="4" fill="none" stroke="#F59E0B" stroke-width="1.8"/>
        <text x="75" y="65" fill="#FDE047" font-size="12" font-weight="bold" font-family="monospace" text-anchor="middle">13.56 MHz</text>
        <text x="75" y="82" fill="#FDE047" font-size="8.5" font-family="monospace" text-anchor="middle">RFID LOOP ANT</text>
      </g>

      <!-- NXP MFRC522 Transceiver IC -->
      <g transform="translate(70, 150)">
        <rect width="40" height="40" rx="3" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="2" fill="#64748B"/>
        <text x="20" y="24" fill="#93C5FD" font-size="7.5" font-family="monospace" text-anchor="middle">MFRC</text>
        <text x="20" y="34" fill="#93C5FD" font-size="7.5" font-family="monospace" text-anchor="middle">522</text>
      </g>

      <!-- 27.120 MHz Crystal Oscillator -->
      <rect x="25" y="158" width="28" height="18" rx="8" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.2"/>
      <text x="39" y="170" fill="#334155" font-size="6.5" font-weight="bold" text-anchor="middle">27.12</text>

      <!-- 8-Pin Gold Header Pins at Bottom Edge (3.3V, RST, GND, MISO, MOSI, SCK, NSS, IRQ) -->
      <g transform="translate(18, 215)">
        ${[
          {name: '3.3V', x: 0}, {name: 'RST', x: 20}, {name: 'GND', x: 40}, {name: 'IRQ', x: 60},
          {name: 'MISO', x: 80}, {name: 'MOSI', x: 100}, {name: 'SCK', x: 120}, {name: 'SDA', x: 140}
        ].map(p => `
          <rect x="${p.x - 4}" y="0" width="8" height="14" fill="#CA8A04" stroke="#713F12" stroke-width="1"/>
          <circle cx="${p.x}" cy="7" r="2.5" fill="#FEF08A"/>
          <text x="${p.x}" y="-4" fill="#FFFFFF" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 8. HC-SR04 ULTRASONIC SENSOR MODULE
// ----------------------------------------------------------------------------
export function renderRealUltrasonicSensor(x: number, y: number): string {
  return `
    <!-- HC-SR04 Ultrasonic Distance Sensor Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Blue PCB Board -->
      <rect width="210" height="110" rx="8" fill="#1D4ED8" stroke="#1E40AF" stroke-width="2"/>
      <rect x="4" y="4" width="202" height="102" rx="6" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

      <!-- Transmit Ultrasonic Transducer (T Cylinder) -->
      <g transform="translate(52, 55)">
        <circle cx="0" cy="0" r="38" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2.5"/>
        <circle cx="0" cy="0" r="30" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/>
        <!-- Mesh Screen Pattern -->
        <circle cx="0" cy="0" r="24" fill="#334155"/>
        <circle cx="0" cy="0" r="8" fill="#0F172A"/>
        <text x="0" y="4" fill="#FFFFFF" font-size="10" font-weight="bold" text-anchor="middle">T</text>
        <text x="0" y="-42" fill="#E2E8F0" font-size="8" font-weight="bold" text-anchor="middle">40kHz Tx</text>
      </g>

      <!-- Receive Ultrasonic Transducer (R Cylinder) -->
      <g transform="translate(158, 55)">
        <circle cx="0" cy="0" r="38" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2.5"/>
        <circle cx="0" cy="0" r="30" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/>
        <!-- Mesh Screen Pattern -->
        <circle cx="0" cy="0" r="24" fill="#334155"/>
        <circle cx="0" cy="0" r="8" fill="#0F172A"/>
        <text x="0" y="4" fill="#FFFFFF" font-size="10" font-weight="bold" text-anchor="middle">R</text>
        <text x="0" y="-42" fill="#E2E8F0" font-size="8" font-weight="bold" text-anchor="middle">40kHz Rx</text>
      </g>

      <!-- 4-Pin Male Header Pins at Bottom (VCC, Trig, Echo, GND) -->
      <g transform="translate(75, 100)">
        <rect width="60" height="16" rx="2" fill="#0F172A"/>
        ${[
          {name: 'VCC', x: 8}, {name: 'Trig', x: 23}, {name: 'Echo', x: 38}, {name: 'GND', x: 53}
        ].map(p => `
          <circle cx="${p.x}" cy="8" r="3" fill="#CA8A04" stroke="#713F12" stroke-width="1"/>
          <text x="${p.x}" y="-3" fill="#FFFFFF" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="105" y="24" fill="#FFFFFF" font-size="11" font-weight="bold" text-anchor="middle">HC-SR04 SONAR</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 9. L298N DUAL H-BRIDGE MOTOR DRIVER MODULE
// ----------------------------------------------------------------------------
export function renderRealL298NDriver(x: number, y: number): string {
  return `
    <!-- L298N Dual H-Bridge Motor Driver Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Deep Red FR4 PCB -->
      <rect width="260" height="230" rx="10" fill="#B91C1C" stroke="#991B1B" stroke-width="2"/>
      <rect x="5" y="5" width="250" height="220" rx="8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>

      <!-- Giant Black Aluminum Multi-Finned Heatsink -->
      <g transform="translate(55, 35)">
        <rect width="150" height="85" rx="4" fill="#0F172A" stroke="#334155" stroke-width="2"/>
        <!-- 8 Heatsink Cooling Fins -->
        ${Array.from({length: 8}).map((_, i) => `
          <rect x="${10 + i * 17}" y="5" width="8" height="75" rx="2" fill="#1E293B"/>
          <line x1="${14 + i * 17}" y1="5" x2="${14 + i * 17}" y2="80" stroke="#475569" stroke-width="1.5"/>
        `).join('')}
        <text x="75" y="98" fill="#CBD5E1" font-size="8" font-family="monospace" text-anchor="middle">L298N HEATSINK (2A/CH)</text>
      </g>

      <!-- Screw Terminals Left: Motor A (OUT1, OUT2) -->
      <g transform="translate(10, 50)">
        <rect width="36" height="60" rx="3" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5"/>
        <circle cx="18" cy="20" r="7" fill="#CA8A04"/>
        <line x1="13" y1="20" x2="23" y2="20" stroke="#451A03" stroke-width="1.5"/>
        <circle cx="18" cy="42" r="7" fill="#CA8A04"/>
        <line x1="13" y1="42" x2="23" y2="42" stroke="#451A03" stroke-width="1.5"/>
        <text x="18" y="72" fill="#FFFFFF" font-size="7.5" font-weight="bold" text-anchor="middle">OUT 1/2</text>
      </g>

      <!-- Screw Terminals Right: Motor B (OUT3, OUT4) -->
      <g transform="translate(214, 50)">
        <rect width="36" height="60" rx="3" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5"/>
        <circle cx="18" cy="20" r="7" fill="#CA8A04"/>
        <line x1="13" y1="20" x2="23" y2="20" stroke="#451A03" stroke-width="1.5"/>
        <circle cx="18" cy="42" r="7" fill="#CA8A04"/>
        <line x1="13" y1="42" x2="23" y2="42" stroke="#451A03" stroke-width="1.5"/>
        <text x="18" y="72" fill="#FFFFFF" font-size="7.5" font-weight="bold" text-anchor="middle">OUT 3/4</text>
      </g>

      <!-- Screw Terminals Bottom: Power Input (+12V, GND, +5V OUT) -->
      <g transform="translate(20, 165)">
        <rect width="75" height="45" rx="3" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5"/>
        <circle cx="15" cy="22" r="6" fill="#CA8A04"/>
        <circle cx="37" cy="22" r="6" fill="#CA8A04"/>
        <circle cx="60" cy="22" r="6" fill="#CA8A04"/>
        <text x="15" y="40" fill="#FFFFFF" font-size="6.5" font-weight="bold" text-anchor="middle">+12V</text>
        <text x="37" y="40" fill="#FFFFFF" font-size="6.5" font-weight="bold" text-anchor="middle">GND</text>
        <text x="60" y="40" fill="#FFFFFF" font-size="6.5" font-weight="bold" text-anchor="middle">+5V</text>
      </g>

      <!-- Logic Control Pins (ENA, IN1, IN2, IN3, IN4, ENB) -->
      <g transform="translate(130, 185)">
        <rect width="115" height="24" rx="2" fill="#0F172A"/>
        ${[
          {name: 'ENA', x: 10}, {name: 'IN1', x: 28}, {name: 'IN2', x: 46},
          {name: 'IN3', x: 64}, {name: 'IN4', x: 82}, {name: 'ENB', x: 100}
        ].map(p => `
          <circle cx="${p.x}" cy="12" r="3" fill="#CA8A04"/>
          <text x="${p.x}" y="-4" fill="#FFFFFF" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 10. TT DC GEARBOX MOTORS (Pair for Robot Wheels)
// ----------------------------------------------------------------------------
export function renderRealDCMotors(x: number, y: number): string {
  return `
    <!-- Dual Yellow TT Gear Motors -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Left Motor -->
      <g transform="translate(0, 0)">
        <rect width="100" height="48" rx="6" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/>
        <circle cx="25" cy="24" r="14" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
        <rect x="21" y="20" width="8" height="8" fill="#1E293B"/>
        <text x="62" y="28" fill="#713F12" font-size="8.5" font-weight="bold">TT MOTOR (L)</text>
        <!-- Motor Terminals -->
        <circle cx="95" cy="15" r="3" fill="#EF4444"/>
        <circle cx="95" cy="33" r="3" fill="#0F172A"/>
      </g>

      <!-- Right Motor -->
      <g transform="translate(0, 65)">
        <rect width="100" height="48" rx="6" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/>
        <circle cx="25" cy="24" r="14" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
        <rect x="21" y="20" width="8" height="8" fill="#1E293B"/>
        <text x="62" y="28" fill="#713F12" font-size="8.5" font-weight="bold">TT MOTOR (R)</text>
        <!-- Motor Terminals -->
        <circle cx="95" cy="15" r="3" fill="#EF4444"/>
        <circle cx="95" cy="33" r="3" fill="#0F172A"/>
      </g>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 11. ACTIVE PIEZO BUZZER
// ----------------------------------------------------------------------------
export function renderRealBuzzer(x: number, y: number): string {
  return `
    <!-- Active Piezo Buzzer Physical Unit -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Black Cylindrical Resonator Body -->
      <circle cx="35" cy="35" r="32" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      <circle cx="35" cy="35" r="26" fill="#0F172A"/>
      <!-- Solder Eyelet Terminals (+) and (-) -->
      <circle cx="25" cy="35" r="3.5" fill="#CA8A04" stroke="#EF4444" stroke-width="1.2"/>
      <circle cx="45" cy="35" r="3.5" fill="#CA8A04" stroke="#0F172A" stroke-width="1.2"/>
      <!-- Top Sound Acoustic Aperture -->
      <circle cx="35" cy="18" r="7" fill="#334155"/>
      <circle cx="35" cy="18" r="3.5" fill="#020617"/>
      <!-- Polarity Markings -->
      <text x="25" y="27" fill="#EF4444" font-size="11" font-weight="900" text-anchor="middle">+</text>
      <text x="45" y="27" fill="#94A3B8" font-size="11" font-weight="900" text-anchor="middle">-</text>
      <text x="35" y="78" fill="#94A3B8" font-size="8" font-weight="bold" font-family="sans-serif" text-anchor="middle">ACTIVE BUZZER</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 12. 5MM DIFFUSE STATUS LED WITH 220-OHM RESISTOR
// ----------------------------------------------------------------------------
export function renderRealLED(x: number, y: number, color: string, label: string): string {
  const hex = color === 'green' ? '#22C55E' : color === 'red' ? '#EF4444' : color === 'yellow' ? '#EAB308' : '#3B82F6';
  const glow = color === 'green' ? '#86EFAC' : color === 'red' ? '#FCA5A5' : color === 'yellow' ? '#FEF08A' : '#93C5FD';
  
  return `
    <!-- 5mm Colored Diffuse LED Physical Component -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Epoxy Lens Dome -->
      <path d="M 12 40 L 12 18 A 12 12 0 0 1 36 18 L 36 40 Z" fill="${hex}" stroke="${hex}" stroke-width="1.5" opacity="0.9"/>
      <!-- Cathode Flat Rim Base -->
      <rect x="8" y="38" width="32" height="6" rx="2" fill="${hex}" stroke="#0F172A" stroke-width="1"/>
      <line x1="38" y1="38" x2="38" y2="44" stroke="#FFFFFF" stroke-width="2"/>
      
      <!-- Internal Lead Frame Anvil & Post -->
      <path d="M 18 36 L 22 24 L 26 24" fill="none" stroke="#F8FAFC" stroke-width="1.5" opacity="0.7"/>
      <line x1="28" y1="36" x2="28" y2="28" stroke="#F8FAFC" stroke-width="1.5" opacity="0.7"/>

      <!-- Bent Wire Leads -->
      <line x1="18" y1="44" x2="18" y2="70" stroke="#CBD5E1" stroke-width="2"/>
      <line x1="30" y1="44" x2="30" y2="70" stroke="#CBD5E1" stroke-width="2"/>

      <!-- Inline 220-Ohm Resistor (Red-Red-Brown-Gold) -->
      <g transform="translate(13, 70)">
        <rect width="10" height="24" rx="3" fill="#D4D4D8" stroke="#71717A" stroke-width="1"/>
        <line x1="1" y1="4" x2="9" y2="4" stroke="#DC2626" stroke-width="2"/>
        <line x1="1" y1="9" x2="9" y2="9" stroke="#DC2626" stroke-width="2"/>
        <line x1="1" y1="14" x2="9" y2="14" stroke="#78350F" stroke-width="2"/>
        <line x1="1" y1="19" x2="9" y2="19" stroke="#CA8A04" stroke-width="1.5"/>
        <line x1="5" y1="24" x2="5" y2="34" stroke="#CBD5E1" stroke-width="2"/>
      </g>
      <text x="24" y="116" fill="#334155" font-size="8" font-weight="bold" font-family="sans-serif" text-anchor="middle">${label}</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 13. 7-PIEZO DRUM PADS ARRAY (With 1M-Ohm Bleed Resistors)
// ----------------------------------------------------------------------------
export function renderRealPiezoArray(x: number, y: number): string {
  const padNames = ['1:KICK', '2:SNARE', '3:HH-C', '4:HH-O', '5:CRASH', '6:TOM1', '7:TOM2'];
  return `
    <!-- 7x Piezoelectric Vibration Sensor Discs Array -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="390" height="250" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
      <text x="195" y="24" fill="#1E293B" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">7x PIEZOELECTRIC TRANSDUCER DISCS ARRAY</text>
      
      <!-- 7 Brass Piezo Ceramic Discs with 1M-Ohm Resistors -->
      ${padNames.map((name, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const px = 25 + col * 92;
        const py = 42 + row * 105;
        return `
          <g transform="translate(${px}, ${py})">
            <!-- Brass Metal Disc (Negative Ground Ring) -->
            <circle cx="36" cy="36" r="32" fill="#CA8A04" stroke="#A16207" stroke-width="2"/>
            <circle cx="36" cy="36" r="28" fill="#EAB308"/>
            
            <!-- Lead Zirconate Titanate (PZT) White Ceramic Element -->
            <circle cx="36" cy="36" r="21" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
            <!-- Center Silver Solder Dot -->
            <circle cx="36" cy="36" r="4.5" fill="#94A3B8" stroke="#475569" stroke-width="1"/>
            
            <!-- 1M Resistor Symbol -->
            <rect x="22" y="70" width="28" height="12" rx="2" fill="#E2E8F0" stroke="#64748B" stroke-width="1"/>
            <text x="36" y="79" fill="#1E293B" font-size="7" font-weight="bold" font-family="monospace" text-anchor="middle">1MΩ</text>
            
            <text x="36" y="94" fill="#0F172A" font-size="8" font-weight="bold" font-family="sans-serif" text-anchor="middle">${name}</text>
          </g>
        `;
      }).join('')}
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 14. 16x2 I2C CHARACTER LCD (Real Photorealistic View)
// ----------------------------------------------------------------------------
export function renderRealLCD1602(x: number, y: number): string {
  return `
    <!-- 16x2 I2C Character LCD Physical Display Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Classic Dark Green FR4 Substrate -->
      <rect width="380" height="240" rx="10" fill="#047857" stroke="#065F46" stroke-width="2"/>
      <rect x="6" y="6" width="368" height="228" rx="6" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>

      <!-- 4 Gold Mounting Screws -->
      <circle cx="20" cy="20" r="6" fill="#CA8A04" stroke="#713F12" stroke-width="1.5"/>
      <circle cx="360" cy="20" r="6" fill="#CA8A04" stroke="#713F12" stroke-width="1.5"/>
      <circle cx="20" cy="220" r="6" fill="#CA8A04" stroke="#713F12" stroke-width="1.5"/>
      <circle cx="360" cy="220" r="6" fill="#CA8A04" stroke="#713F12" stroke-width="1.5"/>

      <!-- Metal Outer Bezel (Black Anodized) -->
      <rect x="80" y="25" width="275" height="175" rx="6" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      
      <!-- Yellow-Green LED Backlit Screen Glass -->
      <rect x="95" y="40" width="245" height="145" rx="4" fill="#86EFAC" stroke="#22C55E" stroke-width="1.5"/>
      
      <!-- 5x8 Dot Matrix LCD Characters -->
      <g font-family="monospace" font-size="14" font-weight="900" fill="#064E3B" letter-spacing="1.5">
        <text x="110" y="95">INNOVATION HUB</text>
        <text x="110" y="140">STATUS: ACTIVE OK</text>
      </g>

      <!-- I2C PCF8574 Backpack on Left Edge -->
      <g transform="translate(10, 35)">
        <rect width="58" height="165" rx="4" fill="#1E3A8A" stroke="#3B82F6" stroke-width="1.5"/>
        <text x="29" y="24" fill="#93C5FD" font-size="8" font-weight="bold" text-anchor="middle">I2C BUS</text>

        <!-- Blue Contrast Trimmer Potentiometer -->
        <rect x="14" y="125" width="30" height="28" rx="2" fill="#2563EB"/>
        <circle cx="29" cy="139" r="7" fill="#F8FAFC"/>
        <line x1="25" y1="139" x2="33" y2="139" stroke="#64748B" stroke-width="2"/>

        <!-- 4 Pin Header (GND, VCC, SDA, SCL) -->
        ${[
          {name: 'GND', y: 45}, {name: 'VCC', y: 65}, {name: 'SDA', y: 85}, {name: 'SCL', y: 105}
        ].map(p => `
          <circle cx="16" cy="${p.y}" r="4" fill="#CA8A04" stroke="#713F12" stroke-width="1.2"/>
          <text x="26" y="${p.y + 3}" fill="#FFFFFF" font-size="7.5" font-family="monospace" font-weight="bold">${p.name}</text>
        `).join('')}
      </g>

      <text x="200" y="222" fill="#ECFDF5" font-size="10" font-weight="bold" text-anchor="middle">16x2 CHARACTER LCD (I2C ADDRESS 0x27)</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 15. 0.96" I2C MONOCHROME OLED (Real Photorealistic View)
// ----------------------------------------------------------------------------
export function renderRealOLED(x: number, y: number): string {
  return `
    <!-- 0.96" I2C Monochrome OLED Display Physical Module (SSD1306) -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Deep Blue PCB FR4 Substrate (Compact Form Factor 175x135) -->
      <rect width="175" height="135" rx="8" fill="#1E3A8A" stroke="#1D4ED8" stroke-width="2"/>
      <rect x="4" y="4" width="167" height="127" rx="6" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

      <!-- 4 Gold Corner Mounting Eyelets -->
      <circle cx="10" cy="10" r="3.5" fill="#CA8A04" stroke="#713F12" stroke-width="1"/>
      <circle cx="165" cy="10" r="3.5" fill="#CA8A04" stroke="#713F12" stroke-width="1"/>
      <circle cx="10" cy="125" r="3.5" fill="#CA8A04" stroke="#713F12" stroke-width="1"/>
      <circle cx="165" cy="125" r="3.5" fill="#CA8A04" stroke="#713F12" stroke-width="1"/>

      <!-- 4-Pin Top Header Block (GND, VCC, SCL, SDA) -->
      <rect x="26" y="8" width="122" height="20" rx="3" fill="#0F172A"/>
      ${[
        { name: 'GND', x: 40, c: '#0F172A' },
        { name: 'VCC', x: 68, c: '#EF4444' },
        { name: 'SCL', x: 96, c: '#F59E0B' },
        { name: 'SDA', x: 124, c: '#3B82F6' }
      ].map(p => `
        <circle cx="${p.x}" cy="18" r="4" fill="#CA8A04" stroke="#713F12" stroke-width="1"/>
        <text x="${p.x}" y="7" fill="#FFFFFF" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
      `).join('')}

      <!-- High-Gloss OLED Glass Screen Bezel -->
      <rect x="18" y="34" width="139" height="78" rx="4" fill="#020617" stroke="#1E293B" stroke-width="2"/>
      
      <!-- Cyan OLED Pixel UI: Robot Emotion Eyes -->
      <g>
        <!-- Left Expressive Eye -->
        <rect x="40" y="46" width="30" height="42" rx="9" fill="#38BDF8"/>
        <circle cx="48" cy="54" r="4.5" fill="#FFFFFF"/>
        <ellipse cx="44" cy="96" rx="8" ry="3" fill="#F43F5E" opacity="0.65"/>

        <!-- Right Expressive Eye -->
        <rect x="86" y="46" width="30" height="42" rx="9" fill="#38BDF8"/>
        <circle cx="94" cy="54" r="4.5" fill="#FFFFFF"/>
        <ellipse cx="112" cy="96" rx="8" ry="3" fill="#F43F5E" opacity="0.65"/>

        <!-- OLED Screen Scanline & HUD subtle accents -->
        <line x1="24" y1="40" x2="151" y2="40" stroke="#0284C7" stroke-width="0.8" opacity="0.5"/>
        <line x1="24" y1="106" x2="151" y2="106" stroke="#0284C7" stroke-width="0.8" opacity="0.5"/>
      </g>

      <text x="87" y="125" fill="#93C5FD" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">0.96" OLED (SSD1306 128x64)</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 16. ESP32-S3 MINI DEVELOPMENT BOARD (Real Photorealistic)
// ----------------------------------------------------------------------------
export function renderRealESP32S3Mini(x: number, y: number): string {
  return `
    <!-- ESP32-S3 Mini Physical Board -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="210" height="340" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="5" y="5" width="200" height="330" rx="8" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

      <!-- Ceramic 2.4GHz Chip Antenna at Top -->
      <g transform="translate(65, 12)">
        <rect width="80" height="26" rx="4" fill="#020617" stroke="#CA8A04" stroke-width="1.5"/>
        <line x1="8" y1="13" x2="72" y2="13" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
        <text x="40" y="24" fill="#FDE047" font-size="6.5" font-weight="bold" text-anchor="middle">CERAMIC ANT</text>
      </g>

      <!-- ESP32-S3 SoC Metallic Can -->
      <g transform="translate(35, 50)">
        <rect width="140" height="150" rx="6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.8"/>
        <circle cx="70" cy="35" r="16" fill="#0F172A"/>
        <text x="70" y="40" fill="#FFFFFF" font-size="10" font-weight="900" text-anchor="middle">S3</text>
        <text x="70" y="75" fill="#0F172A" font-size="12" font-weight="900" text-anchor="middle">ESP32-S3</text>
        <text x="70" y="94" fill="#334155" font-size="8" font-weight="bold" text-anchor="middle">Xtensa Dual LX7 240MHz</text>
        <text x="70" y="112" fill="#475569" font-size="7.5" text-anchor="middle">AI Vector Ext / 512KB SRAM</text>
      </g>

      <!-- Type-C USB Port -->
      <g transform="translate(75, 305)">
        <rect width="60" height="26" rx="6" fill="#94A3B8" stroke="#475569" stroke-width="1.5"/>
        <rect x="8" y="6" width="44" height="14" rx="4" fill="#0F172A"/>
        <text x="30" y="17" fill="#FFFFFF" font-size="7" font-weight="bold" font-family="monospace" text-anchor="middle">TYPE-C</text>
      </g>

      <!-- Left Header Pins (G4, G5, G6, G7, G8, G9, 3V3, GND) -->
      ${['3V3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'GND'].map((p, i) => `
        <circle cx="16" cy="${60 + i * 30}" r="4" fill="#E2E8F0" stroke="#0F172A" stroke-width="1.2"/>
        <text x="26" y="${64 + i * 30}" fill="#94A3B8" font-size="7.5" font-family="monospace" font-weight="bold">${p}</text>
      `).join('')}

      <!-- Right Header Pins (VIN, GND, G10, G11, G12, G13, G14, G15) -->
      ${['VIN', 'GND', 'G10', 'G11', 'G12', 'G13', 'G14', 'G15'].map((p, i) => `
        <circle cx="194" cy="${60 + i * 30}" r="4" fill="#E2E8F0" stroke="#0F172A" stroke-width="1.2"/>
        <text x="184" y="${64 + i * 30}" fill="#94A3B8" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="end">${p}</text>
      `).join('')}

      <text x="105" y="285" fill="#FFFFFF" font-size="9" font-weight="bold" text-anchor="middle">ESP32-S3 MINI</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 17. 4x CORELESS MOTORS & DRONE PROPELLERS
// ----------------------------------------------------------------------------
export function renderRealCorelessMotors(x: number, y: number): string {
  return `
    <!-- 4x Micro Coreless Drone Motors & Props -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="250" height="250" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>
      <!-- X-Frame Arms -->
      <line x1="45" y1="45" x2="205" y2="205" stroke="#334155" stroke-width="10" stroke-linecap="round"/>
      <line x1="205" y1="45" x2="45" y2="205" stroke="#334155" stroke-width="10" stroke-linecap="round"/>

      <!-- M1: Front Right (CW - Orange Prop) -->
      <g transform="translate(190, 45)">
        <circle cx="0" cy="0" r="16" fill="#CBD5E1" stroke="#475569" stroke-width="1.5"/>
        <ellipse cx="0" cy="0" rx="35" ry="8" fill="#F97316" opacity="0.85" transform="rotate(30)"/>
        <circle cx="0" cy="0" r="4" fill="#0F172A"/>
        <text x="0" y="24" fill="#0F172A" font-size="7.5" font-weight="bold" text-anchor="middle">M1 (CW)</text>
      </g>

      <!-- M4: Front Left (CCW - Black Prop) -->
      <g transform="translate(60, 45)">
        <circle cx="0" cy="0" r="16" fill="#CBD5E1" stroke="#475569" stroke-width="1.5"/>
        <ellipse cx="0" cy="0" rx="35" ry="8" fill="#1E293B" opacity="0.85" transform="rotate(-30)"/>
        <circle cx="0" cy="0" r="4" fill="#0F172A"/>
        <text x="0" y="24" fill="#0F172A" font-size="7.5" font-weight="bold" text-anchor="middle">M4 (CCW)</text>
      </g>

      <!-- M3: Rear Left (CW - Orange Prop) -->
      <g transform="translate(60, 195)">
        <circle cx="0" cy="0" r="16" fill="#CBD5E1" stroke="#475569" stroke-width="1.5"/>
        <ellipse cx="0" cy="0" rx="35" ry="8" fill="#F97316" opacity="0.85" transform="rotate(30)"/>
        <circle cx="0" cy="0" r="4" fill="#0F172A"/>
        <text x="0" y="24" fill="#0F172A" font-size="7.5" font-weight="bold" text-anchor="middle">M3 (CW)</text>
      </g>

      <!-- M2: Rear Right (CCW - Black Prop) -->
      <g transform="translate(190, 195)">
        <circle cx="0" cy="0" r="16" fill="#CBD5E1" stroke="#475569" stroke-width="1.5"/>
        <ellipse cx="0" cy="0" rx="35" ry="8" fill="#1E293B" opacity="0.85" transform="rotate(-30)"/>
        <circle cx="0" cy="0" r="4" fill="#0F172A"/>
        <text x="0" y="24" fill="#0F172A" font-size="7.5" font-weight="bold" text-anchor="middle">M2 (CCW)</text>
      </g>

      <text x="125" y="130" fill="#475569" font-size="8.5" font-weight="bold" text-anchor="middle">8520 CORELESS</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 18. DS3231 HIGH-PRECISION REAL-TIME CLOCK (RTC)
// ----------------------------------------------------------------------------
export function renderRealDS3231RTC(x: number, y: number): string {
  return `
    <!-- DS3231 Real-Time Clock Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="180" height="150" rx="8" fill="#1E3A8A" stroke="#1D4ED8" stroke-width="2"/>
      <!-- CR2032 Coin Cell Battery Clip -->
      <circle cx="65" cy="75" r="42" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
      <circle cx="65" cy="75" r="36" fill="#F1F5F9"/>
      <text x="65" y="72" fill="#334155" font-size="11" font-weight="bold" text-anchor="middle">CR2032</text>
      <text x="65" y="86" fill="#64748B" font-size="8" font-family="monospace" text-anchor="middle">+ 3V LITHIUM</text>

      <!-- DS3231 SOIC-16 IC with internal TCXO -->
      <g transform="translate(125, 45)">
        <rect width="36" height="60" rx="3" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
        <text x="18" y="32" fill="#93C5FD" font-size="7" font-family="monospace" text-anchor="middle">DS3231</text>
        <text x="18" y="44" fill="#60A5FA" font-size="6.5" font-family="monospace" text-anchor="middle">TCXO</text>
      </g>

      <!-- 6 Pin Header (32K, SQW, SCL, SDA, VCC, GND) -->
      <g transform="translate(12, 130)">
        ${[
          {name: 'GND', x: 10}, {name: 'VCC', x: 38}, {name: 'SDA', x: 66},
          {name: 'SCL', x: 94}, {name: 'SQW', x: 122}, {name: '32K', x: 150}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="#CA8A04"/>
          <text x="${p.x}" y="-8" fill="#FFFFFF" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="90" y="24" fill="#FFFFFF" font-size="9" font-weight="bold" text-anchor="middle">DS3231 PRECISION RTC</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 19. MPU-6050 6-AXIS GYRO & ACCELEROMETER
// ----------------------------------------------------------------------------
export function renderRealMPU6050(x: number, y: number): string {
  return `
    <!-- MPU-6050 6-DOF IMU Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="180" height="130" rx="8" fill="#1D4ED8" stroke="#1E40AF" stroke-width="2"/>
      <rect x="4" y="4" width="172" height="122" rx="6" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

      <!-- MPU-6050 QFN-24 Chip -->
      <g transform="translate(68, 40)">
        <rect width="44" height="44" rx="3" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="2" fill="#64748B"/>
        <text x="22" y="22" fill="#93C5FD" font-size="7.5" font-family="monospace" text-anchor="middle">MPU</text>
        <text x="22" y="32" fill="#93C5FD" font-size="7.5" font-family="monospace" text-anchor="middle">6050</text>
      </g>

      <!-- Orientation Coordinate Axes (X, Y, Z) -->
      <g transform="translate(130, 48)">
        <line x1="0" y1="20" x2="25" y2="20" stroke="#F59E0B" stroke-width="2"/>
        <line x1="0" y1="20" x2="0" y2="0" stroke="#EF4444" stroke-width="2"/>
        <circle cx="0" cy="20" r="3" fill="#3B82F6"/>
        <text x="28" y="23" fill="#F59E0B" font-size="7" font-weight="bold">X</text>
        <text x="-2" y="-3" fill="#EF4444" font-size="7" font-weight="bold">Y</text>
      </g>

      <!-- 8 Header Pins (VCC, GND, SCL, SDA, XDA, XCL, AD0, INT) -->
      <g transform="translate(14, 110)">
        ${[
          {name: 'VCC', x: 0}, {name: 'GND', x: 22}, {name: 'SCL', x: 44}, {name: 'SDA', x: 66},
          {name: 'XDA', x: 88}, {name: 'XCL', x: 110}, {name: 'AD0', x: 132}, {name: 'INT', x: 154}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="#CA8A04"/>
          <text x="${p.x}" y="-7" fill="#FFFFFF" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="90" y="22" fill="#FFFFFF" font-size="9" font-weight="bold" text-anchor="middle">MPU-6050 6-DOF IMU</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 20. ANALOG 2-AXIS THUMB JOYSTICK MODULE
// ----------------------------------------------------------------------------
export function renderRealAnalogJoystick(x: number, y: number): string {
  return `
    <!-- Analog Thumb Joystick Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="160" height="150" rx="8" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      
      <!-- Black Rubber Thumbstick Hat -->
      <circle cx="80" cy="65" r="44" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <circle cx="80" cy="65" r="36" fill="#1E293B"/>
      <!-- Concentric Grip Rings -->
      <circle cx="80" cy="65" r="26" fill="none" stroke="#475569" stroke-width="1.5"/>
      <circle cx="80" cy="65" r="14" fill="#0F172A"/>

      <!-- 5-Pin Header (GND, +5V, VRx, VRy, SW) -->
      <g transform="translate(18, 130)">
        ${[
          {name: 'GND', x: 10}, {name: '5V', x: 36}, {name: 'VRx', x: 62},
          {name: 'VRy', x: 88}, {name: 'SW', x: 114}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="#CA8A04"/>
          <text x="${p.x}" y="-7" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="80" y="16" fill="#F8FAFC" font-size="8.5" font-weight="bold" text-anchor="middle">JOYSTICK QUADRANT</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 21. AI-THINKER ESP32-CAM MODULE WITH OV2640 CAMERA
// ----------------------------------------------------------------------------
export function renderRealESP32CAM(x: number, y: number): string {
  return `
    <!-- ESP32-CAM Physical Board with OV2640 -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Black PCB -->
      <rect width="190" height="260" rx="8" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      
      <!-- OV2640 2MP Camera Sensor Module -->
      <g transform="translate(55, 30)">
        <rect width="80" height="80" rx="6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
        <circle cx="40" cy="40" r="28" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
        <circle cx="40" cy="40" r="18" fill="#020617"/>
        <!-- Deep Glass Lens Reflex Reflections -->
        <circle cx="40" cy="40" r="12" fill="#1E3A8A"/>
        <ellipse cx="36" cy="36" rx="5" ry="3" fill="#60A5FA" opacity="0.8" transform="rotate(-30, 36, 36)"/>
        <text x="40" y="74" fill="#334155" font-size="6.5" font-weight="bold" text-anchor="middle">OV2640 2MP</text>
      </g>

      <!-- Super-Bright White Flash LED -->
      <g transform="translate(150, 45)">
        <rect width="20" height="20" rx="2" fill="#F8FAFC" stroke="#CA8A04" stroke-width="1.2"/>
        <circle cx="10" cy="10" r="7" fill="#FEF08A"/>
        <text x="10" y="28" fill="#FDE047" font-size="6" font-weight="bold" text-anchor="middle">FLASH</text>
      </g>

      <!-- MicroSD Card Holder -->
      <rect x="45" y="125" width="100" height="70" rx="4" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/>
      <text x="95" y="165" fill="#334155" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">MICRO-SD</text>

      <!-- 8-Pin Header at Bottom (5V, GND, IO12, IO13, IO14, IO15, IO2, IO4) -->
      <g transform="translate(15, 240)">
        ${[
          {name: '5V', x: 0}, {name: 'GND', x: 22}, {name: '12', x: 44}, {name: '13', x: 66},
          {name: '14', x: 88}, {name: '15', x: 110}, {name: '2', x: 132}, {name: '4', x: 154}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="#CA8A04"/>
          <text x="${p.x}" y="-7" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>

      <text x="95" y="22" fill="#FFFFFF" font-size="9" font-weight="bold" text-anchor="middle">ESP32-CAM AI VISION</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 22. DFPLAYER MINI MP3 HARDWARE DECODER
// ----------------------------------------------------------------------------
export function renderRealDFPlayerMini(x: number, y: number): string {
  return `
    <!-- DFPlayer Mini MP3 Player Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="160" height="170" rx="6" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      
      <!-- MicroSD Card Slot -->
      <rect x="25" y="15" width="110" height="75" rx="3" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5"/>
      <rect x="40" y="30" width="80" height="50" rx="2" fill="#0F172A"/>
      <text x="80" y="60" fill="#94A3B8" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">MicroSD CARD</text>

      <!-- YX5200 MP3 Decoder ASIC Chip -->
      <rect x="50" y="100" width="60" height="34" rx="2" fill="#0F172A" stroke="#334155" stroke-width="1"/>
      <text x="80" y="118" fill="#93C5FD" font-size="7" font-family="monospace" text-anchor="middle">YX5200-24SS</text>
      <text x="80" y="128" fill="#64748B" font-size="6.5" font-family="monospace" text-anchor="middle">HW MP3 DSP</text>

      <!-- Dual Header Pins (VCC, RX, TX, SPK1, SPK2, GND) -->
      <g transform="translate(12, 155)">
        ${[
          {name: 'VCC', x: 0}, {name: 'RX', x: 26}, {name: 'TX', x: 52},
          {name: 'SPK1', x: 78}, {name: 'GND', x: 104}, {name: 'SPK2', x: 130}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="#CA8A04"/>
          <text x="${p.x}" y="-8" fill="#FFFFFF" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="80" y="12" fill="#FFFFFF" font-size="8" font-weight="bold" text-anchor="middle">DFPLAYER MINI</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 23. MAX98357A I2S 3W CLASS-D AMPLIFIER DAC
// ----------------------------------------------------------------------------
export function renderRealMAX98357A(x: number, y: number): string {
  return `
    <!-- MAX98357A I2S DAC Amplifier Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="160" height="120" rx="8" fill="#581C87" stroke="#3B0764" stroke-width="2"/>
      
      <!-- MAX98357A WLP Chip -->
      <rect x="65" y="32" width="30" height="30" rx="2" fill="#0F172A" stroke="#6B21A8" stroke-width="1.2"/>
      <text x="80" y="50" fill="#E9D5FF" font-size="6.5" font-family="monospace" text-anchor="middle">MAX</text>
      <text x="80" y="58" fill="#E9D5FF" font-size="6" font-family="monospace" text-anchor="middle">98357A</text>

      <!-- 2-Pin Speaker Screw Terminal (Right Edge) -->
      <g transform="translate(120, 35)">
        <rect width="32" height="50" rx="3" fill="#15803D"/>
        <circle cx="16" cy="15" r="5" fill="#CA8A04"/>
        <circle cx="16" cy="35" r="5" fill="#CA8A04"/>
        <text x="16" y="58" fill="#DCFCE7" font-size="6" font-weight="bold" text-anchor="middle">SPK +/-</text>
      </g>

      <!-- 7-Pin I2S Header (LRC, BCLK, DIN, GAIN, SD, GND, VIN) -->
      <g transform="translate(14, 100)">
        ${[
          {name: 'VIN', x: 0}, {name: 'GND', x: 18}, {name: 'SD', x: 36},
          {name: 'GAIN', x: 54}, {name: 'DIN', x: 72}, {name: 'BCLK', x: 90}, {name: 'LRC', x: 108}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3" fill="#CA8A04"/>
          <text x="${p.x}" y="-6" fill="#FFFFFF" font-size="6" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="80" y="20" fill="#F3E8FF" font-size="8" font-weight="bold" text-anchor="middle">I2S DAC CLASS-D</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 24. 4-OHM 3W FULL-RANGE SPEAKER
// ----------------------------------------------------------------------------
export function renderRealSpeaker(x: number, y: number): string {
  return `
    <!-- 4-Ohm 3W Acoustic Speaker Physical Component -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <circle cx="50" cy="50" r="48" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      <circle cx="50" cy="50" r="40" fill="#334155" stroke="#64748B" stroke-width="1.5"/>
      <!-- Black Paper Cone -->
      <circle cx="50" cy="50" r="28" fill="#0F172A"/>
      <!-- Dust Cap -->
      <circle cx="50" cy="50" r="14" fill="#020617" stroke="#1E293B" stroke-width="1.5"/>
      <text x="50" y="112" fill="#334155" font-size="8" font-weight="bold" text-anchor="middle">4Ω 3W SPEAKER</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 25. PRECISION DC VOLTAGE SENSOR MODULE (0-25V)
// ----------------------------------------------------------------------------
export function renderRealVoltageSensor(x: number, y: number): string {
  return `
    <!-- 0-25V Resistive Voltage Sensor Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="160" height="120" rx="8" fill="#1D4ED8" stroke="#1E40AF" stroke-width="2"/>
      
      <!-- 2-Pin High-Voltage Screw Terminal (+ / -) -->
      <g transform="translate(15, 30)">
        <rect width="36" height="60" rx="3" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5"/>
        <circle cx="18" cy="18" r="6" fill="#CA8A04"/>
        <circle cx="18" cy="42" r="6" fill="#CA8A04"/>
        <text x="18" y="70" fill="#FFFFFF" font-size="7" font-weight="bold" text-anchor="middle">IN +/-</text>
      </g>

      <!-- 5:1 Precision Resistor Divider Network (30K + 7.5K) -->
      <g transform="translate(70, 45)">
        <rect width="20" height="12" rx="2" fill="#0F172A"/>
        <rect width="20" height="12" y="18" rx="2" fill="#0F172A"/>
        <text x="10" y="10" fill="#93C5FD" font-size="6" font-family="monospace" text-anchor="middle">30K</text>
        <text x="10" y="28" fill="#93C5FD" font-size="6" font-family="monospace" text-anchor="middle">7.5K</text>
      </g>

      <!-- 3-Pin Output Header (+, -, S) on Right Edge -->
      <g transform="translate(145, 35)">
        ${[
          {name: 'S', y: 10, c: '#3B82F6'},
          {name: '-', y: 25, c: '#0F172A'},
          {name: '+', y: 40, c: '#EF4444'}
        ].map(p => `
          <circle cx="0" cy="${p.y}" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="-6" y="${p.y + 3}" fill="#FFFFFF" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="end">${p.name}</text>
        `).join('')}
      </g>
      <text x="80" y="20" fill="#FFFFFF" font-size="8" font-weight="bold" text-anchor="middle">VOLTAGE SENSOR (0-25V)</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 26. PHOTO-RESISTOR (LDR) LIGHT SENSOR MODULE
// ----------------------------------------------------------------------------
export function renderRealLDR(x: number, y: number, label = 'LDR LIGHT SENSOR'): string {
  return `
    <!-- LDR Photoresistor Physical Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="150" height="130" rx="8" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      
      <!-- LDR Ceramic Disc Sensor Head -->
      <g transform="translate(75, 45)">
        <circle cx="0" cy="0" r="18" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="14" fill="#FEF08A"/>
        <!-- Cadmium Sulfide (CdS) Serpentine Photoconductive Trace -->
        <path d="M-9 -6 C -5 -10, 5 -10, 9 -6 C 5 -2, -5 -2, -9 2 C -5 6, 5 6, 9 10" fill="none" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round"/>
      </g>

      <!-- Potentiometer Sensitivity Trimmer -->
      <g transform="translate(25, 35)">
        <rect width="20" height="20" rx="2" fill="#2563EB" stroke="#1D4ED8" stroke-width="1"/>
        <circle cx="10" cy="10" r="6" fill="#CBD5E1"/>
        <line x1="6" y1="10" x2="14" y2="10" stroke="#475569" stroke-width="1.5"/>
      </g>

      <!-- 4-Pin Header (VCC, GND, DO, AO) at Bottom -->
      <g transform="translate(20, 110)">
        ${[
          {name: 'VCC', x: 10, c: '#EF4444'},
          {name: 'GND', x: 38, c: '#0F172A'},
          {name: 'DO', x: 66, c: '#10B981'},
          {name: 'AO', x: 94, c: '#3B82F6'}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="75" y="16" fill="#F8FAFC" font-size="8" font-weight="bold" text-anchor="middle">${label}</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 27. DUAL-AXIS LDR SOLAR TRACKER SENSOR HEAD
// ----------------------------------------------------------------------------
export function renderRealDualLDR(x: number, y: number): string {
  return `
    <!-- Dual LDR Solar Tracking Differential Sensor Head -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="180" height="150" rx="8" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      
      <!-- Central Optical Partition Shade (Divider) -->
      <rect x="88" y="25" width="4" height="65" rx="2" fill="#475569"/>

      <!-- Left Sensor: LDR1 (East) -->
      <g transform="translate(50, 55)">
        <circle cx="0" cy="0" r="18" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="14" fill="#FEF08A"/>
        <path d="M-9 -6 C -5 -10, 5 -10, 9 -6 C 5 -2, -5 -2, -9 2 C -5 6, 5 6, 9 10" fill="none" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round"/>
        <text x="0" y="27" fill="#FCA5A5" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">LDR 1 (EAST)</text>
      </g>

      <!-- Right Sensor: LDR2 (West) -->
      <g transform="translate(130, 55)">
        <circle cx="0" cy="0" r="18" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="14" fill="#FEF08A"/>
        <path d="M-9 -6 C -5 -10, 5 -10, 9 -6 C 5 -2, -5 -2, -9 2 C -5 6, 5 6, 9 10" fill="none" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round"/>
        <text x="0" y="27" fill="#FCA5A5" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">LDR 2 (WEST)</text>
      </g>

      <!-- 4-Pin Terminal Header (VCC, GND, LDR1, LDR2) at Bottom -->
      <g transform="translate(24, 130)">
        ${[
          {name: 'VCC', x: 12, c: '#EF4444'},
          {name: 'GND', x: 48, c: '#0F172A'},
          {name: 'AO1', x: 84, c: '#3B82F6'},
          {name: 'AO2', x: 120, c: '#F59E0B'}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#E2E8F0" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="90" y="16" fill="#FBBF24" font-size="8.5" font-weight="bold" text-anchor="middle">DUAL-AXIS SOLAR SENSOR</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 28. BLUETOOTH HC-05 SERIAL TELEMETRY MODULE
// ----------------------------------------------------------------------------
export function renderRealBluetoothHC05(x: number, y: number): string {
  return `
    <!-- HC-05 Bluetooth 2.0+EDR Breakout -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="130" height="190" rx="6" fill="#1E3A8A" stroke="#1D4ED8" stroke-width="2"/>
      
      <!-- Onboard Bluetooth Transceiver Daughterboard -->
      <rect x="15" y="20" width="100" height="110" rx="4" fill="#1D4ED8" stroke="#3B82F6" stroke-width="1"/>
      <rect x="25" y="30" width="80" height="30" fill="#0F172A" stroke="#475569" stroke-width="1"/>
      <text x="65" y="50" fill="#94A3B8" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">CSR BC417</text>

      <!-- Golden Inverted-F Meandering Antenna -->
      <g transform="translate(30, 75)">
        <path d="M0 0 L70 0 L70 15 L50 15 L50 8 L30 8 L30 15 L10 15 L10 5" fill="none" stroke="#CA8A04" stroke-width="2"/>
      </g>

      <!-- 6-Pin Bottom Header (STATE, RXD, TXD, GND, VCC, EN) -->
      <g transform="translate(12, 175)">
        ${[
          {name: 'ST', x: 6}, {name: 'RX', x: 25}, {name: 'TX', x: 44},
          {name: 'GND', x: 63}, {name: 'VCC', x: 82}, {name: 'EN', x: 101}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3" fill="#CA8A04"/>
          <text x="${p.x}" y="-6" fill="#FFFFFF" font-size="6" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="65" y="14" fill="#93C5FD" font-size="8" font-weight="bold" text-anchor="middle">HC-05 BLUETOOTH</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 29. FLAME / FIRE SENSOR OPTICAL DETECTOR MODULE
// ----------------------------------------------------------------------------
export function renderRealFlameSensor(x: number, y: number): string {
  return `
    <!-- Flame Detection Infrared Sensor Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="140" height="130" rx="8" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      
      <!-- Black Epoxy Infrared Receiver Bulb (760nm - 1100nm) -->
      <g transform="translate(70, 45)">
        <rect x="-6" y="-14" width="12" height="28" rx="6" fill="#020617" stroke="#334155" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="8" fill="#1E1B4B"/>
        <text x="0" y="24" fill="#F87171" font-size="7" font-weight="bold" text-anchor="middle">IR FLAME</text>
      </g>

      <!-- 4-Pin Header (A0, D0, GND, VCC) -->
      <g transform="translate(18, 110)">
        ${[
          {name: 'VCC', x: 10, c: '#EF4444'},
          {name: 'GND', x: 38, c: '#0F172A'},
          {name: 'D0', x: 66, c: '#10B981'},
          {name: 'A0', x: 94, c: '#3B82F6'}
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="70" y="16" fill="#EF4444" font-size="8" font-weight="bold" text-anchor="middle">FLAME DETECTOR</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 30. GENERIC HARDWARE BREAKOUT MODULE (Dynamic Multi-Pin Board)
// ----------------------------------------------------------------------------
export function renderRealGenericModule(x: number, y: number, name: string, pins: string[]): string {
  const displayPins = pins.length > 0 ? pins.slice(0, 6) : ['VCC', 'GND', 'SIG'];
  const pWidth = Math.max(140, displayPins.length * 28 + 30);

  return `
    <!-- Generic Hardware Module Breakout: ${name} -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="${pWidth}" height="120" rx="8" fill="#1E1B4B" stroke="#4338CA" stroke-width="2"/>
      
      <!-- Central Processing SMD IC -->
      <rect x="${(pWidth - 60) / 2}" y="32" width="60" height="32" rx="3" fill="#0F172A" stroke="#334155" stroke-width="1"/>
      <circle cx="${(pWidth - 60) / 2 + 8}" cy="38" r="2" fill="#64748B"/>
      <text x="${pWidth / 2}" y="52" fill="#A5B4FC" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">IC DRIVER</text>

      <!-- Gold Header Pin Sockets at Bottom -->
      <g transform="translate(18, 100)">
        ${displayPins.map((p, i) => {
          const px = i * 26 + 10;
          return `
            <circle cx="${px}" cy="0" r="3.5" fill="#CA8A04" stroke="#FFFFFF" stroke-width="1"/>
            <text x="${px}" y="-6" fill="#E2E8F0" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.slice(0, 4)}</text>
          `;
        }).join('')}
      </g>
      <text x="${pWidth / 2}" y="18" fill="#E0E7FF" font-size="8.5" font-weight="bold" text-anchor="middle">${name.toUpperCase().slice(0, 20)}</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 31. DHT11 / DHT22 TEMPERATURE & HUMIDITY SENSOR MODULE
// ----------------------------------------------------------------------------
export function renderRealDHT11(x: number, y: number, label = 'DHT11 TEMP & HUMIDITY'): string {
  return `
    <!-- DHT11 / DHT22 Digital Sensor -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Blue Perforated Polymer Shell -->
      <rect width="130" height="150" rx="8" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
      <rect x="0" y="0" width="130" height="28" rx="6" fill="#0369A1"/>
      <text x="65" y="18" fill="#FFFFFF" font-size="8" font-weight="bold" text-anchor="middle">${label.slice(0, 18)}</text>

      <!-- Perforated Air Vents Grid -->
      <g transform="translate(20, 40)">
        ${[0, 1, 2, 3].map(row => `
          <g transform="translate(0, ${row * 14})">
            ${[0, 1, 2, 3, 4, 5].map(col => `
              <rect x="${col * 15}" y="0" width="8" height="5" rx="1.5" fill="#0C4A6E"/>
            `).join('')}
          </g>
        `).join('')}
      </g>

      <!-- Bottom Pinout Header (VCC, DATA, NC, GND) -->
      <g transform="translate(18, 130)">
        ${[
          { name: 'VCC', x: 10, c: '#EF4444' },
          { name: 'DATA', x: 36, c: '#3B82F6' },
          { name: 'NC', x: 62, c: '#64748B' },
          { name: 'GND', x: 88, c: '#0F172A' }
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 32. HC-SR501 PIR MOTION DETECTION SENSOR
// ----------------------------------------------------------------------------
export function renderRealPIRSensor(x: number, y: number): string {
  return `
    <!-- HC-SR501 Pyroelectric Infrared Sensor -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <!-- Green Substrate Board -->
      <rect width="145" height="155" rx="8" fill="#065F46" stroke="#047857" stroke-width="2"/>
      
      <!-- White Fresnel Hemisphere Faceted Dome -->
      <g transform="translate(72, 60)">
        <circle cx="0" cy="0" r="38" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="28" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1"/>
        <circle cx="0" cy="0" r="16" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1"/>
        <!-- Facet pattern lines -->
        <line x1="-36" y1="0" x2="36" y2="0" stroke="#CBD5E1" stroke-width="0.8"/>
        <line x1="0" y1="-36" x2="0" y2="36" stroke="#CBD5E1" stroke-width="0.8"/>
        <line x1="-25" y1="-25" x2="25" y2="25" stroke="#CBD5E1" stroke-width="0.8"/>
        <line x1="-25" y1="25" x2="25" y2="-25" stroke="#CBD5E1" stroke-width="0.8"/>
      </g>

      <!-- Adjustment Trimpots (Sensitivity & Delay) -->
      <g transform="translate(18, 115)">
        <circle cx="12" cy="0" r="7" fill="#D97706" stroke="#B45309" stroke-width="1"/>
        <line x1="8" y1="0" x2="16" y2="0" stroke="#FEF3C7" stroke-width="1.2"/>
        <text x="12" y="14" fill="#A7F3D0" font-size="5.5" font-weight="bold" text-anchor="middle">SENS</text>
      </g>
      <g transform="translate(48, 115)">
        <circle cx="12" cy="0" r="7" fill="#D97706" stroke="#B45309" stroke-width="1"/>
        <line x1="8" y1="0" x2="16" y2="0" stroke="#FEF3C7" stroke-width="1.2"/>
        <text x="12" y="14" fill="#A7F3D0" font-size="5.5" font-weight="bold" text-anchor="middle">TIME</text>
      </g>

      <!-- 3-Pin Header (VCC, OUT, GND) -->
      <g transform="translate(82, 135)">
        ${[
          { name: 'VCC', x: 10, c: '#EF4444' },
          { name: 'OUT', x: 28, c: '#3B82F6' },
          { name: 'GND', x: 46, c: '#0F172A' }
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="72" y="16" fill="#A7F3D0" font-size="8" font-weight="bold" text-anchor="middle">PIR MOTION (HC-SR501)</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 33. MQ-SERIES GAS & SMOKE SENSOR MODULE (MQ-2 / MQ-135)
// ----------------------------------------------------------------------------
export function renderRealMQGasSensor(x: number, y: number, model = 'MQ-2 GAS/SMOKE'): string {
  return `
    <!-- MQ-Series Combustible Gas / Air Quality Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="140" height="150" rx="8" fill="#1E3A8A" stroke="#1D4ED8" stroke-width="2"/>
      
      <!-- Cylindrical Steel Mesh Sensor Cap -->
      <g transform="translate(70, 56)">
        <circle cx="0" cy="0" r="34" fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        <circle cx="0" cy="0" r="28" fill="#64748B" stroke="#334155" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="16" fill="#475569" stroke="#1E293B" stroke-width="1"/>
        <circle cx="0" cy="0" r="4" fill="#EF4444"/>
        <text x="0" y="2" fill="#FFFFFF" font-size="6" font-weight="bold" text-anchor="middle">HEATER</text>
      </g>

      <!-- 4-Pin Header (A0, D0, GND, VCC) -->
      <g transform="translate(16, 130)">
        ${[
          { name: 'VCC', x: 12, c: '#EF4444' },
          { name: 'GND', x: 42, c: '#0F172A' },
          { name: 'D0', x: 72, c: '#10B981' },
          { name: 'A0', x: 102, c: '#3B82F6' }
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="70" y="16" fill="#93C5FD" font-size="8" font-weight="bold" text-anchor="middle">${model.slice(0, 18)}</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 34. TCRT5000 INFRARED PROXIMITY & LINE TRACKING SENSOR
// ----------------------------------------------------------------------------
export function renderRealIRSensor(x: number, y: number, label = 'IR OBSTACLE SENSOR'): string {
  return `
    <!-- Infrared Proximity Obstacle Detector -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="130" height="140" rx="8" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      
      <!-- Dual IR LEDs: Clear Transmitter & Black Receiver -->
      <g transform="translate(65, 42)">
        <!-- Clear / Blue IR Transmitter -->
        <rect x="-24" y="-14" width="14" height="26" rx="6" fill="#38BDF8" stroke="#0284C7" stroke-width="1"/>
        <text x="-17" y="24" fill="#7DD3FC" font-size="6" font-weight="bold" text-anchor="middle">TX</text>

        <!-- Black Epoxy IR Receiver -->
        <rect x="10" y="-14" width="14" height="26" rx="6" fill="#020617" stroke="#475569" stroke-width="1"/>
        <text x="17" y="24" fill="#94A3B8" font-size="6" font-weight="bold" text-anchor="middle">RX</text>
      </g>

      <!-- 4-Pin Sockets (VCC, GND, D0, A0) -->
      <g transform="translate(14, 120)">
        ${[
          { name: 'VCC', x: 10, c: '#EF4444' },
          { name: 'GND', x: 38, c: '#0F172A' },
          { name: 'D0', x: 66, c: '#10B981' },
          { name: 'A0', x: 94, c: '#3B82F6' }
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="65" y="16" fill="#F1F5F9" font-size="8" font-weight="bold" text-anchor="middle">${label.slice(0, 18)}</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 35. SOUND / MICROPHONE SENSOR MODULE
// ----------------------------------------------------------------------------
export function renderRealSoundSensor(x: number, y: number): string {
  return `
    <!-- Electret Microphone Sound Detector Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="130" height="140" rx="8" fill="#1E293B" stroke="#334155" stroke-width="2"/>
      
      <!-- Cylindrical Silver Microphone Capsule -->
      <g transform="translate(65, 45)">
        <circle cx="0" cy="0" r="22" fill="#CBD5E1" stroke="#94A3B8" stroke-width="2"/>
        <circle cx="0" cy="0" r="14" fill="#0F172A"/>
        <circle cx="0" cy="0" r="6" fill="#1E293B"/>
        <text x="0" y="32" fill="#94A3B8" font-size="6.5" font-weight="bold" text-anchor="middle">MIC CAPSULE</text>
      </g>

      <!-- 4-Pin Header (A0, D0, GND, VCC) -->
      <g transform="translate(14, 120)">
        ${[
          { name: 'VCC', x: 10, c: '#EF4444' },
          { name: 'GND', x: 38, c: '#0F172A' },
          { name: 'D0', x: 66, c: '#10B981' },
          { name: 'A0', x: 94, c: '#3B82F6' }
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="65" y="16" fill="#F1F5F9" font-size="8" font-weight="bold" text-anchor="middle">SOUND SENSOR</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 36. 10K ROTARY POTENTIOMETER MODULE
// ----------------------------------------------------------------------------
export function renderRealPotentiometer(x: number, y: number, label = '10K POTENTIOMETER'): string {
  return `
    <!-- 10K Rotary Dial Potentiometer -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="120" height="135" rx="8" fill="#1E293B" stroke="#334155" stroke-width="2"/>
      
      <!-- Rotary Blue Body with Silver Dial Knob -->
      <g transform="translate(60, 52)">
        <circle cx="0" cy="0" r="28" fill="#2563EB" stroke="#1D4ED8" stroke-width="2"/>
        <circle cx="0" cy="0" r="20" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
        <line x1="0" y1="-18" x2="0" y2="-4" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
        <circle cx="0" cy="0" r="5" fill="#64748B"/>
      </g>

      <!-- 3 Pins (VCC, WIPER/SIG, GND) -->
      <g transform="translate(20, 115)">
        ${[
          { name: 'VCC', x: 15, c: '#EF4444' },
          { name: 'SIG', x: 40, c: '#3B82F6' },
          { name: 'GND', x: 65, c: '#0F172A' }
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="60" y="16" fill="#F8FAFC" font-size="7.5" font-weight="bold" text-anchor="middle">${label.slice(0, 16)}</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 37. TACTILE PUSH BUTTON SWITCH MODULE
// ----------------------------------------------------------------------------
export function renderRealPushButton(x: number, y: number, label = 'PUSH BUTTON'): string {
  return `
    <!-- Momentary Tactile Push Button -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="115" height="120" rx="8" fill="#1E293B" stroke="#334155" stroke-width="2"/>
      
      <!-- Square Tactile Metal Switch Base -->
      <g transform="translate(37, 36)">
        <rect x="0" y="0" width="40" height="40" rx="4" fill="#94A3B8" stroke="#475569" stroke-width="1.5"/>
        <circle cx="20" cy="20" r="14" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <circle cx="20" cy="20" r="10" fill="#EF4444"/>
      </g>

      <!-- 3 Pins (VCC, OUT, GND) -->
      <g transform="translate(18, 102)">
        ${[
          { name: 'VCC', x: 14, c: '#EF4444' },
          { name: 'OUT', x: 40, c: '#10B981' },
          { name: 'GND', x: 66, c: '#0F172A' }
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="57" y="18" fill="#F8FAFC" font-size="7.5" font-weight="bold" text-anchor="middle">${label.slice(0, 16)}</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 37B. TTP223 CAPACITIVE DIGITAL TOUCH SENSOR
// ----------------------------------------------------------------------------
export function renderRealTouchSensor(x: number, y: number): string {
  return `
    <!-- TTP223 Capacitive Digital Touch Sensor Module -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="120" height="130" rx="8" fill="#991B1B" stroke="#7F1D1D" stroke-width="2"/>
      <!-- Concentric Touch Pad Surface -->
      <circle cx="60" cy="50" r="28" fill="#B91C1C" stroke="#CA8A04" stroke-width="2"/>
      <circle cx="60" cy="50" r="20" fill="none" stroke="#EAB308" stroke-width="1.5" stroke-dasharray="3,3"/>
      <circle cx="60" cy="50" r="10" fill="#CA8A04"/>
      <text x="60" y="53" fill="#FEF08A" font-size="7" font-weight="900" font-family="sans-serif" text-anchor="middle">TOUCH</text>
      <!-- 3 Pins (VCC, I/O, GND) -->
      <g transform="translate(18, 110)">
        <circle cx="15" cy="0" r="3.5" fill="#EF4444" stroke="#FFFFFF" stroke-width="1"/>
        <text x="15" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">VCC</text>
        <circle cx="42" cy="0" r="3.5" fill="#A855F7" stroke="#FFFFFF" stroke-width="1"/>
        <text x="42" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">I/O</text>
        <circle cx="69" cy="0" r="3.5" fill="#0F172A" stroke="#FFFFFF" stroke-width="1"/>
        <text x="69" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">GND</text>
      </g>
      <text x="60" y="16" fill="#FEF2F2" font-size="8" font-weight="bold" text-anchor="middle">TTP223 TOUCH</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 38. BATTERY POWER SUPPLY PACK
// ----------------------------------------------------------------------------
export function renderRealBatteryPack(x: number, y: number, label = '9V / 4xAA BATTERY'): string {
  return `
    <!-- External Battery DC Supply Pack -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="130" height="140" rx="8" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      
      <!-- Battery Graphic Body -->
      <rect x="25" y="32" width="80" height="58" rx="6" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
      <rect x="52" y="24" width="26" height="8" rx="2" fill="#CA8A04"/>
      <text x="65" y="66" fill="#FBBF24" font-size="12" font-weight="bold" font-family="monospace" text-anchor="middle">DC 9V</text>

      <!-- Red (+) and Black (-) Terminals -->
      <g transform="translate(25, 115)">
        <circle cx="20" cy="0" r="4.5" fill="#EF4444" stroke="#FFFFFF" stroke-width="1"/>
        <text x="20" y="-8" fill="#EF4444" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">VCC (+)</text>
        
        <circle cx="60" cy="0" r="4.5" fill="#0F172A" stroke="#FFFFFF" stroke-width="1"/>
        <text x="60" y="-8" fill="#94A3B8" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">GND (-)</text>
      </g>
      <text x="65" y="16" fill="#F8FAFC" font-size="7.5" font-weight="bold" text-anchor="middle">${label.slice(0, 18)}</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 39. STEPPER MOTOR (28BYJ-48) + ULN2003 DRIVER BOARD
// ----------------------------------------------------------------------------
export function renderRealStepperMotor(x: number, y: number): string {
  return `
    <!-- 28BYJ-48 Stepper Motor + ULN2003 Driver Board -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="180" height="150" rx="8" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      
      <!-- Cylindrical Silver Motor Can -->
      <g transform="translate(48, 55)">
        <circle cx="0" cy="0" r="30" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>
        <circle cx="0" cy="0" r="10" fill="#CA8A04" stroke="#A16207" stroke-width="1.5"/>
        <rect x="-3" y="-12" width="6" height="8" fill="#FDE047"/>
        <text x="0" y="38" fill="#CBD5E1" font-size="6" font-weight="bold" text-anchor="middle">28BYJ-48</text>
      </g>

      <!-- ULN2003 Driver Board Area -->
      <g transform="translate(100, 32)">
        <rect width="70" height="60" rx="4" fill="#1E293B" stroke="#475569" stroke-width="1"/>
        <!-- 4 State LEDs -->
        ${[0, 1, 2, 3].map(i => `
          <circle cx="${14 + i * 14}" cy="14" r="3" fill="#EF4444"/>
        `).join('')}
        <text x="35" y="34" fill="#E2E8F0" font-size="6.5" font-weight="bold" text-anchor="middle">ULN2003</text>
      </g>

      <!-- 6-Pin Input Header (IN1, IN2, IN3, IN4, VCC, GND) -->
      <g transform="translate(18, 130)">
        ${[
          { name: 'IN1', x: 10, c: '#3B82F6' },
          { name: 'IN2', x: 36, c: '#3B82F6' },
          { name: 'IN3', x: 62, c: '#3B82F6' },
          { name: 'IN4', x: 88, c: '#3B82F6' },
          { name: 'VCC', x: 114, c: '#EF4444' },
          { name: 'GND', x: 140, c: '#0F172A' }
        ].map(p => `
          <circle cx="${p.x}" cy="0" r="3.5" fill="${p.c}" stroke="#FFFFFF" stroke-width="1"/>
          <text x="${p.x}" y="-6" fill="#CBD5E1" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">${p.name}</text>
        `).join('')}
      </g>
      <text x="90" y="16" fill="#F8FAFC" font-size="8" font-weight="bold" text-anchor="middle">STEPPER + ULN2003</text>
    </g>
  `;
}

// ----------------------------------------------------------------------------
// 40. 4x4 MATRIX KEYPAD
// ----------------------------------------------------------------------------
export function renderRealKeypad4x4(x: number, y: number): string {
  const keys = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'];
  return `
    <!-- 4x4 Matrix Membrane Keypad -->
    <g transform="translate(${x}, ${y})" filter="url(#real-drop-shadow)">
      <rect width="150" height="170" rx="8" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      
      <!-- Keypad Buttons Grid -->
      <g transform="translate(18, 30)">
        ${keys.map((k, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const isLetter = ['A', 'B', 'C', 'D'].includes(k);
          return `
            <g transform="translate(${col * 28}, ${row * 24})">
              <rect width="24" height="20" rx="3" fill="${isLetter ? '#262626' : '#141414'}" stroke="${isLetter ? '#737373' : '#333333'}" stroke-width="1"/>
              <text x="12" y="14" fill="#FFFFFF" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">${k}</text>
            </g>
          `;
        }).join('')}
      </g>

      <!-- 8-Pin Ribbon Header at Bottom -->
      <g transform="translate(14, 150)">
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(p => `
          <circle cx="${p * 14}" cy="0" r="3" fill="#CA8A04"/>
        `).join('')}
      </g>
      <text x="75" y="18" fill="#F8FAFC" font-size="8" font-weight="bold" text-anchor="middle">4x4 MATRIX KEYPAD</text>
    </g>
  `;
}


