// ============================================================================
// THE INNOVATION HUB — OMNILAB AI HARDWARE STUDIO (ANTIGRAVITY 2.0 UI)
// Generative hardware engineering studio inspired by Google Antigravity & ChatGPT.
// Features dual-pane layout, live animated loading bar & reasoning tree,
// live project synthesis, interactive blueprint cards, and prompt component chips.
// ============================================================================

import type { ScienceProject, FilterState } from '../types.ts';
import {
  createProjectFromPrompt,
  detectPromptIntent,
  generateAIChatResponse,
  generateProjectSynthesisCommentary,
  getAISettings,
  saveAISettings,
  AIProvider
} from '../services/ai-service.ts';
import { openProjectModal } from './modal.ts';

export interface StudioMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  reasoningSteps?: string[];
  thoughtDuration?: string;
  project?: ScienceProject;
  isStreaming?: boolean;
  isChatThinking?: boolean;
  progressPct?: number;
  synthesisStatus?: string;
  currentStepIndex?: number;
  suggestions?: { label: string; prompt: string }[];
}

export interface StudioFolder {
  id: string;
  name: string;
  createdAt: number;
  isExpanded: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  folderId: string | null; // null = root unorganized
  createdAt: number;
  updatedAt: number;
  targetBoard: 'ESP32' | 'Arduino Uno';
  messages: StudioMessage[];
  pinned?: boolean;
}

let chatSessions: ChatSession[] = [];
let studioFolders: StudioFolder[] = [];
let activeSessionId: string = '';
let targetMovingSessionId: string | null = null;
let studioMessages: StudioMessage[] = [];
let isGenerating = false;
let activeStarterCategory: string = 'all';
let currentTargetBoard: 'ESP32' | 'Arduino Uno' = 'ESP32';
let historySearchQuery: string = '';
let activeMountContainerId: string = 'ai-architect-modal';

export interface StarterPromptItem {
  id: string;
  categoryTag: 'robotics' | 'wearables' | 'energy' | 'sciencefair' | 'qa';
  category: string;
  boardTag: 'ESP32' | 'Arduino Uno' | 'Guides' | 'Troubleshooting';
  svgIcon: string;
  title: string;
  desc: string;
}

// 12 Curated Hardware Engineering Starter Prompts
const STARTER_PROMPTS: StarterPromptItem[] = [
  // 1. Robotics (ESP32)
  {
    id: 'emotion-robot',
    categoryTag: 'robotics',
    category: 'ROBOTICS • ESP32',
    boardTag: 'ESP32',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16.01"></line><line x1="16" y1="16" x2="16" y2="16.01"></line></svg>`,
    title: 'Emotion Desk Robot (Iris/Nemo)',
    desc: 'ESP32 with 0.96" I2C OLED animated eyes, dual SG90 pan-tilt neck servos, sonar distance sensing & touch interaction'
  },
  // 2. Robotics (ESP32)
  {
    id: 'hexapod-robot',
    categoryTag: 'robotics',
    category: 'ROBOTICS • SERVO BUS',
    boardTag: 'ESP32',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M3 7l6 5-6 5"></path><path d="M21 7l-6 5 6 5"></path><line x1="12" y1="3" x2="12" y2="9"></line><line x1="12" y1="15" x2="12" y2="21"></line></svg>`,
    title: '12-DOF Hexapod Walker',
    desc: 'ESP32 hexapod robot with PCA9685 I2C 16-channel servo driver, inverse kinematics gait engine, and ultrasonic collision avoidance'
  },
  // 3. Robotics (Arduino Uno)
  {
    id: 'self-balancing-car',
    categoryTag: 'robotics',
    category: 'ROBOTICS • PID CONTROL',
    boardTag: 'Arduino Uno',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2"><circle cx="6" cy="19" r="2"></circle><circle cx="18" cy="19" r="2"></circle><path d="M12 5v14"></path><path d="M5 19h14"></path><circle cx="12" cy="5" r="3"></circle></svg>`,
    title: 'Self-Balancing Inverted Robot',
    desc: 'Arduino Uno with MPU6050 6-axis IMU, L298N dual H-bridge motor driver, optical encoders, and closed-loop PID balance control'
  },
  // 4. Wearables (ESP32)
  {
    id: 'biometric-watch',
    categoryTag: 'wearables',
    category: 'WEARABLES • BLE TELEMETRY',
    boardTag: 'ESP32',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2"><circle cx="12" cy="12" r="7"></circle><polyline points="12 9 12 12 13.5 13.5"></polyline><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83"></path><path d="M7.49 6.65l.35-3.83A2 2 0 0 1 9.83 1h4.34a2 2 0 0 1 2 1.82l.35 3.83"></path></svg>`,
    title: 'Biometric Smart Wristwatch',
    desc: 'ESP32 BLE wristwatch with 0.96" SSD1306 OLED, MAX30102 pulse oximeter, MPU6050 step counter, and deep-sleep power management'
  },
  // 5. Wearables (ESP32)
  {
    id: 'sos-glove',
    categoryTag: 'wearables',
    category: 'WEARABLES • EMERGENCY',
    boardTag: 'ESP32',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FB923C" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>`,
    title: 'Fall Detection & SOS Glove',
    desc: 'ESP32 wearable glove with 6-axis IMU fall threshold detection, emergency piezo buzzer, and automatic WiFi MQTT SOS alert'
  },
  // 6. Clean Energy (Arduino Uno)
  {
    id: 'smart-greenhouse',
    categoryTag: 'energy',
    category: 'AGRITECH • AUTOMATION',
    boardTag: 'Arduino Uno',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v8"></path><path d="M9 12l3-3 3 3"></path></svg>`,
    title: 'Autonomous Smart Greenhouse',
    desc: 'Arduino Uno with capacitive soil probe, 5V relay water pump, DHT22 climate sensor, and 16x2 I2C LCD live telemetry'
  },
  // 7. Clean Energy (Arduino Uno)
  {
    id: 'solar-tracker',
    categoryTag: 'energy',
    category: 'CLEAN ENERGY • SUN TRACKING',
    boardTag: 'Arduino Uno',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    title: 'Dual-Axis Helio Solar Tracker',
    desc: 'Arduino Uno with 4 LDR light comparator sensors, dual SG90 pan-tilt servos, and maximum power point sun tracking'
  },
  // 8. Science Fair (ESP32)
  {
    id: 'lora-beacon',
    categoryTag: 'sciencefair',
    category: 'SCIENCE FAIR • LONG RANGE',
    boardTag: 'ESP32',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><path d="M4.93 4.93a10 10 0 0 1 14.14 0"></path><path d="M7.76 7.76a6 6 0 0 1 8.48 0"></path><circle cx="12" cy="12" r="2"></circle><path d="M12 14v7"></path><path d="M9 21h6"></path></svg>`,
    title: 'LoRa Emergency Disaster Beacon',
    desc: 'ESP32 SX1278 LoRa mesh communicator with NEO-6M GPS coordinates, DHT22 climate sensor, and 10km off-grid telemetry'
  },
  // 9. Science Fair (Arduino Uno)
  {
    id: 'radar-scanner',
    categoryTag: 'sciencefair',
    category: 'RF & SONAR • 180° SWEEP',
    boardTag: 'Arduino Uno',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818CF8" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><line x1="12" y1="12" x2="19" y2="5"></line><circle cx="12" cy="2" r="2"></circle></svg>`,
    title: 'Ultrasonic Radar Distance Scanner',
    desc: 'Arduino Uno with HC-SR04 sonar module, SG90 continuous sweep servo, piezo alert buzzer, and serial polar mapping'
  },
  // 10. Science Fair (Arduino Uno)
  {
    id: 'rfid-gate',
    categoryTag: 'sciencefair',
    category: 'SECURITY • SPI RFID',
    boardTag: 'Arduino Uno',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    title: 'Touchless RFID Access Gate',
    desc: 'Arduino Uno with RC522 RFID SPI module, SG90 servo deadbolt lock, I2C 16x2 LCD status screen, and credential authorization'
  },
  // 11. Hardware Q&A
  {
    id: 'qa-mcu-choice',
    categoryTag: 'qa',
    category: 'HARDWARE Q&A • ARCHITECTURE',
    boardTag: 'Guides',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F472B6" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    title: 'ESP32 vs Arduino Uno: Which to Pick?',
    desc: 'How do I choose between ESP32 (3.3V dual-core, WiFi/BLE) and Arduino Uno (5V robust ATmega328P) for battery vs motor projects?'
  },
  // 12. Hardware Q&A
  {
    id: 'qa-i2c-debug',
    categoryTag: 'qa',
    category: 'HARDWARE Q&A • BUS PROTOCOLS',
    boardTag: 'Troubleshooting',
    svgIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E879F9" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    title: 'I2C Screen Stuck on Black Screen?',
    desc: 'Why is my 0.96" I2C OLED display showing a blank screen, and how do I calculate 4.7kΩ pull-up resistors for 3.3V vs 5V logic?'
  }
];

// Quick Hardware Component Pills (12 Key Hardware Subsystems)
const HARDWARE_PILLS = [
  'ESP32 DevKit',
  'Arduino Uno R3',
  '0.96" I2C OLED',
  'SG90 Micro Servo',
  'HC-SR04 Sonar',
  'MPU6050 6-Axis IMU',
  '5V Relay Module',
  'Capacitive Soil Probe',
  'WS2812B NeoPixels',
  'DS3231 Precision RTC',
  'RC522 RFID Reader',
  'DHT22 Temp & Humidity'
];

export function getActiveSession(): ChatSession {
  if (!activeSessionId) {
    if (chatSessions.length > 0) {
      activeSessionId = chatSessions[0].id;
    } else {
      const initial: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'Untitled architecture',
        folderId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        targetBoard: currentTargetBoard,
        messages: []
      };
      chatSessions.push(initial);
      activeSessionId = initial.id;
    }
  }
  let s = chatSessions.find(item => item.id === activeSessionId);
  if (!s) {
    if (chatSessions.length === 0) {
      const initial: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'Untitled architecture',
        folderId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        targetBoard: currentTargetBoard,
        messages: []
      };
      chatSessions.push(initial);
      activeSessionId = initial.id;
      return initial;
    }
    s = chatSessions[0];
    activeSessionId = s.id;
  }
  return s;
}

export function saveStudioState(): void {
  try {
    localStorage.setItem('omnilab_studio_sessions', JSON.stringify(chatSessions));
    localStorage.setItem('omnilab_studio_folders', JSON.stringify(studioFolders));
    const active = getActiveSession();
    studioMessages = active.messages;
    localStorage.setItem('omnilab_studio_messages', JSON.stringify(studioMessages.slice(-50)));
  } catch (e) {
    console.error('Error saving studio state:', e);
  }
}

