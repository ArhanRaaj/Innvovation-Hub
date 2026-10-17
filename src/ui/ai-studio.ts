// ============================================================================
// THE INNOVATION HUB — OMNILAB AI HARDWARE STUDIO (ANTIGRAVITY 2.0 UI)
// Generative hardware engineering studio inspired by Google Antigravity & ChatGPT.
// Features dual-pane layout, live animated loading bar & reasoning tree,
// live project synthesis, interactive blueprint cards, and prompt component chips.
// ============================================================================

import type { ScienceProject, FilterState } from '../types.ts';
import { PROJECTS_DATA } from '../data/projects.ts';
import {
  createProjectFromPrompt,
  detectPromptIntent,
  generateAIChatResponse,
  generateProjectSynthesisCommentary,
  getAISettings,
  saveAISettings,
  AIProvider
} from '../services/ai-service.ts';
import { authService } from '../services/auth-service.ts';
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
  folderId: string | null;
  projectId?: string; // Links session directly to a dedicated project laboratory
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
let showAllProjectSessions = false;
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
        title: 'New chat',
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
        title: 'New chat',
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
    const user = authService.getCurrentUser();
    const uid = user ? user.id : 'guest';
    authService.saveUserSessions(chatSessions, uid);
    authService.saveUserFolders(studioFolders, uid);
    const active = getActiveSession();
    studioMessages = active.messages;
  } catch (e) {
    console.error('Error saving studio state:', e);
  }
}

export function initAIStudio(): void {
  const user = authService.getCurrentUser();
  const uid = user ? user.id : 'guest';

  // 1. Load user-specific sessions (strictly isolated per user from Supabase!)
  try {
    const savedSessions = authService.getUserSessions(uid);
    if (savedSessions && savedSessions.length > 0) {
      chatSessions = savedSessions;
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
    } else {
      chatSessions = [];
    }
  } catch {
    chatSessions = [];
  }

  // 2. Ensure each of the 12 curated projects has its dedicated individual chat session
  const userProjects = authService.getUserProjects(uid);
  const allProjectsToMap = [...PROJECTS_DATA, ...userProjects];

  for (const proj of allProjectsToMap) {
    const existing = chatSessions.find(s => s.projectId === proj.id || s.id === 'project-chat-' + proj.id);
    if (!existing) {
      chatSessions.push({
        id: 'project-chat-' + proj.id,
        projectId: proj.id,
        title: proj.title,
        folderId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        targetBoard: proj.board as 'ESP32' | 'Arduino Uno',
        messages: [
          {
            id: 'msg-welcome-' + proj.id,
            role: 'assistant',
            content: `### **${proj.title}** Engineering Laboratory

I have the verified hardware schematic, BOM (**${proj.components.length} components**), conductor netlist (**${proj.wiringTable.length} pin connections**), and compilable Arduino C++ firmware loaded on the workbench.

How can I help you with this project today? Feel free to ask about the wiring, code logic, or troubleshooting!`,
            timestamp: 'Just now',
            suggestions: [
              { label: 'Explain wiring', prompt: 'Explain the wiring connections and pin assignments for this circuit' },
              { label: 'Explain C++ code', prompt: 'Explain how the firmware code works step-by-step' },
              { label: 'Power & voltage', prompt: 'What are the power supply and voltage requirements?' },
              { label: 'Troubleshooting tips', prompt: 'What are common issues and troubleshooting tips for this build?' }
            ]
          }
        ]
      });
    } else {
      // Keep existing user chat history while maintaining project metadata
      existing.projectId = proj.id;
      existing.title = proj.title;
      existing.targetBoard = proj.board as 'ESP32' | 'Arduino Uno';
    }
  }

  // 3. Ensure at least one general engineering chat exists
  const hasGeneralChat = chatSessions.some(s => !s.projectId);
  if (!hasGeneralChat) {
    chatSessions.unshift({
      id: 'session-' + Date.now(),
      title: 'General Engineering Chat',
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      targetBoard: currentTargetBoard,
      messages: []
    });
  }

  // 4. URL Routing: If user visits /studio?project=..., auto-activate that project's chat!
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const reqProjId = urlParams.get('project');
    if (reqProjId) {
      const match = chatSessions.find(s => s.projectId === reqProjId || s.id === 'project-chat-' + reqProjId);
      if (match) {
        activeSessionId = match.id;
        currentTargetBoard = match.targetBoard || 'ESP32';
        studioMessages = match.messages;
        return;
      }
    }
  }

  // Set active session
  if (!activeSessionId || !chatSessions.some(s => s.id === activeSessionId)) {
    activeSessionId = chatSessions[0].id;
  }
  const activeSess = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];
  studioMessages = activeSess.messages;
  currentTargetBoard = activeSess.targetBoard || 'ESP32';
}

export function getAllStudioProjects(): ScienceProject[] {
  const user = authService.getCurrentUser();
  const uid = user ? user.id : 'guest';

  // 1. Projects stored in active user account
  const accountProjects = authService.getUserProjects(uid);

  // 2. Projects synthesized in active session messages
  const projs: ScienceProject[] = [...accountProjects];
  const seenIds = new Set<string>(accountProjects.map(p => p.id));

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
  const user = authService.getCurrentUser();
  const uid = user ? user.id : 'guest';
  const accountProjects = authService.getUserProjects(uid);
  const foundInAccount = accountProjects.find(p => p.id === id);
  if (foundInAccount) return foundInAccount;

  for (const session of chatSessions) {
    for (const m of session.messages) {
      if (m.project && m.project.id === id) return m.project;
    }
  }
  return undefined;
}

