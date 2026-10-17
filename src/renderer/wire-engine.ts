// ============================================================================
// OMNILAB SCIENCE PROJECTS - WIRE MANAGEMENT & ROUTING ENGINE
// Computes high-precision terminal coordinates, dedicated conduit trunk lanes,
// orthogonal corner fillets, cable harness S-curves, and interactive net badges.
// ============================================================================

import type { WireColor, WireConnection, Point2D, DisplayHardwareMode, WireRoutingStyle, CircuitViewMode, ScienceProject } from '../types.ts';

export const WIRE_HEX_MAP: Record<WireColor | string, string> = {
  red: '#EF4444',
  black: '#475569',
  blue: '#3B82F6',
  amber: '#F59E0B',
  green: '#10B981',
  purple: '#A855F7',
  orange: '#F97316',
  yellow: '#FACC15',
  white: '#F8FAFC',
  gray: '#94A3B8'
};

export function isPowerWire(w: WireConnection): boolean {
  const normColor = (w.color || '').toLowerCase();
  const fromNorm = (w.from || '').toUpperCase();
  const toNorm = (w.to || '').toUpperCase();
  if (normColor === 'red' || normColor === 'black' || normColor === 'gray') return true;
  if (fromNorm.includes('5V') || fromNorm.includes('3.3V') || fromNorm.includes('3V3') || fromNorm.includes('VIN') || fromNorm.includes('GND')) return true;
  if (toNorm.includes('5V') || toNorm.includes('3.3V') || toNorm.includes('3V3') || toNorm.includes('VCC') || toNorm.includes('GND') || toNorm.includes('VIN')) return true;
  return false;
}

// ----------------------------------------------------------------------------
// ARDUINO UNO PIN COORDINATES (Supports both Real & Blueprint Vector Views)
// ----------------------------------------------------------------------------
export function getArduinoPinCoord(pinStr: string, viewMode: CircuitViewMode = 'real', boardOriginX = 50, boardOriginY = 100): Point2D {
  const norm = pinStr.toUpperCase();

  // 1. Check Power and Analog Pins FIRST (prevents substring collision with 5, 4, etc.)
  if (norm.includes('3.3V') || norm.includes('3V3')) {
    return viewMode === 'vector' ? { x: 90, y: 390, name: '3V3' } : { x: boardOriginX + 124, y: boardOriginY + 284, name: '3V3' };
  }
  if (norm.includes('5V')) {
    return viewMode === 'vector' ? { x: 116, y: 390, name: '5V' } : { x: boardOriginX + 140, y: boardOriginY + 284, name: '5V' };
  }
  if (norm.includes('VIN')) {
    return viewMode === 'vector' ? { x: 194, y: 390, name: 'VIN' } : { x: boardOriginX + 188, y: boardOriginY + 284, name: 'VIN' };
  }
  if (norm.includes('AREF') || norm.includes('ARF')) {
    return viewMode === 'vector' ? { x: 106, y: 160, name: 'AREF' } : { x: boardOriginX + 116, y: boardOriginY + 16, name: 'AREF' };
  }

  // Analog Pins A0-A5
  const aMatch = norm.match(/\bA([0-5])\b/) || norm.match(/A([0-5])/);
  if (aMatch) {
    const aIdx = parseInt(aMatch[1], 10);
    return viewMode === 'vector'
      ? { x: 220 + aIdx * 26, y: 390, name: `A${aIdx}` }
      : { x: boardOriginX + 232 + aIdx * 16, y: boardOriginY + 284, name: `A${aIdx}` };
  }

  // Dedicated SCL / SDA Header Sockets
  if (norm.includes('SCL')) {
    return viewMode === 'vector' ? { x: 70, y: 160, name: 'SCL' } : { x: boardOriginX + 84, y: boardOriginY + 16, name: 'SCL' };
  }
  if (norm.includes('SDA')) {
    return viewMode === 'vector' ? { x: 88, y: 160, name: 'SDA' } : { x: boardOriginX + 100, y: boardOriginY + 16, name: 'SDA' };
  }

  // Ground Pins
  if (norm.includes('GND')) {
    if (norm.includes('TOP') || norm.includes('13') || norm.includes('DIGITAL')) {
      return viewMode === 'vector' ? { x: 124, y: 160, name: 'GND' } : { x: boardOriginX + 132, y: boardOriginY + 16, name: 'GND' };
    }
    return viewMode === 'vector' ? { x: 142, y: 390, name: 'GND' } : { x: boardOriginX + 156, y: boardOriginY + 284, name: 'GND' };
  }

  // Digital Pins: D0-D13 or PIN 0-13
  const dMatch = norm.match(/\b(?:D|PIN|DIGITAL)?\s*(1[0-3]|[0-9])\b/);
  if (dMatch) {
    const dNum = parseInt(dMatch[1], 10);
    const vecXMap: Record<number, number> = {
      13: 142, 12: 160, 11: 178, 10: 196, 9: 214, 8: 232,
      7: 250, 6: 268, 5: 286, 4: 304, 3: 322, 2: 340, 1: 358, 0: 376
    };
    const realXMap: Record<number, number> = {
      13: boardOriginX + 148, 12: boardOriginX + 164, 11: boardOriginX + 180, 10: boardOriginX + 196,
      9: boardOriginX + 212, 8: boardOriginX + 228, 7: boardOriginX + 256, 6: boardOriginX + 272,
      5: boardOriginX + 288, 4: boardOriginX + 304, 3: boardOriginX + 320, 2: boardOriginX + 336,
      1: boardOriginX + 352, 0: boardOriginX + 368
    };

    if (vecXMap[dNum] !== undefined) {
      return viewMode === 'vector'
        ? { x: vecXMap[dNum], y: 160, name: `D${dNum}` }
        : { x: realXMap[dNum], y: boardOriginY + 16, name: `D${dNum}` };
    }
  }

  // Fallback to Power 5V Pin
  return viewMode === 'vector' ? { x: 116, y: 390, name: '5V' } : { x: boardOriginX + 140, y: boardOriginY + 284, name: '5V' };
}

