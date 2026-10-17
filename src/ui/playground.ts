// ============================================================================
// THE INNOVATION HUB - DIGITAL SIGNAL & CIRCUIT SIMULATOR ENGINE
// High-precision virtual oscilloscope, interactive waveform generator, & pinout matrix.
// ============================================================================

export interface PlaygroundModule {
  id: string;
  name: string;
  shortName: string;
  protocol: string;
  voltage: string;
  current: string;
  description: string;
  relatedProjectId: string;
  sliderLabel: string;
  sliderMin: number;
  sliderMax: number;
  sliderDefault: number;
  sliderUnit: string;
  pins: {
    pinName: string;
    unoTarget: string;
    espTarget: string;
    wireColor: string;
    signalType: string;
  }[];
  calculateWaveform: (val: number) => {
    ch1Label: string;
    ch2Label: string;
    measure1: string;
    measure2: string;
    measure3: string;
    ch1Path: string;
    ch2Path: string;
  };
}

export const PLAYGROUND_MODULES: PlaygroundModule[] = [
  {
    id: 'ultrasonic',
    name: 'HC-SR04 Ultrasonic Sonar',
    shortName: 'Ultrasonic Sonar',
    protocol: 'Digital IO / 40kHz Acoustic Ping',
    voltage: '5.0V DC',
    current: '15mA Active',
    description: 'Emits an 8-cycle 40kHz ultrasound burst and measures round-trip flight time to calculate distance.',
    relatedProjectId: 'ultrasonic-radar-system',
    sliderLabel: 'Target Obstacle Distance',
    sliderMin: 4,
    sliderMax: 300,
    sliderDefault: 24,
    sliderUnit: 'cm',
    pins: [
      { pinName: 'VCC', unoTarget: '5V Rail', espTarget: 'VIN (5V)', wireColor: '#EF4444', signalType: '5V DC Power' },
      { pinName: 'Trig', unoTarget: 'Pin D9 (PWM)', espTarget: 'GPIO 5', wireColor: '#10B981', signalType: '10µs TTL Trigger' },
      { pinName: 'Echo', unoTarget: 'Pin D10', espTarget: 'GPIO 18', wireColor: '#2563EB', signalType: 'Echo Return Pulse' },
      { pinName: 'GND', unoTarget: 'GND Rail', espTarget: 'GND Rail', wireColor: '#1E293B', signalType: 'Common Ground' }
    ],
    calculateWaveform: (dist: number) => {
      // Echo pulse duration = distance * 58.2 µs
      const pulseDurationUs = Math.round(dist * 58.2);
      const echoWidth = Math.min(260, Math.max(30, Math.round(dist * 0.9)));
      return {
        ch1Label: 'CH1: TRIG (10µs Ping)',
        ch2Label: 'CH2: ECHO (Flight Time)',
        measure1: `Flight Time: ${pulseDurationUs} µs`,
        measure2: `Distance: ${dist} cm`,
        measure3: `Speed of Sound: 343 m/s`,
        // Channel 1: Short 10us trigger pulse at start
        ch1Path: 'M 20 60 L 50 60 L 50 20 L 70 20 L 70 60 L 580 60',
        // Channel 2: Echo goes HIGH after trig and stays HIGH proportional to distance
        ch2Path: `M 20 140 L 80 140 L 80 90 L ${80 + echoWidth} 90 L ${80 + echoWidth} 140 L 580 140`
      };
    }
  },
  {
    id: 'servo',
    name: 'SG90 Micro Servo (9g)',
    shortName: 'SG90 Servo',
    protocol: '50Hz Analog PWM (1.0ms - 2.0ms)',
    voltage: '4.8V - 6.0V DC',
    current: '100mA Idle / 550mA Stall',
    description: 'High-torque position-controlled servomotor with internal closed-loop potentiometer feedback.',
    relatedProjectId: 'obstacle-avoiding-robot-car',
    sliderLabel: 'Servo Horn Angle',
    sliderMin: 0,
    sliderMax: 180,
    sliderDefault: 90,
    sliderUnit: '°',
    pins: [
      { pinName: 'VCC (+)', unoTarget: '5V Rail', espTarget: 'VIN (5V)', wireColor: '#EF4444', signalType: '5V Motor Rail' },
      { pinName: 'PWM Sig', unoTarget: 'Pin D11 (PWM)', espTarget: 'GPIO 19', wireColor: '#F97316', signalType: '50Hz PWM Signal' },
      { pinName: 'GND (-)', unoTarget: 'GND Rail', espTarget: 'GND Rail', wireColor: '#1E293B', signalType: 'Common Ground' }
    ],
    calculateWaveform: (deg: number) => {
      // 0 deg = 1.0ms, 90 deg = 1.5ms, 180 deg = 2.0ms
      const pulseMs = (1.0 + (deg / 180.0)).toFixed(2);
      const highWidth = Math.round(20 + (deg / 180.0) * 80);
      return {
        ch1Label: 'CH1: PWM 50Hz Carrier',
        ch2Label: 'CH2: Duty Cycle Pulse',
        measure1: `Pulse Width: ${pulseMs} ms`,
        measure2: `Target Angle: ${deg}°`,
        measure3: `Carrier Period: 20.0 ms`,
        // 2 consecutive PWM pulses
        ch1Path: 'M 20 60 L 50 60 L 50 20 L 550 20',
        ch2Path: `M 20 140 L 50 140 L 50 90 L ${50 + highWidth} 90 L ${50 + highWidth} 140 L 300 140 L 300 90 L ${300 + highWidth} 90 L ${300 + highWidth} 140 L 580 140`
      };
    }
  },
  {
    id: 'oled',
    name: '0.96" SSD1306 OLED Display',
    shortName: 'I2C OLED HUD',
    protocol: 'I2C Bus (0x3C / Fast Mode 400kHz)',
    voltage: '3.3V - 5.0V DC',
    current: '20mA Full White',
    description: '128x64 self-illuminating organic LED display transmitting high-speed raster graphics over 2-wire I2C.',
    relatedProjectId: 'diy-digital-watch',
    sliderLabel: 'I2C Bus Clock Frequency',
    sliderMin: 100,
    sliderMax: 400,
    sliderDefault: 400,
    sliderUnit: 'kHz',
    pins: [
      { pinName: 'VCC', unoTarget: '3.3V / 5V', espTarget: '3.3V Out', wireColor: '#EF4444', signalType: 'Logic Power' },
      { pinName: 'GND', unoTarget: 'GND Rail', espTarget: 'GND Rail', wireColor: '#1E293B', signalType: 'Common Ground' },
      { pinName: 'SCL', unoTarget: 'Pin A5 (SCL)', espTarget: 'GPIO 22 (SCL)', wireColor: '#EAB308', signalType: 'I2C Serial Clock' },
      { pinName: 'SDA', unoTarget: 'Pin A4 (SDA)', espTarget: 'GPIO 21 (SDA)', wireColor: '#2563EB', signalType: 'I2C Serial Data' }
    ],
    calculateWaveform: (freq: number) => {
      return {
        ch1Label: `CH1: SCL Clock (${freq} kHz)`,
        ch2Label: 'CH2: SDA Data Packet (0x3C)',
        measure1: `Bus Speed: ${freq} kHz`,
        measure2: `Slave Addr: 0x3C`,
        measure3: `Refresh Rate: ~60 FPS`,
        ch1Path: 'M 20 60 L 40 60 L 40 20 L 70 20 L 70 60 L 100 60 L 100 20 L 130 20 L 130 60 L 160 60 L 160 20 L 190 20 L 190 60 L 220 60 L 220 20 L 250 20 L 250 60 L 280 60 L 280 20 L 310 20 L 310 60 L 340 60 L 340 20 L 370 20 L 370 60 L 400 60 L 400 20 L 430 20 L 430 60 L 580 60',
        ch2Path: 'M 20 90 L 55 90 L 55 140 L 115 140 L 115 90 L 175 90 L 175 140 L 235 140 L 235 90 L 320 90 L 320 140 L 415 140 L 415 90 L 580 90'
      };
    }
  },
  {
    id: 'imu',
    name: 'MPU-6050 6-DOF IMU Sensor',
    shortName: 'MPU-6050 IMU',
    protocol: 'I2C Bus (0x68 / 1kHz Sample Rate)',
    voltage: '3.3V Logic Safe',
    current: '3.9mA Active',
    description: 'Digital 3-axis angular rate sensor (gyro) and 3-axis accelerometer with on-chip motion processor.',
    relatedProjectId: 'flight-simulator-mpu6050',
    sliderLabel: 'Aircraft Pitch Angle (Tilt)',
    sliderMin: -60,
    sliderMax: 60,
    sliderDefault: 18,
    sliderUnit: '°',
    pins: [
      { pinName: 'VCC', unoTarget: '3.3V Out', espTarget: '3.3V Out', wireColor: '#EF4444', signalType: '3.3V Logic Power' },
      { pinName: 'GND', unoTarget: 'GND Rail', espTarget: 'GND Rail', wireColor: '#1E293B', signalType: 'Ground Reference' },
      { pinName: 'SCL', unoTarget: 'Pin A5 (SCL)', espTarget: 'GPIO 22 (SCL)', wireColor: '#EAB308', signalType: 'I2C Serial Clock' },
      { pinName: 'SDA', unoTarget: 'Pin A4 (SDA)', espTarget: 'GPIO 21 (SDA)', wireColor: '#2563EB', signalType: 'I2C Telemetry Data' },
      { pinName: 'INT', unoTarget: 'Pin D2 (INT0)', espTarget: 'GPIO 23', wireColor: '#8B5CF6', signalType: 'DMP Interrupt' }
    ],
    calculateWaveform: (pitch: number) => {
      const gZ = (Math.cos((pitch * Math.PI) / 180)).toFixed(2);
      const gX = (Math.sin((pitch * Math.PI) / 180)).toFixed(2);
      const waveY = 115 - Math.round(pitch * 0.5);
      return {
        ch1Label: 'CH1: INT DMP Data Ready Pulse',
        ch2Label: 'CH2: Accelerometer Vector',
        measure1: `Pitch: ${pitch}°`,
        measure2: `Acc X: ${gX} g`,
        measure3: `Acc Z: ${gZ} g`,
        ch1Path: 'M 20 60 L 60 60 L 60 20 L 75 20 L 75 60 L 220 60 L 220 20 L 235 20 L 235 60 L 380 60 L 380 20 L 395 20 L 395 60 L 580 60',
        ch2Path: `M 20 115 Q 120 ${waveY}, 220 115 T 420 115 T 580 115`
      };
    }
  },
  {
    id: 'soil',
    name: 'Capacitive Soil Moisture V1.2',
    shortName: 'Capacitive Soil',
    protocol: 'Continuous Analog Voltage (0V - 3.0V)',
    voltage: '3.3V - 5.5V DC',
    current: '5mA Operating',
    description: 'Corrosion-free capacitor probe that transduces soil moisture permittivity into analog voltage.',
    relatedProjectId: 'soil-moisture-auto-watering',
    sliderLabel: 'Soil Moisture Level',
    sliderMin: 0,
    sliderMax: 100,
    sliderDefault: 45,
    sliderUnit: '%',
    pins: [
      { pinName: 'VCC', unoTarget: '5V Power', espTarget: '3.3V Out', wireColor: '#EF4444', signalType: '5V DC Power' },
      { pinName: 'AOUT', unoTarget: 'Pin A0 (ADC)', espTarget: 'GPIO 34 (ADC1)', wireColor: '#10B981', signalType: 'Analog Voltage (0-3V)' },
      { pinName: 'GND', unoTarget: 'GND Rail', espTarget: 'GND Rail', wireColor: '#1E293B', signalType: 'Ground Reference' }
    ],
    calculateWaveform: (moisture: number) => {
      // High moisture = lower voltage in capacitive probe
      const voltage = (3.0 - (moisture / 100.0) * 1.8).toFixed(2);
      const adc10bit = Math.round((parseFloat(voltage) / 5.0) * 1023);
      const voltY = 145 - Math.round(parseFloat(voltage) * 22);
      return {
        ch1Label: 'CH1: ADC Analog DC Voltage',
        ch2Label: 'CH2: Pump Relay Trip Threshold',
        measure1: `Probe Voltage: ${voltage} V`,
        measure2: `10-bit ADC: ${adc10bit} / 1023`,
        measure3: moisture < 30 ? 'Status: DRY (Pump ON)' : 'Status: OPTIMAL',
        ch1Path: `M 20 ${voltY} L 580 ${voltY}`,
        ch2Path: 'M 20 120 L 580 120'
      };
    }
  }
];

