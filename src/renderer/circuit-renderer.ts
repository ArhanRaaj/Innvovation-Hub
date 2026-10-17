// ============================================================================
// OMNILAB SCIENCE PROJECTS - UNIFIED CIRCUIT RENDERING ENGINE
// Seamlessly toggles between Real Physical Components View & Blueprint Schematic,
// integrates orthogonal wire conduit routing, and handles display hardware modes.
// ============================================================================

import type { ScienceProject, DisplayHardwareMode, WireRoutingStyle, CircuitViewMode, WireConnection, WireFilterMode } from '../types.ts';
import {
  renderRealArduinoUno,
  renderRealESP32,
  renderRealESP32S3Mini,
  renderRealESP32CAM,
  renderRealCapacitiveSoilProbe,
  renderRealRelayModule,
  renderRealWaterPump,
  renderRealSG90Servo,
  renderRealRC522Module,
  renderRealUltrasonicSensor,
  renderRealL298NDriver,
  renderRealDCMotors,
  renderRealBuzzer,
  renderRealLED,
  renderRealPiezoArray,
  renderRealLCD1602,
  renderRealOLED,
  renderRealCorelessMotors,
  renderRealDS3231RTC,
  renderRealMPU6050,
  renderRealAnalogJoystick,
  renderRealDFPlayerMini,
  renderRealMAX98357A,
  renderRealSpeaker,
  renderRealVoltageSensor,
  renderRealLDR,
  renderRealDualLDR,
  renderRealBluetoothHC05,
  renderRealFlameSensor,
  renderRealGenericModule,
  renderRealDHT11,
  renderRealPIRSensor,
  renderRealMQGasSensor,
  renderRealIRSensor,
  renderRealSoundSensor,
  renderRealPotentiometer,
  renderRealPushButton,
  renderRealTouchSensor,
  renderRealBatteryPack,
  renderRealStepperMotor,
  renderRealKeypad4x4
} from './real-components.ts';
import { renderVectorSchematic } from './vector-schematic.ts';
import {
  getArduinoPinCoord,
  getESP32PinCoord,
  getMcuPinCoord,
  isMcuPin,
  getComponentTargetCoord,
  generateWirePath,
  WIRE_HEX_MAP,
  isPowerWire
} from './wire-engine.ts';

export function projectRequiresDisplay(project: ScienceProject): boolean {
  const str = (
    (project.title || '') + ' ' +
    (project.tags ? project.tags.join(' ') : '') + ' ' +
    (project.components ? project.components.map(c => c.name).join(' ') : '') + ' ' +
    (project.circuitDiagram?.modules ? project.circuitDiagram.modules.map(m => m.name).join(' ') : '') + ' ' +
    (project.wiringTable ? project.wiringTable.map(w => w.to).join(' ') : '')
  ).toLowerCase();
  return str.includes('oled') || str.includes('ssd1306') || str.includes('1602') || str.includes('16x2') || str.includes('hd44780') || str.includes('lcd');
}