// ----------------------------------------------------------------------------
// ESP32 DEVKIT PIN COORDINATES (Supports both Real & Blueprint Vector Views)
// ----------------------------------------------------------------------------
// ESP32 DEVKIT PIN COORDINATES (Supports Standard DevKit, ESP32-S3 Mini & ESP32-CAM)
// ----------------------------------------------------------------------------
export function getESP32PinCoord(
  pinStr: string,
  viewMode: CircuitViewMode = 'real',
  boardOriginX = 50,
  boardOriginY = 70,
  projectId = ''
): Point2D {
  const norm = pinStr.toUpperCase();

  // Special Layout A: ESP32-S3 Mini (used on Quadcopter Drone)
  if (projectId.includes('drone') || norm.includes('S3') || norm.includes('MINI')) {
    const s3X = 50;
    const s3Y = 100;
    if (norm.includes('3.3V') || norm.includes('3V3')) return { x: s3X + 16, y: s3Y + 60, name: '3V3' };
    if (norm.includes('VIN') || norm.includes('5V')) return { x: s3X + 194, y: s3Y + 60, name: 'VIN' };
    if (norm.includes('GND')) return { x: s3X + 16, y: s3Y + 270, name: 'GND' };

    // S3 Left Pins: 3V3, G4, G5, G6, G7, G8, G9, GND (at s3Y + 60 + i * 30)
    const s3Left = norm.match(/\b(?:G|GPIO)?([4-9])\b/);
    if (s3Left) {
      const gNum = parseInt(s3Left[1], 10);
      const idx = gNum - 4 + 1;
      return { x: s3X + 16, y: s3Y + 60 + idx * 30, name: `GPIO${gNum}` };
    }
    // S3 Right Pins: VIN, GND, G10, G11, G12, G13, G14, G15 (at s3Y + 60 + i * 30)
    const s3Right = norm.match(/\b(?:G|GPIO)?(1[0-5])\b/);
    if (s3Right) {
      const gNum = parseInt(s3Right[1], 10);
      const idx = gNum - 10 + 2;
      return { x: s3X + 194, y: s3Y + 60 + idx * 30, name: `GPIO${gNum}` };
    }
    return { x: s3X + 16, y: s3Y + 60, name: '3V3' };
  }

  // Special Layout B: ESP32-CAM AI Vision Board (used on Face Recognition)
  if (projectId.includes('cam') || norm.includes('CAM')) {
    const camX = 50;
    const camY = 100;
    // Bottom Header at y = 340 (x: 15, 37, 59, 81, 103, 125, 147, 169)
    if (norm.includes('5V')) return { x: camX + 15, y: camY + 240, name: '5V' };
    if (norm.includes('GND')) return { x: camX + 37, y: camY + 240, name: 'GND' };
    if (norm.includes('12')) return { x: camX + 59, y: camY + 240, name: 'IO12' };
    if (norm.includes('13')) return { x: camX + 81, y: camY + 240, name: 'IO13' };
    if (norm.includes('14')) return { x: camX + 103, y: camY + 240, name: 'IO14' };
    if (norm.includes('15')) return { x: camX + 125, y: camY + 240, name: 'IO15' };
    if (norm.includes('2')) return { x: camX + 147, y: camY + 240, name: 'IO2' };
    if (norm.includes('4')) return { x: camX + 169, y: camY + 240, name: 'IO4' };
    // Flashing & Programming Top Pins
    if (norm.includes('0') || norm.includes('BOOT')) return { x: camX + 100, y: camY + 45, name: 'IO0' };
    if (norm.includes('U0R') || norm.includes('RX')) return { x: camX + 125, y: camY + 45, name: 'U0R' };
    if (norm.includes('U0T') || norm.includes('TX')) return { x: camX + 150, y: camY + 45, name: 'U0T' };
    return { x: camX + 15, y: camY + 240, name: '5V' };
  }

  // Standard ESP32 NodeMCU 30-Pin Board
  // 1. Power Pins
  if (norm.includes('3.3V') || norm.includes('3V3')) {
    return viewMode === 'vector' ? { x: 68, y: 143, name: '3V3' } : { x: boardOriginX + 24, y: boardOriginY + 70, name: '3V3' };
  }
  if (norm.includes('5V') || norm.includes('VIN')) {
    return viewMode === 'vector' ? { x: 302, y: 143, name: 'VIN' } : { x: boardOriginX + 246, y: boardOriginY + 70, name: 'VIN(5V)' };
  }
  if (norm.includes('EN')) {
    return viewMode === 'vector' ? { x: 68, y: 143 + 26, name: 'EN' } : { x: boardOriginX + 24, y: boardOriginY + 96, name: 'EN' };
  }
  if (norm.includes('VP') || norm.includes('36')) {
    return viewMode === 'vector' ? { x: 68, y: 143 + 52, name: 'GPIO36' } : { x: boardOriginX + 24, y: boardOriginY + 122, name: 'GPIO36' };
  }
  if (norm.includes('VN') || norm.includes('39')) {
    return viewMode === 'vector' ? { x: 68, y: 143 + 78, name: 'GPIO39' } : { x: boardOriginX + 24, y: boardOriginY + 148, name: 'GPIO39' };
  }

  // Left vs Right GND
  if (norm.includes('GND')) {
    if (norm.includes('LEFT')) {
      return viewMode === 'vector' ? { x: 68, y: 143 + 13 * 26, name: 'GND' } : { x: boardOriginX + 24, y: boardOriginY + 408, name: 'GND' };
    }
    return viewMode === 'vector' ? { x: 302, y: 143 + 26, name: 'GND' } : { x: boardOriginX + 246, y: boardOriginY + 96, name: 'GND' };
  }

  // Dedicated I2C Pins (Default ESP32 Wire SDA=GPIO21, SCL=GPIO22)
  if (norm.includes('SDA')) {
    return viewMode === 'vector' ? { x: 302, y: 143 + 10 * 26, name: 'SDA(GPIO21)' } : { x: boardOriginX + 246, y: boardOriginY + 70 + 10 * 26, name: 'SDA(GPIO21)' };
  }
  if (norm.includes('SCL')) {
    return viewMode === 'vector' ? { x: 302, y: 143 + 7 * 26, name: 'SCL(GPIO22)' } : { x: boardOriginX + 246, y: boardOriginY + 70 + 7 * 26, name: 'SCL(GPIO22)' };
  }

  // Match Specific GPIO Numbers
  const numMatch = norm.match(/\b(?:GPIO|PIN|D|IO)?\s*([0-9]+)\b/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const leftIdxMap: Record<number, number> = {
      36: 2, 39: 3, 34: 4, 35: 5, 32: 6, 33: 7, 25: 8, 26: 9, 27: 10, 14: 11, 12: 12
    };
    if (leftIdxMap[num] !== undefined) {
      const idx = leftIdxMap[num];
      return viewMode === 'vector'
        ? { x: 68, y: 143 + idx * 26, name: `GPIO${num}` }
        : { x: boardOriginX + 24, y: boardOriginY + 70 + idx * 26, name: `GPIO${num}` };
    }

    const rightIdxMap: Record<number, number> = {
      13: 2, 9: 3, 10: 4, 11: 5, 23: 6, 22: 7, 1: 8, 3: 9, 21: 10, 19: 11, 18: 12, 5: 13, 4: 14, 2: 14, 15: 14
    };
    if (rightIdxMap[num] !== undefined) {
      const idx = rightIdxMap[num];
      return viewMode === 'vector'
        ? { x: 302, y: 143 + idx * 26, name: `GPIO${num}` }
        : { x: boardOriginX + 246, y: boardOriginY + 70 + idx * 26, name: `GPIO${num}` };
    }
  }

  // Dedicated UART Pins
  if (norm.includes('TX')) {
    return viewMode === 'vector' ? { x: 302, y: 143 + 8 * 26, name: 'TX0' } : { x: boardOriginX + 246, y: boardOriginY + 278, name: 'TX0' };
  }
  if (norm.includes('RX')) {
    return viewMode === 'vector' ? { x: 302, y: 143 + 9 * 26, name: 'RX0' } : { x: boardOriginX + 246, y: boardOriginY + 304, name: 'RX0' };
  }

  // Fallback
  return viewMode === 'vector' ? { x: 302, y: 143, name: 'VIN' } : { x: boardOriginX + 246, y: boardOriginY + 70, name: 'VIN(5V)' };
}

// ----------------------------------------------------------------------------
// UNIVERSAL MCU PIN DETECTOR & RESOLVER
// ----------------------------------------------------------------------------
export function isMcuPin(str: string): boolean {
  const norm = str.toUpperCase().trim();

  // Peripheral modules, sensors, and power rails (e.g. '0.96" OLED SDA', 'Pan Servo PWM', 'Positive 5V Power Rail')
  const isPeripheral = /\b(OLED|LCD|DISPLAY|SERVO|SONAR|HC-?SR04|SR04|TTP223|TOUCH|SENSOR|MODULE|BUZZER|PIEZO|RELAY|PUMP|L298N|BATTERY|BATT|MOTOR|SPEAKER|DFPLAYER|MAX98357|MPU|RTC|DS3231|PROBE|JOYSTICK|RAIL|BUS)\b/i.test(norm);
  if (isPeripheral && !norm.includes('ARDUINO') && !norm.includes('ESP32') && !norm.includes('CAM')) {
    return false;
  }

  // Explicit MCU designations
  if (norm.includes('ARDUINO') || norm.includes('UNO') || norm.includes('ESP32') || norm.includes('GPIO') || norm.includes('CAM') || norm.includes('BOARD') || norm.includes('NODE')) {
    return true;
  }

  // Standalone MCU board pin designations (e.g. "Pin 4", "D13", "A0", "5V", "3.3V", "GND", "VIN")
  return /^(A[0-5]|D[0-9]|D1[0-3]|PIN\s*[0-9]+|5V|3V3|3\.3V|GND|VIN|AREF|SCL|SDA|EN|VP|VN|TX0?|RX0?)$/.test(norm) ||
         /\b(GPIO\s*[0-9]+|PIN\s*[0-9]+|ANALOG\s*A[0-5]|DIGITAL\s*D?[0-9]+)\b/.test(norm);
}

export function getMcuPinCoord(
  pinStr: string,
  viewMode: CircuitViewMode = 'real',
  isProjectArduino: boolean = true,
  projectId: string = ''
): Point2D {
  const norm = pinStr.toUpperCase();
  if (norm.includes('ESP32') || norm.includes('CAM') || (!isProjectArduino && !norm.includes('ARDUINO') && !norm.includes('UNO'))) {
    return getESP32PinCoord(pinStr, viewMode, 50, 70, projectId);
  }
  return getArduinoPinCoord(pinStr, viewMode, 50, 100);
}