function renderWorkspaceHeaderHTML(): string {
  const active = getActiveSession();
  const currentUser = authService.getCurrentUser();
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  const userTitle = currentUser ? `${currentUser.name} (${currentUser.email}) - Account Profile` : 'Sign In';

  if (active.projectId) {
    const isESP = active.targetBoard === 'ESP32';
    const boardColor = isESP ? '#60a5fa' : '#22c55e';
    const boardBg = isESP ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)';
    const boardBorder = isESP ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 197, 94, 0.3)';

    return `
      <header id="studio-workspace-header" style="height:52px; border-bottom:1px solid #222222; background:#0a0a0a; padding:0 20px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
        <div style="display:flex; align-items:center; gap:10px; min-width:0;">
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; background:rgba(59, 130, 246, 0.15); color:#60a5fa; padding:3px 8px; border-radius:9999px; border:1px solid rgba(59, 130, 246, 0.3); white-space:nowrap;">Project lab</span>
          <span class="text-sm font-semibold truncate" id="studio-active-title" style="font-size:14px; font-weight:600; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${escapeHtml(active.title)}
          </span>
          <span style="font-size:10px; padding:2px 8px; border-radius:4px; font-family:monospace; font-weight:700; color:${boardColor}; background:${boardBg}; border:1px solid ${boardBorder}; white-space:nowrap;">
            ${active.targetBoard}
          </span>
        </div>

        <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
          <button style="display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; background:#1a1a1a; color:#e0e0e0; border:1px solid #333333; cursor:pointer; font-size:12px; transition:all 0.15s ease;" onmouseover="this.style.background='#252525'; this.style.borderColor='#3b82f6';" onmouseout="this.style.background='#1a1a1a'; this.style.borderColor='#333333';" onclick="window.omniLabStudio.inspectActiveProject()" title="View Schematic & Circuit Diagram">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span>Schematic</span>
          </button>
          <button style="display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; background:#1a1a1a; color:#e0e0e0; border:1px solid #333333; cursor:pointer; font-size:12px; transition:all 0.15s ease;" onmouseover="this.style.background='#252525'; this.style.borderColor='#22c55e';" onmouseout="this.style.background='#1a1a1a'; this.style.borderColor='#333333';" onclick="window.omniLabStudio.copyLatestCode()" title="Copy Arduino C++ Firmware">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span>Copy Code</span>
          </button>
          <div id="studio-header-avatar-btn" style="width:28px; height:28px; border-radius:50%; background:#0284c7; color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:12px; cursor:pointer;" title="${userTitle}" onclick="window.omniLabStudio.showAuthorInfo()">${userInitial}</div>
        </div>
      </header>
    `;
  }

  // General Engineering Chat Header
  return `
    <header id="studio-workspace-header" style="height:52px; border-bottom:1px solid #222222; background:#0a0a0a; padding:0 20px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
      <div style="display:flex; align-items:center; gap:8px; cursor:pointer; min-width:0;" onclick="window.omniLabStudio.renamePrompt()" title="Click to rename chat">
        <span class="text-sm font-medium" id="studio-active-title" style="font-size:14px; font-weight:500; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(active.title)}</span>
        <svg style="width:13px; height:13px; color:#666666; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </div>

      <div style="display:flex; align-items:center; gap:10px;">
        <button style="display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:8px; background:#1a1a1a; color:#ffffff; border:1px solid #333333; cursor:pointer; font-size:12px; font-weight:500; transition:all 0.15s ease;" onmouseover="this.style.background='#252525'; this.style.borderColor='#3b82f6';" onmouseout="this.style.background='#1a1a1a'; this.style.borderColor='#333333';" onclick="window.omniLabStudio.createNewChat()" title="Start New Chat">
          <span style="color:#60a5fa; font-weight:bold; font-size:14px; line-height:1;">+</span>
          <span>New Chat</span>
        </button>
        <div id="studio-header-avatar-btn" style="width:28px; height:28px; border-radius:50%; background:#0284c7; color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:12px; cursor:pointer;" title="${userTitle}" onclick="window.omniLabStudio.showAuthorInfo()">${userInitial}</div>
      </div>
    </header>
  `;
}