export function extractProjectComponents(project: ScienceProject): Array<{ name: string; type: string; pins: string[] }> {
  // 1. If project has explicit circuitDiagram.modules, use them directly (prevents duplicate ghost modules)
  if (project.circuitDiagram?.modules && project.circuitDiagram.modules.length > 0) {
    return project.circuitDiagram.modules.map(m => ({
      name: m.name,
      type: m.type || 'sensor',
      pins: Array.isArray(m.pins) ? [...m.pins] : ['VCC', 'GND', 'SIG']
    }));
  }

  // 2. Fallback deduction from BOM only when circuitDiagram.modules is completely absent
  const list: Array<{ name: string; type: string; pins: string[] }> = [];
  const seenTypes = new Set<string>();
  const ignoredNames = ['arduino', 'esp32', 'breadboard', 'jumper', 'wire', 'solderless', 'resistor', 'prototyping', 'pcb', 'screw', 'chassis', 'mount', 'standoff', 'bezel', 'case'];

  (project.components || []).forEach(c => {
    const cLower = c.name.toLowerCase();
    if (ignoredNames.some(ig => cLower.includes(ig))) return;

    let typeKey = '';
    if (cLower.includes('oled') || cLower.includes('lcd') || cLower.includes('display')) typeKey = 'display';
    else if (cLower.includes('servo')) {
      typeKey = cLower.includes('tilt') ? 'servo_tilt' : (cLower.includes('pan') ? 'servo_pan' : 'servo_' + list.length);
    }
    else if (cLower.includes('sonar') || cLower.includes('ultrasonic') || cLower.includes('sr04')) typeKey = 'sonar';
    else if (cLower.includes('touch') || cLower.includes('ttp223')) typeKey = 'touch';
    else if (cLower.includes('buzzer') || cLower.includes('piezo')) typeKey = 'buzzer';
    else if (cLower.includes('relay')) typeKey = 'relay';
    else if (cLower.includes('soil')) typeKey = 'soil';
    else if (cLower.includes('pump')) typeKey = 'pump';
    else if (cLower.includes('mpu') || cLower.includes('imu')) typeKey = 'imu';
    else typeKey = cLower;

    if (seenTypes.has(typeKey)) return;
    seenTypes.add(typeKey);

    list.push({
      name: c.name,
      type: typeKey.includes('display') ? 'display' : (typeKey.includes('servo') ? 'actuator' : 'sensor'),
      pins: ['VCC', 'GND', 'SIG']
    });
  });

  return list;
}