// ----------------------------------------------------------------------------
// COMPONENT DESTINATION TERMINAL COORDINATES
// ----------------------------------------------------------------------------
export function getComponentTargetCoord(
  connection: WireConnection,
  index: number,
  total: number,
  projectOrId: ScienceProject | string,
  displayMode: DisplayHardwareMode,
  viewMode: CircuitViewMode = 'real'
): Point2D {
  const norm = connection.to.toUpperCase().replace(/\s+/g, '');
  const project: ScienceProject | null = typeof projectOrId === 'object' ? projectOrId : null;
  const projectId = typeof projectOrId === 'string' ? projectOrId : (projectOrId?.id || '');
  const isArduino = project && project.board
    ? project.board.toLowerCase().includes('arduino')
    : (!projectId.includes('drone') && !projectId.includes('cam') && !projectId.includes('drum'));

  // 0. MCU PIN TARGET RESOLVER
  // When a wire terminates on an MCU pin (e.g. L298N 5V -> Arduino 5V, Buttons -> Arduino GND, ESP32-CAM GPIO0 -> GND)
  if (
    norm.includes('ARDUINO') ||
    norm.includes('UNO') ||
    norm.includes('ESP32') ||
    norm.includes('CAMGND') ||
    norm.includes('CAM5V') ||
    (isMcuPin(connection.to) && !norm.includes('SENSOR') && !norm.includes('MODULE') && !norm.includes('COMMON') && !norm.includes('ALL'))
  ) {
    return getMcuPinCoord(connection.to, viewMode, isArduino, projectId);
  }

  // 1. BLUEPRINT VECTOR SCHEMATIC MODE TARGET RESOLVER
  if (viewMode === 'vector') {
    const modules = (typeof projectOrId === 'object' && projectOrId.circuitDiagram?.modules)
      ? projectOrId.circuitDiagram.modules
      : [];

    let modIdx = -1;
    let pinIdx = 0;
    const cleanNorm = norm.replace(/[^A-Z0-9]/g, '');

    if (modules.length > 0) {
      for (let mi = 0; mi < modules.length; mi++) {
        const mod = modules[mi];
        const cleanMod = mod.name.toUpperCase().replace(/[^A-Z0-9]/g, '');

        const isDisplay = (cleanMod.includes('DISPLAY') || cleanMod.includes('OLED') || cleanMod.includes('LCD')) &&
                          (cleanNorm.includes('OLED') || cleanNorm.includes('LCD') || cleanNorm.includes('DISPLAY'));
        const isRelay = cleanMod.includes('RELAY') && cleanNorm.includes('RELAY');
        const isSoil = (cleanMod.includes('SOIL') || cleanMod.includes('CAPACITIVE')) &&
                       (cleanNorm.includes('SOIL') || cleanNorm.includes('CAPACITIVE') || cleanNorm.includes('MOISTURE'));
        const isPump = cleanMod.includes('PUMP') && cleanNorm.includes('PUMP');
        const isBatt = (cleanMod.includes('BATTERY') || cleanMod.includes('BATT') || cleanMod.includes('POWER')) &&
                       (cleanNorm.includes('BATTERY') || cleanNorm.includes('BATT') || cleanNorm.includes('EXT'));
        const isServo = (cleanMod.includes('SERVO') || cleanMod.includes('SG90')) && cleanNorm.includes('SERVO');
        const isSonar = (cleanMod.includes('ULTRASONIC') || cleanMod.includes('SR04') || cleanMod.includes('SONAR')) &&
                        (cleanNorm.includes('ULTRASONIC') || cleanNorm.includes('SR04') || cleanNorm.includes('SONAR'));
        const isMpu = (cleanMod.includes('MPU') || cleanMod.includes('IMU') || cleanMod.includes('GYRO')) &&
                      (cleanNorm.includes('MPU') || cleanNorm.includes('IMU') || cleanNorm.includes('GYRO'));

        if (isDisplay || isRelay || isSoil || isPump || isBatt || isServo || isSonar || isMpu || cleanNorm.includes(cleanMod) || cleanMod.includes(cleanNorm.slice(0, 4))) {
          modIdx = mi;
          if (mod.pins && mod.pins.length > 0) {
            for (let pi = 0; pi < mod.pins.length; pi++) {
              const pClean = mod.pins[pi].toUpperCase().replace(/[^A-Z0-9]/g, '');
              if (cleanNorm.includes(pClean) || pClean.includes(cleanNorm.slice(-3))) {
                pinIdx = pi;
                break;
              }
            }
          }
          break;
        }
      }
    }

    if (modIdx === -1) {
      const count = Math.max(1, modules.length || 3);
      modIdx = index % count;
      pinIdx = Math.floor(index / count) % 4;
    }

    const blockY = 65 + modIdx * 115;
    return {
      x: 540,
      y: blockY + 32 + (pinIdx * 14),
      name: connection.to.slice(0, 8)
    };
  }

  // 1B. POWER RAILS (Top Positive 5V & Ground Bus)
  if (norm.includes('POWERRAIL') || norm.includes('5VRAIL') || norm.includes('5VBUS') || norm.includes('POSITIVE5V') || norm.includes('POSITIVEPOWER') || norm.includes('ALLVCC') || norm.includes('BUS(5V)') || norm.includes('3.3VRAIL') || norm.includes('POSITIVE3.3V') || norm.includes('VCCRAIL') || norm.includes('VCCBUS') || norm.includes('3V3RAIL')) {
    return { x: 280 + (index % 16) * 35, y: 21, name: 'VCC-BUS' };
  }
  if (norm.includes('GROUNDRAIL') || norm.includes('GNDRAIL') || norm.includes('COMMONGROUND') || norm.includes('SYSTEMGROUND') || norm.includes('ALLGND') || norm.includes('COMMONGND') || norm.includes('GNDBUS')) {
    return { x: 295 + (index % 16) * 35, y: 33, name: 'GND-BUS' };
  }

  // 2. PROJECT-SPECIFIC TARGET COORDINATES (Curated Production Hardware Layouts)
  if (projectId === 'rfid-smart-access-system') {
    // RC522 at (530, 55), SG90 at (740, 55), Buzzer at (890, 65), Green LED at (870, 160), Red LED at (920, 160), OLED at (530, 320)
    if (norm.includes('RC522') || norm.includes('RFID')) {
      if (norm.includes('3.3V')) return { x: 548, y: 270, name: '3.3V' };
      if (norm.includes('RST')) return { x: 568, y: 270, name: 'RST' };
      if (norm.includes('GND')) return { x: 588, y: 270, name: 'GND' };
      if (norm.includes('MISO')) return { x: 628, y: 270, name: 'MISO' };
      if (norm.includes('MOSI')) return { x: 648, y: 270, name: 'MOSI' };
      if (norm.includes('SCK')) return { x: 668, y: 270, name: 'SCK' };
      if (norm.includes('SDA') || norm.includes('SS') || norm.includes('NSS')) return { x: 688, y: 270, name: 'SDA' };
    }
    if (norm.includes('SERVO')) {
      if (norm.includes('SIG') || norm.includes('ORANGE') || norm.includes('PWM')) return { x: 715, y: 135, name: 'SIG' };
      if (norm.includes('VCC') || norm.includes('RED') || norm.includes('5V')) return { x: 715, y: 140, name: 'VCC' };
      if (norm.includes('GND') || norm.includes('BROWN')) return { x: 715, y: 145, name: 'GND' };
    }
    if (norm.includes('BUZZER') || norm.includes('PIEZO')) {
      if (norm.includes('+') || norm.includes('POS') || norm.includes('SIG') || norm.includes('12')) return { x: 915, y: 100, name: 'BUZZ(+)' };
      return { x: 935, y: 100, name: 'BUZZ(-)' };
    }
    if (norm.includes('GREEN') || norm.includes('ACCESS') || norm.includes('AUTHORIZED') || norm.includes('14')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG') || norm.includes('14')) return { x: 888, y: 264, name: 'LED-G(+)' };
      return { x: 900, y: 230, name: 'LED-G(-)' };
    }
    if (norm.includes('RED') || norm.includes('DENIED') || norm.includes('27')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG') || norm.includes('27')) return { x: 938, y: 264, name: 'LED-R(+)' };
      return { x: 950, y: 230, name: 'LED-R(-)' };
    }
    if (norm.includes('OLED') || norm.includes('LCD') || norm.includes('DISPLAY')) {
      if (norm.includes('GND')) return { x: 570, y: 338, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V') || norm.includes('3.3V')) return { x: 598, y: 338, name: 'VCC' };
      if (norm.includes('SCL')) return { x: 626, y: 338, name: 'SCL' };
      if (norm.includes('SDA')) return { x: 654, y: 338, name: 'SDA' };
    }
  }

  if (projectId === 'soil-moisture-auto-watering') {
    // Capacitive Probe at (530, 65): AOUT=587, GND=610, VCC=633
    if (norm.includes('CAPACITIVE') || norm.includes('SENSOR') || norm.includes('SOIL')) {
      if (norm.includes('AOUT') || norm.includes('A0') || norm.includes('SIG')) return { x: 587, y: 82, name: 'AOUT' };
      if (norm.includes('GND')) return { x: 610, y: 82, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 633, y: 82, name: 'VCC' };
    }
    // Relay Module at (720, 65): IN=726, GND=726, VCC=726 | NO=867, COM=867, NC=867
    if (norm.includes('RELAY')) {
      if (norm.includes('IN')) return { x: 726, y: 125, name: 'IN' };
      if (norm.includes('GND')) return { x: 726, y: 145, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 726, y: 165, name: 'VCC' };
      if (norm.includes('COM')) return { x: 867, y: 140, name: 'COM' };
      if (norm.includes('NO')) return { x: 867, y: 110, name: 'NO' };
      if (norm.includes('NC')) return { x: 867, y: 170, name: 'NC' };
    }
    // Pump at (920, 95): Red(+)=885, Black(-)=885
    if (norm.includes('PUMP')) {
      if (norm.includes('RED') || norm.includes('+') || norm.includes('POS')) return { x: 885, y: 145, name: 'PUMP+' };
      return { x: 885, y: 160, name: 'PUMP-' };
    }
    // Battery Pack at (730, 230): (+)=775, (-)=815
    if (norm.includes('BATTERY') || norm.includes('BATT') || norm.includes('EXT')) {
      if (norm.includes('+') || norm.includes('POS')) return { x: 775, y: 345, name: 'BATT+' };
      return { x: 815, y: 345, name: 'BATT-' };
    }
    if (norm.includes('OLED') || norm.includes('LCD') || norm.includes('DISPLAY')) {
      if (norm.includes('GND')) return { x: 570, y: 318, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 598, y: 318, name: 'VCC' };
      if (norm.includes('SCL')) return { x: 626, y: 318, name: 'SCL' };
      if (norm.includes('SDA')) return { x: 654, y: 318, name: 'SDA' };
    }
  }

  if (projectId === 'under-voltage-protection-system') {
    // Voltage sensor at (530, 65), Relay at (715, 65), Buzzer at (910, 65), LEDs at (875, 910, 945, 160), OLED at (530, 300)
    if (norm.includes('SENSOR') || norm.includes('VOLTAGE')) {
      if (norm.includes('OUT') || norm.includes('SIG') || norm.includes('SIGNAL')) return { x: 546, y: 100, name: 'SIG' };
      if (norm.includes('GND')) return { x: 546, y: 120, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 546, y: 140, name: 'VCC' };
    }
    if (norm.includes('RELAY')) {
      if (norm.includes('IN')) return { x: 726, y: 115, name: 'IN' };
      if (norm.includes('GND')) return { x: 726, y: 135, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 726, y: 155, name: 'VCC' };
    }
    if (norm.includes('BUZZER') || norm.includes('PIEZO')) {
      if (norm.includes('+') || norm.includes('POS') || norm.includes('SIG')) return { x: 935, y: 100, name: 'BUZZ(+)' };
      return { x: 955, y: 100, name: 'BUZZ(-)' };
    }
    if (norm.includes('GREEN') || norm.includes('NORMAL')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG')) return { x: 893, y: 264, name: 'LED-G+' };
      return { x: 905, y: 230, name: 'LED-G-' };
    }
    if (norm.includes('YELLOW') || norm.includes('UNDER')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG')) return { x: 928, y: 264, name: 'LED-Y+' };
      return { x: 940, y: 230, name: 'LED-Y-' };
    }
    if (norm.includes('RED') || norm.includes('OVER')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG')) return { x: 963, y: 264, name: 'LED-R+' };
      return { x: 975, y: 230, name: 'LED-R-' };
    }
    if (norm.includes('OLED') || norm.includes('LCD') || norm.includes('DISPLAY')) {
      if (norm.includes('GND')) return { x: 570, y: 318, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 598, y: 318, name: 'VCC' };
      if (norm.includes('SCL')) return { x: 626, y: 318, name: 'SCL' };
      if (norm.includes('SDA')) return { x: 654, y: 318, name: 'SDA' };
    }
  }

  if (projectId === 'ultrasonic-radar-system') {
    // HC-SR04 at (520, 65), SG90 at (800, 65), Buzzer at (560, 245), LED at (750, 245), OLED/LCD at (520, 360)
    if (norm.includes('HC-SR04') || norm.includes('SONAR') || norm.includes('ULTRASONIC')) {
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 603, y: 173, name: 'VCC' };
      if (norm.includes('TRIG')) return { x: 618, y: 173, name: 'TRIG' };
      if (norm.includes('ECHO')) return { x: 633, y: 173, name: 'ECHO' };
      if (norm.includes('GND')) return { x: 648, y: 173, name: 'GND' };
    }
    if (norm.includes('SERVO')) {
      if (norm.includes('SIGNAL') || norm.includes('ORANGE') || norm.includes('PWM')) return { x: 765, y: 148, name: 'SIG' };
      if (norm.includes('VCC') || norm.includes('RED') || norm.includes('5V')) return { x: 765, y: 153, name: 'VCC' };
      if (norm.includes('GND') || norm.includes('BROWN')) return { x: 765, y: 158, name: 'GND' };
    }
    if (norm.includes('BUZZER') || norm.includes('PIEZO')) {
      if (norm.includes('+') || norm.includes('POS') || norm.includes('SIG')) return { x: 585, y: 280, name: 'BUZZ(+)' };
      return { x: 605, y: 280, name: 'BUZZ(-)' };
    }
    if (norm.includes('LED') || norm.includes('ALERT') || norm.includes('TARGET')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG')) return { x: 768, y: 349, name: 'LED+' };
      return { x: 780, y: 315, name: 'LED-' };
    }
    if (norm.includes('OLED') || norm.includes('LCD') || norm.includes('DISPLAY')) {
      if (norm.includes('GND')) return { x: 560, y: 378, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 588, y: 378, name: 'VCC' };
      if (norm.includes('SCL')) return { x: 616, y: 378, name: 'SCL' };
      if (norm.includes('SDA')) return { x: 644, y: 378, name: 'SDA' };
    }
  }

  if (projectId === 'obstacle-avoiding-robot-car') {
    // L298N at (530, 55), HC-SR04 & SG90 at (810, 55), Dual DC Motors at (810, 290), 7.4V Battery at (530, 310)
    if (norm.includes('BATTERY') || norm.includes('BATT') || norm.includes('7.4V')) {
      if (norm.includes('+') || norm.includes('POS')) return { x: 575, y: 425, name: 'BATT+' };
      return { x: 615, y: 425, name: 'BATT-' };
    }
    if (norm.includes('L298N')) {
      if (norm.includes('+12V') || norm.includes('12V') || norm.includes('BATT')) return { x: 545, y: 235, name: '12V' };
      if (norm.includes('GND')) return { x: 567, y: 235, name: 'GND' };
      if (norm.includes('+5V') || norm.includes('5V')) return { x: 590, y: 235, name: '+5V' };
      if (norm.includes('IN1')) return { x: 660, y: 255, name: 'IN1' };
      if (norm.includes('IN2')) return { x: 678, y: 255, name: 'IN2' };
      if (norm.includes('IN3')) return { x: 696, y: 255, name: 'IN3' };
      if (norm.includes('IN4')) return { x: 714, y: 255, name: 'IN4' };
      if (norm.includes('OUT1') || norm.includes('OUT2')) return { x: 530, y: 130, name: 'OUT1/2' };
      if (norm.includes('OUT3') || norm.includes('OUT4')) return { x: 740, y: 130, name: 'OUT3/4' };
    }
    if (norm.includes('HC-SR04') || norm.includes('SONAR') || norm.includes('ULTRASONIC')) {
      if (norm.includes('TRIG')) return { x: 875, y: 155, name: 'TRIG' };
      if (norm.includes('ECHO')) return { x: 890, y: 155, name: 'ECHO' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 860, y: 155, name: 'VCC' };
      if (norm.includes('GND')) return { x: 905, y: 155, name: 'GND' };
    }
    if (norm.includes('SERVO')) {
      if (norm.includes('SIG') || norm.includes('PIN')) return { x: 825, y: 255, name: 'SERVO' };
      if (norm.includes('VCC')) return { x: 825, y: 260, name: 'VCC' };
      return { x: 825, y: 265, name: 'GND' };
    }
    if (norm.includes('MOTOR')) {
      if (norm.includes('LEFT') || norm.includes('A')) return { x: 810, y: 320, name: 'MOT-L' };
      return { x: 810, y: 385, name: 'MOT-R' };
    }
  }

  if (projectId === 'reverse-car-parking-sensor') {
    // HC-SR04 at (530, 65), Buzzer at (760, 65), 3 LEDs at (860, 900, 940, 65), LCD/OLED at (530, 290)
    if (norm.includes('HC-SR04') || norm.includes('SONAR') || norm.includes('ULTRASONIC') || norm.includes('SENSOR')) {
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 613, y: 173, name: 'VCC' };
      if (norm.includes('TRIG')) return { x: 628, y: 173, name: 'TRIG' };
      if (norm.includes('ECHO')) return { x: 643, y: 173, name: 'ECHO' };
      if (norm.includes('GND')) return { x: 658, y: 173, name: 'GND' };
    }
    if (norm.includes('BUZZER') || norm.includes('PIEZO')) {
      if (norm.includes('+') || norm.includes('POS') || norm.includes('SIG')) return { x: 785, y: 100, name: 'BUZZ(+)' };
      return { x: 805, y: 100, name: 'BUZZ(-)' };
    }
    if (norm.includes('GREEN') || norm.includes('SAFE')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG')) return { x: 878, y: 169, name: 'LED-G+' };
      return { x: 890, y: 135, name: 'LED-G-' };
    }
    if (norm.includes('YELLOW') || norm.includes('CAUTION')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG')) return { x: 918, y: 169, name: 'LED-Y+' };
      return { x: 930, y: 135, name: 'LED-Y-' };
    }
    if (norm.includes('RED') || norm.includes('STOP')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG')) return { x: 958, y: 169, name: 'LED-R+' };
      return { x: 970, y: 135, name: 'LED-R-' };
    }
    if (norm.includes('OLED') || norm.includes('LCD') || norm.includes('DISPLAY')) {
      if (norm.includes('GND')) return { x: 570, y: 308, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 598, y: 308, name: 'VCC' };
      if (norm.includes('SCL')) return { x: 626, y: 308, name: 'SCL' };
      if (norm.includes('SDA')) return { x: 654, y: 308, name: 'SDA' };
    }
  }

  if (projectId === 'electronic-drumset-7-piezo-python-esp32') {
    // 7-Piezo array at (530, 55)
    const padIndex = (index < 7) ? index : (index % 7);
    const col = padIndex % 4;
    const row = Math.floor(padIndex / 4);
    return {
      x: 555 + col * 92 + 36,
      y: 97 + row * 105 + 36,
      name: `PAD-${padIndex + 1}`
    };
  }

  if (projectId === 'drone-esp32-s3-mini') {
    // MPU-6050 at (530, 65), Coreless motors at (730, 65), 1S LiPo at (530, 240)
    if (norm.includes('LIPO') || norm.includes('1S') || norm.includes('3.7V') || norm.includes('BATTERY') || norm.includes('BATT')) {
      if (norm.includes('+') || norm.includes('POS') || norm.includes('3.7V')) return { x: 575, y: 355, name: 'LIPO+' };
      return { x: 615, y: 355, name: 'LIPO-' };
    }
    if (norm.includes('MPU') || norm.includes('GYRO') || norm.includes('ACCEL')) {
      if (norm.includes('SDA')) return { x: 596, y: 175, name: 'SDA' };
      if (norm.includes('SCL')) return { x: 574, y: 175, name: 'SCL' };
      if (norm.includes('VCC') || norm.includes('3.3V')) return { x: 530, y: 175, name: 'VCC' };
      if (norm.includes('GND')) return { x: 552, y: 175, name: 'GND' };
    }
    if (norm.includes('MOTOR') || norm.includes('GATE') || norm.includes('PROP') || norm.includes('LEAD')) {
      if (norm.includes('1') || norm.includes('FRONT-RIGHT')) return { x: 920, y: 110, name: 'M1' };
      if (norm.includes('2') || norm.includes('REAR-RIGHT')) return { x: 920, y: 260, name: 'M2' };
      if (norm.includes('3') || norm.includes('REAR-LEFT')) return { x: 790, y: 260, name: 'M3' };
      if (norm.includes('4') || norm.includes('FRONT-LEFT')) return { x: 790, y: 110, name: 'M4' };
      return { x: 790, y: 110, name: 'MOT+' };
    }
  }

  if (projectId === 'diy-digital-watch') {
    // DS3231 RTC at (530, 65), OLED/LCD at (730, 65), Wake Button at (730, 220), Set Button at (860, 220)
    if (norm.includes('DS3231') || norm.includes('RTC')) {
      if (norm.includes('SDA')) return { x: 596, y: 195, name: 'SDA' };
      if (norm.includes('SCL')) return { x: 624, y: 195, name: 'SCL' };
      if (norm.includes('VCC') || norm.includes('3.3V') || norm.includes('5V')) return { x: 568, y: 195, name: 'VCC' };
      if (norm.includes('GND')) return { x: 540, y: 195, name: 'GND' };
    }
    if (norm.includes('OLED') || norm.includes('LCD') || norm.includes('DISPLAY')) {
      if (norm.includes('GND')) return { x: 770, y: 83, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 798, y: 83, name: 'VCC' };
      if (norm.includes('SCL')) return { x: 826, y: 83, name: 'SCL' };
      if (norm.includes('SDA')) return { x: 854, y: 83, name: 'SDA' };
    }
    if (norm.includes('BUTTON') || norm.includes('BTN') || norm.includes('WAKE') || norm.includes('SET') || norm.includes('LEG')) {
      if (norm.includes('COMMON') || norm.includes('LEG')) return { x: 814, y: 322, name: 'BTN-GND' };
      if (norm.includes('WAKE') || norm.includes('1')) return { x: 788, y: 322, name: 'WAKE' };
      return { x: 918, y: 322, name: 'SET' };
    }
  }

  if (projectId === 'flight-simulator-mpu6050') {
    // MPU-6050 at (530, 65), Joystick at (730, 65), Buzzer at (910, 65), LED at (910, 150)
    if (norm.includes('MPU') || norm.includes('GYRO')) {
      if (norm.includes('SDA')) return { x: 596, y: 175, name: 'SDA' };
      if (norm.includes('SCL')) return { x: 574, y: 175, name: 'SCL' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 530, y: 175, name: 'VCC' };
      if (norm.includes('GND')) return { x: 552, y: 175, name: 'GND' };
    }
    if (norm.includes('JOYSTICK') || norm.includes('THROTTLE') || norm.includes('VRX') || norm.includes('VRY')) {
      if (norm.includes('VRX') || norm.includes('THROTTLE')) return { x: 792, y: 195, name: 'VRX' };
      if (norm.includes('VRY') || norm.includes('RUDDER')) return { x: 818, y: 195, name: 'VRY' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 766, y: 195, name: 'VCC' };
      if (norm.includes('GND')) return { x: 740, y: 195, name: 'GND' };
    }
    if (norm.includes('BUZZER') || norm.includes('PIEZO')) {
      if (norm.includes('+') || norm.includes('POS') || norm.includes('SIG')) return { x: 935, y: 100, name: 'BUZZ(+)' };
      return { x: 955, y: 100, name: 'BUZZ(-)' };
    }
    if (norm.includes('LED') || norm.includes('STALL')) {
      if (norm.includes('ANODE') || norm.includes('+') || norm.includes('SIG')) return { x: 928, y: 254, name: 'LED+' };
      return { x: 940, y: 220, name: 'LED-' };
    }
  }

  if (projectId === 'face-recognition-esp32-cam') {
    // Relay at (530, 65), Buzzer at (730, 65), 5V DC External Supply at (730, 220)
    if (norm.includes('BATTERY') || norm.includes('BATT') || norm.includes('SUPPLY') || norm.includes('5VEXTERNAL') || norm.includes('EXT')) {
      if (norm.includes('+') || norm.includes('5V') || norm.includes('VCC')) return { x: 775, y: 335, name: '5V-EXT' };
      return { x: 815, y: 335, name: 'GND-EXT' };
    }
    if (norm.includes('RELAY')) {
      if (norm.includes('IN')) return { x: 536, y: 110, name: 'IN' };
      if (norm.includes('GND')) return { x: 536, y: 130, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 536, y: 150, name: 'VCC' };
    }
    if (norm.includes('BUZZER') || norm.includes('PIEZO')) {
      if (norm.includes('+') || norm.includes('POS') || norm.includes('SIG')) return { x: 755, y: 100, name: 'BUZZ(+)' };
      return { x: 775, y: 100, name: 'BUZZ(-)' };
    }
  }

  if (projectId === 'music-player-dfplayer-i2s') {
    // DFPlayer at (530, 65), MAX98357A at (710, 65), Speaker at (890, 65)
    if (norm.includes('DFPLAYER')) {
      if (norm.includes('RX')) return { x: 556, y: 220, name: 'RX' };
      if (norm.includes('TX')) return { x: 582, y: 220, name: 'TX' };
      if (norm.includes('SPK')) return { x: 608, y: 220, name: 'SPK' };
      if (norm.includes('VCC')) return { x: 530, y: 220, name: 'VCC' };
      if (norm.includes('GND')) return { x: 634, y: 220, name: 'GND' };
    }
    if (norm.includes('MAX98357') || norm.includes('I2S') || norm.includes('DAC')) {
      if (norm.includes('DIN')) return { x: 782, y: 165, name: 'DIN' };
      if (norm.includes('BCLK')) return { x: 800, y: 165, name: 'BCLK' };
      if (norm.includes('LRC')) return { x: 818, y: 165, name: 'LRC' };
      if (norm.includes('VCC') || norm.includes('VIN')) return { x: 710, y: 165, name: 'VIN' };
      if (norm.includes('GND')) return { x: 728, y: 165, name: 'GND' };
    }
    if (norm.includes('SPEAKER')) return { x: 940, y: 115, name: 'SPK' };
    if (norm.includes('BUTTON') || norm.includes('BTN')) return { x: 620, y: 250, name: 'NAV' };
  }

  // 3. GENERIC / DYNAMIC RESOLVER FOR CUSTOM AI PROJECTS
  if (norm.includes('BUZZER') || norm.includes('PIEZO')) {
    let bx = 890;
    let by = 65;
    const mods = project?.circuitDiagram?.modules || [];
    const bIdx = mods.findIndex((m: any) => m.name.toLowerCase().includes('buzzer') || m.name.toLowerCase().includes('piezo'));
    if (bIdx !== -1) {
      const col = bIdx % 2;
      const row = Math.floor(bIdx / 2);
      bx = 530 + col * 225;
      by = 65 + row * 165;
    }
    if (norm.includes('+') || norm.includes('POS') || norm.includes('SIG') || norm.includes('VCC')) {
      return { x: bx + 25, y: by + 35, name: 'BUZZ(+)' };
    }
    return { x: bx + 45, y: by + 35, name: 'BUZZ(-)' };
  }

  if (norm.includes('LED') || norm.includes('STATUS')) {
    let lx = 870;
    let ly = 160;
    const mods = project?.circuitDiagram?.modules || [];
    const lIdx = mods.findIndex((m: any) => m.name.toLowerCase().includes('led'));
    if (lIdx !== -1) {
      const col = lIdx % 2;
      const row = Math.floor(lIdx / 2);
      lx = 530 + col * 225;
      ly = 65 + row * 165;
    }
    if (norm.includes('+') || norm.includes('ANODE') || norm.includes('SIG') || norm.includes('PIN')) {
      return { x: lx + 18, y: ly + 104, name: 'LED+' };
    }
    return { x: lx + 30, y: ly + 70, name: 'LED-' };
  }

  // 4. DISPLAY MODULE TERMINALS (Real Components Mode fallback)
  if (norm.includes('OLED') || norm.includes('SSD1306') || (norm.includes('DISPLAY') && !norm.includes('DFPLAYER'))) {
    if (displayMode === 'lcd') {
      if (norm.includes('GND')) return { x: 610, y: 380, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('5V')) return { x: 610, y: 400, name: 'VCC' };
      if (norm.includes('SDA')) return { x: 610, y: 420, name: 'SDA' };
      if (norm.includes('SCL')) return { x: 610, y: 440, name: 'SCL' };
      return { x: 610, y: 380 + (index % 4) * 20, name: 'LCD' };
    } else {
      let ox = 530;
      let oy = 65;
      const mods = project?.circuitDiagram?.modules || [];
      const oledIdx = mods.findIndex((m: any) => m.name.toLowerCase().includes('oled') || m.name.toLowerCase().includes('display'));
      if (oledIdx !== -1) {
        const col = oledIdx % 2;
        const row = Math.floor(oledIdx / 2);
        ox = 530 + col * 225;
        oy = 65 + row * 165;
      }
      if (norm.includes('GND')) return { x: ox + 40, y: oy + 18, name: 'GND' };
      if (norm.includes('VCC') || norm.includes('3.3V') || norm.includes('5V')) return { x: ox + 68, y: oy + 18, name: 'VCC' };
      if (norm.includes('SCL')) return { x: ox + 96, y: oy + 18, name: 'SCL' };
      if (norm.includes('SDA')) return { x: ox + 124, y: oy + 18, name: 'SDA' };
      return { x: ox + 40 + (index % 4) * 28, y: oy + 18, name: 'OLED' };
    }
  }

  // 5. DUAL SERVO / PAN & TILT MOTOR RESOLVER
  if (norm.includes('SERVO') || norm.includes('SG90')) {
    const isTilt = norm.includes('TILT') || norm.includes('PITCH') || norm.includes('Y');
    let sx = isTilt ? 530 : 755;
    let sy = isTilt ? 230 : 65;
    const mods = project?.circuitDiagram?.modules || [];
    const sIdx = mods.findIndex((m: any) => {
      const mn = m.name.toLowerCase();
      if (isTilt) return mn.includes('tilt') || mn.includes('pitch');
      return mn.includes('pan') || mn.includes('yaw') || mn.includes('servo') || mn.includes('sg90');
    });
    if (sIdx !== -1) {
      const col = sIdx % 2;
      const row = Math.floor(sIdx / 2);
      sx = 530 + col * 225;
      sy = 65 + row * 165;
    }
    if (norm.includes('PWM') || norm.includes('SIG') || norm.includes('ORANGE') || norm.includes('YELLOW')) {
      return { x: sx - 35, y: sy + 83, name: isTilt ? 'TILT-SIG' : 'PAN-SIG' };
    }
    if (norm.includes('VCC') || norm.includes('RED') || norm.includes('5V')) {
      return { x: sx - 35, y: sy + 88, name: isTilt ? 'TILT-VCC' : 'PAN-VCC' };
    }
    return { x: sx - 35, y: sy + 93, name: isTilt ? 'TILT-GND' : 'PAN-GND' };
  }

  // 6. HC-SR04 ULTRASONIC SONAR SENSOR
  if (norm.includes('HC-SR04') || norm.includes('SR04') || norm.includes('SONAR') || norm.includes('ULTRASONIC')) {
    let ux = 755;
    let uy = 230;
    const mods = project?.circuitDiagram?.modules || [];
    const uIdx = mods.findIndex((m: any) => {
      const mn = m.name.toLowerCase();
      return mn.includes('sonar') || mn.includes('ultrasonic') || mn.includes('sr04');
    });
    if (uIdx !== -1) {
      const col = uIdx % 2;
      const row = Math.floor(uIdx / 2);
      ux = 530 + col * 225;
      uy = 65 + row * 165;
    }
    if (norm.includes('VCC') || norm.includes('5V')) return { x: ux + 83, y: uy + 108, name: 'TRIG-VCC' };
    if (norm.includes('TRIG')) return { x: ux + 98, y: uy + 108, name: 'TRIG' };
    if (norm.includes('ECHO')) return { x: ux + 113, y: uy + 108, name: 'ECHO' };
    if (norm.includes('GND')) return { x: ux + 128, y: uy + 108, name: 'SONAR-GND' };
    return { x: ux + 105, y: uy + 108, name: 'SONAR' };
  }

  // 7. CAPACITIVE TOUCH SENSOR (TTP223)
  if (norm.includes('TOUCH') || norm.includes('TTP223')) {
    let tx = 530;
    let ty = 395;
    const mods = project?.circuitDiagram?.modules || [];
    const tIdx = mods.findIndex((m: any) => {
      const mn = m.name.toLowerCase();
      return mn.includes('touch') || mn.includes('ttp223');
    });
    if (tIdx !== -1) {
      const col = tIdx % 2;
      const row = Math.floor(tIdx / 2);
      tx = 530 + col * 225;
      ty = 65 + row * 165;
    }
    if (norm.includes('VCC') || norm.includes('5V') || norm.includes('3.3V')) return { x: tx + 33, y: ty + 110, name: 'TOUCH-VCC' };
    if (norm.includes('I/O') || norm.includes('SIG') || norm.includes('OUT') || norm.includes('DATA')) return { x: tx + 60, y: ty + 110, name: 'TOUCH-IO' };
    if (norm.includes('GND')) return { x: tx + 87, y: ty + 110, name: 'TOUCH-GND' };
    return { x: tx + 60, y: ty + 110, name: 'TOUCH' };
  }


  // 3. SEMANTIC GENERAL COMPONENT TARGET RESOLVER (For AI-generated and custom robotics projects)
  if (norm.includes('LDR') || norm.includes('LIGHT') || norm.includes('PHOTO')) {
    let lx = 530;
    let ly = 65;
    const mods = project?.circuitDiagram?.modules || [];
    const lIdx = mods.findIndex((m: any) => m.name.toLowerCase().includes('ldr') || m.name.toLowerCase().includes('light'));
    if (lIdx !== -1) {
      const col = lIdx % 2;
      const row = Math.floor(lIdx / 2);
      lx = 530 + col * 225;
      ly = 65 + row * 165;
    }
    if (norm.includes('VCC') || norm.includes('3.3V') || norm.includes('5V')) return { x: lx + 36, y: ly + 130, name: 'VCC' };
    if (norm.includes('GND')) return { x: lx + 72, y: ly + 130, name: 'GND' };
    if (norm.includes('LDR1') || norm.includes('AO1') || norm.includes('EAST') || norm.includes('LDR_L') || norm.includes('LDRL') || norm.includes('LEFT') || (norm.includes('ANALOG') && !norm.includes('2'))) {
      return { x: lx + 108, y: ly + 130, name: 'AO1' };
    }
    if (norm.includes('LDR2') || norm.includes('AO2') || norm.includes('WEST') || norm.includes('LDR_R') || norm.includes('LDRR') || norm.includes('RIGHT')) {
      return { x: lx + 144, y: ly + 130, name: 'AO2' };
    }
    return { x: lx + 108, y: ly + 130, name: 'LDR' };
  }

  if (norm.includes('TCRT5000') || norm.includes('REFLECTANCE') || (norm.includes('IR') && (norm.includes('ARRAY') || norm.includes('SENSOR')))) {
    let rx = 530;
    let ry = 65;
    const mods = project?.circuitDiagram?.modules || [];
    const rIdx = mods.findIndex((m: any) => m.name.toLowerCase().includes('tcrt') || m.name.toLowerCase().includes('array') || m.name.toLowerCase().includes('ir'));
    if (rIdx !== -1) {
      const col = rIdx % 2;
      const row = Math.floor(rIdx / 2);
      rx = 530 + col * 225;
      ry = 65 + row * 165;
    }
    if (norm.includes('VCC') || norm.includes('5V')) return { x: rx + 25, y: ry + 120, name: 'VCC' };
    if (norm.includes('GND')) return { x: rx + 50, y: ry + 120, name: 'GND' };
    if (norm.includes('OUT1') || norm.includes('IR1') || norm.includes('1')) return { x: rx + 75, y: ry + 120, name: 'OUT1' };
    if (norm.includes('OUT2') || norm.includes('IR2') || norm.includes('2')) return { x: rx + 100, y: ry + 120, name: 'OUT2' };
    if (norm.includes('OUT3') || norm.includes('IR3') || norm.includes('3')) return { x: rx + 125, y: ry + 120, name: 'OUT3' };
    return { x: rx + 75, y: ry + 120, name: 'IR' };
  }

  if (norm.includes('SERVO') || norm.includes('SG90') || norm.includes('PAN') || norm.includes('TILT')) {
    // SG90 Servo is at (760, 80)
    if (norm.includes('PWM') || norm.includes('SIG') || norm.includes('ORANGE') || norm.includes('CONTROL')) {
      return { x: 760 + 25, y: 80 + 165, name: 'SIG' };
    }
    if (norm.includes('VCC') || norm.includes('5V') || norm.includes('RED') || norm.includes('VIN')) {
      return { x: 760 + 25, y: 80 + 175, name: 'VCC' };
    }
    if (norm.includes('GND') || norm.includes('BROWN') || norm.includes('BLACK')) {
      return { x: 760 + 25, y: 80 + 185, name: 'GND' };
    }
    return { x: 760 + 25, y: 80 + 165, name: 'SERVO' };
  }

  if (norm.includes('HC-SR04') || norm.includes('SONAR') || norm.includes('ULTRASONIC')) {
    // HC-SR04 is at (540, 80)
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 540 + 83, y: 80 + 110, name: 'VCC' };
    if (norm.includes('TRIG')) return { x: 540 + 98, y: 80 + 110, name: 'TRIG' };
    if (norm.includes('ECHO')) return { x: 540 + 113, y: 80 + 110, name: 'ECHO' };
    if (norm.includes('GND')) return { x: 540 + 128, y: 80 + 110, name: 'GND' };
    return { x: 540 + 98, y: 80 + 110, name: 'SONAR' };
  }

  if (norm.includes('FLAME') || norm.includes('FIRE')) {
    // Flame sensor at (530, 80)
    if (norm.includes('VCC')) return { x: 530 + 28, y: 80 + 110, name: 'VCC' };
    if (norm.includes('GND')) return { x: 530 + 56, y: 80 + 110, name: 'GND' };
    if (norm.includes('D0') || norm.includes('DIGITAL')) return { x: 530 + 84, y: 80 + 110, name: 'D0' };
    if (norm.includes('A0') || norm.includes('ANALOG') || norm.includes('SIG')) return { x: 530 + 112, y: 80 + 110, name: 'A0' };
    return { x: 530 + 112, y: 80 + 110, name: 'FLAME' };
  }

  if (norm.includes('BLUETOOTH') || norm.includes('HC-05') || norm.includes('HC05')) {
    // HC-05 at (740, 80)
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 740 + 94, y: 80 + 175, name: 'VCC' };
    if (norm.includes('GND')) return { x: 740 + 75, y: 80 + 175, name: 'GND' };
    if (norm.includes('TX')) return { x: 740 + 56, y: 80 + 175, name: 'TX' };
    if (norm.includes('RX')) return { x: 740 + 37, y: 80 + 175, name: 'RX' };
    return { x: 740 + 56, y: 80 + 175, name: 'BT' };
  }

  if (norm.includes('RELAY')) {
    // Relay at (720, 80)
    if (norm.includes('IN') || norm.includes('SIG')) return { x: 720 + 15, y: 80 + 65, name: 'IN' };
    if (norm.includes('GND')) return { x: 720 + 15, y: 80 + 85, name: 'GND' };
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 720 + 15, y: 80 + 105, name: 'VCC' };
    return { x: 720 + 15, y: 80 + 65, name: 'RELAY' };
  }

  if (norm.includes('PUMP') || norm.includes('MOTOR_WATER')) {
    if (norm.includes('+') || norm.includes('VCC') || norm.includes('RED')) return { x: 900 + 15, y: 100 + 45, name: '+' };
    return { x: 900 + 15, y: 100 + 65, name: '-' };
  }

  if (norm.includes('L298N') || norm.includes('DRIVER')) {
    let dx = 730;
    let dy = 65;
    const mods = project?.circuitDiagram?.modules || [];
    const dIdx = mods.findIndex((m: any) => m.name.toLowerCase().includes('l298n') || m.name.toLowerCase().includes('driver'));
    if (dIdx !== -1) {
      const col = dIdx % 2;
      const row = Math.floor(dIdx / 2);
      dx = 530 + col * 225;
      dy = 65 + row * 165;
    }
    if (norm.includes('IN1')) return { x: dx + 130, y: dy + 225, name: 'IN1' };
    if (norm.includes('IN2')) return { x: dx + 148, y: dy + 225, name: 'IN2' };
    if (norm.includes('IN3')) return { x: dx + 166, y: dy + 225, name: 'IN3' };
    if (norm.includes('IN4')) return { x: dx + 184, y: dy + 225, name: 'IN4' };
    if (norm.includes('ENA')) return { x: dx + 112, y: dy + 225, name: 'ENA' };
    if (norm.includes('ENB')) return { x: dx + 202, y: dy + 225, name: 'ENB' };
    if (norm.includes('12V') || norm.includes('BATT') || norm.includes('VCC') || norm.includes('5V')) return { x: dx + 20, y: dy + 220, name: '12V' };
    if (norm.includes('GND')) return { x: dx + 42, y: dy + 220, name: 'GND' };
    return { x: dx + 130, y: dy + 225, name: 'DRV' };
  }

  if (norm.includes('MPU') || norm.includes('IMU') || norm.includes('GYRO') || norm.includes('ACCEL')) {
    let mx = 530;
    let my = 65;
    const mods = project?.circuitDiagram?.modules || [];
    const mIdx = mods.findIndex((m: any) => m.name.toLowerCase().includes('mpu') || m.name.toLowerCase().includes('imu'));
    if (mIdx !== -1) {
      const col = mIdx % 2;
      const row = Math.floor(mIdx / 2);
      mx = 530 + col * 225;
      my = 65 + row * 165;
    }
    if (norm.includes('VCC') || norm.includes('3.3V') || norm.includes('5V')) return { x: mx + 26, y: my + 130, name: 'VCC' };
    if (norm.includes('GND')) return { x: mx + 44, y: my + 130, name: 'GND' };
    if (norm.includes('SCL')) return { x: mx + 62, y: my + 130, name: 'SCL' };
    if (norm.includes('SDA')) return { x: mx + 80, y: my + 130, name: 'SDA' };
    return { x: mx + 62, y: my + 130, name: 'IMU' };
  }

  if (norm.includes('BUZZER')) {
    return { x: 890 + 25, y: 80 + 50, name: 'BUZZ' };
  }

  if (norm.includes('LED')) {
    return { x: 910 + 10, y: 150 + 45, name: 'LED' };
  }

  if (norm.includes('DHT') || norm.includes('TEMP') || norm.includes('HUMID')) {
    // DHT11 / DHT22 Sensor Module at (530, 80)
    if (norm.includes('VCC') || norm.includes('5V') || norm.includes('3.3V')) return { x: 530 + 28, y: 80 + 130, name: 'VCC' };
    if (norm.includes('DATA') || norm.includes('SIG') || norm.includes('OUT')) return { x: 530 + 54, y: 80 + 130, name: 'DATA' };
    if (norm.includes('NC')) return { x: 530 + 80, y: 80 + 130, name: 'NC' };
    if (norm.includes('GND')) return { x: 530 + 106, y: 80 + 130, name: 'GND' };
    return { x: 530 + 54, y: 80 + 130, name: 'DHT' };
  }

  if (norm.includes('PIR') || (norm.includes('MOTION') && !norm.includes('DC'))) {
    // HC-SR501 PIR Sensor at (740, 80)
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 740 + 92, y: 80 + 135, name: 'VCC' };
    if (norm.includes('OUT') || norm.includes('SIG') || norm.includes('D0')) return { x: 740 + 110, y: 80 + 135, name: 'OUT' };
    if (norm.includes('GND')) return { x: 740 + 128, y: 80 + 135, name: 'GND' };
    return { x: 740 + 110, y: 80 + 135, name: 'PIR' };
  }

  if (norm.includes('MQ') || norm.includes('GAS') || norm.includes('SMOKE')) {
    // MQ Gas Sensor at (530, 80)
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 530 + 28, y: 80 + 130, name: 'VCC' };
    if (norm.includes('GND')) return { x: 530 + 58, y: 80 + 130, name: 'GND' };
    if (norm.includes('D0') || norm.includes('DIGITAL')) return { x: 530 + 88, y: 80 + 130, name: 'D0' };
    if (norm.includes('A0') || norm.includes('ANALOG') || norm.includes('SIG')) return { x: 530 + 118, y: 80 + 130, name: 'A0' };
    return { x: 530 + 118, y: 80 + 130, name: 'MQ' };
  }

  if (norm.includes('TCRT') || (norm.includes('IR') && (norm.includes('OBSTACLE') || norm.includes('TRACK')))) {
    // IR Obstacle Sensor at (530, 80)
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 530 + 24, y: 80 + 120, name: 'VCC' };
    if (norm.includes('GND')) return { x: 530 + 52, y: 80 + 120, name: 'GND' };
    if (norm.includes('D0') || norm.includes('DIGITAL')) return { x: 530 + 80, y: 80 + 120, name: 'D0' };
    if (norm.includes('A0') || norm.includes('SIG')) return { x: 530 + 108, y: 80 + 120, name: 'A0' };
    return { x: 530 + 80, y: 80 + 120, name: 'IR' };
  }

  if (norm.includes('SOUND') || norm.includes('MIC') || norm.includes('AUDIO')) {
    // Sound Detector Module at (740, 80)
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 740 + 24, y: 80 + 120, name: 'VCC' };
    if (norm.includes('GND')) return { x: 740 + 52, y: 80 + 120, name: 'GND' };
    if (norm.includes('D0') || norm.includes('DIGITAL')) return { x: 740 + 80, y: 80 + 120, name: 'D0' };
    if (norm.includes('A0') || norm.includes('SIG')) return { x: 740 + 108, y: 80 + 120, name: 'A0' };
    return { x: 740 + 108, y: 80 + 120, name: 'MIC' };
  }

  if (norm.includes('POTENTIOMETER') || norm.includes('POT') || norm.includes('10K')) {
    // 10K Potentiometer at (530, 80)
    if (norm.includes('VCC') || norm.includes('5V') || norm.includes('3.3V')) return { x: 530 + 35, y: 80 + 115, name: 'VCC' };
    if (norm.includes('SIG') || norm.includes('WIPER') || norm.includes('OUT')) return { x: 530 + 60, y: 80 + 115, name: 'SIG' };
    if (norm.includes('GND')) return { x: 530 + 85, y: 80 + 115, name: 'GND' };
    return { x: 530 + 60, y: 80 + 115, name: 'POT' };
  }

  if (norm.includes('BUTTON') || norm.includes('BTN') || norm.includes('SWITCH')) {
    // Tactile Push Button at (740, 80)
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 740 + 32, y: 80 + 102, name: 'VCC' };
    if (norm.includes('OUT') || norm.includes('SIG') || norm.includes('PIN')) return { x: 740 + 58, y: 80 + 102, name: 'OUT' };
    if (norm.includes('GND')) return { x: 740 + 84, y: 80 + 102, name: 'GND' };
    return { x: 740 + 58, y: 80 + 102, name: 'BTN' };
  }

  if (norm.includes('BATTERY') || norm.includes('BATT') || norm.includes('POWER') || norm.includes('9V')) {
    // Battery DC Supply at (740, 80)
    if (norm.includes('+') || norm.includes('VCC') || norm.includes('RED') || norm.includes('POS')) return { x: 740 + 45, y: 80 + 115, name: 'VCC(+)' };
    return { x: 740 + 85, y: 80 + 115, name: 'GND(-)' };
  }

  if (norm.includes('STEPPER') || norm.includes('ULN2003')) {
    // Stepper Motor with ULN2003 Driver at (530, 80)
    if (norm.includes('IN1')) return { x: 530 + 28, y: 80 + 130, name: 'IN1' };
    if (norm.includes('IN2')) return { x: 530 + 54, y: 80 + 130, name: 'IN2' };
    if (norm.includes('IN3')) return { x: 530 + 80, y: 80 + 130, name: 'IN3' };
    if (norm.includes('IN4')) return { x: 530 + 106, y: 80 + 130, name: 'IN4' };
    if (norm.includes('VCC') || norm.includes('5V')) return { x: 530 + 132, y: 80 + 130, name: 'VCC' };
    if (norm.includes('GND')) return { x: 530 + 158, y: 80 + 130, name: 'GND' };
    return { x: 530 + 28, y: 80 + 130, name: 'STEP' };
  }

  if (norm.includes('KEYPAD') || norm.includes('MATRIX')) {
    // 4x4 Matrix Keypad at (530, 80)
    const pinMatch = norm.match(/\d+/);
    const pIdx = pinMatch ? parseInt(pinMatch[0], 10) : 1;
    return { x: 530 + 14 + (pIdx % 8) * 14, y: 80 + 150, name: `K${pIdx}` };
  }

  // 4. INTELLIGENT MODULE LOOKUP (Resolves any dynamic or AI synthesized module)
  const rawModules = (project?.circuitDiagram?.modules && project.circuitDiagram.modules.length > 0)
    ? project.circuitDiagram.modules
    : (project?.components ? project.components.map(c => ({ name: c.name, type: 'sensor', pins: ['VCC', 'GND', 'SIG'] })) : []);

  for (let mIdx = 0; mIdx < rawModules.length; mIdx++) {
    const mod = rawModules[mIdx];
    const modClean = mod.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanNorm = norm.replace(/[^A-Z0-9]/g, '');
    const mLower = mod.name.toLowerCase();
    const isMatched = cleanNorm.includes(modClean) || modClean.includes(cleanNorm.slice(0, 5)) ||
                      cleanNorm.slice(0, 5).includes(modClean.slice(0, 5)) ||
                      mLower.split(' ').some(w => w.length >= 3 && cleanNorm.includes(w.toUpperCase()));

    if (isMatched) {
      const col = mIdx % 2;
      const row = Math.floor(mIdx / 2);
      const mx = 530 + col * 225;
      const my = 65 + row * 165;

      // Check specific component types for exact physical pin offsets
      if (mLower.includes('oled') || mLower.includes('display')) {
        if (norm.includes('GND')) return { x: mx + 40, y: my + 18, name: 'GND' };
        if (norm.includes('VCC') || norm.includes('3.3V') || norm.includes('5V')) return { x: mx + 68, y: my + 18, name: 'VCC' };
        if (norm.includes('SCL')) return { x: mx + 96, y: my + 18, name: 'SCL' };
        if (norm.includes('SDA')) return { x: mx + 124, y: my + 18, name: 'SDA' };
        return { x: mx + 40, y: my + 18, name: 'OLED' };
      }
      if (mLower.includes('lcd')) {
        if (norm.includes('GND')) return { x: mx + 26, y: my + 80, name: 'GND' };
        if (norm.includes('VCC') || norm.includes('5V')) return { x: mx + 26, y: my + 100, name: 'VCC' };
        if (norm.includes('SDA')) return { x: mx + 26, y: my + 120, name: 'SDA' };
        if (norm.includes('SCL')) return { x: mx + 26, y: my + 140, name: 'SCL' };
        return { x: mx + 26, y: my + 80, name: 'LCD' };
      }
      if (mLower.includes('sonar') || mLower.includes('ultrasonic') || mLower.includes('sr04')) {
        if (norm.includes('VCC') || norm.includes('5V')) return { x: mx + 83, y: my + 108, name: 'VCC' };
        if (norm.includes('TRIG')) return { x: mx + 98, y: my + 108, name: 'TRIG' };
        if (norm.includes('ECHO')) return { x: mx + 113, y: my + 108, name: 'ECHO' };
        if (norm.includes('GND')) return { x: mx + 128, y: my + 108, name: 'GND' };
        return { x: mx + 98, y: my + 108, name: 'SONAR' };
      }
      if (mLower.includes('servo') || mLower.includes('sg90')) {
        if (norm.includes('PWM') || norm.includes('SIG') || norm.includes('ORANGE') || norm.includes('YELLOW')) return { x: mx - 35, y: my + 83, name: 'SIG' };
        if (norm.includes('VCC') || norm.includes('RED') || norm.includes('5V')) return { x: mx - 35, y: my + 88, name: 'VCC' };
        return { x: mx - 35, y: my + 93, name: 'GND' };
      }
      if (mLower.includes('relay')) {
        if (norm.includes('IN') || norm.includes('SIG')) return { x: mx + 15, y: my + 45, name: 'IN' };
        if (norm.includes('GND')) return { x: mx + 15, y: my + 70, name: 'GND' };
        if (norm.includes('VCC') || norm.includes('5V')) return { x: mx + 15, y: my + 95, name: 'VCC' };
        return { x: mx + 15, y: my + 45, name: 'RELAY' };
      }
      if (mLower.includes('buzzer') || mLower.includes('piezo')) {
        if (norm.includes('+') || norm.includes('POS') || norm.includes('SIG') || norm.includes('VCC')) return { x: mx + 25, y: my + 35, name: 'BUZZ+' };
        return { x: mx + 45, y: my + 35, name: 'BUZZ-' };
      }
      if (mLower.includes('led')) {
        if (norm.includes('+') || norm.includes('POS') || norm.includes('ANODE') || norm.includes('PIN')) return { x: mx + 18, y: my + 104, name: 'LED+' };
        return { x: mx + 30, y: my + 70, name: 'LED-' };
      }
      if (mLower.includes('touch') || mLower.includes('ttp223')) {
        if (norm.includes('VCC') || norm.includes('5V') || norm.includes('3.3V')) return { x: mx + 33, y: my + 110, name: 'VCC' };
        if (norm.includes('SIG') || norm.includes('IO') || norm.includes('OUT')) return { x: mx + 60, y: my + 110, name: 'SIG' };
        return { x: mx + 87, y: my + 110, name: 'GND' };
      }
      if (mLower.includes('dht') || mLower.includes('temp')) {
        if (norm.includes('VCC') || norm.includes('5V')) return { x: mx + 28, y: my + 130, name: 'VCC' };
        if (norm.includes('DATA') || norm.includes('SIG')) return { x: mx + 54, y: my + 130, name: 'DATA' };
        return { x: mx + 106, y: my + 130, name: 'GND' };
      }

      // Generic pin distribution along component terminal header
      let pinIdx = 0;
      if (mod.pins && mod.pins.length > 0) {
        for (let pi = 0; pi < mod.pins.length; pi++) {
          const pName = mod.pins[pi].toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (cleanNorm.includes(pName)) {
            pinIdx = pi;
            break;
          }
        }
      }
      return {
        x: mx + 22 + pinIdx * 24,
        y: my + 110,
        name: norm.slice(0, 6)
      };
    }
  }

  // Safe fallback anchored to the first component or active grid cell
  const fallbackMod = rawModules[0];
  const fx = fallbackMod ? 530 : 600;
  const fy = fallbackMod ? 95 : 120;
  return {
    x: fx + (index % 4) * 25,
    y: fy + (index % 3) * 20,
    name: norm.slice(0, 6)
  };
}