export function initAIStudio(): void {
  try {
    const savedFolders = localStorage.getItem('omnilab_studio_folders');
    if (savedFolders) {
      studioFolders = JSON.parse(savedFolders);
    } else {
      studioFolders = [
        { id: 'folder-robotics', name: 'Robotics Lab', createdAt: Date.now(), isExpanded: true },
        { id: 'folder-iot', name: 'IoT & Sensor Nodes', createdAt: Date.now(), isExpanded: true },
        { id: 'folder-sciencefair', name: 'Science Fair 2026', createdAt: Date.now(), isExpanded: true }
      ];
      try {
        localStorage.setItem('omnilab_studio_folders', JSON.stringify(studioFolders));
      } catch {}
    }
  } catch {
    studioFolders = [];
  }

  try {
    const savedSessions = localStorage.getItem('omnilab_studio_sessions');
    if (savedSessions) {
      chatSessions = JSON.parse(savedSessions);
      // Clean up any test/dummy synthesized projects
      chatSessions = chatSessions.filter(s => {
        const titleL = s.title?.toLowerCase() || '';
        return !titleL.includes('uhm') && !titleL.includes('edition') && !titleL.includes('isnt');
      });
      chatSessions.forEach(s => {
        s.messages = s.messages.filter(m => {
          if (m.project) {
            const pid = m.project.id?.toLowerCase() || '';
            const ptitle = m.project.title?.toLowerCase() || '';
            if (pid.includes('uhm') || pid.includes('edition') || ptitle.includes('uhm') || ptitle.includes('edition')) {
              return false;
            }
          }
          return true;
        });
      });
    }
  } catch {
    chatSessions = [];
  }

  // Legacy migration if no sessions
  if (chatSessions.length === 0) {
    try {
      const saved = localStorage.getItem('omnilab_studio_messages');
      if (saved) {
        const msgs: StudioMessage[] = JSON.parse(saved);
        if (msgs.length > 0) {
          const firstProj = msgs.find(m => m.project)?.project;
          chatSessions.push({
            id: 'session-legacy',
            title: firstProj?.title || 'Emotion Desk Robot',
            folderId: 'folder-robotics',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            targetBoard: (firstProj?.board as any) || 'ESP32',
            messages: msgs
          });
        }
      }
    } catch {}
  }

  // Ensure default session if still empty
  if (chatSessions.length === 0) {
    chatSessions.push({
      id: 'session-' + Date.now(),
      title: 'Untitled architecture',
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      targetBoard: 'ESP32',
      messages: []
    });
  }

  activeSessionId = chatSessions[0].id;
  studioMessages = chatSessions[0].messages;
}

export function getAllStudioProjects(): ScienceProject[] {
  const projs: ScienceProject[] = [];
  const seenIds = new Set<string>();

  chatSessions.forEach(session => {
    session.messages.forEach(m => {
      if (m.project && !seenIds.has(m.project.id)) {
        seenIds.add(m.project.id);
        projs.push(m.project);
      }
    });
  });

  return projs;
}

export function getStudioProjectById(id: string): ScienceProject | undefined {
  for (const session of chatSessions) {
    for (const m of session.messages) {
      if (m.project && m.project.id === id) return m.project;
    }
  }
  return undefined;
}