export function renderComponentModule(
  mName: string,
  pins: string[],
  x: number,
  y: number,
  displayMode: DisplayHardwareMode,
  needsDisplay: boolean
): string {
  const n = mName.toLowerCase();

  if (n.includes('display') || n.includes('oled') || n.includes('lcd')) {
    if (!needsDisplay) return '';
    return (displayMode === 'lcd') ? renderRealLCD1602(x, y) : renderRealOLED(x, y);
  }
  if (n.includes('dht') || n.includes('temp') || n.includes('humid')) {
    return renderRealDHT11(x, y, mName);
  }
  if (n.includes('pir') || (n.includes('motion') && !n.includes('dc'))) {
    return renderRealPIRSensor(x, y);
  }
  if (n.includes('gas') || n.includes('smoke') || n.includes('mq')) {
    return renderRealMQGasSensor(x, y, mName);
  }
  if (n.includes('tcrt') || (n.includes('ir') && (n.includes('obstacle') || n.includes('proximity') || n.includes('track') || n.includes('sensor')))) {
    return renderRealIRSensor(x, y, mName);
  }
  if (n.includes('sound') || n.includes('mic') || n.includes('audio')) {
    return renderRealSoundSensor(x, y);
  }
  if (n.includes('potentiometer') || n.includes('pot') || n.includes('10k')) {
    return renderRealPotentiometer(x, y, mName);
  }
  if (n.includes('touch') || n.includes('ttp223')) {
    return renderRealTouchSensor(x, y);
  }
  if (n.includes('button') || n.includes('btn') || n.includes('tactile') || n.includes('switch')) {
    return renderRealPushButton(x, y, mName);
  }
  if (n.includes('battery') || n.includes('power supply') || n.includes('9v') || n.includes('batt')) {
    return renderRealBatteryPack(x, y, mName);
  }
  if (n.includes('stepper') || n.includes('uln2003') || n.includes('28byj')) {
    return renderRealStepperMotor(x, y);
  }
  if (n.includes('keypad') || n.includes('matrix')) {
    return renderRealKeypad4x4(x, y);
  }
  if (n.includes('soil') || n.includes('capacitive')) {
    return renderRealCapacitiveSoilProbe(x, y);
  }
  if (n.includes('pump') || n.includes('water pump')) {
    return renderRealWaterPump(x, y);
  }
  if (n.includes('relay')) {
    return renderRealRelayModule(x, y);
  }
  if (n.includes('servo') || n.includes('sg90') || n.includes('mg995')) {
    return renderRealSG90Servo(x, y);
  }
  if (n.includes('rfid') || n.includes('rc522')) {
    return renderRealRC522Module(x, y);
  }
  if (n.includes('ultrasonic') || n.includes('sonar') || n.includes('hc-sr04')) {
    return renderRealUltrasonicSensor(x, y);
  }
  if (n.includes('l298n') || n.includes('motor driver')) {
    return renderRealL298NDriver(x, y);
  }
  if (n.includes('dc motor') || n.includes('motors') || n.includes('gear motor')) {
    return renderRealDCMotors(x, y);
  }
  if (n.includes('coreless') || n.includes('drone motor')) {
    return renderRealCorelessMotors(x, y);
  }
  if (n.includes('buzzer')) {
    return renderRealBuzzer(x, y);
  }
  if (n.includes('led')) {
    const c = n.includes('green') ? 'green' : (n.includes('yellow') ? 'yellow' : (n.includes('blue') ? 'blue' : 'red'));
    return renderRealLED(x, y, c, mName);
  }
  if (n.includes('piezo')) {
    return renderRealPiezoArray(x, y);
  }
  if (n.includes('ds3231') || n.includes('rtc')) {
    return renderRealDS3231RTC(x, y);
  }
  if (n.includes('mpu') || n.includes('imu') || n.includes('gyro') || n.includes('accelerometer')) {
    return renderRealMPU6050(x, y);
  }
  if (n.includes('joystick')) {
    return renderRealAnalogJoystick(x, y);
  }
  if (n.includes('dfplayer')) {
    return renderRealDFPlayerMini(x, y);
  }
  if (n.includes('max98357') || n.includes('i2s amp')) {
    return renderRealMAX98357A(x, y);
  }
  if (n.includes('speaker')) {
    return renderRealSpeaker(x, y);
  }
  if (n.includes('voltage sensor')) {
    return renderRealVoltageSensor(x, y);
  }
  if (n.includes('ldr') || n.includes('light sensor') || n.includes('photoresistor')) {
    return n.includes('dual') ? renderRealDualLDR(x, y) : renderRealLDR(x, y, mName);
  }
  if (n.includes('bluetooth') || n.includes('hc-05')) {
    return renderRealBluetoothHC05(x, y);
  }
  if (n.includes('flame') || n.includes('fire')) {
    return renderRealFlameSensor(x, y);
  }
  if (n.includes('camera') || n.includes('esp32-cam')) {
    return renderRealESP32CAM(x, y);
  }

  // Fallback: Generic Breakout Module
  return renderRealGenericModule(x, y, mName, pins);
}

