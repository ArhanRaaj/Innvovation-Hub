import React from 'react';
import { createRoot, Root } from 'react-dom/client';
// @ts-ignore
import AeroShards from './AeroShards.jsx';
// @ts-ignore
import PromptBar from './PromptBar.jsx';
// @ts-ignore
import SpringCheck from './SpringCheck.jsx';
// @ts-ignore
import ElectricBorder from './ElectricBorder.jsx';
// @ts-ignore
import ThoughtLine from './ThoughtLine.jsx';

import { SparklesIcon, File02Icon, ChartLineData01Icon, Globe02Icon } from '@hugeicons/core-free-icons';

// Mount AeroShards as full-page dynamic background
export function initAeroShardsBackground(): void {
  const mountEl = document.getElementById('aero-shards-bg');
  if (!mountEl) return;

  try {
    const root = createRoot(mountEl);
    root.render(
      <AeroShards
        shardColor="#896ABD"
        accentColor="#A855F7"
        placement="full"
        material="glass"
        markers="none"
        count={260}
        depthOfField={0.45}
        vignette={0.25}
        dpr={1}
        mouseInteraction={true}
        pulseOnClick={true}
        holdToGather={true}
        onError={(err: any) => {
          console.warn('WebGPU not active or fallback engaged:', err);
          mountEl.style.display = 'none';
        }}
      />
    );
  } catch (err) {
    console.warn('Could not initialize AeroShards background:', err);
  }
}

// Mount Hero PromptBar
export function initHeroPromptBar(): void {
  const mountEl = document.getElementById('hero-promptbar-mount');
  if (!mountEl) return;

  const sources = [
    { key: 'uno', name: 'Arduino Uno R3', description: 'ATmega328P 16MHz Microcontroller', icon: File02Icon },
    { key: 'esp32', name: 'ESP32 Wi-Fi & BLE', description: 'Dual-core 240MHz IoT SoC', icon: Globe02Icon },
    { key: 'sensors', name: 'Sensor Suite', description: 'Ultrasonic, IMU, DHT22, PIR, Soil, Gas', icon: SparklesIcon },
    { key: 'actuators', name: 'Motors & Relays', description: 'Servos, DC Drivers, Relays, Pumps', icon: ChartLineData01Icon }
  ];

  const commands = [
    { key: 'robot', name: '/robot', description: 'Generate autonomous robotics project' },
    { key: 'iot', name: '/iot', description: 'Generate cloud IoT telemetry project' },
    { key: 'solar', name: '/solar', description: 'Generate solar energy & tracking project' },
    { key: 'firmware', name: '/firmware', description: 'Generate custom Arduino C++ code only' }
  ];

  const models = [
    { key: 'groq', name: 'Groq Llama 3.3', tag: 'Ultra Fast' },
    { key: 'gemini', name: 'Gemini 2.5 Flash', tag: 'Multimodal' },
    { key: 'openrouter', name: 'DeepSeek R1', tag: 'Deep Reasoning' }
  ];

  const root = createRoot(mountEl);

  function handleSend(text: string, _meta?: any): void {
    if (window.omniLab && window.omniLab.submitHeroAIPrompt) {
      window.omniLab.submitHeroAIPrompt(text);
    }
  }

  root.render(
    <PromptBar
      placeholder="Ask AI Architect: 'Build a solar tracking robot with 2 servos' or 'Gesture rover'..."
      sources={sources}
      commands={commands}
      models={models}
      defaultModel="groq"
      efforts={['Low', 'Medium', 'High', 'Extra', 'Max']}
      defaultEffort="High"
      onSend={handleSend}
      background="rgba(19, 10, 38, 0.85)"
      color="#f5f5f5"
      menuBackground="#22103f"
      sparkColor="#c084fc"
      sparkBoost={1.2}
      width={720}
      radius={16}
    />
  );
}