// ----------------------------------------------------------------------------
// COMPUTE ROUTING PATH (Orthogonal Conduit vs S-Curve Harness)
// ----------------------------------------------------------------------------
export function generateWirePath(
  startPt: Point2D,
  endPt: Point2D,
  wireIdx: number,
  totalWires: number,
  isArduino: boolean,
  routingStyle: WireRoutingStyle
): { pathD: string; badgeX: number; badgeY: number } {
  const sx = startPt.x;
  const sy = startPt.y;
  const ex = endPt.x;
  const ey = endPt.y;

  // 1A. Top Power Rail Drop (starts at top power rail sy <= 40, drops down to component ey > 40)
  if (sy <= 40 && ey > 40) {
    const isVcc = sy <= 26;
    const dropY = Math.min(ey - 10, Math.max(sy + 10, 42 + (wireIdx % 6) * 5));
    const pathD = `M ${sx} ${sy} L ${sx} ${dropY} L ${ex} ${dropY} L ${ex} ${ey}`;
    return { pathD, badgeX: (sx + ex) / 2, badgeY: dropY };
  }

  // 1B. Component or MCU pin up to top Power Rail (ey <= 40 && sy > 40)
  if (ey <= 40 && sy > 40) {
    const isVcc = ey <= 26;
    const riseY = Math.min(sy - 10, Math.max(ey + 10, 42 + (wireIdx % 6) * 5));
    if (!isArduino && sx < 150) {
      const leftLaneX = 24 - (wireIdx % 4) * 5;
      const pathD = `M ${sx} ${sy} L ${leftLaneX} ${sy} L ${leftLaneX} ${riseY} L ${ex} ${riseY} L ${ex} ${ey}`;
      return { pathD, badgeX: (leftLaneX + ex) / 2, badgeY: riseY };
    } else {
      const conduitX = Math.min(480, Math.max(440, (sx + ex) / 2));
      const pathD = `M ${sx} ${sy} L ${conduitX} ${sy} L ${conduitX} ${riseY} L ${ex} ${riseY} L ${ex} ${ey}`;
      return { pathD, badgeX: (conduitX + ex) / 2, badgeY: riseY };
    }
  }

  // 1C. Direct Inter-Component Interconnect (Both endpoints on peripheral components)
  const isInterComponent = sx >= 450 && ex >= 450;
  if (isInterComponent) {
    const midX = Math.max(sx, ex) + 20 + (wireIdx % 4) * 10;
    const pathD = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ey} L ${ex} ${ey}`;
    return { pathD, badgeX: midX, badgeY: (sy + ey) / 2 };
  }

  // Dedicated conduit trunk vertical channel between MCU and peripherals (x = 445 to 505)
  const laneStep = Math.min(7, Math.max(4, 55 / Math.max(1, totalWires)));
  const conduitX = 448 + (wireIdx * laneStep);

  // S-Curve Cable Harness Mode
  if (routingStyle === 'curved') {
    if (!isArduino && (sx < 120 || ex < 120)) {
      const isStartLeft = sx < 120;
      const leftPt = isStartLeft ? startPt : endPt;
      const rightPt = isStartLeft ? endPt : startPt;
      const isTopLoop = leftPt.y < 240;
      const bypassY = isTopLoop ? (52 - (wireIdx % 4) * 5) : (470 + (wireIdx % 4) * 6);
      const pts = [
        `M ${leftPt.x} ${leftPt.y}`,
        `C ${leftPt.x - 30} ${leftPt.y}, 15 ${bypassY}, 200 ${bypassY}`,
        `C 380 ${bypassY}, ${conduitX} ${rightPt.y}, ${rightPt.x} ${rightPt.y}`
      ];
      return {
        pathD: isStartLeft ? pts.join(' ') : `M ${rightPt.x} ${rightPt.y} C ${conduitX} ${rightPt.y}, 380 ${bypassY}, 200 ${bypassY} C 15 ${bypassY}, ${leftPt.x - 30} ${leftPt.y}, ${leftPt.x} ${leftPt.y}`,
        badgeX: conduitX,
        badgeY: rightPt.y
      };
    }
    const dx = Math.abs(ex - sx);
    const cx1 = sx + (ex >= sx ? 1 : -1) * Math.max(35, dx * 0.4);
    const cx2 = ex - (ex >= sx ? 1 : -1) * Math.max(35, dx * 0.4);
    const pathD = `M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ey}, ${ex} ${ey}`;
    return { pathD, badgeX: (sx + ex) / 2, badgeY: (sy + ey) / 2 };
  }

  // Orthogonal Conduit Trunk Mode (Clean, Filleted, Bidirectional)
  const isLeftToRight = sx <= ex;
  const lx = isLeftToRight ? sx : ex;
  const ly = isLeftToRight ? sy : ey;
  const rx = isLeftToRight ? ex : sx;
  const ry = isLeftToRight ? ey : sy;

  const isFromBottom = isArduino && ly > 250;
  const isFromTop = isArduino && ly < 200;
  const isESP32Left = !isArduino && lx < 120;

  let pts: Point2D[] = [];

  if (isFromTop) {
    const topExitY = Math.max(44, 56 - (wireIdx % 4) * 4);
    pts = [
      { x: lx, y: ly },
      { x: lx, y: topExitY },
      { x: conduitX, y: topExitY },
      { x: conduitX, y: ry },
      { x: rx, y: ry }
    ];
  } else if (isFromBottom) {
    const bottomDropY = Math.min(480, 420 + (wireIdx % 5) * 8);
    pts = [
      { x: lx, y: ly },
      { x: lx, y: bottomDropY },
      { x: conduitX, y: bottomDropY },
      { x: conduitX, y: ry },
      { x: rx, y: ry }
    ];
  } else if (isESP32Left) {
    const isTopLoop = ly < 240;
    const leftLaneX = 24 - (wireIdx % 4) * 4;
    const bypassY = isTopLoop ? Math.max(54, 68 - (wireIdx % 4) * 5) : Math.min(480, 450 + (wireIdx % 4) * 6);
    pts = [
      { x: lx, y: ly },
      { x: leftLaneX, y: ly },
      { x: leftLaneX, y: bypassY },
      { x: conduitX, y: bypassY },
      { x: conduitX, y: ry },
      { x: rx, y: ry }
    ];
  } else {
    // Normal horizontal exit to vertical conduit lane
    pts = [
      { x: lx, y: ly },
      { x: conduitX, y: ly },
      { x: conduitX, y: ry },
      { x: rx, y: ry }
    ];
  }

  // If wire is directed from right to left, reverse point array so path starts at sx, sy and ends at ex, ey
  if (!isLeftToRight) {
    pts.reverse();
  }

  // Generate smooth SVG path string
  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  return { pathD, badgeX: conduitX, badgeY: Math.min(490, Math.max(60, (sy + ey) / 2)) };
}