export function renderCircuitSchematicSVG(
  project: ScienceProject,
  viewMode: CircuitViewMode,
  displayMode: DisplayHardwareMode,
  routingStyle: WireRoutingStyle,
  wireFilter: WireFilterMode = 'all'
): string {
  const isArduino = project.board.toLowerCase().includes('arduino');
  const isS3 = project.id.includes('drone');
  const isCam = project.id.includes('cam');

  const svgW = 1040;
  const svgH = 620;

  let svg = `
    <svg id="main-circuit-svg" width="100%" height="580" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" 
         style="background:#050505; border-radius:12px; font-family:'JetBrains Mono', monospace; user-select:none;">
      <defs>
        <!-- Engineering CAD Dot Grid -->
        <pattern id="circuit-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#2E2E2E" />
        </pattern>
        <!-- Precision Major CAD Grid -->
        <pattern id="circuit-major-grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="none" stroke="#121212" stroke-width="0.75"/>
        </pattern>
        <!-- Realistic Component Drop Shadows -->
        <filter id="real-drop-shadow" x="-8%" y="-8%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.85"/>
        </filter>
        <filter id="wire-glow-active" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#FFFFFF" flood-opacity="0.75"/>
        </filter>
      </defs>

      <!-- Canvas Background -->
      <rect width="100%" height="100%" fill="#050505" />
      <rect width="100%" height="100%" fill="url(#circuit-major-grid)" />
      <rect width="100%" height="100%" fill="url(#circuit-dot-grid)" />

      <!-- Precision CAD Outer Corner Alignment Ticks -->
      <g stroke="#333333" stroke-width="1.2" fill="none">
        <path d="M 14 26 L 14 14 L 26 14" />
        <path d="M 1026 14 L 1038 14 L 1038 26" />
        <path d="M 14 606 L 14 618 L 26 618" />
        <path d="M 1026 618 L 1038 618 L 1038 606" />
      </g>
      
      <!-- Top Power Distribution Rails (Realistic Breadboard Bus Strip) -->
      <g transform="translate(40, 10)">
        <!-- Breadboard Rail Body -->
        <rect width="960" height="34" rx="4" fill="#0C0C0C" stroke="#262626" stroke-width="1.2" />
        
        <!-- Authentic Breadboard Socket Eyelets (Row 1 & Row 2) -->
        ${Array.from({ length: 42 }).map((_, i) => `
          <circle cx="${180 + i * 18}" cy="11" r="1.6" fill="#000000" stroke="#333333" stroke-width="0.8"/>
          <circle cx="${180 + i * 18}" cy="23" r="1.6" fill="#000000" stroke="#333333" stroke-width="0.8"/>
        `).join('')}

        <!-- Positive Bus (+ Red) -->
        <line x1="20" y1="11" x2="940" y2="11" stroke="#EF4444" stroke-width="2" stroke-linecap="round" />
        <rect x="20" y="4" width="130" height="14" rx="2" fill="#171717" stroke="#EF4444" stroke-width="0.8" />
        <text x="25" y="14" fill="#EF4444" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="bold">+ VCC BUS (${isArduino ? '5.0V' : '3.3V'})</text>

        <!-- Ground Bus (- Blue/Slate) -->
        <line x1="20" y1="23" x2="940" y2="23" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" />
        <rect x="790" y="16" width="150" height="14" rx="2" fill="#171717" stroke="#3B82F6" stroke-width="0.8" />
        <text x="795" y="26" fill="#60A5FA" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="bold">- COMMON SYSTEM GND</text>
      </g>

      <!-- Zoomable & Pannable Master Container -->
      <g id="circuit-zoom-container">
  `;

  // --------------------------------------------------------------------------
  // VIEW MODE A: REAL PHYSICAL COMPONENTS VIEW
  // --------------------------------------------------------------------------
  if (viewMode === 'real') {
    // 1. Render Left Microcontroller Board
    if (isCam) {
      svg += renderRealESP32CAM(50, 90);
    } else if (isS3) {
      svg += renderRealESP32S3Mini(50, 90);
    } else if (isArduino) {
      svg += renderRealArduinoUno(50, 100);
    } else {
      svg += renderRealESP32(50, 70);
    }

    // 2. Render Project-Specific Physical Modules (Right Canvas)
    svg += `<g id="physical-peripherals">`;

    const needsDisplay = projectRequiresDisplay(project);
    const pid = (project.id || '').toLowerCase();
    const pKeywords = (
      (project.title || '') + ' ' +
      (project.tags ? project.tags.join(' ') : '') + ' ' +
      (project.components ? project.components.map(c => c.name).join(' ') : '') + ' ' +
      (project.wiringTable ? project.wiringTable.map(w => w.to).join(' ') : '')
    ).toLowerCase();

    // Check if project has standard curated ID
    const isCuratedDefault = [
      'soil-moisture-auto-watering',
      'rfid-smart-access-system',
      'under-voltage-protection-system',
      'ultrasonic-radar-system',
      'obstacle-avoiding-robot-car',
      'reverse-car-parking-sensor',
      'electronic-drumset-7-piezo-python-esp32',
      'drone-esp32-s3-mini',
      'diy-digital-watch',
      'flight-simulator-mpu6050',
      'face-recognition-esp32-cam',
      'music-player-dfplayer-i2s'
    ].includes(project.id);

    if (project.id === 'soil-moisture-auto-watering') {
      svg += renderRealCapacitiveSoilProbe(530, 65);
      svg += renderRealRelayModule(720, 65);
      svg += renderRealWaterPump(920, 95);
      svg += renderRealBatteryPack(730, 230, '4x AA BATTERY PACK');
      if (needsDisplay) svg += (displayMode === 'lcd') ? renderRealLCD1602(530, 300) : renderRealOLED(530, 300);
    } else if (project.id === 'rfid-smart-access-system') {
      svg += renderRealRC522Module(530, 55);
      svg += renderRealSG90Servo(740, 55);
      svg += renderRealBuzzer(890, 65);
      svg += renderRealLED(870, 160, 'green', 'ACCESS OK');
      svg += renderRealLED(920, 160, 'red', 'DENIED');
      if (needsDisplay) svg += (displayMode === 'lcd') ? renderRealLCD1602(530, 320) : renderRealOLED(530, 320);
    } else if (project.id === 'under-voltage-protection-system') {
      svg += renderRealVoltageSensor(530, 65);
      svg += renderRealRelayModule(715, 65);
      svg += renderRealBuzzer(910, 65);
      svg += renderRealLED(875, 160, 'green', 'NORMAL');
      svg += renderRealLED(910, 160, 'yellow', 'UNDER-V');
      svg += renderRealLED(945, 160, 'red', 'OVER-V');
      if (needsDisplay) svg += (displayMode === 'lcd') ? renderRealLCD1602(530, 300) : renderRealOLED(530, 300);
    } else if (project.id === 'ultrasonic-radar-system') {
      svg += renderRealUltrasonicSensor(520, 65);
      svg += renderRealSG90Servo(800, 65);
      svg += renderRealBuzzer(560, 245);
      svg += renderRealLED(750, 245, 'red', 'TARGET');
      if (needsDisplay) svg += (displayMode === 'lcd') ? renderRealLCD1602(520, 360) : renderRealOLED(520, 360);
    } else if (project.id === 'obstacle-avoiding-robot-car') {
      svg += renderRealL298NDriver(530, 55);
      svg += renderRealUltrasonicSensor(810, 55);
      svg += renderRealSG90Servo(850, 175);
      svg += renderRealDCMotors(810, 290);
      svg += renderRealBatteryPack(530, 310, '7.4V Li-ion BATT');
    } else if (project.id === 'reverse-car-parking-sensor') {
      svg += renderRealUltrasonicSensor(530, 65);
      svg += renderRealBuzzer(760, 65);
      svg += renderRealLED(860, 65, 'green', 'SAFE');
      svg += renderRealLED(900, 65, 'yellow', 'CAUTION');
      svg += renderRealLED(940, 65, 'red', 'STOP');
      if (needsDisplay) svg += (displayMode === 'lcd') ? renderRealLCD1602(530, 290) : renderRealOLED(530, 290);
    } else if (project.id === 'electronic-drumset-7-piezo-python-esp32') {
      svg += renderRealPiezoArray(530, 55);
    } else if (project.id === 'drone-esp32-s3-mini') {
      svg += renderRealMPU6050(530, 65);
      svg += renderRealCorelessMotors(730, 65);
      svg += renderRealBatteryPack(530, 240, '1S 3.7V LiPo');
    } else if (project.id === 'diy-digital-watch') {
      svg += renderRealDS3231RTC(530, 65);
      svg += (displayMode === 'lcd') ? renderRealLCD1602(730, 65) : renderRealOLED(730, 65);
      svg += renderRealPushButton(730, 220, 'WAKE BUTTON');
      svg += renderRealPushButton(860, 220, 'SET BUTTON');
    } else if (project.id === 'flight-simulator-mpu6050') {
      svg += renderRealMPU6050(530, 65);
      svg += renderRealAnalogJoystick(730, 65);
      svg += renderRealBuzzer(910, 65);
      svg += renderRealLED(910, 150, 'red', 'STALL');
    } else if (project.id === 'face-recognition-esp32-cam') {
      svg += renderRealRelayModule(530, 65);
      svg += renderRealBuzzer(730, 65);
      svg += renderRealBatteryPack(730, 220, '5V 2A DC SUPPLY');
    } else if (project.id === 'music-player-dfplayer-i2s') {
      svg += renderRealDFPlayerMini(530, 65);
      svg += renderRealMAX98357A(710, 65);
      svg += renderRealSpeaker(890, 65);
    } else {
      // DYNAMIC UNIVERSAL HARDWARE EXTRACTION & LAYOUT ENGINE (Never drops any component)
      const peripherals = extractProjectComponents(project);
      
      // Filter out display modules if project does not require one
      const displayFiltered = peripherals.filter(p => {
        const pLower = p.name.toLowerCase();
        const isDisplay = pLower.includes('display') || pLower.includes('oled') || pLower.includes('lcd');
        return !isDisplay || needsDisplay;
      });

      if (displayFiltered.length > 0) {
        displayFiltered.forEach((p, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const mx = 530 + col * 225;
          const my = 65 + row * 165;
          svg += renderComponentModule(p.name, p.pins, mx, my, displayMode, needsDisplay);
        });
      } else {
        if (needsDisplay) {
          svg += (displayMode === 'lcd') ? renderRealLCD1602(540, 180) : renderRealOLED(540, 180);
        }
      }
    }

    svg += `</g>`;
  } else {
    // ------------------------------------------------------------------------
    // VIEW MODE B: VECTOR SCHEMATIC BLUEPRINT
    // ------------------------------------------------------------------------
    svg += renderVectorSchematic(project, displayMode);
  }

  // --------------------------------------------------------------------------
  // DRAW INTERACTIVE CLEAN CONDUIT TRUNK WIRES
  // --------------------------------------------------------------------------
  svg += `<g id="wires-group">`;

  const wiring = ensureCompleteCircuitWiring(project, displayMode);
  const totalWires = wiring.length;

  wiring.forEach((w, wi) => {
    const wireColor = WIRE_HEX_MAP[w.color] || '#3B82F6';
    const isPower = isPowerWire(w);
    let isFilteredOut = false;
    if (wireFilter === 'power' && !isPower) isFilteredOut = true;
    if (wireFilter === 'signals' && isPower) isFilteredOut = true;

    // Start point on MCU or source component (aware of viewMode)
    const startIsMcu = isMcuPin(w.from);
    const startPt = startIsMcu
      ? getMcuPinCoord(w.from, viewMode, isArduino, project.id)
      : getComponentTargetCoord({ ...w, to: w.from }, wi, totalWires, project, displayMode, viewMode);

    // End point on target component or MCU pin (aware of project modules & viewMode)
    const endIsMcu = isMcuPin(w.to);
    const endPt = endIsMcu
      ? getMcuPinCoord(w.to, viewMode, isArduino, project.id)
      : getComponentTargetCoord(w, wi, totalWires, project, displayMode, viewMode);

    // Compute route path & badge placement
    const { pathD, badgeX, badgeY } = generateWirePath(startPt, endPt, wi, totalWires, isArduino, routingStyle);
    const wireTypeClass = isPower ? 'wire-power' : 'wire-signal';
    const filterClass = isFilteredOut ? 'wire-filtered-out' : '';

    svg += `
      <g class="interactive-wire ${wireTypeClass} ${filterClass}" data-wire-idx="${wi}" data-from="${w.from}" data-to="${w.to}" data-color="${w.color}">
        <!-- Wire Layer 1: Ambient Halo -->
        <path class="wire-halo" d="${pathD}" fill="none" stroke="${wireColor}" stroke-width="8" stroke-opacity="0.12" stroke-linecap="round" stroke-linejoin="round" />
        
        <!-- Wire Layer 2: Outer Silicone Insulation Jacket -->
        <path class="wire-jacket" d="${pathD}" fill="none" stroke="${wireColor}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" />
        
        <!-- Wire Layer 3: Conductor Specular Highlight -->
        <path class="wire-specular" d="${pathD}" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-opacity="0.35" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Wire Layer 4: Live Electron Signal Pulse Animation Overlay -->
        <path class="wire-signal-pulse" d="${pathD}" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6, 26" />

        <!-- Start Terminal: DuPont Housing & Gold Contact Eyelet -->
        <g class="wire-terminal start-terminal" transform="translate(${startPt.x}, ${startPt.y})">
          <circle cx="0" cy="0" r="6" fill="#0A0A0A" stroke="#525252" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="3.2" fill="#EAB308" stroke="${wireColor}" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="1.2" fill="#FFFFFF"/>
        </g>

        <!-- End Terminal: DuPont Housing & Gold Contact Eyelet -->
        <g class="wire-terminal end-terminal" transform="translate(${endPt.x}, ${endPt.y})">
          <circle cx="0" cy="0" r="6" fill="#0A0A0A" stroke="#525252" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="3.2" fill="#EAB308" stroke="${wireColor}" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="1.2" fill="#FFFFFF"/>
        </g>

        <!-- Floating Interactive HUD Badge Tooltip (Smooth hover reveal, no wire blockage) -->
        <g class="wire-hud-tooltip" transform="translate(${badgeX}, ${badgeY})">
          <rect x="-85" y="-18" width="170" height="36" rx="6" fill="#0A0A0A" stroke="${wireColor}" stroke-width="1.5" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.95))"/>
          <text x="0" y="-3" fill="#FFFFFF" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="bold" text-anchor="middle">${w.from} ➔ ${w.to}</text>
          <text x="0" y="10" fill="${wireColor}" font-size="7.5" font-family="'JetBrains Mono', monospace" font-weight="600" text-anchor="middle">${w.desc.length > 28 ? w.desc.substring(0, 26) + '...' : w.desc}</text>
        </g>
      </g>
    `;
  });

  svg += `
        </g>
      </g> <!-- end #circuit-zoom-container -->
    </svg>
  `;

  return svg;
}