// Mount AI Architect Modal PromptBar
export function initModalPromptBar(): void {
  const mountEl = document.getElementById('ai-modal-promptbar-mount');
  if (!mountEl) return;

  const sources = [
    { key: 'sensors', name: 'Sensor Catalog', description: 'PIR, Ultrasonic, Soil, IMU, DHT', icon: SparklesIcon },
    { key: 'displays', name: 'Display Modules', description: 'OLED SSD1306, LCD 1602 I2C', icon: Globe02Icon },
    { key: 'actuators', name: 'Actuators', description: 'SG90 Servo, Relays, Stepper, Pump', icon: ChartLineData01Icon }
  ];

  const commands = [
    { key: 'circuit', name: '/circuit', description: 'Synthesize breadboard wiring diagram' },
    { key: 'bom', name: '/bom', description: 'Generate bill of materials table' },
    { key: 'code', name: '/code', description: 'Generate production Arduino C++ firmware' }
  ];

  const models = [
    { key: 'groq', name: 'Groq Llama 3.3', tag: 'Fastest' },
    { key: 'gemini', name: 'Gemini 2.5 Flash', tag: 'Multimodal' },
    { key: 'openrouter', name: 'DeepSeek R1', tag: 'Reasoning' }
  ];

  const root = createRoot(mountEl);

  function handleSend(text: string): void {
    const textarea = document.getElementById('ai-architect-textarea') as HTMLTextAreaElement | null;
    if (textarea) textarea.value = text;
    if (window.omniLab && window.omniLab.generateProjectFromModal) {
      window.omniLab.generateProjectFromModal();
    }
  }

  root.render(
    <PromptBar
      placeholder="Describe the robotics or science project you want to build..."
      sources={sources}
      commands={commands}
      models={models}
      defaultModel="groq"
      efforts={['Fast', 'Balanced', 'Deep', 'Max Effort']}
      defaultEffort="Max Effort"
      onSend={handleSend}
      background="rgba(24, 12, 48, 0.9)"
      color="#ffffff"
      menuBackground="#2b1452"
      sparkColor="#c084fc"
      sparkBoost={1.3}
      width={760}
      radius={16}
    />
  );
}

// Mount ThoughtLine during generation
let thoughtLineRoot: Root | null = null;
export function setGenerationThoughtLine(working: boolean, steps: string[] = []): void {
  const mountEl = document.getElementById('ai-thoughtline-mount');
  if (!mountEl) return;

  if (!thoughtLineRoot) {
    thoughtLineRoot = createRoot(mountEl);
  }

  thoughtLineRoot.render(
    <ThoughtLine
      working={working}
      steps={steps}
      label="AI Synthesizing Circuit & Firmware…"
      doneLabel="Generated in"
      fontSize={14}
      collapsible={true}
      showTimer={true}
    />
  );
}

// Helper to mount interactive SpringCheck anywhere
export interface SpringCheckOptions {
  label: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  color?: string;
}

export function mountSpringCheck(targetElement: HTMLElement, { label, defaultChecked = false, onChange, color = '#c084fc' }: SpringCheckOptions): Root | undefined {
  if (!targetElement) return;
  const root = createRoot(targetElement);
  root.render(
    <SpringCheck
      label={label}
      defaultChecked={defaultChecked}
      onChange={onChange}
      color="#ffffff"
      fillColor={color}
      checkColor="#0b0718"
      boxSize={24}
      boxRadius={7}
      fontSize={14}
      bounce={0.25}
    />
  );
  return root;
}

// Helper to wrap element in ElectricBorder
export interface ElectricBorderOptions {
  color?: string;
  glowColor?: string;
  speed?: number;
  chaos?: number;
  spread?: number;
  strands?: number;
  thickness?: number;
  borderRadius?: number;
}

export function mountElectricBorder(targetElement: HTMLElement, content: React.ReactNode, options: ElectricBorderOptions = {}): Root | undefined {
  if (!targetElement) return;
  const root = createRoot(targetElement);
  root.render(
    <ElectricBorder
      color={options.color || '#a855f7'}
      glowColor={options.glowColor || '#c084fc'}
      speed={options.speed || 1}
      chaos={options.chaos || 0.4}
      spread={options.spread || 0.5}
      strands={options.strands || 3}
      thickness={options.thickness || 1.6}
      borderRadius={options.borderRadius || 16}
    >
      {content}
    </ElectricBorder>
  );
  return root;
}