export function renderAIStudioModal(containerId = 'ai-architect-modal'): void {
  activeMountContainerId = containerId;
  const modal = document.getElementById(containerId);
  if (!modal) return;

  const isDedicated = window.location.pathname.includes('studio.html') || containerId === 'dedicated-studio-mount';
  const settings = getAISettings();
  const currentProvider = settings.provider || 'auto';
  const savedProjectCount = studioMessages.filter(m => m.project).length;
  const currentUser = authService.getCurrentUser();
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  const userTitle = currentUser ? `${currentUser.name} (${currentUser.email}) - Account Profile` : 'Sign In';

  if (!currentUser) {
    modal.innerHTML = `
      <div class="google-ai-studio flex h-screen w-full bg-[#0a0a0a] text-[#ffffff] items-center justify-center p-6 select-none" id="ai-studio-shell" style="display:flex; height:100vh; width:100%; background:#0a0a0a; align-items:center; justify-content:center; box-sizing:border-box;">
        <div class="max-w-md w-full bg-[#111111] border border-[#222222] rounded-2xl p-8 text-center shadow-2xl flex flex-col items-center" style="max-width:440px; width:100%; background:#111111; border:1px solid #222222; border-radius:20px; padding:36px; text-align:center; box-sizing:border-box;">
          <div style="width:64px; height:64px; border-radius:50%; background:rgba(59, 130, 246, 0.12); border:1px solid rgba(59, 130, 246, 0.3); display:flex; align-items:center; justify-content:center; margin-bottom:20px; color:#60a5fa;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#60a5fa; font-weight:700; margin-bottom:8px; display:block; font-family:monospace;">THE INNOVATION HUB &bull; AI HARDWARE STUDIO</span>
          <h2 style="color:#ffffff; font-size:24px; font-weight:700; margin-bottom:8px;">Sign In to Use AI Studio</h2>
          <p style="color:#a0a0a0; font-size:14px; line-height:1.5; margin-bottom:24px;">Please log in to your engineer account to start designing custom hardware architectures, interactive schematics, and compiling C++ firmware.</p>
          <div style="display:flex; flex-direction:column; gap:12px; width:100%;">
            <button onclick="window.innovationHubAuth.openAuthModal('signin')" style="width:100%; padding:12px 16px; background:#3b82f6; color:#ffffff; font-weight:600; border-radius:12px; border:none; cursor:pointer; transition:background 0.15s ease;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
              Sign In to Your Account &rarr;
            </button>
            <button onclick="window.innovationHubAuth.openAuthModal('register')" style="width:100%; padding:12px 16px; background:#1a1a1a; color:#ffffff; font-weight:500; border-radius:12px; border:1px solid #333333; cursor:pointer; transition:background 0.15s ease;" onmouseover="this.style.background='#242424'" onmouseout="this.style.background='#1a1a1a'">
              Create Free Account
            </button>
          </div>
          <div style="margin-top:24px; padding-top:16px; border-top:1px solid #222222; width:100%; display:flex; justify-content:center;">
            <a href="/" style="font-size:12px; color:#a0a0a0; text-decoration:none;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#a0a0a0'">&larr; Return to Home</a>
          </div>
        </div>
      </div>
    `;
    return;
  }

  modal.innerHTML = `
    <!-- Main Full-Screen AI Hardware Studio Application Shell (ChatGPT / Gemini Style) -->
    <div class="google-ai-studio flex h-screen w-full bg-[#0a0a0a] text-[#ffffff] overflow-hidden select-none" id="ai-studio-shell" style="display:flex; height:100vh; width:100%; background:#0a0a0a; color:#ffffff; font-family:'Google Sans', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif; overflow:hidden; user-select:none;">
      
      <!-- 1. Left Navigation Sidebar: Dedicated Project Labs + General Conversations -->
      <aside class="w-64 h-full bg-[#111111] border-r border-[#222222] flex flex-col justify-between p-3 shrink-0" style="width:260px; min-width:260px; height:100%; background:#111111; border-right:1px solid #222222; display:flex; flex-direction:column; justify-content:space-between; padding:12px; box-sizing:border-box; flex-shrink:0;">
        <div class="flex flex-col flex-1 min-h-0" style="display:flex; flex-direction:column; flex:1; min-height:0; gap:12px;">
          <!-- Clean Brand Logo Area -->
          <div style="display:flex; align-items:center; gap:10px; padding:6px 8px; cursor:pointer;" onclick="window.omniLabStudio.createNewChat()">
            <div style="width:30px; height:30px; border-radius:8px; background:rgba(59, 130, 246, 0.15); border:1px solid rgba(59, 130, 246, 0.3); display:flex; align-items:center; justify-content:center; color:#60a5fa; flex-shrink:0;">
              <span aria-hidden="true" style="font-size:16px;">✳</span>
            </div>
            <div style="display:flex; flex-direction:column; line-height:1.2;">
              <span style="font-size:14px; font-weight:600; color:#ffffff;">The Innovation Hub</span>
              <span style="font-size:10px; color:#a0a0a0; font-weight:500; letter-spacing:0.04em;">AI Studio</span>
            </div>
          </div>

          <!-- + New Chat Button -->
          <button 
            style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:#1a1a1a; border:1px solid #2e2e2e; color:#ffffff; border-radius:10px; padding:9px 14px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s ease;" 
            onmouseover="this.style.background='#242424'; this.style.borderColor='#3b82f6';"
            onmouseout="this.style.background='#1a1a1a'; this.style.borderColor='#2e2e2e';"
            onclick="window.omniLabStudio.createNewChat()"
          >
            <span style="color:#60a5fa; font-size:15px; font-weight:bold; line-height:1;">+</span>
            <span>New Chat</span>
          </button>

          <!-- Search Filter Input -->
          <div style="padding:0 2px;">
            <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:8px; background:#161616; border:1px solid #262626;">
              <svg style="width:13px; height:13px; color:#666666; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Find a chat or project" style="width:100%; background:transparent !important; border:none !important; outline:none !important; font-size:12px; color:#ffffff; padding:0;" oninput="window.omniLabStudio.filterHistory(this.value)" />
            </div>
          </div>

          <!-- History & Projects Scrollable List -->
          <div class="flex-1 overflow-y-auto px-1 space-y-3 custom-scrollbar" id="ai-studio-history-list" style="flex:1; min-height:0; overflow-y:auto; padding:2px 2px; display:flex; flex-direction:column; gap:8px;">
            ${renderHistoryItemsHTML()}
          </div>
        </div>

        <!-- Sidebar Footer -->
        <div style="border-top:1px solid #222222; padding-top:10px; display:flex; flex-direction:column; gap:6px; font-size:12px;">
          <a href="/projects" style="display:flex; align-items:center; gap:8px; padding:6px 10px; color:#a0a0a0; text-decoration:none; border-radius:6px; transition:all 0.15s ease;" onmouseover="this.style.color='#ffffff'; this.style.background='#1a1a1a';" onmouseout="this.style.color='#a0a0a0'; this.style.background='transparent';">
            <svg style="width:14px; height:14px; color:#60a5fa;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span style="font-size:12px; font-weight:500;">Explore All Projects (12)</span>
          </a>
          
          <div style="display:flex; align-items:center; justify-content:space-between; padding:2px 6px;">
            <button style="display:flex; align-items:center; gap:6px; color:#a0a0a0; background:transparent !important; border:none; cursor:pointer; font-size:12px; padding:4px 0; transition:color 0.15s ease;" onmouseover="this.style.color='#ffffff';" onmouseout="this.style.color='#a0a0a0';" onclick="window.omniLabStudio.openSettingsModal()">
              <svg style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Settings</span>
            </button>
            <button style="color:#666666; background:transparent !important; border:none; cursor:pointer; font-size:13px; padding:4px; transition:color 0.15s ease;" onmouseover="this.style.color='#ffffff';" onmouseout="this.style.color='#666666';" onclick="window.omniLabStudio.toggleSidebar()" title="Collapse Sidebar">&lt;</button>
          </div>
        </div>
      </aside>

      <!-- 2. Central Main Workspace (Full width, right sidebar removed!) -->
      <main class="flex-1 h-full flex flex-col bg-[#0a0a0a] overflow-hidden min-w-0" style="flex:1 1 0%; height:100%; display:flex; flex-direction:column; background:#0a0a0a; overflow:hidden; min-width:0;">
        <!-- Top Workspace Bar Mount -->
        <div id="studio-workspace-header-mount">
          ${renderWorkspaceHeaderHTML()}
        </div>

        <!-- Chat Stream Area (Spacious ChatGPT / Gemini style) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar" id="ai-studio-chat-stream" style="flex:1 1 0%; overflow-y:auto; padding:24px 20px 10px 20px; display:flex; flex-direction:column; scroll-behavior:smooth;">
          ${renderChatStreamHTML()}
        </div>

        <!-- Bottom Input Bar (ChatGPT-style auto-growing textarea) -->
        <div style="width:100%; max-width:840px; margin:0 auto; padding:0 20px 20px 20px; box-sizing:border-box; flex-shrink:0;">
          <div style="width:100%; background:#1a1a1a; border:1px solid #333333; border-radius:18px; padding:10px 12px 10px 16px; display:flex; align-items:flex-end; gap:10px; box-shadow:0 8px 30px rgba(0,0,0,0.5); transition:border-color 0.15s ease; box-sizing:border-box;">
            <textarea
              id="ai-studio-input"
              rows="1"
              placeholder="Ask about wiring, code, components, or anything hardware..."
              style="width:100%; max-height:150px; min-height:24px; background:transparent !important; border:none !important; outline:none !important; font-size:14px; line-height:1.5; color:#ffffff; resize:none; padding:4px 0; font-family:inherit; box-sizing:border-box;"
              onkeydown="window.omniLabStudio.handleInputKeydown(event)"
              oninput="window.omniLabStudio.autoResizeTextarea(this); window.omniLabStudio.updateTokenCount();"
            ></textarea>
            
            <button
              id="ai-studio-submit-btn"
              onclick="window.omniLabStudio.handleSend()"
              title="Send"
              style="width:34px; height:34px; min-width:34px; border-radius:50%; background:#3b82f6; color:#ffffff; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s ease; flex-shrink:0; margin-bottom:1px;"
              onmouseover="this.style.background='#2563eb';"
              onmouseout="this.style.background='#3b82f6';"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          </div>
          <div style="text-align:center; margin-top:8px; font-size:11px; color:#666666;">
            The Innovation Hub AI Assistant &bull; ESP32 &amp; Arduino Hardware Engineering
          </div>
        </div>
      </main>
    </div>

    <!-- Move to Folder Picker Modal (Clean Dark Mode) -->
    <div id="ai-studio-folder-picker" class="studio-folder-picker-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:99999; align-items:center; justify-content:center;" onclick="if(event.target===this) window.omniLabStudio.closeFolderPicker()">
      <div style="max-width:440px; width:100%; background:#111111; border:1px solid #222222; border-radius:16px; padding:20px; box-shadow:0 20px 40px rgba(0,0,0,0.8); box-sizing:border-box;">
        <div style="display:flex; align-items:center; justify-content:space-between; padding-bottom:12px; border-bottom:1px solid #222222;">
          <h3 style="font-size:14px; font-weight:600; color:#ffffff; margin:0;">Move Architecture to Folder</h3>
          <button style="color:#a0a0a0; background:transparent; border:none; cursor:pointer; font-size:18px; padding:2px;" onclick="window.omniLabStudio.closeFolderPicker()">&times;</button>
        </div>
        <div style="padding:12px 0; display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto;" id="folder-picker-options">
          <!-- Populated dynamically -->
        </div>
        <div style="padding-top:12px; border-top:1px solid #222222; display:flex; justify-content:space-between; align-items:center;">
          <button style="font-size:12px; color:#60a5fa; background:transparent; border:none; cursor:pointer;" onclick="window.omniLabStudio.createFolderPrompt()">+ Create New Folder</button>
          <button style="padding:6px 14px; font-size:12px; border-radius:6px; background:#1a1a1a; color:#ffffff; border:1px solid #333333; cursor:pointer;" onclick="window.omniLabStudio.closeFolderPicker()">Cancel</button>
        </div>
      </div>
    </div>

    <!-- API Key & Model Settings Modal -->
    <div id="ai-settings-drawer" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:99999; align-items:center; justify-content:center;" onclick="if(event.target===this) window.omniLabStudio.closeSettingsModal()">
      <div style="max-width:460px; width:100%; background:#111111; border:1px solid #222222; border-radius:16px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.8); box-sizing:border-box;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid #222222;">
          <h3 style="margin:0; font-size:16px; font-weight:600; color:#ffffff; display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>AI Studio Settings</span>
          </h3>
          <button style="background:transparent; border:none; color:#666666; font-size:20px; cursor:pointer; padding:2px;" onclick="window.omniLabStudio.closeSettingsModal()">&times;</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label style="display:block; font-size:12px; font-weight:500; color:#a0a0a0; margin-bottom:6px;">Active AI Model / Provider</label>
            <select id="setting-provider-select" style="width:100%; background:#1a1a1a; border:1px solid #333333; border-radius:8px; padding:10px 12px; color:#ffffff; font-size:13px; outline:none; cursor:pointer;">
              <option value="auto">Antigravity Auto Hardware Synthesis (Offline Ready)</option>
              <option value="gemini">Google Gemini (Flash / Pro)</option>
              <option value="groq">Groq Cloud (Llama 3.3 70B)</option>
              <option value="openrouter">OpenRouter (Multi-Model)</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:500; color:#a0a0a0; margin-bottom:6px;">Custom API Key (Optional)</label>
            <input type="password" id="setting-key-input" placeholder="gsk_... or AIzaSy... (leave blank for default)" style="width:100%; background:#1a1a1a; border:1px solid #333333; border-radius:8px; padding:10px 12px; color:#ffffff; font-size:13px; outline:none; box-sizing:border-box;">
            <p style="font-size:11px; color:#666666; margin:6px 0 0 0;">Saved in this browser. Your key is sent to the selected AI provider for requests.</p>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
            <button style="padding:8px 16px; border-radius:8px; background:#1a1a1a; border:1px solid #333333; color:#a0a0a0; font-size:13px; cursor:pointer;" onclick="window.omniLabStudio.closeSettingsModal()">Cancel</button>
            <button style="padding:8px 18px; border-radius:8px; background:#3b82f6; border:none; color:#ffffff; font-size:13px; font-weight:500; cursor:pointer;" onclick="window.omniLabStudio.saveSettings()">Save Configuration</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Focus input
  setTimeout(() => {
    const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | null;
    input?.focus();
  }, 100);
}

function renderHistoryItemsHTML(): string {
  const q = historySearchQuery.trim().toLowerCase();
  
  // Separate into Project Laboratories and General Conversations
  const projectSessions = chatSessions.filter(s => !!s.projectId);
  const generalSessions = chatSessions.filter(s => !s.projectId);

  let filteredProjects = projectSessions;
  let filteredGeneral = generalSessions;

  if (q) {
    filteredProjects = filteredProjects.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.messages.some(m => m.content.toLowerCase().includes(q))
    );
    filteredGeneral = filteredGeneral.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }

  // Keep recent conversations at the top, with pinned items taking priority.
  filteredGeneral.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
  filteredProjects.sort((a, b) => b.updatedAt - a.updatedAt);

  const isSearching = q.length > 0;
  const visibleProjectSessions = isSearching || showAllProjectSessions
    ? filteredProjects
    : filteredProjects.slice(0, 5);
  const activeProjectSession = filteredProjects.find(s => s.id === activeSessionId);
  if (!isSearching && !showAllProjectSessions && activeProjectSession && !visibleProjectSessions.includes(activeProjectSession)) {
    visibleProjectSessions[visibleProjectSessions.length - 1] = activeProjectSession;
  }
  const hasMoreProjects = !isSearching && filteredProjects.length > 5;

  const htmlChunks: string[] = [];

  // Put normal conversations first so the studio reads like a familiar chatbot.
  htmlChunks.push(`
    <div class="studio-sidebar-section">
      <div class="studio-sidebar-section-header studio-sidebar-section-heading" style="display:flex; align-items:center; justify-content:space-between; padding:6px 6px 3px 6px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="studio-section-mark" aria-hidden="true">C</span>
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#9aa0a6;">Recent chats</span>
        </div>
        <span class="studio-count">${filteredGeneral.length}</span>
      </div>
      <div class="space-y-0.5" style="display:flex; flex-direction:column; gap:2px;">
        ${filteredGeneral.length === 0 ? `
          <div class="studio-sidebar-empty">No chats yet. Start one above.</div>
        ` : filteredGeneral.map(s => renderSessionItemHTML(s)).join('')}
      </div>
    </div>
  `);

  // Keep project labs compact, with an explicit way to browse the full list.
  htmlChunks.push(`
    <div class="studio-sidebar-section studio-projects-section" style="margin-top:18px;">
      <div class="studio-sidebar-section-header studio-sidebar-section-heading" style="display:flex; align-items:center; justify-content:space-between; padding:6px 6px 3px 6px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="studio-section-mark" aria-hidden="true">P</span>
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#9aa0a6;">Project labs</span>
        </div>
        <span class="studio-count">${filteredProjects.length}</span>
      </div>
      <div class="space-y-0.5" style="display:flex; flex-direction:column; gap:2px;">
        ${visibleProjectSessions.length === 0 ? `
          <div class="studio-sidebar-empty">${isSearching ? 'No matching projects' : 'No project labs yet'}</div>
        ` : visibleProjectSessions.map(s => renderProjectSessionItemHTML(s)).join('')}
      </div>
      ${hasMoreProjects ? `<button class="studio-show-more" onclick="window.omniLabStudio.toggleProjectSessions()">${showAllProjectSessions ? 'Show fewer' : `Show all ${filteredProjects.length} projects`}<span aria-hidden="true">${showAllProjectSessions ? '−' : '+'}</span></button>` : ''}
    </div>
  `);

  return htmlChunks.join('');
}

function renderProjectSessionItemHTML(s: ChatSession): string {
  const isActive = s.id === activeSessionId;
  const isESP = s.targetBoard === 'ESP32';
  const boardColor = isESP ? '#38bdf8' : '#34d399';
  const boardBg = isESP ? 'rgba(56, 189, 248, 0.12)' : 'rgba(52, 211, 153, 0.12)';

  return `
    <div 
      class="studio-chat-session-item group ${isActive ? 'active' : ''}" 
      onclick="window.omniLabStudio.switchSession('${s.id}')"
      title="${escapeForAttr(s.title)}"
    >
      <div class="flex items-center space-x-2 min-w-0 flex-1" style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
        <span class="studio-session-mark" aria-hidden="true">•</span>
        <span class="truncate ${isActive ? 'text-white font-medium' : 'text-[#bdc1c6]'}" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px;">
          ${escapeHtml(s.title)}
        </span>
      </div>

      <div class="flex items-center space-x-1 shrink-0" style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
        <span style="font-size:9px; padding:1px 6px; border-radius:4px; font-family:monospace; font-weight:600; color:${boardColor}; background:${boardBg}; border:1px solid ${boardColor}33;">
          ${s.targetBoard === 'ESP32' ? 'ESP32' : 'Uno'}
        </span>
      </div>
    </div>
  `;
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
        <span class="studio-session-mark" aria-hidden="true">${s.pinned ? '★' : '•'}</span>
        <span class="truncate ${isActive ? 'text-white font-medium' : 'text-[#bdc1c6]'}" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px;">
          ${escapeHtml(s.title || 'New chat')}
        </span>
      </div>

      <div class="flex items-center space-x-1 shrink-0" style="display:flex; align-items:center; gap:2px; flex-shrink:0;">
        <span class="text-[9px] px-1 py-0.2 rounded bg-[#1e1f20] text-[#80868b] border border-white/5 font-mono group-hover:hidden ${isActive ? 'hidden' : ''}">
          ${msgCount > 0 ? `${msgCount}` : boardTag}
        </span>
        <div class="chat-actions">
          <button class="studio-chat-action-btn" onclick="window.omniLabStudio.togglePinSession('${s.id}', event)" title="${s.pinned ? 'Unpin' : 'Pin to top'}">
            ${s.pinned ? '★' : '☆'}
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
      <div class="w-full flex-1 flex flex-col items-center justify-center text-center my-auto py-10" style="width:100%; flex:1 1 0%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; margin:auto 0; padding:40px 16px;">
        <!-- Animated Sparkle Icon -->
        <div style="width:52px; height:52px; border-radius:16px; background:rgba(59, 130, 246, 0.1); border:1px solid rgba(59, 130, 246, 0.25); display:flex; align-items:center; justify-content:center; margin-bottom:18px; color:#60a5fa;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
          </svg>
        </div>

        <h1 style="font-size:30px; font-weight:600; color:#ffffff; letter-spacing:-0.02em; margin:0 0 6px 0; font-family:'Google Sans', sans-serif;">The Innovation Hub</h1>
        <p style="font-size:14px; color:#a0a0a0; max-width:520px; margin:0 auto 28px auto; line-height:1.5;">
          AI Hardware Engineering Assistant • Ask about circuits, pinouts, C++ firmware, or troubleshoot hardware issues.
        </p>

        <!-- 4 Hardware Engineering Suggestion Cards (2x2 Grid) -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; width:100%; max-width:680px; text-align:left;">
          
          <!-- Card 1: ESP32 Pinout -->
          <div 
            style="background:#18181b; hover:background:#27272a; border:1px solid #27272a; border-radius:12px; padding:16px; cursor:pointer; transition:all 0.15s ease;"
            onclick="window.omniLabStudio.selectStarter('Explain the ESP32 GPIO pinout, 3.3V logic levels, and which pins to avoid for analog reads', true)"
          >
            <div class="studio-prompt-mark" aria-hidden="true">01</div>
            <div style="font-size:13px; font-weight:600; color:#ffffff; margin-bottom:4px;">Explain ESP32 GPIO Pinout</div>
            <div style="font-size:12px; color:#a0a0a0; line-height:1.4;">Pins to avoid, ADC2 Wi-Fi conflict, and 3.3V logic constraints.</div>
          </div>

          <!-- Card 2: Servo Sweep -->
          <div 
            style="background:#18181b; border:1px solid #27272a; border-radius:12px; padding:16px; cursor:pointer; transition:all 0.15s ease;"
            onclick="window.omniLabStudio.selectStarter('Write an Arduino C++ sketch to sweep an SG90 servo from 0 to 180 degrees using non-blocking millis()', true)"
          >
            <div class="studio-prompt-mark" aria-hidden="true">02</div>
            <div style="font-size:13px; font-weight:600; color:#ffffff; margin-bottom:4px;">Write Servo Sweep Sketch</div>
            <div style="font-size:12px; color:#a0a0a0; line-height:1.4;">Non-blocking C++ code for SG90 servo with smooth motion.</div>
          </div>

          <!-- Card 3: MCU Comparison -->
          <div 
            style="background:#18181b; border:1px solid #27272a; border-radius:12px; padding:16px; cursor:pointer; transition:all 0.15s ease;"
            onclick="window.omniLabStudio.selectStarter('What is the difference between ESP32 and Arduino Uno for beginner robotics?', true)"
          >
            <div class="studio-prompt-mark" aria-hidden="true">03</div>
            <div style="font-size:13px; font-weight:600; color:#ffffff; margin-bottom:4px;">ESP32 vs. Arduino Uno</div>
            <div style="font-size:12px; color:#a0a0a0; line-height:1.4;">Compare clock speeds, 5V vs 3.3V, memory, and Wi-Fi features.</div>
          </div>

          <!-- Card 4: I2C OLED Debugging -->
          <div 
            style="background:#18181b; border:1px solid #27272a; border-radius:12px; padding:16px; cursor:pointer; transition:all 0.15s ease;"
            onclick="window.omniLabStudio.selectStarter('Why is my 0.96 inch I2C OLED display showing a blank black screen? How do I troubleshoot it?', true)"
          >
            <div class="studio-prompt-mark" aria-hidden="true">04</div>
            <div style="font-size:13px; font-weight:600; color:#ffffff; margin-bottom:4px;">Debug I2C OLED Display</div>
            <div style="font-size:12px; color:#a0a0a0; line-height:1.4;">Fix black screens, I2C address scanning, and pull-up resistors.</div>
          </div>

        </div>
      </div>
    `;
  }

  // Render Conversational Thread
  return `
    <div class="w-full max-w-3xl mx-auto flex flex-col space-y-6 pt-4" style="width:100%; max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:20px; padding-top:16px;">
      ${msgs.map(msg => renderSingleMessageHTML(msg)).join('')}
    </div>
  `;
}