export function initHomePlayground(): void {
  const mount = document.getElementById('home-playground-mount');
  if (!mount) return;

  let activeBoard: 'uno' | 'esp32' = 'uno';
  let activeModuleId: string = 'ultrasonic';
  let sliderValue: number = 24;

  function render(): void {
    const mod = PLAYGROUND_MODULES.find(m => m.id === activeModuleId) || PLAYGROUND_MODULES[0];
    const isUno = activeBoard === 'uno';
    const boardTitle = isUno ? 'Arduino Uno R3 (ATmega328P)' : 'ESP32 Dual-Core (Xtensa 240MHz)';
    const wave = mod.calculateWaveform(sliderValue);

    mount!.innerHTML = `
      <div class="playground-box">
        <!-- Left: Interactive Configuration & Netlist Matrix -->
        <div class="playground-controls">
          <div class="playground-ctrl-group">
            <span class="playground-ctrl-label">1. Select Microcontroller Board</span>
            <div class="playground-btn-row">
              <button class="playground-choice-btn ${isUno ? 'active' : ''}" data-board="uno">
                Arduino Uno R3
              </button>
              <button class="playground-choice-btn ${!isUno ? 'active' : ''}" data-board="esp32">
                ESP32 NodeMCU
              </button>
            </div>
          </div>

          <div class="playground-ctrl-group">
            <span class="playground-ctrl-label">2. Select Peripheral Hardware Module</span>
            <div class="playground-btn-row">
              ${PLAYGROUND_MODULES.map(m => `
                <button class="playground-choice-btn ${m.id === activeModuleId ? 'active' : ''}" data-module="${m.id}">
                  ${m.shortName}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Interactive Live Telemetry Slider -->
          <div class="playground-specs-card" style="background:#0D0D0D; border:1px solid rgba(255,255,255,0.15);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span class="playground-ctrl-label" style="color:#FFFFFF;">${mod.sliderLabel}</span>
              <span id="playground-slider-val" style="font-family:var(--font-mono); font-weight:800; font-size:1.1rem; color:#FFFFFF;">
                ${sliderValue} ${mod.sliderUnit}
              </span>
            </div>
            <input type="range" id="playground-live-slider" min="${mod.sliderMin}" max="${mod.sliderMax}" value="${sliderValue}" style="width:100%; accent-color:#FFFFFF; cursor:pointer;" />
          </div>

          <!-- Real-Time Hardware Pin Connections Matrix -->
          <div class="playground-specs-card">
            <span class="playground-ctrl-label" style="margin-bottom:6px;">Verified Conductor Netlist</span>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${mod.pins.map(p => `
                <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.78rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${p.wireColor}; box-shadow:0 0 6px ${p.wireColor};"></span>
                    <span style="font-family:var(--font-mono); font-weight:700; color:#FFFFFF;">${p.pinName}</span>
                    <span style="color:#737373;">&rarr;</span>
                    <span style="font-family:var(--font-mono); color:#E5E5E5;">${isUno ? p.unoTarget : p.espTarget}</span>
                  </div>
                  <span style="font-size:0.7rem; color:#A3A3A3;">${p.signalType}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="margin-top:auto; padding-top:6px;">
            <a href="project.html?id=${mod.relatedProjectId}" class="btn-view-project" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; text-decoration:none; padding:12px 18px;">
              <span>Open Complete Lab Blueprint &amp; Code</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
        </div>

        <!-- Right: Digital Storage Oscilloscope (DSO) Virtual Laboratory Screen -->
        <div class="playground-canvas-wrap" style="background:#020202; border:1px solid rgba(255,255,255,0.18); box-shadow:inset 0 0 40px rgba(0,0,0,0.9);">
          <!-- Scope Top Status Header -->
          <div class="playground-canvas-header" style="background:#0A0A0A; border-bottom:1px solid rgba(255,255,255,0.12);">
            <div class="playground-canvas-title">
              <span class="section-kicker-dot"></span>
              <span>DSO-1002 &bull; DIGITAL STORAGE OSCILLOSCOPE</span>
            </div>
            <div style="display:flex; gap:16px; font-family:var(--font-mono); font-size:0.72rem;">
              <span style="color:#38BDF8;">${wave.measure1}</span>
              <span style="color:#E5E5E5;">${wave.measure2}</span>
              <span style="color:#10B981;">${wave.measure3}</span>
            </div>
          </div>

          <!-- Oscilloscope Reticle Screen -->
          <div class="playground-canvas-body" style="padding:16px;">
            <svg viewBox="0 0 600 200" style="width:100%; height:auto; max-height:260px; background:#000000; border-radius:8px; border:1px solid rgba(255,255,255,0.1);" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <!-- Reticle Grid Pattern -->
                <pattern id="dso-grid" width="30" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 25" fill="none" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="0.8" />
                  <circle cx="15" cy="12.5" r="0.6" fill="#FFFFFF" opacity="0.12" />
                </pattern>
                <!-- Phosphor Blur Filter -->
                <filter id="phosphor-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect width="600" height="200" fill="url(#dso-grid)" />

              <!-- Center Reticle Crosshairs -->
              <line x1="0" y1="100" x2="600" y2="100" stroke="#FFFFFF" stroke-opacity="0.15" stroke-dasharray="2,4" />
              <line x1="300" y1="0" x2="300" y2="200" stroke="#FFFFFF" stroke-opacity="0.15" stroke-dasharray="2,4" />

              <!-- On-Screen Telemetry Labels -->
              <text x="14" y="24" fill="#38BDF8" font-size="9" font-family="monospace" font-weight="bold">${wave.ch1Label}</text>
              <text x="14" y="180" fill="#FFFFFF" font-size="9" font-family="monospace" font-weight="bold">${wave.ch2Label}</text>
              <text x="586" y="24" fill="#737373" font-size="8.5" font-family="monospace" text-anchor="end">5V / DIV &bull; 100µs / DIV</text>

              <!-- Channel 1 Waveform (Blue/Cyan Pulse Trace) -->
              <path d="${wave.ch1Path}" fill="none" stroke="#38BDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" filter="url(#phosphor-glow)" />

              <!-- Channel 2 Waveform (Bright White Pulse Trace) -->
              <path d="${wave.ch2Path}" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" filter="url(#phosphor-glow)" />

              <!-- Moving Scan Beam Indicator -->
              <line x1="0" y1="0" x2="0" y2="200" stroke="#FFFFFF" stroke-width="2" opacity="0.3">
                <animate attributeName="x1" from="0" to="600" dur="2s" repeatCount="indefinite" />
                <animate attributeName="x2" from="0" to="600" dur="2s" repeatCount="indefinite" />
              </line>
            </svg>
          </div>

          <!-- Scope Bottom Status Info -->
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 18px; background:#070707; border-top:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:0.75rem; color:#A3A3A3;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10B981; box-shadow:0 0 6px #10B981;"></span>
              <span>TRIGGER: AUTO &bull; TIMEBASE: 50.0 µs &bull; DC COUPLED</span>
            </div>
            <span style="color:#737373;">REAL-TIME SIGNAL SYNTHESIZER</span>
          </div>
        </div>
      </div>
    `;

    // Bind board toggles
    mount!.querySelectorAll<HTMLButtonElement>('[data-board]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeBoard = btn.getAttribute('data-board') as 'uno' | 'esp32';
        render();
      });
    });

    // Bind module toggles
    mount!.querySelectorAll<HTMLButtonElement>('[data-module]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeModuleId = btn.getAttribute('data-module') || 'ultrasonic';
        const newMod = PLAYGROUND_MODULES.find(m => m.id === activeModuleId);
        if (newMod) sliderValue = newMod.sliderDefault;
        render();
      });
    });

    // Bind interactive parameter slider
    const slider = document.getElementById('playground-live-slider') as HTMLInputElement | null;
    slider?.addEventListener('input', (e) => {
      sliderValue = parseFloat((e.target as HTMLInputElement).value);
      const valEl = document.getElementById('playground-slider-val');
      if (valEl) valEl.textContent = `${sliderValue} ${mod.sliderUnit}`;
      render();
    });
  }

  render();
}