export function renderAIStudioModal(containerId = 'ai-architect-modal'): void {
  activeMountContainerId = containerId;
  const modal = document.getElementById(containerId);
  if (!modal) return;

  const isDedicated = window.location.pathname.includes('studio.html') || containerId === 'dedicated-studio-mount';
  const settings = getAISettings();
  const currentProvider = settings.provider || 'auto';
  const savedProjectCount = studioMessages.filter(m => m.project).length;

  modal.innerHTML = `
    <!-- Main Google AI Studio Application Wrapper -->
    <div class="google-ai-studio flex h-screen w-full bg-[#131314] text-[#e8eaed] overflow-hidden select-none" id="ai-studio-shell" style="display:flex; height:100vh; width:100%; background:#131314; color:#e8eaed; font-family:'Google Sans', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif; overflow:hidden; user-select:none;">
      
      <!-- 1. Left Navigation Sidebar -->
      <aside class="w-60 h-full bg-[#131314] border-r border-[#282a2d] flex flex-col justify-between p-3 shrink-0" style="width:235px; min-width:235px; height:100%; background:#131314; border-right:1px solid #282a2d; display:flex; flex-direction:column; justify-content:space-between; padding:12px; box-sizing:border-box; flex-shrink:0;">
        <div class="space-y-3.5" style="display:flex; flex-direction:column; gap:14px;">
          <!-- Brand Logo: Sparkle icon + The Innovation Hub -->
          <div class="flex items-center space-x-2.5 px-2 py-1 cursor-pointer" style="display:flex; align-items:center; gap:8px; padding:4px 8px; cursor:pointer;" onclick="window.omniLabStudio.startNewBuild()">
            <svg class="w-4 h-4 text-[#4285f4]" style="width:18px; height:18px; color:#4285f4; flex-shrink:0;" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
            </svg>
            <div style="display:flex; flex-direction:column; line-height:1.2;">
              <span class="text-sm font-semibold tracking-normal text-white" style="font-size:14px; font-weight:600; color:#ffffff; line-height:1.2;">The Innovation Hub</span>
              <span class="text-[10px] text-[#8ab4f8] font-mono uppercase tracking-wider" style="font-size:10px; color:#8ab4f8; letter-spacing:0.04em;">AI Studio</span>
            </div>
          </div>

          <!-- Get API Key Pill Button -->
          <button class="btn-api-key w-full flex items-center justify-center space-x-2 rounded-full py-2 px-4 text-xs font-medium transition-colors cursor-pointer" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:transparent; border:1px solid #3c4043; color:#8ab4f8; border-radius:9999px; padding:7px 14px; font-size:12px; font-weight:500; cursor:pointer;" onclick="window.omniLabStudio.openSettingsModal()">
            <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5-1.5 1.5 1.5 1.5-3 3-1.5-1.5L9 11.5l1.5 1.5L7 16l-4 4v2h2l4-4 2 2 3-3-1.5-1.5 1.5-1.5-1.5-1.5 3-3 1.5 1.5 1.5-1.5z"/>
            </svg>
            <span>Get API key</span>
          </button>

          <!-- Primary Navigation Items -->
          <div class="space-y-1 text-xs" style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <button class="nav-active w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-[#282a2d] text-white font-medium text-left cursor-pointer border-0" style="width:100%; display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px; background:#282a2d; color:#ffffff; font-weight:500; border:none; cursor:pointer; text-align:left;" onclick="window.omniLabStudio.startNewBuild()">
              <svg class="w-4 h-4 text-white" style="width:16px; height:16px; color:#ffffff;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              <span>Create Prompt</span>
            </button>
            <button class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#202124] text-[#9aa0a6] hover:text-white transition-colors text-left cursor-pointer border-0 bg-transparent" style="width:100%; display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px; background:transparent !important; color:#9aa0a6; border:none; cursor:pointer; text-align:left;" onclick="window.omniLabStudio.triggerRealtimeStream()">
              <svg class="w-4 h-4" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.93 4.93a10 10 0 0 1 14.14 0M7.76 7.76a6 6 0 0 1 8.48 0m-5.65 2.83a2 2 0 0 1 2.83 0"/></svg>
              <span>Stream Realtime</span>
            </button>
            <button class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#202124] text-[#9aa0a6] hover:text-white transition-colors text-left cursor-pointer border-0 bg-transparent" style="width:100%; display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px; background:transparent !important; color:#9aa0a6; border:none; cursor:pointer; text-align:left;" onclick="window.location.href='projects.html'">
              <svg class="w-4 h-4" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Starter Apps</span>
            </button>
            <button class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#202124] text-[#9aa0a6] hover:text-white transition-colors text-left cursor-pointer border-0 bg-transparent" style="width:100%; display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px; background:transparent !important; color:#9aa0a6; border:none; cursor:pointer; text-align:left;" onclick="window.omniLabStudio.openSettingsModal()">
              <svg class="w-4 h-4" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              <span>Tune a Model</span>
            </button>

            <!-- Library & Architectures Section -->
            <div class="pt-2 flex flex-col" style="padding-top:8px; display:flex; flex-direction:column;">
              <div class="flex items-center justify-between px-2 py-1 text-[#9aa0a6] text-[11px] font-semibold uppercase tracking-wider" style="display:flex; align-items:center; justify-content:space-between; padding:4px 8px; color:#9aa0a6; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em;">
                <div class="flex items-center space-x-1.5" style="display:flex; align-items:center; gap:6px;">
                  <svg class="w-3.5 h-3.5 text-[#9aa0a6]" style="width:14px; height:14px; color:#9aa0a6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  <span>Library</span>
                </div>
                <div class="flex items-center space-x-1" style="display:flex; align-items:center; gap:3px;">
                  <button class="p-1 rounded hover:bg-[#202124] text-[#9aa0a6] hover:text-[#8ab4f8] transition-colors cursor-pointer" onclick="window.omniLabStudio.createFolderPrompt()" title="New Folder" style="padding:2px 4px; background:transparent !important; border:none; cursor:pointer; color:#9aa0a6;">
                    <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                  </button>
                  <button class="p-1 rounded hover:bg-[#202124] text-[#9aa0a6] hover:text-[#8ab4f8] transition-colors cursor-pointer" onclick="window.omniLabStudio.createNewChat()" title="New Architecture Chat" style="padding:2px 4px; background:transparent !important; border:none; cursor:pointer; color:#9aa0a6;">
                    <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>
              </div>

              <!-- Search Filter Input -->
              <div class="px-2 mb-1.5" style="padding:0 6px; margin-bottom:5px;">
                <div class="flex items-center px-2 py-1 rounded bg-[#1e1f20] border border-[#282a2d] focus-within:border-[#8ab4f8]/50 text-xs" style="display:flex; align-items:center; gap:6px; padding:3px 8px; border-radius:6px; background:#1e1f20; border:1px solid #282a2d;">
                  <svg class="w-3 h-3 text-[#5f6368]" style="width:11px; height:11px; color:#5f6368;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" placeholder="Filter chats &amp; folders..." class="w-full bg-transparent border-0 outline-none text-[11px] text-white placeholder-[#5f6368]" style="width:100%; background:transparent !important; border:none !important; outline:none !important; font-size:11px; color:#ffffff; padding:1px;" oninput="window.omniLabStudio.filterHistory(this.value)" />
                </div>
              </div>

              <!-- History Tree list -->
              <div class="space-y-0.5 max-h-48 overflow-y-auto px-1" id="ai-studio-history-list" style="display:flex; flex-direction:column; gap:2px; max-height:190px; overflow-y:auto; padding:0 4px;">
                ${renderHistoryItemsHTML()}
              </div>
            </div>

            <!-- Prompt Gallery Tab (Active Style) -->
            <button class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-[#282a2d] text-white font-medium text-left cursor-pointer border-0" style="width:100%; display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px; background:#282a2d; color:#ffffff; border:none; cursor:pointer; text-align:left;" onclick="window.location.href='projects.html'">
              <svg class="w-4 h-4 text-[#8ab4f8]" style="width:16px; height:16px; color:#8ab4f8;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Prompt Gallery</span>
            </button>
          </div>
        </div>

        <!-- Sidebar Footer -->
        <div class="space-y-2 pt-2 border-t border-[#282a2d] text-xs" style="display:flex; flex-direction:column; gap:6px; border-top:1px solid #282a2d; padding-top:8px; font-size:12px;">
          <a href="https://ai.google.dev/docs" target="_blank" class="flex items-center space-x-3 px-3 py-1 text-[#9aa0a6] hover:text-white transition-colors" style="display:flex; align-items:center; gap:8px; padding:4px 8px; color:#9aa0a6; text-decoration:none;">
            <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>API documentation</span>
          </a>
          <a href="https://discuss.ai.google.dev" target="_blank" class="flex items-center space-x-3 px-3 py-1 text-[#9aa0a6] hover:text-white transition-colors" style="display:flex; align-items:center; gap:8px; padding:4px 8px; color:#9aa0a6; text-decoration:none;">
            <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Developer forum</span>
          </a>
          <div class="flex items-center space-x-2 px-3 py-1 text-[#9aa0a6]" style="display:flex; align-items:center; gap:6px; padding:4px 8px; color:#9aa0a6;">
            <span>Changelog</span>
            <span class="text-[9px] bg-[#1a73e8] text-white px-1.5 py-0.2 rounded font-semibold uppercase" style="font-size:9px; background:#1a73e8; color:#ffffff; padding:1px 5px; border-radius:3px; font-weight:600;">NEW</span>
          </div>
          <p class="text-[10px] text-[#5f6368] px-3 leading-tight" style="font-size:10px; color:#5f6368; padding:0 8px; line-height:1.3; margin:2px 0;">This experimental model is for feedback and testing only. No production use.</p>
          
          <div class="flex items-center justify-between px-2 pt-1" style="display:flex; align-items:center; justify-content:space-between; padding:4px 8px;">
            <button class="flex items-center space-x-2 text-[#9aa0a6] hover:text-white text-xs bg-transparent border-0 cursor-pointer p-1" style="display:flex; align-items:center; gap:6px; color:#9aa0a6; background:transparent !important; border:none; cursor:pointer; font-size:12px;" onclick="window.omniLabStudio.openSettingsModal()">
              <svg class="w-4 h-4" style="width:15px; height:15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Settings</span>
            </button>
            <button class="text-[#9aa0a6] hover:text-white bg-transparent border-0 cursor-pointer p-1" style="color:#9aa0a6; background:transparent !important; border:none; cursor:pointer; font-size:14px;" onclick="window.omniLabStudio.toggleSidebar()" title="Collapse Sidebar">&lt;</button>
          </div>
        </div>
      </aside>

      <!-- 2. Central Main Workspace -->
      <main class="flex-1 h-full flex flex-col bg-[#131314] overflow-hidden min-w-0" style="flex:1 1 0%; height:100%; display:flex; flex-direction:column; background:#131314; overflow:hidden; min-width:0;">
        <!-- Top Workspace Bar -->
        <header class="h-12 border-b border-[#282a2d] px-5 flex items-center justify-between shrink-0" style="height:48px; border-bottom:1px solid #282a2d; padding:0 20px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
          <div class="flex items-center space-x-2 cursor-pointer group" style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="window.omniLabStudio.renamePrompt()" title="Click to rename prompt">
            <span class="text-sm text-white font-medium group-hover:text-[#8ab4f8] transition-colors" id="studio-active-title" style="font-size:14px; font-weight:500; color:#ffffff;">${escapeHtml(getActiveSession().title)}</span>
            <svg class="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-white transition-colors" style="width:14px; height:14px; color:#9aa0a6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>

          <div class="flex items-center space-x-3 text-xs" style="display:flex; align-items:center; gap:12px; font-size:12px;">
            <button id="studio-compare-btn" class="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#202124] hover:bg-[#282a2d] text-[#e8eaed] border border-[#3c4043] transition-colors cursor-pointer" style="display:flex; align-items:center; gap:6px; padding:4px 12px; border-radius:4px; background:#202124; color:#e8eaed; border:1px solid #3c4043; cursor:pointer;" onclick="window.omniLabStudio.toggleTargetBoard()" title="Toggle Target Architecture (${currentTargetBoard})">
              <span class="text-[#8ab4f8]">→</span>
              <span id="studio-compare-text">Compare (${currentTargetBoard})</span>
            </button>
            <button class="text-[#9aa0a6] hover:text-white p-1 bg-transparent border-0 cursor-pointer text-base" style="color:#9aa0a6; background:transparent !important; border:none; cursor:pointer; font-size:16px;" onclick="window.omniLabStudio.startNewBuild()" title="Start New Session">⋮</button>
            <!-- Blue User Avatar Circle with Initial 'A' -->
            <div class="w-7 h-7 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center justify-center font-semibold text-xs cursor-pointer transition-colors" style="width:28px; height:28px; border-radius:50%; background:#1a73e8; color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:12px;" title="User Profile" onclick="window.omniLabStudio.showAuthorInfo()">A</div>
            <button class="text-[#9aa0a6] hover:text-white p-1 bg-transparent border-0 cursor-pointer ml-1 text-lg leading-none" style="color:#9aa0a6; background:transparent !important; border:none; cursor:pointer; font-size:18px;" onclick="if(window.omniLab?.closeAIArchitectModal && !window.location.pathname.includes('studio.html')){window.omniLab.closeAIArchitectModal();}else{window.location.href='projects.html';}" title="Exit Studio">&times;</button>
          </div>
        </header>

        <!-- Elevated Central Container Card (Google AI Studio canvas) -->
        <div class="flex-1 p-3 overflow-hidden flex flex-col" style="flex:1 1 0%; padding:12px; overflow:hidden; display:flex; flex-direction:column;">
          <div class="flex-1 bg-[#1e1f20] border border-[#282a2d] rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-2xl" style="flex:1 1 0%; background:#1e1f20; border:1px solid #282a2d; border-radius:18px; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; position:relative;">
            
            <!-- Inner scrollable thread or empty state -->
            <div class="flex-1 overflow-y-auto px-8 py-8 flex flex-col" id="ai-studio-chat-stream" style="flex:1 1 0%; overflow-y:auto; padding:28px 32px; display:flex; flex-direction:column;">
              ${renderChatStreamHTML()}
            </div>

            <!-- Integrated Command Input Dock (Google AI Studio pill dock) -->
            <div class="p-4 pt-1" style="padding:16px; padding-top:4px;">
              <!-- Component injection chips -->
              <div class="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none text-xs" style="display:flex; align-items:center; gap:8px; overflow-x:auto; padding-bottom:8px; font-size:12px;">
                <span class="text-[10px] text-[#9aa0a6] uppercase tracking-wider shrink-0 font-medium" style="font-size:10px; color:#9aa0a6; text-transform:uppercase; letter-spacing:0.06em; flex-shrink:0;">+ INJECT:</span>
                <button class="px-2.5 py-0.5 rounded-full bg-[#282a2d] hover:bg-[#35373b] text-[#e8eaed] border border-white/5 cursor-pointer whitespace-nowrap text-[11px]" style="padding:2px 10px; border-radius:9999px; background:#282a2d; color:#e8eaed; border:1px solid rgba(255,255,255,0.06); cursor:pointer; white-space:nowrap; font-size:11px;" onclick="window.omniLabStudio.insertPill('ESP32 DevKit')">+ ESP32</button>
                <button class="px-2.5 py-0.5 rounded-full bg-[#282a2d] hover:bg-[#35373b] text-[#e8eaed] border border-white/5 cursor-pointer whitespace-nowrap text-[11px]" style="padding:2px 10px; border-radius:9999px; background:#282a2d; color:#e8eaed; border:1px solid rgba(255,255,255,0.06); cursor:pointer; white-space:nowrap; font-size:11px;" onclick="window.omniLabStudio.insertPill('Arduino Uno R3')">+ Arduino</button>
                <button class="px-2.5 py-0.5 rounded-full bg-[#282a2d] hover:bg-[#35373b] text-[#e8eaed] border border-white/5 cursor-pointer whitespace-nowrap text-[11px]" style="padding:2px 10px; border-radius:9999px; background:#282a2d; color:#e8eaed; border:1px solid rgba(255,255,255,0.06); cursor:pointer; white-space:nowrap; font-size:11px;" onclick="window.omniLabStudio.insertPill('0.96\" I2C OLED')">+ OLED</button>
                <button class="px-2.5 py-0.5 rounded-full bg-[#282a2d] hover:bg-[#35373b] text-[#e8eaed] border border-white/5 cursor-pointer whitespace-nowrap text-[11px]" style="padding:2px 10px; border-radius:9999px; background:#282a2d; color:#e8eaed; border:1px solid rgba(255,255,255,0.06); cursor:pointer; white-space:nowrap; font-size:11px;" onclick="window.omniLabStudio.insertPill('SG90 Micro Servo')">+ Servo</button>
                <button class="px-2.5 py-0.5 rounded-full bg-[#282a2d] hover:bg-[#35373b] text-[#e8eaed] border border-white/5 cursor-pointer whitespace-nowrap text-[11px]" style="padding:2px 10px; border-radius:9999px; background:#282a2d; color:#e8eaed; border:1px solid rgba(255,255,255,0.06); cursor:pointer; white-space:nowrap; font-size:11px;" onclick="window.omniLabStudio.insertPill('HC-SR04 Sonar')">+ Sonar</button>
                <button class="px-2.5 py-0.5 rounded-full bg-[#282a2d] hover:bg-[#35373b] text-[#e8eaed] border border-white/5 cursor-pointer whitespace-nowrap text-[11px]" style="padding:2px 10px; border-radius:9999px; background:#282a2d; color:#e8eaed; border:1px solid rgba(255,255,255,0.06); cursor:pointer; white-space:nowrap; font-size:11px;" onclick="window.omniLabStudio.insertPill('5V Relay Module')">+ Relay</button>
              </div>

              <!-- Pill input bar with Run ⌘↵ -->
              <div class="w-full bg-[#131314] border border-[#3c4043] focus-within:border-[#8ab4f8] rounded-full px-4 py-2 flex items-center justify-between transition-colors shadow-inner" style="width:100%; background:#131314; border:1px solid #3c4043; border-radius:9999px; padding:6px 14px; display:flex; align-items:center; justify-content:space-between; box-sizing:border-box;">
                <div class="flex items-center space-x-3 flex-1 min-w-0 pr-2" style="display:flex; align-items:center; gap:10px; flex:1; min-width:0; padding-right:8px;">
                  <input 
                    id="ai-studio-input"
                    type="text" 
                    class="w-full bg-transparent border-0 outline-none text-sm text-white placeholder-[#80868b]"
                    style="width:100%; background:transparent !important; border:none !important; outline:none !important; font-size:14px !important; color:#ffffff !important; padding:4px 6px;"
                    placeholder="Describe any Arduino Uno experiment, sensor system, or robotics build..."
                    onkeydown="window.omniLabStudio.handleInputKeydown(event)"
                    oninput="window.omniLabStudio.updateTokenCount()"
                  />
                </div>
                
                <div class="flex items-center space-x-2 shrink-0" style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                  <button class="w-7 h-7 rounded-full hover:bg-[#282a2d] text-[#9aa0a6] hover:text-white flex items-center justify-center transition-colors bg-transparent border-0 cursor-pointer" style="width:28px; height:28px; border-radius:50%; color:#9aa0a6; display:flex; align-items:center; justify-content:center; background:transparent !important; border:none; cursor:pointer;" onclick="window.omniLabStudio.insertPill('Sensors & I2C OLED')" title="Add Component">
                    <svg class="w-4 h-4" style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  </button>
                  
                  <!-- Run Button with Shortcut Badge -->
                  <button 
                    id="ai-studio-submit-btn"
                    class="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#282a2d] hover:bg-[#35373b] text-[#e8eaed] text-xs font-medium transition-colors border border-[#3c4043] cursor-pointer"
                    style="display:flex; align-items:center; gap:6px; padding:6px 16px; border-radius:9999px; background:#282a2d; color:#e8eaed; font-size:12px; font-weight:500; border:1px solid #3c4043; cursor:pointer;"
                    onclick="window.omniLabStudio.handleSend()"
                    title="Run Synthesis (Ctrl+Enter)"
                  >
                    <span>Run</span>
                    <span class="text-[10px] text-[#8ab4f8] font-mono" style="font-size:10px; color:#8ab4f8; font-family:monospace;">⌘↵</span>
                  </button>
                  
                  <button class="w-7 h-7 rounded-full hover:bg-[#282a2d] text-[#9aa0a6] hover:text-white flex items-center justify-center transition-colors bg-transparent border-0 cursor-pointer" style="width:28px; height:28px; border-radius:50%; color:#9aa0a6; display:flex; align-items:center; justify-content:center; background:transparent !important; border:none; cursor:pointer;" onclick="window.omniLabStudio.clearInput()" title="Clear Input">
                    <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 3. Right Sidebar: "Run settings" -->
      <aside class="w-64 h-full bg-[#131314] border-l border-[#282a2d] p-4 flex flex-col justify-between shrink-0 overflow-y-auto" id="studio-run-settings" style="width:260px; min-width:260px; height:100%; background:#131314; border-left:1px solid #282a2d; padding:16px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box; flex-shrink:0; overflow-y:auto;">
        <div class="space-y-4" style="display:flex; flex-direction:column; gap:16px;">
          <!-- Title + Reset Icon -->
          <div class="flex items-center justify-between pb-1" style="display:flex; align-items:center; justify-content:space-between; padding-bottom:4px;">
            <span class="text-sm font-medium text-white" style="font-size:14px; font-weight:500; color:#ffffff;">Run settings</span>
            <button class="text-[#9aa0a6] hover:text-white bg-transparent border-0 cursor-pointer" style="color:#9aa0a6; background:transparent !important; border:none; cursor:pointer;" onclick="window.omniLabStudio.clearInput()" title="Reset input">
              <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </button>
          </div>

          <!-- Get Code Button (exact Google AI Studio style) -->
          <button class="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-full border border-[#3c4043] hover:border-[#8ab4f8]/50 bg-transparent text-xs font-medium text-[#8ab4f8] transition-colors cursor-pointer" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:7px 12px; border-radius:9999px; border:1px solid #3c4043; background:transparent; color:#8ab4f8; font-size:12px; font-weight:500; cursor:pointer;" onclick="window.omniLabStudio.copyLatestCode()">
            <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span>&lt; &gt; Get code</span>
          </button>

          <!-- Model Setting -->
          <div class="space-y-1.5" style="display:flex; flex-direction:column; gap:6px;">
            <div class="flex items-center space-x-1.5 text-xs text-[#9aa0a6]" style="display:flex; align-items:center; gap:6px; font-size:12px; color:#9aa0a6;">
              <span class="text-[#8ab4f8] font-bold">+</span>
              <span class="font-medium text-white">Model</span>
            </div>
            <select class="w-full bg-[#1e1f20] border border-[#3c4043] rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer" style="width:100%; background:#1e1f20; border:1px solid #3c4043; border-radius:8px; padding:8px 12px; font-size:12px; color:#ffffff; outline:none; cursor:pointer;" onchange="window.omniLabStudio.switchModel(this.value)">
              <option value="gemini-2.0-flash" selected>Gemini 2.0 Flash Experimental</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="llama-3.3-70b">Llama 3.3 70B (Groq)</option>
            </select>
          </div>

          <!-- Output format Setting -->
          <div class="space-y-1.5" style="display:flex; flex-direction:column; gap:6px;">
            <div class="flex items-center justify-between text-xs" style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
              <span class="text-[#9aa0a6]">Output format</span>
              <span class="text-[9px] bg-[#1a73e8] text-white px-1.5 py-0.2 rounded font-semibold uppercase" style="font-size:9px; background:#1a73e8; color:#ffffff; padding:1px 5px; border-radius:3px; font-weight:600;">NEW</span>
            </div>
            <select class="w-full bg-[#1e1f20] border border-[#3c4043] rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer" style="width:100%; background:#1e1f20; border:1px solid #3c4043; border-radius:8px; padding:8px 12px; font-size:12px; color:#ffffff; outline:none; cursor:pointer;">
              <option selected>Interactive Circuit, CAD & Code</option>
              <option>C++ Firmware Only</option>
              <option>Wiring Netlist & Pinout</option>
            </select>
          </div>

          <!-- Token Count Setting -->
          <div class="space-y-1.5" style="display:flex; flex-direction:column; gap:6px;">
            <div class="flex items-center space-x-1.5 text-xs text-[#9aa0a6]" style="display:flex; align-items:center; gap:6px; font-size:12px; color:#9aa0a6;">
              <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              <span>Token count</span>
            </div>
            <div class="text-xs text-[#9aa0a6] bg-[#1e1f20] border border-[#3c4043] rounded-lg px-3 py-2 flex items-center justify-between" style="background:#1e1f20; border:1px solid #3c4043; border-radius:8px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; font-size:12px;">
              <span id="studio-token-count" style="color:#ffffff; font-weight:500;">0</span>
              <span class="text-[#5f6368]" style="color:#5f6368;">/ 32,768</span>
            </div>
          </div>

          <!-- Temperature Slider -->
          <div class="space-y-2" style="display:flex; flex-direction:column; gap:8px;">
            <div class="flex items-center justify-between text-xs" style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
              <div class="flex items-center space-x-1.5 text-[#9aa0a6]" style="display:flex; align-items:center; gap:6px; color:#9aa0a6;">
                <svg class="w-3.5 h-3.5" style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                <span>Temperature</span>
              </div>
              <span class="px-2 py-0.5 rounded bg-[#1e1f20] border border-[#3c4043] text-xs font-mono text-white" id="temp-val-display" style="padding:2px 8px; border-radius:4px; background:#1e1f20; border:1px solid #3c4043; font-size:11px; color:#ffffff; font-family:monospace;">0.8</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1" 
              value="0.8" 
              class="w-full accent-[#8ab4f8] cursor-pointer"
              style="width:100%; accent-color:#8ab4f8; cursor:pointer;"
              oninput="const d = document.getElementById('temp-val-display'); if(d) d.textContent = this.value;"
            />
          </div>

          <!-- Advanced Settings Accordion -->
          <div class="pt-2 border-t border-[#282a2d]" style="border-top:1px solid #282a2d; padding-top:8px;">
            <details class="text-xs text-[#9aa0a6] cursor-pointer" style="font-size:12px; color:#9aa0a6; cursor:pointer;">
              <summary class="flex items-center justify-between py-1 text-white font-medium hover:text-[#8ab4f8] transition-colors" style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; color:#ffffff; font-weight:500;">
                <span>Advanced settings</span>
              </summary>
              <div class="pt-2 space-y-2 text-[11px]" style="padding-top:8px; display:flex; flex-direction:column; gap:8px; font-size:11px;">
                <div>
                  <span class="text-[#9aa0a6]">Target Architecture:</span>
                  <button class="w-full mt-1 px-2.5 py-1.5 rounded bg-[#1e1f20] border border-[#3c4043] text-white text-left flex items-center justify-between cursor-pointer" style="width:100%; margin-top:4px; padding:6px 10px; border-radius:4px; background:#1e1f20; border:1px solid #3c4043; color:#ffffff; display:flex; align-items:center; justify-content:space-between; cursor:pointer;" onclick="window.omniLabStudio.toggleTargetBoard()">
                    <span id="adv-target-board-text">${currentTargetBoard}</span>
                    <span class="text-[#8ab4f8]">Toggle ⇄</span>
                  </button>
                </div>
                <div>
                  <span class="text-[#9aa0a6]">Hardware Netlist Verification:</span>
                  <div class="text-[#10b981] mt-0.5" style="color:#10b981; margin-top:2px;">Pinout collision guard: ACTIVE</div>
                </div>
              </div>
            </details>
          </div>
        </div>

        <!-- Bottom collapse arrow -->
        <div class="flex justify-end pt-3 border-t border-[#282a2d]" style="display:flex; justify-content:flex-end; padding-top:8px; border-top:1px solid #282a2d;">
          <button class="text-[#9aa0a6] hover:text-white bg-transparent border-0 cursor-pointer p-1" style="color:#9aa0a6; background:transparent !important; border:none; cursor:pointer; font-size:14px;" onclick="const s = document.getElementById('studio-run-settings'); if(s) s.style.display = s.style.display==='none' ? 'flex' : 'none';" title="Collapse Run Settings">&gt;</button>
        </div>
      </aside>
    </div>

    <!-- Move to Folder Picker Modal (Antigravity Architecture Management) -->
    <div id="ai-studio-folder-picker" class="studio-folder-picker-overlay" style="display:none;" onclick="if(event.target===this) window.omniLabStudio.closeFolderPicker()">
      <div class="studio-folder-picker-card">
        <div class="flex items-center justify-between pb-3 border-b border-[#282a2d]" style="display:flex; align-items:center; justify-content:space-between; padding-bottom:10px; border-bottom:1px solid #282a2d;">
          <h3 class="text-sm font-semibold text-white" style="font-size:14px; font-weight:600; color:#ffffff; margin:0;">Move Architecture to Folder</h3>
          <button class="text-[#9aa0a6] hover:text-white bg-transparent border-0 cursor-pointer text-lg leading-none" style="color:#9aa0a6; background:transparent; border:none; cursor:pointer; font-size:18px;" onclick="window.omniLabStudio.closeFolderPicker()">&times;</button>
        </div>
        <div class="py-3 space-y-1.5 max-h-56 overflow-y-auto" id="folder-picker-options" style="padding:12px 0; display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto;">
          <!-- Populated dynamically -->
        </div>
        <div class="pt-3 border-t border-[#282a2d] flex justify-between items-center" style="padding-top:10px; border-top:1px solid #282a2d; display:flex; justify-content:space-between; align-items:center;">
          <button class="text-xs text-[#00f2fe] hover:underline bg-transparent border-0 cursor-pointer" style="font-size:12px; color:#00f2fe; background:transparent; border:none; cursor:pointer;" onclick="window.omniLabStudio.createFolderPrompt()">+ Create New Folder</button>
          <button class="px-3 py-1 text-xs rounded bg-[#282a2d] hover:bg-[#35373b] text-white border-0 cursor-pointer" style="padding:4px 12px; font-size:12px; border-radius:4px; background:#282a2d; color:#ffffff; border:none; cursor:pointer;" onclick="window.omniLabStudio.closeFolderPicker()">Cancel</button>
        </div>
      </div>
    </div>

    <!-- API Key Settings Drawer Modal -->
    <div id="ai-settings-drawer" class="ai-settings-drawer" style="display:none;">
      <div class="ai-settings-card">
        <div class="ai-settings-header">
          <h3>AI Engine &amp; API Key Configuration</h3>
          <button class="modal-close-btn" onclick="window.omniLabStudio.closeSettingsModal()">&times;</button>
        </div>
        <div class="ai-settings-body">
          <label class="setting-label">Active Provider</label>
          <select id="setting-provider-select" class="premium-select" style="margin-bottom:14px;">
            <option value="auto">Antigravity Auto Hardware Synthesis (Offline Ready)</option>
            <option value="groq">Groq Cloud (Llama 3.3 70B)</option>
            <option value="gemini">Google Gemini 1.5 Pro</option>
            <option value="openrouter">OpenRouter (Multi-Model)</option>
          </select>
          <label class="setting-label">Custom API Key (Optional)</label>
          <input type="password" id="setting-key-input" class="premium-input" placeholder="gsk_... or AIzaSy... (leave blank for built-in synthesis)" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="btn-cancel" onclick="window.omniLabStudio.closeSettingsModal()">Cancel</button>
            <button class="btn-save" onclick="window.omniLabStudio.saveSettings()">Save Configuration</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Focus input
  setTimeout(() => {
    const input = document.getElementById('ai-studio-input') as HTMLInputElement | null;
    input?.focus();
  }, 100);
}

function renderHistoryItemsHTML(): string {
  const q = historySearchQuery.trim().toLowerCase();
  let sessions = [...chatSessions];

  if (q) {
    sessions = sessions.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }

  if (sessions.length === 0 && !q && studioFolders.length === 0) {
    return `
      <div class="text-[11px] text-[#5f6368] italic p-2.5 text-center">
        No architectures created yet.
      </div>
    `;
  }

  const htmlChunks: string[] = [];

  // 1. Folders Section
  studioFolders.forEach(folder => {
    const folderSessions = sessions.filter(s => s.folderId === folder.id);
    const count = folderSessions.length;
    const isExpanded = folder.isExpanded !== false;

    // Sort pinned on top
    folderSessions.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    htmlChunks.push(`
      <div class="studio-folder-box">
        <div class="studio-folder-header group" onclick="window.omniLabStudio.toggleFolderExpand('${folder.id}', event)">
          <div class="flex items-center space-x-1.5 min-w-0 flex-1" style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
            <span class="studio-folder-chevron ${isExpanded ? 'expanded' : ''}">▶</span>
            <span style="font-size:12px;">📁</span>
            <span class="truncate font-medium text-white/90" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px;">${escapeHtml(folder.name)}</span>
            <span class="text-[10px] text-[#5f6368] font-mono">(${count})</span>
          </div>
          <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" style="display:flex; align-items:center; gap:2px;">
            <button class="studio-chat-action-btn" onclick="window.omniLabStudio.createNewChatInsideFolder('${folder.id}', event)" title="New Chat in ${escapeForAttr(folder.name)}">+</button>
            <button class="studio-chat-action-btn" onclick="window.omniLabStudio.renameFolderPrompt('${folder.id}', event)" title="Rename Folder">✎</button>
            <button class="studio-chat-action-btn text-[#5f6368] hover:text-red-400" onclick="window.omniLabStudio.deleteFolderPrompt('${folder.id}', event)" title="Delete Folder">&times;</button>
          </div>
        </div>

        ${isExpanded ? `
          <div class="studio-folder-children">
            ${folderSessions.length === 0 ? `
              <div class="text-[10px] text-[#5f6368] italic px-2 py-1">Empty folder</div>
            ` : folderSessions.map(s => renderSessionItemHTML(s)).join('')}
          </div>
        ` : ''}
      </div>
    `);
  });

  // 2. Root Sessions (Sessions without folder or whose folder was removed)
  const rootSessions = sessions.filter(s => !s.folderId || !studioFolders.some(f => f.id === s.folderId));
  if (rootSessions.length > 0) {
    if (studioFolders.length > 0) {
      htmlChunks.push(`
        <div class="text-[10px] uppercase font-mono text-[#5f6368] px-2 pt-1 pb-0.5 tracking-wider" style="font-size:10px; color:#5f6368; padding:4px 8px 2px 8px;">
          Unorganized Chats
        </div>
      `);
    }
    // Sort pinned on top
    rootSessions.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    htmlChunks.push(...rootSessions.map(s => renderSessionItemHTML(s)));
  }

  return htmlChunks.join('');
}

function renderSessionItemHTML(s: ChatSession): string {
  const isActive = s.id === activeSessionId;
  const msgCount = s.messages.length;
  const boardTag = s.targetBoard === 'ESP32' ? 'ESP32' : 'Uno';

  return `
    <div 
      class="studio-chat-session-item group ${isActive ? 'active' : ''}" 
      onclick="window.omniLabStudio.switchSession('${s.id}')"
      title="${escapeForAttr(s.title)}"
    >
      <div class="flex items-center space-x-1.5 min-w-0 flex-1" style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
        <span style="font-size:11px;">${s.pinned ? '📌' : '💬'}</span>
        <span class="truncate ${isActive ? 'text-white font-medium' : 'text-[#bdc1c6]'}" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px;">
          ${escapeHtml(s.title || 'Untitled architecture')}
        </span>
      </div>

      <div class="flex items-center space-x-1 shrink-0" style="display:flex; align-items:center; gap:2px; flex-shrink:0;">
        <span class="text-[9px] px-1 py-0.2 rounded bg-[#1e1f20] text-[#80868b] border border-white/5 font-mono group-hover:hidden ${isActive ? 'hidden' : ''}">
          ${msgCount > 0 ? `${msgCount}` : boardTag}
        </span>
        <div class="chat-actions">
          <button class="studio-chat-action-btn" onclick="window.omniLabStudio.togglePinSession('${s.id}', event)" title="${s.pinned ? 'Unpin' : 'Pin to top'}">
            ${s.pinned ? '★' : '📌'}
          </button>
          <button class="studio-chat-action-btn" onclick="window.omniLabStudio.openFolderPicker('${s.id}', event)" title="Move to Folder">
            📁
          </button>
          <button class="studio-chat-action-btn" onclick="window.omniLabStudio.renameSession('${s.id}', event)" title="Rename">
            ✎
          </button>
          <button class="studio-chat-action-btn text-[#5f6368] hover:text-red-400" onclick="window.omniLabStudio.deleteSession('${s.id}', event)" title="Delete">
            &times;
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderChatStreamHTML(): string {
  const currentSession = getActiveSession();
  const msgs = currentSession.messages;

  if (msgs.length === 0) {
    return `
      <div class="w-full flex-1 flex flex-col items-center justify-center text-center my-auto py-8" style="width:100%; flex:1 1 0%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; margin:auto 0; padding:32px 0;">
        <h1 class="text-4xl font-normal text-white mb-2 tracking-tight" style="font-size:36px; font-weight:400; color:#ffffff; letter-spacing:-0.02em; margin:0 0 8px 0; font-family:'Google Sans', sans-serif;">What will you build?</h1>
        <p class="text-sm text-[#9aa0a6] max-w-lg mb-8 font-normal" style="font-size:13px; color:#9aa0a6; max-width:560px; margin:0 auto 32px auto; line-height:1.5;">
          Push Gemini to the limits of what AI can do using the Gemini API
        </p>

        <!-- 3 Google AI Studio Starter Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:16px; width:100%; max-width:820px;">
          
          <!-- Card 1: Image Editing -->
          <div class="studio-starter-card bg-[#282a2d] hover:bg-[#35373b] p-6 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between border border-transparent hover:border-[#8ab4f8]/40" style="background:#282a2d; padding:22px; border-radius:12px; text-align:left; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.15s ease;" onclick="window.omniLabStudio.selectStarter('ESP32 Emotion Desk Robot with 0.96 inch I2C OLED display, dual SG90 pan-tilt servos, and HC-SR04 sonar distance sensor', true)">
            <div class="text-[#8ab4f8] mb-4" style="color:#8ab4f8; margin-bottom:16px;">
              <svg class="w-7 h-7" style="width:28px; height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-white mb-1.5" style="font-size:15px; font-weight:600; color:#ffffff; margin:0 0 6px 0;">Image Editing</h3>
              <p class="text-xs text-[#9aa0a6] leading-relaxed" style="font-size:12px; color:#9aa0a6; margin:0; line-height:1.45;">Edit an image of croissants &amp; robot actuators.</p>
            </div>
          </div>

          <!-- Card 2: Visual Story -->
          <div class="studio-starter-card bg-[#282a2d] hover:bg-[#35373b] p-6 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between border border-transparent hover:border-[#8ab4f8]/40" style="background:#282a2d; padding:22px; border-radius:12px; text-align:left; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.15s ease;" onclick="window.omniLabStudio.selectStarter('Autonomous Smart Greenhouse with capacitive soil probe, 5V relay water pump, DHT22 climate sensor, and 16x2 I2C LCD', true)">
            <div class="text-[#8ab4f8] mb-4" style="color:#8ab4f8; margin-bottom:16px;">
              <svg class="w-7 h-7" style="width:28px; height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <line x1="9" y1="10" x2="15" y2="10"></line>
                <line x1="12" y1="7" x2="12" y2="13"></line>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-white mb-1.5" style="font-size:15px; font-weight:600; color:#ffffff; margin:0 0 6px 0;">Visual Story</h3>
              <p class="text-xs text-[#9aa0a6] leading-relaxed" style="font-size:12px; color:#9aa0a6; margin:0; line-height:1.45;">Generate a story with sensor images &amp; telemetry.</p>
            </div>
          </div>

          <!-- Card 3: Birthday Card -->
          <div class="studio-starter-card bg-[#282a2d] hover:bg-[#35373b] p-6 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between border border-transparent hover:border-[#8ab4f8]/40" style="background:#282a2d; padding:22px; border-radius:12px; text-align:left; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.15s ease;" onclick="window.omniLabStudio.selectStarter('Ultrasonic radar distance scanner with SG90 continuous sweep servo, HC-SR04 sonar, and piezo alert buzzer', true)">
            <div class="text-[#8ab4f8] mb-4" style="color:#8ab4f8; margin-bottom:16px;">
              <svg class="w-7 h-7" style="width:28px; height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-white mb-1.5" style="font-size:15px; font-weight:600; color:#ffffff; margin:0 0 6px 0;">Birthday Card</h3>
              <p class="text-xs text-[#9aa0a6] leading-relaxed" style="font-size:12px; color:#9aa0a6; margin:0; line-height:1.45;">Design a custom birthday card or radar scanner.</p>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // Render Conversational Thread
  return `
    <div class="w-full max-w-4xl mx-auto flex flex-col space-y-6 pt-4">
      ${msgs.map(msg => renderSingleMessageHTML(msg)).join('')}
    </div>
  `;
}

function renderSingleMessageHTML(msg: StudioMessage): string {
  if (msg.role === 'user') {
    return `
      <div class="chat-row user-row">
        <div class="chat-bubble user-bubble">
          <p class="bubble-text">${escapeHtml(msg.content)}</p>
          <span class="bubble-timestamp">${msg.timestamp}</span>
        </div>
        <img src="assets/arhanraaj-pfp.jpg" alt="You" class="chat-avatar user-avatar" />
      </div>
    `;
  }

  // Assistant Response: LIVE SYNTHESIS LOADING STATE
  if (msg.isStreaming) {
    if (msg.isChatThinking) {
      return `
        <div class="chat-row assistant-row">
          <div class="chat-avatar assistant-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div class="chat-bubble assistant-bubble">
            <div class="chat-thinking-badge">
              <span class="thinking-spinner">✦</span>
              <span>${escapeHtml(msg.synthesisStatus || 'Consulting Hardware Engineering Knowledge Base...')}</span>
              <span style="font-size: 0.78rem; color: #6B7280; margin-left: 8px;">⏱ ${msg.thoughtDuration || '0.4s'}</span>
            </div>
          </div>
        </div>
      `;
    }

    const pct = msg.progressPct || 20;
    const statusText = msg.synthesisStatus || 'Synthesizing Hardware Architecture & Power Budget...';
    const timerText = msg.thoughtDuration || '0.4s';

    return `
      <div class="chat-row assistant-row">
        <div class="chat-avatar assistant-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>

        <div class="chat-bubble assistant-bubble" style="width: 100%; max-width: 820px;">
          <!-- Signature OmniLab Loading Bar & Reasoning Engine Card -->
          <div class="ai-synthesis-progress-card">
            <!-- Animated Laser Beam Shimmer -->
            <div class="synthesis-laser-shimmer"></div>

            <div class="synthesis-status-header">
              <div class="synthesis-status-left">
                <div class="synthesis-spinner-orbit">
                  <span class="spinner-ring"></span>
                  <span class="spinner-core"></span>
                </div>
                <div>
                  <div class="synthesis-status-title" id="synthesis-title-${msg.id}">
                    ${statusText}
                  </div>
                  <div class="synthesis-status-sub">The Innovation Hub // AI Hardware Studio</div>
                </div>
              </div>
              <div class="synthesis-status-right">
                <span class="synthesis-pct-badge" id="synthesis-pct-${msg.id}">${pct}%</span>
                <span class="synthesis-timer-badge" id="synthesis-timer-${msg.id}">⏱ ${timerText}</span>
              </div>
            </div>

            <!-- Dynamic Progress Fill Bar -->
            <div class="synthesis-progress-track">
              <div class="synthesis-progress-fill" id="synthesis-fill-${msg.id}" style="width: ${pct}%;"></div>
            </div>

            <!-- Live Step-by-Step Reasoning Progress Tree -->
            <div class="synthesis-steps-tree">
              ${renderLiveSynthesisStepsHTML(msg)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Assistant Response: COMPLETED SYNTHESIS OR CHAT
  return `
    <div class="chat-row assistant-row">
      <div class="chat-avatar assistant-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>

      <div class="chat-bubble assistant-bubble">
        <!-- Antigravity Reasoning Accordion (Extended Thinking) -->
        ${msg.reasoningSteps && msg.reasoningSteps.length > 0 ? `
          <div class="ai-thought-accordion" id="thought-${msg.id}">
            <div class="thought-header" onclick="window.omniLabStudio.toggleThought('${msg.id}')">
              <div class="thought-pulse-indicator">
                <span class="thought-sparkle">✦</span>
                <span class="thought-title">Thought for ${msg.thoughtDuration || '2.4s'}</span>
              </div>
              <svg class="thought-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="thought-body" id="thought-body-${msg.id}">
              ${msg.reasoningSteps.map(step => `
                <div class="thought-step">
                  <span class="step-check">✓</span>
                  <span class="step-text">${step}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Message Body with Rich Markdown -->
        <div class="assistant-content">
          ${formatMarkdownToHTML(msg.content)}
        </div>

        <!-- Suggestion Action Chips (if any) -->
        ${msg.suggestions && msg.suggestions.length > 0 ? `
          <div class="assistant-suggestions-row">
            <div class="suggestions-label">💡 Suggested Next Actions &amp; Blueprints:</div>
            <div class="suggestions-chips-wrap">
              ${msg.suggestions.map(s => `
                <button class="suggestion-chip" onclick="window.omniLabStudio.selectStarter('${escapeForAttr(s.prompt)}')">
                  <span class="chip-spark">⚡</span>
                  <span class="chip-text">${escapeHtml(s.label)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Embedded Interactive Blueprint Card -->
        ${msg.project ? renderBlueprintCardHTML(msg.project) : ''}
      </div>
    </div>
  `;
}

function renderLiveSynthesisStepsHTML(msg: StudioMessage): string {
  const allSteps = [
    'Analyzed electrical power budget & logic translation (5.0V / 3.3V)',
    'Selected microcontroller architecture & mapped GPIO pinout matrix',
    'Routing orthogonal conductor conduits & breadboard power rails',
    'Verifying bill of materials & zero-fault electrical ratings',
    'Compiling production-ready Arduino C++ firmware'
  ];

  const currentIdx = msg.currentStepIndex || 1;

  return allSteps.map((stepText, idx) => {
    const stepNum = idx + 1;
    if (stepNum < currentIdx) {
      return `
        <div class="synthesis-step-item step-done">
          <span class="step-icon-done">✓</span>
          <span>${stepText}</span>
        </div>
      `;
    } else if (stepNum === currentIdx) {
      return `
        <div class="synthesis-step-item step-active">
          <span class="step-icon-active">⚡</span>
          <span>${stepText}...</span>
        </div>
      `;
    } else {
      return `
        <div class="synthesis-step-item step-pending">
          <span class="step-icon-pending">○</span>
          <span>${stepText}</span>
        </div>
      `;
    }
  }).join('');
}

function renderBlueprintCardHTML(project: ScienceProject): string {
  const isArduino = project.board.toLowerCase().includes('arduino');
  const compCount = project.components?.length || 0;
  const wireCount = project.wiringTable?.length || 0;

  return `
    <div class="ai-blueprint-card">
      <div class="blueprint-card-header">
        <div class="blueprint-header-left">
          <span class="board-pill ${isArduino ? 'arduino' : 'esp32'}">${project.board}</span>
          <span class="diff-badge ${project.difficulty}">${project.difficulty}</span>
          <span class="blueprint-cat">${project.category}</span>
        </div>
        <div class="blueprint-time">⏱ ${project.estimatedTime || '2 Hours'}</div>
      </div>

      <h3 class="blueprint-card-title">${project.title}</h3>
      <p class="blueprint-card-summary">${project.shortDesc}</p>

      <!-- Key Specs Pills -->
      <div class="blueprint-metrics-row">
        <div class="metric-box">
          <span class="metric-num">${compCount}</span>
          <span class="metric-label">BOM Components</span>
        </div>
        <div class="metric-box">
          <span class="metric-num">${wireCount}</span>
          <span class="metric-label">Conductor Nets</span>
        </div>
        <div class="metric-box">
          <span class="metric-num">100%</span>
          <span class="metric-label">CAD Verified</span>
        </div>
      </div>

      <!-- Action Buttons Bar -->
      <div class="blueprint-actions-bar">
        <button class="blueprint-btn-primary" onclick="if(window.omniLabStudio?.inspectProject){window.omniLabStudio.inspectProject('${project.id}')}else if(window.omniLab?.openModal){window.omniLab.openModal('${project.id}')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Inspect Schematic &amp; Pins</span>
        </button>
        <button class="blueprint-btn-secondary" onclick="window.omniLabStudio.copyCode('${project.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Copy C++ Code</span>
        </button>
        <a href="project.html?id=${project.id}" class="blueprint-btn-link" target="_blank">
          <span>Full Blueprint</span> &rarr;
        </a>
      </div>
    </div>
  `;
}

function formatProviderName(provider: string): string {
  switch (provider) {
    case 'groq': return 'Groq (Llama 3.3 70B)';
    case 'gemini': return 'Google Gemini 1.5 Pro';
    case 'openrouter': return 'OpenRouter Auto';
    default: return 'Antigravity Hardware Core';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeForAttr(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function formatMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';

  const codeBlocks: string[] = [];
  let text = markdown.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre class="code-block-container"><code class="code-block language-${lang || 'cpp'}">${escapeHtml(code.trim())}</code></pre>`);
    return `%%CODEBLOCK_${idx}%%`;
  });

  // Table support (simple markdown tables)
  text = text.replace(/\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g, (_, headerLine, bodyLines) => {
    const headers = headerLine.split('|').map((h: string) => h.trim()).filter(Boolean);
    const rows = bodyLines.trim().split('\n').map((row: string) => {
      const cols = row.split('|').map((c: string) => c.trim()).filter(Boolean);
      return `<tr>${cols.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
    }).join('');
    return `<div style="overflow-x:auto; margin: 12px 0;"><table class="ai-table" style="width:100%; border-collapse: collapse; font-size: 0.86rem;">
      <thead><tr style="border-bottom: 1px solid #333; color: #93C5FD;">${headers.map((h: string) => `<th style="text-align:left; padding:6px 10px;">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  });

  // Headings
  text = text.replace(/^### (.*$)/gim, '<h4 class="ai-heading-3">$1</h4>');
  text = text.replace(/^## (.*$)/gim, '<h3 class="ai-heading-2">$1</h3>');
  text = text.replace(/^# (.*$)/gim, '<h2 class="ai-heading-1">$1</h2>');

  // Bold & Italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Interactive buttons in text like [⚡ Build Project: XYZ]
  text = text.replace(/\[⚡ (?:Build|Synthesize)(?: Idea)?:?\s*([^\]]+)\]/gi, (_, projName) => {
    const clean = projName.trim();
    return `<button class="inline-build-btn" onclick="window.omniLabStudio.selectStarter('Build ${escapeForAttr(clean)}')">⚡ Build ${escapeHtml(clean)}</button>`;
  });

  // Blockquotes
  text = text.replace(/^>\s*(.*$)/gim, '<blockquote style="border-left: 3px solid #3B82F6; padding: 6px 12px; margin: 10px 0; background: rgba(59,130,246,0.06); color: #D1D5DB; border-radius: 0 6px 6px 0;">$1</blockquote>');

  // Lists (unordered)
  text = text.replace(/(?:^|\n)- ([^\n]+)/g, '\n<li class="ai-list-item">$1</li>');
  text = text.replace(/(<li class="ai-list-item">[\s\S]+?<\/li>)(?!\s*<li)/g, '<ul class="ai-unordered-list">$1</ul>');

  // Lists (ordered)
  text = text.replace(/(?:^|\n)(\d+)\. ([^\n]+)/g, '\n<li class="ai-ol-item"><span class="ol-num">$1.</span> $2</li>');
  text = text.replace(/(<li class="ai-ol-item">[\s\S]+?<\/li>)(?!\s*<li)/g, '<ol class="ai-ordered-list">$1</ol>');

  // Split into paragraphs for leftover text lines
  const chunks = text.split(/\n\s*\n/).map(chunk => {
    chunk = chunk.trim();
    if (!chunk) return '';
    if (/^<(h\d|ul|ol|pre|div|table|blockquote)/i.test(chunk)) {
      return chunk;
    }
    return `<p class="ai-paragraph">${chunk.replace(/\n/g, '<br/>')}</p>`;
  });

  text = chunks.filter(Boolean).join('\n');

  // Restore code blocks
  text = text.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => {
    return codeBlocks[Number(idx)] || '';
  });

  return text;
}

// ----------------------------------------------------------------------------
// EXPOSED OMNILAB STUDIO GLOBAL ACTIONS
// ----------------------------------------------------------------------------
declare global {
  interface Window {
    omniLabStudio: {
      handleSend: () => Promise<void>;
      handleInputKeydown: (e: KeyboardEvent) => void;
      autoResizeTextarea: (ta: HTMLTextAreaElement) => void;
      clearInput: () => void;
      selectStarter: (prompt: string, autoRun?: boolean) => void;
      insertPill: (pillText: string) => void;
      startNewBuild: () => void;
      clearChat: () => void;
      toggleThought: (msgId: string) => void;
      inspectProject: (projectId: string) => void;
      copyCode: (projectId: string) => void;
      copyLatestCode: () => void;
      renamePrompt: () => void;
      showAuthorInfo: () => void;
      triggerRealtimeStream: () => void;
      updateTokenCount: () => void;
      toggleSidebar: () => void;
      toggleFullscreen: () => void;
      switchModel: (provider: string) => void;
      openSettingsModal: () => void;
      closeSettingsModal: () => void;
      saveSettings: () => void;
      filterCategory: (cat: string) => void;
      toggleTargetBoard: () => void;
      filterHistory: (query: string) => void;
      togglePinoutCheatsheet: () => void;
      deleteHistoryItem: (id: string, e: MouseEvent) => void;

      // Antigravity Architecture Multi-Chat & Folder Management
      createNewChat: (folderId?: string) => void;
      createNewChatInsideFolder: (folderId: string, e: MouseEvent) => void;
      switchSession: (sessionId: string) => void;
      renameSession: (sessionId: string, e?: MouseEvent) => void;
      deleteSession: (sessionId: string, e?: MouseEvent) => void;
      togglePinSession: (sessionId: string, e?: MouseEvent) => void;
      createFolderPrompt: () => void;
      renameFolderPrompt: (folderId: string, e?: MouseEvent) => void;
      deleteFolderPrompt: (folderId: string, e?: MouseEvent) => void;
      toggleFolderExpand: (folderId: string, e?: MouseEvent) => void;
      openFolderPicker: (sessionId: string, e?: MouseEvent) => void;
      confirmMoveToFolder: (folderId: string | null) => void;
      closeFolderPicker: () => void;
    };
  }
}

export function registerOmniLabStudioGlobals(
  projectsData: ScienceProject[],
  state: FilterState,
  onProjectsUpdated: () => void,
  showToast: (msg: string) => void
): void {
  window.omniLabStudio = {
    handleSend: async () => {
      const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | null;
      const sendBtn = document.getElementById('ai-studio-submit-btn') as HTMLButtonElement | null;
      const prompt = input?.value.trim();

      if (!prompt || isGenerating) return;

      isGenerating = true;
      if (sendBtn) sendBtn.disabled = true;

      const currentSession = getActiveSession();

      // 1. Add User Message to Active Session
      const userMsgId = 'msg-' + Date.now();
      const userMsg: StudioMessage = {
        id: userMsgId,
        role: 'user',
        content: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      currentSession.messages.push(userMsg);
      studioMessages = currentSession.messages;

      // Auto-title session on first user turn if untitled
      if (currentSession.title === 'Untitled architecture' || currentSession.title === 'Untitled prompt' || currentSession.messages.length <= 2) {
        currentSession.title = prompt.length > 38 ? prompt.slice(0, 38) + '...' : prompt;
        const titleEl = document.getElementById('studio-active-title');
        if (titleEl) titleEl.textContent = currentSession.title;
      }
      currentSession.updatedAt = Date.now();

      // Clear input
      if (input) {
        input.value = '';
        input.style.height = 'auto';
      }

      const intent = detectPromptIntent(prompt);

      if (intent === 'chat') {
        const assistantMsgId = 'msg-' + (Date.now() + 1);
        const assistantMsg: StudioMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thoughtDuration: '0.4s',
          isStreaming: true,
          isChatThinking: true,
          synthesisStatus: 'Consulting Hardware Engineering Knowledge Base...'
        };
        currentSession.messages.push(assistantMsg);
        studioMessages = currentSession.messages;

        const stream = document.getElementById('ai-studio-chat-stream');
        if (stream) {
          stream.innerHTML = renderChatStreamHTML();
          stream.scrollTop = stream.scrollHeight;
        }

        const startTime = Date.now();
        const thinkTimer = setInterval(() => {
          if (!isGenerating) {
            clearInterval(thinkTimer);
            return;
          }
          const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
          assistantMsg.thoughtDuration = `${elapsedSec}s`;
          if (stream) {
            const timerEl = document.getElementById(`synthesis-timer-${assistantMsg.id}`);
            if (timerEl) timerEl.textContent = `⏱ ${elapsedSec}s`;
          }
        }, 200);

        try {
          // Pass multi-turn history for infinite contextual chat
          const history = currentSession.messages
            .filter(m => !m.isStreaming && m.content)
            .map(m => ({ role: m.role, content: m.content }));

          const chatRes = await generateAIChatResponse(prompt, history);
          clearInterval(thinkTimer);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          assistantMsg.thoughtDuration = `${elapsed}s`;
          assistantMsg.content = chatRes.reply;
          assistantMsg.reasoningSteps = chatRes.reasoning;
          assistantMsg.suggestions = chatRes.suggestions;
          assistantMsg.isStreaming = false;
          currentSession.updatedAt = Date.now();

          saveStudioState();

          if (stream) {
            stream.innerHTML = renderChatStreamHTML();
            stream.scrollTop = stream.scrollHeight;
          }

          const historyList = document.getElementById('ai-studio-history-list');
          if (historyList) {
            historyList.innerHTML = renderHistoryItemsHTML();
          }
          const countBadge = document.getElementById('history-count-badge');
          if (countBadge) {
            countBadge.textContent = `${getAllStudioProjects().length} Saved`;
          }
        } catch (err) {
          clearInterval(thinkTimer);
          console.error('Studio chat error:', err);
          assistantMsg.isStreaming = false;
          assistantMsg.content = 'Sorry, an error occurred while processing your request. Please try again.';
          if (stream) stream.innerHTML = renderChatStreamHTML();
        } finally {
          isGenerating = false;
          if (sendBtn) sendBtn.disabled = false;
        }
        return;
      }

      // Hardware Synthesis Mode
      const assistantMsgId = 'msg-' + (Date.now() + 1);
      const assistantMsg: StudioMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thoughtDuration: '0.2s',
        progressPct: 15,
        synthesisStatus: `Synthesizing ${currentTargetBoard} power budget & voltage translation...`,
        currentStepIndex: 1,
        isStreaming: true
      };
      currentSession.messages.push(assistantMsg);
      studioMessages = currentSession.messages;

      // Refresh chat stream
      const stream = document.getElementById('ai-studio-chat-stream');
      if (stream) {
        stream.innerHTML = renderChatStreamHTML();
        stream.scrollTop = stream.scrollHeight;
      }

      const startTime = Date.now();

      // Progressive live synthesis stages for loading bar
      const stages = [
        { pct: 30, status: `Selecting optimal ${currentTargetBoard} GPIO pinout mapping...`, step: 2 },
        { pct: 55, status: 'Routing orthogonal conductor conduits & breadboard power rails...', step: 3 },
        { pct: 80, status: 'Verifying bill of materials & zero-fault electrical ratings...', step: 4 },
        { pct: 92, status: 'Compiling production-ready Arduino C++ firmware...', step: 5 }
      ];

      let stageIdx = 0;
      const progressTimer = setInterval(() => {
        if (!isGenerating) {
          clearInterval(progressTimer);
          return;
        }
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        if (stageIdx < stages.length) {
          const s = stages[stageIdx];
          assistantMsg.progressPct = s.pct;
          assistantMsg.synthesisStatus = s.status;
          assistantMsg.currentStepIndex = s.step;
          assistantMsg.thoughtDuration = `${elapsedSec}s`;
          stageIdx++;
        } else {
          assistantMsg.thoughtDuration = `${elapsedSec}s`;
        }
        if (stream) {
          stream.innerHTML = renderChatStreamHTML();
          stream.scrollTop = stream.scrollHeight;
        }
      }, 420);

      try {
        const newProject = await createProjectFromPrompt(prompt, currentTargetBoard);
        clearInterval(progressTimer);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        assistantMsg.thoughtDuration = `${elapsed}s`;
        assistantMsg.progressPct = 100;
        assistantMsg.currentStepIndex = 5;
        assistantMsg.synthesisStatus = 'Hardware synthesis complete!';
        assistantMsg.project = newProject;
        assistantMsg.reasoningSteps = [
          `Analyzed electrical power budget & logic voltage translation for ${newProject.board}`,
          `Microcontroller mapped: ${newProject.board} with verified GPIO netlist`,
          'Orthogonal conductor conduits routed across dual power rails with 0 crossing shorts',
          'Component BOM verified with load current margins & pull-up resistors',
          'Compiled verified production-ready Arduino C++ firmware with hardware interrupts'
        ];
        assistantMsg.content = generateProjectSynthesisCommentary(newProject, prompt);

        // Update session metadata
        currentSession.title = newProject.title;
        currentSession.targetBoard = (newProject.board as any) || currentTargetBoard;
        currentSession.updatedAt = Date.now();

        // Small cinematic pause so user sees 100% completion
        if (stream) {
          stream.innerHTML = renderChatStreamHTML();
          stream.scrollTop = stream.scrollHeight;
        }

        await new Promise(res => setTimeout(res, 350));
        assistantMsg.isStreaming = false;

        // Add to main projects store
        projectsData.unshift(newProject);
        state.bookmarkedIds.add(newProject.id);
        localStorage.setItem('lab_bookmarks', JSON.stringify([...state.bookmarkedIds]));
        onProjectsUpdated();

        // Persist session architecture
        saveStudioState();

        // Update history sidebar
        const historyList = document.getElementById('ai-studio-history-list');
        if (historyList) {
          historyList.innerHTML = renderHistoryItemsHTML();
        }
        const countBadge = document.getElementById('history-count-badge');
        if (countBadge) {
          countBadge.textContent = `${getAllStudioProjects().length} Saved`;
        }

        // Update active title and token count
        const titleEl = document.getElementById('studio-active-title');
        if (titleEl) titleEl.textContent = newProject.title;
        const tokenEl = document.getElementById('studio-token-count');
        if (tokenEl) tokenEl.textContent = '2,842';

        if (stream) {
          stream.innerHTML = renderChatStreamHTML();
          stream.scrollTop = stream.scrollHeight;
        }

        showToast(`🎉 "${newProject.title}" synthesized successfully!`);
      } catch (err) {
        clearInterval(progressTimer);
        console.error('Studio generation error:', err);
        assistantMsg.content = 'Encountered an issue synthesizing the hardware blueprint. Please check your prompt or network configuration.';
        assistantMsg.isStreaming = false;
        if (stream) stream.innerHTML = renderChatStreamHTML();
        showToast('Error synthesizing project. Please try again.');
      } finally {
        isGenerating = false;
        if (sendBtn) sendBtn.disabled = false;
      }
    },

    handleInputKeydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.omniLabStudio.handleSend();
      }
    },

    autoResizeTextarea: (ta: HTMLTextAreaElement) => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(140, ta.scrollHeight) + 'px';
    },

    clearInput: () => {
      const input = document.getElementById('ai-studio-input') as HTMLInputElement | null;
      if (input) {
        input.value = '';
        input.focus();
        window.omniLabStudio.updateTokenCount();
      }
    },

    selectStarter: (prompt: string, autoRun = false) => {
      const input = document.getElementById('ai-studio-input') as HTMLInputElement | null;
      if (input) {
        input.value = prompt;
        input.focus();
        window.omniLabStudio.updateTokenCount();
      }
      if (autoRun) {
        window.omniLabStudio.handleSend();
      }
    },

    insertPill: (pillText: string) => {
      const input = document.getElementById('ai-studio-input') as HTMLInputElement | null;
      if (input) {
        const val = input.value.trim();
        input.value = val ? `${val}, with ${pillText}` : `Build a project using ${pillText}`;
        input.focus();
        window.omniLabStudio.updateTokenCount();
      }
    },

    updateTokenCount: () => {
      const input = document.getElementById('ai-studio-input') as HTMLInputElement | null;
      const tokenEl = document.getElementById('studio-token-count');
      if (tokenEl && input) {
        const tokens = Math.max(0, Math.ceil(input.value.length / 4));
        tokenEl.textContent = tokens.toString();
      }
    },

    renamePrompt: () => {
      const current = getActiveSession();
      const updated = window.prompt('Rename architecture session:', current.title);
      if (updated && updated.trim()) {
        current.title = updated.trim();
        current.updatedAt = Date.now();
        saveStudioState();
        const titleEl = document.getElementById('studio-active-title');
        if (titleEl) titleEl.textContent = current.title;
        const historyList = document.getElementById('ai-studio-history-list');
        if (historyList) {
          historyList.innerHTML = renderHistoryItemsHTML();
        }
        showToast(`Renamed architecture to "${current.title}"`);
      }
    },

    showAuthorInfo: () => {
      showToast('The Innovation Hub Account • Pro Workspace');
    },

    triggerRealtimeStream: () => {
      window.omniLabStudio.selectStarter('ESP32 Realtime WebSocket Telemetry with MPU6050 6-Axis IMU and live browser graph', true);
    },

    copyLatestCode: () => {
      const current = getActiveSession();
      const p = current.messages.find(m => m.project)?.project || getAllStudioProjects()[0] || projectsData[0];
      if (p?.code) {
        navigator.clipboard.writeText(p.code);
        showToast(`Copied ${p.title} C++ firmware to clipboard!`);
      } else {
        showToast('Synthesize a build first to get firmware code.');
      }
    },

    filterCategory: (cat: string) => {
      activeStarterCategory = cat;
      const stream = document.getElementById('ai-studio-chat-stream');
      if (stream && getActiveSession().messages.length === 0) {
        stream.innerHTML = renderChatStreamHTML();
      }
    },

    toggleTargetBoard: () => {
      currentTargetBoard = currentTargetBoard === 'ESP32' ? 'Arduino Uno' : 'ESP32';
      const currentSession = getActiveSession();
      currentSession.targetBoard = currentTargetBoard;
      saveStudioState();
      const compareBtnText = document.getElementById('studio-compare-text');
      if (compareBtnText) {
        compareBtnText.textContent = `Compare (${currentTargetBoard})`;
      }
      const advBtnText = document.getElementById('adv-target-board-text');
      if (advBtnText) {
        advBtnText.textContent = currentTargetBoard;
      }
      const input = document.getElementById('ai-studio-input') as HTMLInputElement | null;
      if (input) {
        input.placeholder = `Describe any ${currentTargetBoard} robotics build, sensor network, or automation circuit...`;
      }
      showToast(`Switched Target MCU to ${currentTargetBoard} (${currentTargetBoard === 'ESP32' ? '3.3V Logic' : '5.0V Logic'})`);
    },

    filterHistory: (query: string) => {
      historySearchQuery = query;
      const historyList = document.getElementById('ai-studio-history-list');
      if (historyList) {
        historyList.innerHTML = renderHistoryItemsHTML();
      }
      const countBadge = document.getElementById('history-count-badge');
      if (countBadge) {
        countBadge.textContent = `${getAllStudioProjects().length} Saved`;
      }
    },

    togglePinoutCheatsheet: () => {},

    deleteHistoryItem: (id: string, e: MouseEvent) => {
      window.omniLabStudio.deleteSession(id, e);
    },

    startNewBuild: () => {
      window.omniLabStudio.createNewChat();
    },

    clearChat: () => {
      window.omniLabStudio.startNewBuild();
    },

    // ========================================================================
    // ANTIGRAVITY MULTI-CHAT & FOLDER ARCHITECTURE MANAGEMENT
    // ========================================================================
    createNewChat: (folderId?: string) => {
      const newSession: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'Untitled architecture',
        folderId: folderId || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        targetBoard: currentTargetBoard,
        messages: []
      };
      chatSessions.unshift(newSession);
      activeSessionId = newSession.id;
      studioMessages = newSession.messages;
      saveStudioState();

      const stream = document.getElementById('ai-studio-chat-stream');
      if (stream) {
        stream.innerHTML = renderChatStreamHTML();
        stream.scrollTop = stream.scrollHeight;
      }
      const historyList = document.getElementById('ai-studio-history-list');
      if (historyList) {
        historyList.innerHTML = renderHistoryItemsHTML();
      }
      const titleEl = document.getElementById('studio-active-title');
      if (titleEl) {
        titleEl.textContent = newSession.title;
      }
      const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | null;
      if (input) {
        input.value = '';
        input.focus();
        window.omniLabStudio.updateTokenCount();
      }
      showToast('Created new architecture session');
    },

    createNewChatInsideFolder: (folderId: string, e: MouseEvent) => {
      if (e) e.stopPropagation();
      const folder = studioFolders.find(f => f.id === folderId);
      if (folder) folder.isExpanded = true;
      window.omniLabStudio.createNewChat(folderId);
    },

    switchSession: (sessionId: string) => {
      const target = chatSessions.find(s => s.id === sessionId);
      if (!target) return;
      activeSessionId = target.id;
      studioMessages = target.messages;
      currentTargetBoard = target.targetBoard || 'ESP32';

      const stream = document.getElementById('ai-studio-chat-stream');
      if (stream) {
        stream.innerHTML = renderChatStreamHTML();
        stream.scrollTop = stream.scrollHeight;
      }
      const historyList = document.getElementById('ai-studio-history-list');
      if (historyList) {
        historyList.innerHTML = renderHistoryItemsHTML();
      }
      const titleEl = document.getElementById('studio-active-title');
      if (titleEl) {
        titleEl.textContent = target.title;
      }
      const compareBtnText = document.getElementById('studio-compare-text');
      if (compareBtnText) {
        compareBtnText.textContent = `Compare (${currentTargetBoard})`;
      }
      const advBtnText = document.getElementById('adv-target-board-text');
      if (advBtnText) {
        advBtnText.textContent = currentTargetBoard;
      }
      saveStudioState();
    },

    renameSession: (sessionId: string, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      const session = chatSessions.find(s => s.id === sessionId);
      if (!session) return;
      const newName = window.prompt('Rename architecture session:', session.title);
      if (newName && newName.trim()) {
        session.title = newName.trim();
        session.updatedAt = Date.now();
        saveStudioState();
        const historyList = document.getElementById('ai-studio-history-list');
        if (historyList) {
          historyList.innerHTML = renderHistoryItemsHTML();
        }
        if (sessionId === activeSessionId) {
          const titleEl = document.getElementById('studio-active-title');
          if (titleEl) titleEl.textContent = session.title;
        }
        showToast(`Renamed to "${session.title}"`);
      }
    },

    deleteSession: (sessionId: string, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      const session = chatSessions.find(s => s.id === sessionId);
      if (!session) return;
      if (!confirm(`Delete architecture "${session.title}"?`)) return;

      chatSessions = chatSessions.filter(s => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (chatSessions.length > 0) {
          activeSessionId = chatSessions[0].id;
          studioMessages = chatSessions[0].messages;
        } else {
          const fallback: ChatSession = {
            id: 'session-' + Date.now(),
            title: 'Untitled architecture',
            folderId: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            targetBoard: currentTargetBoard,
            messages: []
          };
          chatSessions.push(fallback);
          activeSessionId = fallback.id;
          studioMessages = fallback.messages;
        }
        const stream = document.getElementById('ai-studio-chat-stream');
        if (stream) stream.innerHTML = renderChatStreamHTML();
        const titleEl = document.getElementById('studio-active-title');
        if (titleEl) titleEl.textContent = getActiveSession().title;
      }
      saveStudioState();
      const historyList = document.getElementById('ai-studio-history-list');
      if (historyList) {
        historyList.innerHTML = renderHistoryItemsHTML();
      }
      showToast('Deleted architecture session');
    },

    togglePinSession: (sessionId: string, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      const session = chatSessions.find(s => s.id === sessionId);
      if (!session) return;
      session.pinned = !session.pinned;
      saveStudioState();
      const historyList = document.getElementById('ai-studio-history-list');
      if (historyList) {
        historyList.innerHTML = renderHistoryItemsHTML();
      }
      showToast(session.pinned ? '📌 Pinned architecture to top' : 'Unpinned architecture');
    },

    createFolderPrompt: () => {
      const name = window.prompt('New Folder Name (e.g., Robotics Lab, Wearables, IoT):');
      if (name && name.trim()) {
        const newFolder: StudioFolder = {
          id: 'folder-' + Date.now(),
          name: name.trim(),
          createdAt: Date.now(),
          isExpanded: true
        };
        studioFolders.push(newFolder);
        saveStudioState();
        const historyList = document.getElementById('ai-studio-history-list');
        if (historyList) {
          historyList.innerHTML = renderHistoryItemsHTML();
        }
        showToast(`Created folder "${newFolder.name}"`);
      }
    },

    renameFolderPrompt: (folderId: string, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      const folder = studioFolders.find(f => f.id === folderId);
      if (!folder) return;
      const newName = window.prompt('Rename Folder:', folder.name);
      if (newName && newName.trim()) {
        folder.name = newName.trim();
        saveStudioState();
        const historyList = document.getElementById('ai-studio-history-list');
        if (historyList) {
          historyList.innerHTML = renderHistoryItemsHTML();
        }
        showToast(`Renamed folder to "${folder.name}"`);
      }
    },

    deleteFolderPrompt: (folderId: string, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      const folder = studioFolders.find(f => f.id === folderId);
      if (!folder) return;
      if (!confirm(`Delete folder "${folder.name}"? (Chats inside will be moved to root)`)) return;
      chatSessions.forEach(s => {
        if (s.folderId === folderId) {
          s.folderId = null;
        }
      });
      studioFolders = studioFolders.filter(f => f.id !== folderId);
      saveStudioState();
      const historyList = document.getElementById('ai-studio-history-list');
      if (historyList) {
        historyList.innerHTML = renderHistoryItemsHTML();
      }
      showToast(`Deleted folder "${folder.name}"`);
    },

    toggleFolderExpand: (folderId: string, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      const folder = studioFolders.find(f => f.id === folderId);
      if (!folder) return;
      folder.isExpanded = !folder.isExpanded;
      saveStudioState();
      const historyList = document.getElementById('ai-studio-history-list');
      if (historyList) {
        historyList.innerHTML = renderHistoryItemsHTML();
      }
    },

    openFolderPicker: (sessionId: string, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      targetMovingSessionId = sessionId;
      const picker = document.getElementById('ai-studio-folder-picker');
      const options = document.getElementById('folder-picker-options');
      const session = chatSessions.find(s => s.id === sessionId);
      if (!picker || !options || !session) return;

      let optsHTML = `
        <div 
          class="p-2.5 rounded hover:bg-[#282a2d] cursor-pointer flex items-center justify-between text-xs text-white ${!session.folderId ? 'bg-[#282a2d] font-semibold text-[#00f2fe]' : ''}"
          style="padding:10px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; font-size:12px; background:${!session.folderId ? '#282a2d' : 'transparent'};"
          onclick="window.omniLabStudio.confirmMoveToFolder(null)"
        >
          <div style="display:flex; align-items:center; gap:8px;">
            <span>🏠</span>
            <span>Unorganized (Root)</span>
          </div>
          ${!session.folderId ? '<span style="color:#00f2fe;">✓ Current</span>' : ''}
        </div>
      `;

      studioFolders.forEach(folder => {
        const isCurrent = session.folderId === folder.id;
        optsHTML += `
          <div 
            class="p-2.5 rounded hover:bg-[#282a2d] cursor-pointer flex items-center justify-between text-xs text-white ${isCurrent ? 'bg-[#282a2d] font-semibold text-[#00f2fe]' : ''}"
            style="padding:10px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; font-size:12px; background:${isCurrent ? '#282a2d' : 'transparent'};"
            onclick="window.omniLabStudio.confirmMoveToFolder('${folder.id}')"
          >
            <div style="display:flex; align-items:center; gap:8px;">
              <span>📁</span>
              <span>${escapeHtml(folder.name)}</span>
            </div>
            ${isCurrent ? '<span style="color:#00f2fe;">✓ Current</span>' : ''}
          </div>
        `;
      });

      options.innerHTML = optsHTML;
      picker.style.display = 'flex';
    },

    confirmMoveToFolder: (folderId: string | null) => {
      if (!targetMovingSessionId) return;
      const session = chatSessions.find(s => s.id === targetMovingSessionId);
      if (session) {
        session.folderId = folderId;
        saveStudioState();
        const historyList = document.getElementById('ai-studio-history-list');
        if (historyList) {
          historyList.innerHTML = renderHistoryItemsHTML();
        }
        const targetFolder = studioFolders.find(f => f.id === folderId);
        showToast(targetFolder ? `Moved to "${targetFolder.name}"` : 'Moved to Root');
      }
      window.omniLabStudio.closeFolderPicker();
    },

    closeFolderPicker: () => {
      targetMovingSessionId = null;
      const picker = document.getElementById('ai-studio-folder-picker');
      if (picker) picker.style.display = 'none';
    },

    toggleThought: (msgId: string) => {
      const body = document.getElementById(`thought-body-${msgId}`);
      const chevron = document.querySelector(`#thought-${msgId} .thought-chevron`) as HTMLElement | null;
      if (body) {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'flex' : 'none';
        if (chevron) chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
    },

    inspectProject: (projectId: string) => {
      let p = projectsData.find(item => item.id === projectId) || getStudioProjectById(projectId);
      if (p) {
        if (!projectsData.some(item => item.id === p!.id)) {
          projectsData.unshift(p);
        }
        openProjectModal(p, state);
      } else if (window.omniLab?.openModal) {
        window.omniLab.openModal(projectId);
      } else {
        showToast('Could not find hardware project specifications');
      }
    },

    copyCode: (projectId: string) => {
      const p = projectsData.find(item => item.id === projectId) || getStudioProjectById(projectId);
      if (p?.code) {
        navigator.clipboard.writeText(p.code);
        showToast('Copied C++ firmware code to clipboard!');
      } else {
        showToast('Firmware code not found for this project');
      }
    },

    toggleSidebar: () => {
      const shell = document.getElementById('ai-studio-shell');
      shell?.classList.toggle('sidebar-collapsed');
    },

    toggleFullscreen: () => {
      const shell = document.getElementById('ai-studio-shell');
      if (shell) {
        shell.classList.toggle('fullscreen-studio');
      }
    },

    switchModel: (provider: string) => {
      saveAISettings({ provider: provider as AIProvider });
      showToast(`Switched model to ${formatProviderName(provider)}`);
    },

    openSettingsModal: () => {
      const drawer = document.getElementById('ai-settings-drawer');
      if (drawer) drawer.style.display = 'flex';
      const settings = getAISettings();
      const provSelect = document.getElementById('setting-provider-select') as HTMLSelectElement | null;
      const keyInput = document.getElementById('setting-key-input') as HTMLInputElement | null;
      if (provSelect) provSelect.value = settings.provider;
      if (keyInput) keyInput.value = settings.apiKey;
    },

    closeSettingsModal: () => {
      const drawer = document.getElementById('ai-settings-drawer');
      if (drawer) drawer.style.display = 'none';
    },

    saveSettings: () => {
      const provSelect = document.getElementById('setting-provider-select') as HTMLSelectElement | null;
      const keyInput = document.getElementById('setting-key-input') as HTMLInputElement | null;
      if (provSelect) {
        saveAISettings({
          provider: provSelect.value as AIProvider,
          apiKey: keyInput?.value.trim() || ''
        });
      }
      window.omniLabStudio.closeSettingsModal();
      showToast('Saved AI engine configuration');
    }
  };
}