function renderSingleMessageHTML(msg: StudioMessage): string {
  const currentUser = authService.getCurrentUser();
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  const userTitle = currentUser ? currentUser.name : 'You';

  if (msg.role === 'user') {
    return `
      <div class="chat-row user-row" style="display:flex; justify-content:flex-end; align-items:flex-start; gap:10px; margin:6px 0;">
        <div class="chat-bubble user-bubble" style="background:#1e3a5f; color:#ffffff; border:1px solid rgba(59, 130, 246, 0.3); border-radius:18px 18px 4px 18px; padding:12px 18px; max-width:80%; font-size:14px; line-height:1.55; box-shadow:0 4px 12px rgba(0,0,0,0.25);">
          <div style="white-space:pre-wrap; word-break:break-word;">${escapeHtml(msg.content)}</div>
        </div>
        <div style="width:32px; height:32px; border-radius:50%; background:#2563eb; color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex-shrink:0; box-shadow:0 2px 6px rgba(37,99,235,0.4);" title="${userTitle}">
          ${userInitial}
        </div>
      </div>
    `;
  }

  // Assistant Response: LIVE SYNTHESIS LOADING STATE
  if (msg.isStreaming) {
    if (msg.isChatThinking) {
      return `
        <div class="chat-row assistant-row" style="display:flex; justify-content:flex-start; align-items:flex-start; gap:12px; margin:8px 0;">
          <div style="width:32px; height:32px; border-radius:50%; background:#1e293b; color:#60a5fa; border:1px solid rgba(96,165,250,0.25); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
            </svg>
          </div>
          <div class="chat-bubble assistant-bubble" style="background:#18181b; border:1px solid #27272a; border-radius:18px 18px 18px 4px; padding:12px 18px; font-size:13px; color:#a0a0a0;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="thinking-spinner" style="color:#60a5fa;">•••</span>
              <span>${escapeHtml(msg.synthesisStatus || 'Consulting hardware engineering knowledge base...')}</span>
              <span id="synthesis-timer-${msg.id}" style="font-size:11px; color:#6b7280; margin-left:6px;">⏱ ${msg.thoughtDuration || '0.4s'}</span>
            </div>
          </div>
        </div>
      `;
    }

    const pct = msg.progressPct || 20;
    const statusText = msg.synthesisStatus || 'Synthesizing Hardware Architecture & Power Budget...';
    const timerText = msg.thoughtDuration || '0.4s';

    return `
      <div class="chat-row assistant-row" style="display:flex; justify-content:flex-start; align-items:flex-start; gap:12px; margin:8px 0;">
        <div style="width:32px; height:32px; border-radius:50%; background:#1e293b; color:#60a5fa; border:1px solid rgba(96,165,250,0.25); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
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
    <div class="chat-row assistant-row" style="display:flex; justify-content:flex-start; align-items:flex-start; gap:12px; margin:8px 0;">
      <div style="width:32px; height:32px; border-radius:50%; background:#1e293b; color:#60a5fa; border:1px solid rgba(96,165,250,0.25); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
        </svg>
      </div>

      <div class="chat-bubble assistant-bubble" style="flex:1; min-width:0; background:transparent; padding:0; border:none;">
        <!-- Antigravity Reasoning Accordion (Extended Thinking) -->
        ${msg.reasoningSteps && msg.reasoningSteps.length > 0 ? `
          <div class="ai-thought-accordion" id="thought-${msg.id}">
            <div class="thought-header" onclick="window.omniLabStudio.toggleThought('${msg.id}')">
              <div class="thought-pulse-indicator">
                <span class="thought-sparkle">•</span>
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
            <div class="suggestions-label">Suggested next steps</div>
            <div class="suggestions-chips-wrap">
              ${msg.suggestions.map(s => `
                <button class="suggestion-chip" onclick="window.omniLabStudio.selectStarter('${escapeForAttr(s.prompt)}')">
                  <span class="chip-spark" aria-hidden="true">›</span>
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
      <span class="step-icon-active">•</span>
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
  return stripStudioEmoji(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripStudioEmoji(value: string): string {
  return value.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '');
}

function escapeForAttr(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function formatMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';

  const codeBlocks: string[] = [];
  let text = stripStudioEmoji(markdown).replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
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
  text = text.replace(/\[(?:⚡\s*)?(?:Build|Synthesize)(?: Idea)?:?\s*([^\]]+)\]/gi, (_, projName) => {
    const clean = projName.trim();
    return `<button class="inline-build-btn" onclick="window.omniLabStudio.selectStarter('Build ${escapeForAttr(clean)}')">Build ${escapeHtml(clean)}</button>`;
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
      inspectActiveProject: () => void;
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
      toggleProjectSessions: () => void;
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
      const projectContext = currentSession.projectId
        ? (projectsData.find(p => p.id === currentSession.projectId) || PROJECTS_DATA.find(p => p.id === currentSession.projectId) || getStudioProjectById(currentSession.projectId))
        : undefined;

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
      if (!currentSession.projectId && (currentSession.title === 'New chat' || currentSession.title === 'Untitled architecture' || currentSession.title === 'Untitled prompt' || currentSession.messages.length <= 2)) {
        currentSession.title = prompt.length > 38 ? prompt.slice(0, 38) + '...' : prompt;
        const titleEl = document.getElementById('studio-active-title');
        if (titleEl) titleEl.textContent = currentSession.title;
        const historyList = document.getElementById('ai-studio-history-list');
        if (historyList) historyList.innerHTML = renderHistoryItemsHTML();
      }
      currentSession.updatedAt = Date.now();

      // Clear input
      if (input) {
        input.value = '';
        input.style.height = 'auto';
      }

      const intent = detectPromptIntent(prompt, !!projectContext);

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
          synthesisStatus: projectContext ? `Consulting ${projectContext.title} Hardware Specs...` : 'Consulting Hardware Engineering Knowledge Base...'
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
            .slice(0, -1)
            .map(m => ({ role: m.role, content: m.content }));

          const chatRes = await generateAIChatResponse(prompt, history, projectContext);
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
          const historyList = document.getElementById('ai-studio-history-list');
          if (historyList) historyList.innerHTML = renderHistoryItemsHTML();
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

        // Save strictly to active user's account repository
        const activeUser = authService.getCurrentUser();
        authService.saveUserProject(newProject, activeUser?.id);

        if (!projectsData.some(p => p.id === newProject.id)) {
          projectsData.unshift(newProject);
        }
        state.bookmarkedIds.add(newProject.id);
        localStorage.setItem('lab_bookmarks', JSON.stringify([...state.bookmarkedIds]));
        onProjectsUpdated();

        // Persist session architecture for active user
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
      const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | HTMLInputElement | null;
      if (input) {
        input.value = '';
        input.style.height = 'auto';
        input.focus();
        window.omniLabStudio.updateTokenCount();
      }
    },

    selectStarter: (prompt: string, autoRun = false) => {
      const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | HTMLInputElement | null;
      if (input) {
        input.value = prompt;
        if (input instanceof HTMLTextAreaElement) {
          window.omniLabStudio.autoResizeTextarea(input);
        }
        input.focus();
        window.omniLabStudio.updateTokenCount();
      }
      if (autoRun) {
        window.omniLabStudio.handleSend();
      }
    },

    insertPill: (pillText: string) => {
      const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | HTMLInputElement | null;
      if (input) {
        const val = input.value.trim();
        input.value = val ? `${val}, with ${pillText}` : `Build a project using ${pillText}`;
        if (input instanceof HTMLTextAreaElement) {
          window.omniLabStudio.autoResizeTextarea(input);
        }
        input.focus();
        window.omniLabStudio.updateTokenCount();
      }
    },

    updateTokenCount: () => {
      const input = document.getElementById('ai-studio-input') as HTMLTextAreaElement | HTMLInputElement | null;
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
        const headerMount = document.getElementById('studio-workspace-header-mount');
        if (headerMount) {
          headerMount.innerHTML = renderWorkspaceHeaderHTML();
        }
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
      if ((window as any).innovationHubAuth) {
        (window as any).innovationHubAuth.openAuthModal('profile');
      } else {
        showToast('The Innovation Hub • Hardware Engineering Workspace');
      }
    },

    triggerRealtimeStream: () => {
      window.omniLabStudio.selectStarter('ESP32 Realtime WebSocket Telemetry with MPU6050 6-Axis IMU and live browser graph', true);
    },

    copyLatestCode: () => {
      const current = getActiveSession();
      const p = current.projectId
        ? (projectsData.find(item => item.id === current.projectId) || PROJECTS_DATA.find(item => item.id === current.projectId) || getStudioProjectById(current.projectId))
        : (current.messages.find(m => m.project)?.project || getAllStudioProjects()[0] || projectsData[0]);
      if (p?.code) {
        navigator.clipboard.writeText(p.code);
        showToast(`Copied ${p.title} C++ firmware to clipboard!`);
      } else {
        showToast('Firmware code not found for this project');
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

    toggleProjectSessions: () => {
      showAllProjectSessions = !showAllProjectSessions;
      const historyList = document.getElementById('ai-studio-history-list');
      if (historyList) historyList.innerHTML = renderHistoryItemsHTML();
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
        title: 'New chat',
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

      const headerMount = document.getElementById('studio-workspace-header-mount');
      if (headerMount) {
        headerMount.innerHTML = renderWorkspaceHeaderHTML();
      }
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

      const headerMount = document.getElementById('studio-workspace-header-mount');
      if (headerMount) {
        headerMount.innerHTML = renderWorkspaceHeaderHTML();
      }
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
        const headerMount = document.getElementById('studio-workspace-header-mount');
        if (headerMount) {
          headerMount.innerHTML = renderWorkspaceHeaderHTML();
        }
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

      // Protect project laboratory sessions from deletion
      if (session.projectId) {
        if (!confirm(`Clear conversation history for "${session.title}" laboratory? (The project workbench will remain accessible)`)) return;
        session.messages = [
          {
            id: 'msg-welcome-' + session.projectId,
            role: 'assistant',
            content: `### **${session.title}** Engineering Laboratory\n\nWorkbench reset. How can I help you with this project today? Feel free to ask about wiring, code logic, or troubleshooting!`,
            timestamp: 'Just now',
            suggestions: [
              { label: 'Explain wiring', prompt: 'Explain the wiring connections and pin assignments for this circuit' },
              { label: 'Explain C++ code', prompt: 'Explain how the firmware code works step-by-step' },
              { label: 'Power & voltage', prompt: 'What are the power supply and voltage requirements?' },
              { label: 'Troubleshooting tips', prompt: 'What are common issues and troubleshooting tips for this build?' }
            ]
          }
        ];
        if (activeSessionId === sessionId) {
          studioMessages = session.messages;
          const stream = document.getElementById('ai-studio-chat-stream');
          if (stream) stream.innerHTML = renderChatStreamHTML();
        }
        saveStudioState();
        showToast('Cleared project laboratory history');
        return;
      }

      if (!confirm(`Delete architecture "${session.title}"?`)) return;

      chatSessions = chatSessions.filter(s => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (chatSessions.length > 0) {
          activeSessionId = chatSessions[0].id;
          studioMessages = chatSessions[0].messages;
        } else {
          const fallback: ChatSession = {
            id: 'session-' + Date.now(),
            title: 'New chat',
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
        const headerMount = document.getElementById('studio-workspace-header-mount');
        if (headerMount) headerMount.innerHTML = renderWorkspaceHeaderHTML();
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
      showToast(session.pinned ? 'Pinned chat to top' : 'Unpinned chat');
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

    inspectActiveProject: () => {
      const active = getActiveSession();
      if (active.projectId) {
        window.omniLabStudio.inspectProject(active.projectId);
      } else {
        const foundProject = active.messages.find(m => m.project)?.project;
        if (foundProject) {
          window.omniLabStudio.inspectProject(foundProject.id);
        } else {
          showToast('No project attached to this chat session');
        }
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