// Adapt wiring table according to selected display mode
export function adaptWiringForDisplay(wiring: WireConnection[], displayMode: DisplayHardwareMode): WireConnection[] {
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

// Ensure complete circuit wiring with power rails and peripheral power distribution
export function ensureCompleteCircuitWiring(
  project: ScienceProject,
  displayMode: DisplayHardwareMode
): WireConnection[] {
  let wiring = adaptWiringForDisplay(project.wiringTable || [], displayMode);
  const isArduino = project.board ? project.board.toLowerCase().includes('arduino') : false;
  const vccRailName = isArduino ? 'Positive 5.0V Power Rail' : 'Positive 3.3V Power Rail';
  const gndRailName = 'Common System Ground (GND)';

  // If the project already has a curated, verified wiring table (all 12 built-in projects),
  // DO NOT add synthetic power rail drops or MCU-to-rail wires!
  // All curated projects already connect sensors directly to MCU 5V/3.3V and GND or external batteries.
  const isCurated = [
    'soil-moisture-auto-watering',
    'rfid-smart-access-system',
    'under-voltage-protection-system',
    'ultrasonic-radar-system',
    'obstacle-avoiding-robot-car',
    'reverse-car-parking-sensor',
    'electronic-drumset-7-piezo-python-esp32',
    'drone-esp32-s3-mini',
    'diy-digital-watch',
    'flight-simulator-mpu6050',
    'face-recognition-esp32-cam',
    'music-player-dfplayer-i2s'
  ].includes(project.id);

  if (isCurated) {
    return wiring;
  }

  // For dynamic / AI-generated projects:
  // Only connect MCU to the power rails if the project wiring table explicitly references rails
  const explicitlyUsesRail = wiring.some(w =>
    w.to.toLowerCase().includes('rail') || w.to.toLowerCase().includes('bus') ||
    w.from.toLowerCase().includes('rail') || w.from.toLowerCase().includes('bus')
  );

  if (explicitlyUsesRail) {
    const hasMcuVcc = wiring.some(w => isPowerWire(w) && (w.to.toLowerCase().includes('rail') || w.to.toLowerCase().includes('bus')) && !w.to.toLowerCase().includes('gnd'));
    const hasMcuGnd = wiring.some(w => isPowerWire(w) && (w.to.toLowerCase().includes('rail') || w.to.toLowerCase().includes('bus')) && (w.to.toLowerCase().includes('gnd') || w.to.toLowerCase().includes('ground')));

    if (!hasMcuVcc) {
      wiring.unshift({
        from: isArduino ? 'Arduino 5V' : 'ESP32 VIN (5V)',
        to: vccRailName,
        color: 'red',
        desc: isArduino ? '5V Power Bus' : '3.3V Power Bus'
      });
    }
    if (!hasMcuGnd) {
      wiring.unshift({
        from: isArduino ? 'Arduino GND' : 'ESP32 GND',
        to: gndRailName,
        color: 'black',
        desc: 'System Ground Rail'
      });
    }
  }

  // Check which modules lack power connections, filtering out non-electronic parts
  const nonElectronic = ['server', 'wifi', 'wi-fi', 'telemetry', 'python', 'software', 'app', 'chassis', 'bracket', 'screw', 'battery', 'mount', 'standoff', 'prototyping', 'breadboard', 'resistor', 'button', 'switch', 'speaker', 'piezo', 'led'];
  const modules = extractProjectComponents(project);

  modules.forEach(m => {
    const mName = m.name;
    const mLower = mName.toLowerCase();

    if (nonElectronic.some(ne => mLower.includes(ne))) return;

    // Check if module already has any VCC or power connection in wiring
    const hasVcc = wiring.some(w => {
      const toL = w.to.toLowerCase();
      const fromL = w.from.toLowerCase();
      const matchesMod = toL.includes(mLower) || fromL.includes(mLower) || mLower.split(' ').some(word => word.length > 3 && (toL.includes(word) || fromL.includes(word)));
      return matchesMod && (toL.includes('vcc') || toL.includes('5v') || toL.includes('3.3v') || toL.includes('power') || toL.includes('vin') || fromL.includes('5v') || fromL.includes('3.3v'));
    });

    // Check if module already has any GND connection in wiring
    const hasGnd = wiring.some(w => {
      const toL = w.to.toLowerCase();
      const fromL = w.from.toLowerCase();
      const matchesMod = toL.includes(mLower) || fromL.includes(mLower) || mLower.split(' ').some(word => word.length > 3 && (toL.includes(word) || fromL.includes(word)));
      return matchesMod && (toL.includes('gnd') || toL.includes('ground') || toL.includes('neg') || toL.includes('(-)') || fromL.includes('gnd'));
    });

    const isOledOrLcd = mLower.includes('oled') || mLower.includes('lcd') || mLower.includes('display');

    if (!hasVcc) {
      const targetPin = isOledOrLcd ? (displayMode === 'lcd' ? '1602 LCD VCC (5V)' : '0.96" OLED VCC') : `${mName} VCC`;
      const powerSource = explicitlyUsesRail ? vccRailName : (isArduino ? 'Arduino 5V' : 'ESP32 VIN (5V)');
      wiring.push({
        from: powerSource,
        to: targetPin,
        color: 'red',
        desc: `${mName} Power Supply`
      });
    }

    if (!hasGnd) {
      const targetPin = isOledOrLcd ? (displayMode === 'lcd' ? '1602 LCD GND' : '0.96" OLED GND') : `${mName} GND`;
      const gndSource = explicitlyUsesRail ? gndRailName : (isArduino ? 'Arduino GND' : 'ESP32 GND');
      wiring.push({
        from: gndSource,
        to: targetPin,
        color: 'black',
        desc: `${mName} Ground Reference`
      });
    }
  });

  return wiring;
}
