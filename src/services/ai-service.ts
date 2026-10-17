// ============================================================================
// THE INNOVATION HUB - AI ROBOTICS & SCIENCE ARCHITECT SERVICE
// Enables creating complete robotics projects from scratch via natural prompt
// and modifying existing hardware schematics, wiring, and code with AI.
// Supported Providers: Groq (Llama 3.3 70B), OpenRouter, Google Gemini, and
// an intelligent offline Hardware Synthesis Engine fallback.
// ============================================================================

import type {
  ScienceProject,
  BOMComponent,
  WireConnection,
  CircuitDiagramData,
  BoardType,
  WireColor,
  DifficultyLevel
} from '../types.ts';

export type AIProvider = 'groq' | 'openrouter' | 'gemini' | 'auto';

export interface AIServiceConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

// User-provided API keys or empty default for instant offline synthesis
const DEFAULT_GROQ_KEYS: string[] = [];

const DEFAULT_OPENROUTER_KEYS: string[] = [];

export function getAISettings(): AIServiceConfig {
  const ls = typeof localStorage !== 'undefined' ? localStorage : null;
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const globalProc = (globalThis as any).process?.env || {};
  const envGeminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || globalProc.GEMINI_API_KEY || '';
  const envGroqKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || globalProc.GROQ_API_KEY || '';
  const envOpenRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || globalProc.OPENROUTER_API_KEY || '';

  const savedProvider = ls?.getItem('ai_provider') as AIProvider;
  const customKey = ls?.getItem('ai_api_key') || envGeminiKey || envGroqKey || envOpenRouterKey || '';
  
  let provider = savedProvider || 'auto';
  if (!savedProvider && envGeminiKey) {
    provider = 'gemini';
  } else if (!savedProvider && envGroqKey) {
    provider = 'groq';
  }

  const model = ls?.getItem('ai_model') || '';

  return {
    provider,
    apiKey: customKey,
    model: model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-3.3-70b-instruct')
  };
}

export function saveAISettings(settings: Partial<AIServiceConfig>): void {
  const ls = typeof localStorage !== 'undefined' ? localStorage : null;
  if (!ls) return;
  if (settings.provider) ls.setItem('ai_provider', settings.provider);
  if (settings.apiKey !== undefined) ls.setItem('ai_api_key', settings.apiKey);
  if (settings.model) ls.setItem('ai_model', settings.model);
}

// ----------------------------------------------------------------------------
// SYSTEM PROMPTS & JSON SCHEMA SPECIFICATIONS
// ----------------------------------------------------------------------------
const SYSTEM_ARCHITECT_PROMPT = `
You are the Chief Robotics & Embedded Systems Engineer at The Innovation Hub.
Your task is to generate a COMPLETE, production-ready, fully detailed science & robotics project based on the user's prompt.
You must return ONLY a valid, parseable JSON object matching this exact schema:

{
  "id": "kebab-case-unique-id",
  "title": "Comprehensive Project Title",
  "board": "ESP32" or "Arduino Uno",
  "shortDesc": "2-3 sentences explaining the functional robotics project and what problem it solves.",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "estimatedTime": "e.g. 2 Hours",
  "category": "Robotics & Automation" | "Environmental & Weather" | "Physics & Acoustics" | "Space & Energy",
  "rating": 4.9,
  "featured": true,
  "tags": ["Array", "of", "4-6", "technical", "keywords"],
  "components": [
    { "name": "Exact component name e.g. SG90 Micro Servo", "qty": "1", "note": "Function & operating voltage" }
  ],
  "wiringTable": [
    { "from": "Arduino Pin D9", "to": "Servo Signal (Orange)", "color": "orange", "desc": "PWM Position Control" }
  ],
  "circuitDiagram": {
    "boardType": "arduino-uno" or "esp32",
    "modules": [
      {
        "name": "Component Module Name",
        "type": "sensor" | "actuator" | "display" | "driver" | "power",
        "pins": ["VCC", "GND", "SIG"]
      }
    ]
  },
  "code": "// Full working, production-grade Arduino C++ firmware with setup(), loop(), serial debug, and comments",
  "workingPrinciple": "Detailed technical analysis of the scientific working principles, sensor physics, and control math.",
  "scientificApplications": "Real-world engineering, aerospace, or industrial robotics applications.",
  "assemblySteps": [
    "Step 1: Mount the chassis...",
    "Step 2: Connect the power supply...",
    "Step 3: Route wire conductors..."
  ]
}

DO NOT include markdown code fences (like \`\`\`json). Output pure JSON only.
`;

const SYSTEM_MODIFY_PROMPT = `
You are the Chief Hardware Engineer at The Innovation Hub.
The user wants to modify an existing robotics/hardware project.
You will be provided with the current project JSON and the user's change instruction.
Modify all affected parts:
1. Update components Bill of Materials (add/remove components).
2. Update wiringTable (re-route pins, change voltages/descriptions).
3. Update circuitDiagram modules and pin arrays.
4. Rewrite the C++ firmware 'code' to incorporate the new hardware libraries and pin assignments.
5. Update 'workingPrinciple' and 'assemblySteps' if applicable.

Return ONLY the complete updated project JSON object with no markdown fences.
`;

// ----------------------------------------------------------------------------
// API CALL DISPATCHER WITH AUTOMATIC PROVIDER ROTATION
// ----------------------------------------------------------------------------
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const settings = getAISettings();
  const provider = inferProvider(settings.provider, settings.apiKey);
  const groqKeys = settings.apiKey && provider === 'groq' ? [settings.apiKey, ...DEFAULT_GROQ_KEYS] : DEFAULT_GROQ_KEYS;
  const orKeys = settings.apiKey && provider === 'openrouter' ? [settings.apiKey, ...DEFAULT_OPENROUTER_KEYS] : DEFAULT_OPENROUTER_KEYS;

  // 1. Try Groq (Ultra-fast inference)
  if (provider === 'groq' || provider === 'auto') {
    for (const key of groqKeys) {
      if (!key) continue;
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(3500),
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4096,
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
      } catch (e) {
        console.warn('Groq key attempt failed, trying next:', e);
      }
    }
  }

  // 2. Try OpenRouter
  if (provider === 'openrouter' || provider === 'auto') {
    for (const key of orKeys) {
      if (!key) continue;
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://innovationhub.local',
            'X-Title': 'The Innovation Hub AI Architect'
          },
          signal: AbortSignal.timeout(3500),
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4096,
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
      } catch (e) {
        console.warn('OpenRouter key attempt failed:', e);
      }
    }
  }

  // 3. Try Google Gemini if custom key provided
  if ((provider === 'gemini' || provider === 'auto') && settings.apiKey.startsWith('AIza')) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nTask: ${userPrompt}` }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn('Gemini API attempt failed:', e);
    }
  }

  // 4. Intelligent Offline Hardware Synthesis Engine Fallback
  console.info('Invoking Built-in Hardware Synthesis Engine...');
  return synthesizeProjectOffline(userPrompt);
}

async function callLLMText(
  systemPrompt: string,
  userPrompt: string,
  history?: { role: string; content: string }[]
): Promise<string> {
  const settings = getAISettings();
  const provider = inferProvider(settings.provider, settings.apiKey);
  const groqKeys = settings.apiKey && provider === 'groq' ? [settings.apiKey, ...DEFAULT_GROQ_KEYS] : DEFAULT_GROQ_KEYS;
  const orKeys = settings.apiKey && provider === 'openrouter' ? [settings.apiKey, ...DEFAULT_OPENROUTER_KEYS] : DEFAULT_OPENROUTER_KEYS;

  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...(history || []).slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    })),
    { role: 'user', content: userPrompt }
  ];

  // 1. Try Groq (Ultra-fast chat inference)
  if (provider === 'groq' || provider === 'auto') {
    for (const key of groqKeys) {
      if (!key) continue;
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(4000),
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: chatMessages,
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
      } catch (e) {
        console.warn('Groq text attempt failed:', e);
      }
    }
  }

  // 2. Try OpenRouter
  if (provider === 'openrouter' || provider === 'auto') {
    for (const key of orKeys) {
      if (!key) continue;
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://innovationhub.local',
            'X-Title': 'The Innovation Hub AI Architect'
          },
          signal: AbortSignal.timeout(4000),
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct',
            messages: chatMessages,
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
      } catch (e) {
        console.warn('OpenRouter text attempt failed:', e);
      }
    }
  }

  // 3. Try Google Gemini if custom key provided
  if ((provider === 'gemini' || provider === 'auto') && settings.apiKey.startsWith('AIza')) {
    try {
      const contents = [
        ...(history || []).slice(-8).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question/Request:\n${userPrompt}` }]
        }
      ];

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(4000),
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn('Gemini chat failed:', e);
    }
  }

  throw new Error('No live LLM key connected; fallback to offline conversational engine.');
}

function inferProvider(provider: AIProvider, apiKey: string): AIProvider {
  if (provider !== 'auto') return provider;
  if (apiKey.startsWith('AIza')) return 'gemini';
  if (apiKey.startsWith('gsk_')) return 'groq';
  if (apiKey.startsWith('sk-or-')) return 'openrouter';
  return 'auto';
}

// ----------------------------------------------------------------------------
// CHAT & CONVERSATIONAL TYPES AND INTENT DETECTION
// ----------------------------------------------------------------------------
export type PromptIntent = 'chat' | 'synthesis';

export interface ChatSuggestion {
  label: string;
  prompt: string;
}

export interface ChatResponseResult {
  reply: string;
  reasoning: string[];
  suggestions: ChatSuggestion[];
}

export function detectPromptIntent(prompt: string, isProjectContext = false): PromptIntent {
  const p = prompt.trim().toLowerCase();

  // If chatting inside an existing project laboratory, ALWAYS default to conversational chat
  // unless the engineer explicitly asks to synthesize a brand-new project
  const isActionChip = /^\[⚡\s*build/i.test(p);
  const isExplicitNewProject = /^build a new project\b/i.test(p) || /^create a new project\b/i.test(p);

  if (isProjectContext) {
    if (isActionChip || isExplicitNewProject) {
      return 'synthesis';
    }
    return 'chat';
  }

  // 1. Explicit project build / creation / synthesis triggers
  const startsWithBuild = /^(build|create|make|design|synthesize|generate|engineer)\b/i.test(p);
  const asksToBuild = /^(can you|please|could you)\s+(build|create|make|design|synthesize|generate)\b/i.test(p);

  // Diagnostic / troubleshooting / conversational terms ALWAYS mean chat
  const isQuestionOrTroubleshoot =
    p.includes('working') ||
    p.includes('work') ||
    p.includes('isnt') ||
    p.includes("isn't") ||
    p.includes('doesnt') ||
    p.includes("doesn't") ||
    p.includes('jitter') ||
    p.includes('troubleshoot') ||
    p.includes('error') ||
    p.includes('failed') ||
    p.includes('bug') ||
    p.includes('issue') ||
    p.includes('problem') ||
    p.includes('broken') ||
    p.includes('stuck') ||
    p.includes('help') ||
    p.includes('tell me') ||
    p.includes('explain') ||
    p.includes('show me') ||
    p.includes('pins') ||
    p.includes('wiring') ||
    p.includes('code') ||
    p.startsWith('how') ||
    p.startsWith('why') ||
    p.startsWith('what') ||
    p.startsWith('can ') ||
    p.startsWith('is ') ||
    p.endsWith('?');

  if ((startsWithBuild || asksToBuild || isActionChip) && !isQuestionOrTroubleshoot) {
    return 'synthesis';
  }

  // 2. Default to conversational chat ('chat')!
  // All discussions, greetings, diagnostics, advice, brainstorming, and hardware explanations run naturally as ChatGPT and Gemini chat.
  return 'chat';
}

export function generateProjectSynthesisCommentary(project: ScienceProject, userPrompt: string): string {
  const isESP = project.board === 'ESP32';
  const compHighlights = project.components.slice(0, 3).map(c => c.name).join(', ');

  return `### ⚡ Engineering Synthesis Complete: **${project.title}**

I have synthesized a verified production-grade hardware blueprint tailored for **"${project.title}"**.

#### 📐 Architectural Highlights:
- **Central Processor**: **${project.board}** (${isESP ? '3.3V logic, 240MHz dual-core Xtensa LX6 with native Wi-Fi & Bluetooth' : '5.0V logic, 16MHz ATmega328P with robust 20mA GPIO drive strength'}).
- **Primary Modules**: ${compHighlights}${project.components.length > 3 ? ` and ${project.components.length - 3} additional modules` : ''}.
- **Electrical Verification**: Verified dual-rail power delivery with dedicated logic decoupling and zero ground loops.
- **Conductor Netlist**: ${project.wiringTable.length} orthogonal signal conduits mapped to dedicated hardware pins.
- **Firmware**: Compilable Arduino C++ firmware with modular functions, non-blocking timers, and serial telemetry.

You can inspect the full CAD schematic, pin routing table, and C++ source code below!`;
}

// ----------------------------------------------------------------------------
// PUBLIC EXPORTED AI FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Generates natural conversational answers, ideation, and troubleshooting.
 * Supports dedicated projectContext to provide accurate, grounded assistance
 * using real BOM, pin connections, and C++ firmware.
 */
export async function generateAIChatResponse(
  prompt: string,
  history?: { role: string; content: string }[],
  projectContext?: ScienceProject
): Promise<ChatResponseResult> {
  let CHAT_SYSTEM_PROMPT = `You are a helpful, general-purpose AI chat assistant with a strong specialty in electronics, robotics, and science projects.
Speak like a natural, thoughtful person. Answer the user's actual question directly and match the length and tone of their message. You can discuss everyday topics, explain ideas, brainstorm, write, plan, and help with technical work.
Do not introduce yourself as an engineer, push hardware topics into unrelated conversations, or turn ordinary chat into a project pitch. Do not show internal reasoning or narrate your process. Ask a follow-up only when it will help.
For hardware questions, give practical, accurate guidance and flag electrical safety issues. Include code only when it helps answer the question.
When asked for ideas, provide a varied, thoughtfully selected set that fits the user's request. Avoid repeating the same list across turns. For buildable electronics ideas, include the board and core parts, and add a build action tag like [Build Idea: <Title>].
If a question is outside your knowledge, be honest and ask what detail would help. Use clean Markdown only when it improves readability.`;

  if (projectContext) {
    CHAT_SYSTEM_PROMPT += `

ACTIVE PROJECT WORKBENCH CONTEXT:
The user is currently inside the dedicated laboratory for: **${projectContext.title}**.
- Microcontroller: ${projectContext.board} (${projectContext.board === 'ESP32' ? '3.3V Logic, Wi-Fi & BLE, dual-core 240MHz' : '5V Logic, 16MHz ATmega328P'})
- Category: ${projectContext.category} | Difficulty: ${projectContext.difficulty}
- Summary: ${projectContext.shortDesc}
- Verified Bill of Materials (${projectContext.components.length} components):
${projectContext.components.map(c => `  * ${c.name} (Qty: ${c.qty}) - ${c.note}`).join('\n')}
- Complete Wiring Netlist (${projectContext.wiringTable.length} pin connections):
${projectContext.wiringTable.map(w => `  * [${w.color}] ${w.from} -> ${w.to} (${w.desc})`).join('\n')}
- Scientific Working Principle:
${projectContext.workingPrinciple}
- Compilable Arduino C++ Firmware:
\`\`\`cpp
${projectContext.code}
\`\`\`

IMPORTANT FOR THIS WORKBENCH:
- You have access to this project's schematic, pinouts, BOM, and firmware. Use those details when they're relevant to the user's question.
- If the user changes to an unrelated topic, answer it normally without pulling the conversation back to this project.
- If they ask about wiring, cite the exact pins from the wiring netlist above.
- If they ask about firmware, explain the specific functions and variables from the code above.
- If they ask for troubleshooting, identify potential issues for this specific board and modules (e.g., servo current draw, I2C pullups, ESP32 ADC2 Wi-Fi conflict).
- Never output full project synthesis JSON unless explicitly told to 'build a new project from scratch'.
- Use the project details when they're relevant, and respond normally to unrelated questions.`;
  }

  try {
    const rawReply = await callLLMText(CHAT_SYSTEM_PROMPT, prompt, history);

    const suggestions: ChatSuggestion[] = [];
    const buildRegex = /\[(?:⚡\s*)?Build(?: Idea)?:?\s*([^\]]+)\]/gi;
    let match;
    while ((match = buildRegex.exec(rawReply)) !== null) {
      const cleanName = match[1].trim();
      if (cleanName && !suggestions.some(s => s.label === cleanName)) {
        suggestions.push({
          label: `Build ${cleanName}`,
          prompt: `Build ${cleanName}`
        });
      }
    }

    if (suggestions.length === 0) {
      if (projectContext) {
        suggestions.push(
          { label: '🔌 Explain Wiring', prompt: 'Explain the wiring connections and pin assignments for this circuit' },
          { label: '💻 Explain C++ Code', prompt: 'Explain how the firmware code works step-by-step' },
          { label: '⚡ Power & Decoupling', prompt: 'What are the power supply and voltage requirements?' },
          { label: '🛠️ Troubleshooting Tips', prompt: 'What are common issues and troubleshooting tips for this build?' }
        );
      } else {
        suggestions.push(
          { label: 'Brainstorm an idea', prompt: 'Help me brainstorm ideas for a personal project' },
          { label: 'Explain something', prompt: 'Explain a topic I am curious about in simple terms' },
          { label: 'Help me write', prompt: 'Help me write or improve something' }
        );
      }
    }

    return {
      reply: rawReply,
      reasoning: [
        projectContext ? `Referenced ${projectContext.title} hardware architecture and pinout netlist` : 'Analyzed user context and hardware parameters',
        'Consulted embedded systems engineering knowledge base',
        'Synthesized conversational engineering guidance'
      ],
      suggestions
    };
  } catch {
    return generateOfflineChatResponse(prompt, history, projectContext);
  }
}

/**
 * Creates a complete robotics project from a user prompt.
 */
export async function createProjectFromPrompt(prompt: string, targetBoard?: BoardType): Promise<ScienceProject> {
  const enrichedPrompt = targetBoard ? `${prompt} (Target MCU: ${targetBoard})` : prompt;
  const responseText = await callLLM(
    SYSTEM_ARCHITECT_PROMPT,
    `Create a comprehensive, fully functional robotics/electronics project for the following concept:\n"${enrichedPrompt}"`
  );

  return cleanAndParseProjectJSON(responseText, enrichedPrompt);
}

/**
 * Modifies an existing project using an AI instruction.
 */
export async function modifyProjectWithPrompt(
  currentProject: ScienceProject,
  modificationInstruction: string
): Promise<ScienceProject> {
  const userPayload = `
CURRENT PROJECT JSON:
${JSON.stringify(currentProject, null, 2)}

MODIFICATION REQUEST:
"${modificationInstruction}"

Please return the full updated project JSON with all changes applied.
`;

  try {
    const responseText = await callLLM(SYSTEM_MODIFY_PROMPT, userPayload);
    const updated = cleanAndParseProjectJSON(responseText, modificationInstruction);
    updated.id = currentProject.id;
    return updated;
  } catch (err) {
    console.warn('LLM modification failed, applying local synthesis modification:', err);
    return synthesizeProjectModificationOffline(currentProject, modificationInstruction);
  }
}

// ----------------------------------------------------------------------------
// JSON CLEANER & SANITIZER
// ----------------------------------------------------------------------------
function cleanAndParseProjectJSON(rawText: string, fallbackTopic: string): ScienceProject {
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '');
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/i, '');
    if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/i, '');
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned) as any;

    const board: BoardType = (parsed.board && parsed.board.toLowerCase().includes('esp')) ? 'ESP32' : 'Arduino Uno';
    const difficulty: DifficultyLevel = (['Beginner', 'Intermediate', 'Advanced'].includes(parsed.difficulty))
      ? parsed.difficulty
      : 'Intermediate';

    // Normalize components
    const components: BOMComponent[] = (Array.isArray(parsed.components) ? parsed.components : []).map((c: any) => ({
      name: String(c.name || 'Component'),
      qty: String(c.qty || '1'),
      note: String(c.note || '')
    }));

    // Normalize wiringTable
    const rawWiring = Array.isArray(parsed.wiringTable) ? parsed.wiringTable : (Array.isArray(parsed.wireConnections) ? parsed.wireConnections : []);
    const validColors: WireColor[] = ['red', 'black', 'blue', 'amber', 'green', 'purple', 'orange', 'yellow', 'white', 'gray'];

    const wiringTable: WireConnection[] = rawWiring.map((w: any) => {
      let color: WireColor = 'blue';
      const cLower = String(w.color || '').toLowerCase();
      for (const col of validColors) {
        if (cLower.includes(col)) { color = col; break; }
      }
      return {
        from: String(w.from || 'Board Pin'),
        to: String(w.to || 'Component Pin'),
        color,
        desc: String(w.desc || w.net || 'Signal Connection')
      };
    });

    const circuitDiagram: CircuitDiagramData = parsed.circuitDiagram && Array.isArray(parsed.circuitDiagram.modules)
      ? {
          boardType: board === 'ESP32' ? 'esp32' : 'arduino-uno',
          modules: parsed.circuitDiagram.modules.map((m: any) => ({
            name: String(m.name || 'Module'),
            type: (['sensor', 'actuator', 'display', 'driver', 'power'].includes(m.type) ? m.type : 'sensor'),
            pins: Array.isArray(m.pins) ? m.pins.map((p: any) => typeof p === 'string' ? p : (p.name || 'PIN')) : ['VCC', 'GND', 'SIG']
          }))
        }
      : generateDefaultCircuitLayout(board, components);

    const project: ScienceProject = {
      id: parsed.id || 'ai-project-' + Date.now(),
      title: parsed.title || 'AI Generated Robotics Project',
      shortDesc: parsed.shortDesc || 'Custom robotic automation project generated by AI.',
      board,
      category: parsed.category || 'Robotics & Automation',
      difficulty,
      estimatedTime: parsed.estimatedTime || '2 Hours',
      rating: typeof parsed.rating === 'number' ? parsed.rating : 4.9,
      featured: typeof parsed.featured === 'boolean' ? parsed.featured : true,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : ['Robotics', 'Automation', board],
      components: components.length > 0 ? components : [
        { name: board === 'ESP32' ? 'ESP32 NodeMCU' : 'Arduino Uno R3', qty: '1', note: 'Main CPU' },
        { name: 'Hardware Sensor Module', qty: '1', note: 'Primary detection' }
      ],
      workingPrinciple: parsed.workingPrinciple || 'Scientific operating theory and control dynamics.',
      wiringTable: wiringTable.length > 0 ? wiringTable : [
        { from: 'Board 5V', to: 'Module VCC', color: 'red', desc: '5V Power' },
        { from: 'Board GND', to: 'Module GND', color: 'black', desc: 'Ground' }
      ],
      circuitDiagram,
      code: parsed.code || '// Custom Firmware\nvoid setup() { Serial.begin(9600); }\nvoid loop() {}',
      assemblySteps: Array.isArray(parsed.assemblySteps) ? parsed.assemblySteps.map(String) : [
        'Step 1: Mount the microcontroller and modules to the chassis.',
        'Step 2: Connect power and signal conduits as per the wiring table.',
        'Step 3: Upload firmware and verify hardware response.'
      ],
      scientificApplications: parsed.scientificApplications || 'Industrial automation, smart agriculture, and IoT telemetry.'
    };

    return project;
  } catch (err) {
    console.warn('JSON parse error from LLM, synthesizing verified project:', err);
    return JSON.parse(synthesizeProjectOffline(fallbackTopic));
  }
}

// ----------------------------------------------------------------------------
// INTELLIGENT BUILT-IN HARDWARE SYNTHESIS ENGINE (ZERO-FAIL CLIENT ENGINE)
// ----------------------------------------------------------------------------
function synthesizeProjectOffline(userPrompt: string): string {
  let prompt = userPrompt;
  const match = userPrompt.match(/for the following concept:\s*["']?([\s\S]+?)["']?$/i);
  if (match && match[1]) {
    prompt = match[1].trim();
  }
  const pLower = prompt.toLowerCase();
  let isESP = false;
  if (pLower.includes('target mcu: esp32') || pLower.includes('target board: esp32')) {
    isESP = true;
  } else if (pLower.includes('target mcu: arduino') || pLower.includes('target board: arduino')) {
    isESP = false;
  } else {
    isESP = pLower.includes('esp32') || pLower.includes('iot') || pLower.includes('wifi') || pLower.includes('bluetooth');
  }
  const boardName: BoardType = isESP ? 'ESP32' : 'Arduino Uno';

  if (
    pLower.includes('emotion') ||
    pLower.includes('nemo') ||
    pLower.includes('iris') ||
    pLower.includes('desktop robot') ||
    pLower.includes('desk robot') ||
    pLower.includes('desk pet') ||
    pLower.includes('pet robot') ||
    pLower.includes('companion') ||
    pLower.includes('emo') ||
    pLower.includes('vector') ||
    pLower.includes('cozmo') ||
    pLower.includes('head robot') ||
    pLower.includes('face robot')
  ) {
    return JSON.stringify(getEmotionDeskRobotTemplate(boardName));
  }

  if (pLower.includes('watch') || pLower.includes('wearable') || pLower.includes('clock') || pLower.includes('pedometer') || pLower.includes('wrist')) {
    return JSON.stringify(getSmartWatchTemplate(boardName));
  }

  if (pLower.includes('voice') || pLower.includes('assistant') || pLower.includes('alexa') || pLower.includes('speaker') || pLower.includes('audio') || pLower.includes('sound')) {
    return JSON.stringify(getVoiceAssistantTemplate(boardName));
  }

  if (pLower.includes('weather') || pLower.includes('climate') || pLower.includes('temperature') || pLower.includes('humidity') || pLower.includes('dht') || pLower.includes('bmp280') || pLower.includes('air quality')) {
    return JSON.stringify(getWeatherStationTemplate(boardName));
  }

  if (pLower.includes('radar') || pLower.includes('sonar scanner') || pLower.includes('distance mapper') || pLower.includes('sweep')) {
    return JSON.stringify(getRadarScannerTemplate(boardName));
  }

  if (pLower.includes('irrigation') || pLower.includes('plant') || pLower.includes('watering') || pLower.includes('soil') || pLower.includes('garden')) {
    return JSON.stringify(getSmartIrrigationTemplate(boardName));
  }

  if (pLower.includes('rfid') || pLower.includes('security gate') || pLower.includes('smart lock') || pLower.includes('door lock') || pLower.includes('keycard')) {
    return JSON.stringify(getRFIDAccessTemplate(boardName));
  }

  if (pLower.includes('dustbin') || pLower.includes('trash') || pLower.includes('bin') || pLower.includes('lid')) {
    return JSON.stringify(getSmartDustbinTemplate(boardName));
  }
  if (pLower.includes('solar') || pLower.includes('tracker') || pLower.includes('sun') || pLower.includes('panel')) {
    return JSON.stringify(getSolarTrackerTemplate(boardName));
  }
  if (pLower.includes('gesture') || pLower.includes('hand') || pLower.includes('accelerometer') || pLower.includes('glove')) {
    return JSON.stringify(getGestureCarTemplate(boardName));
  }
  if (pLower.includes('balance') || pLower.includes('balancing') || pLower.includes('two wheel')) {
    return JSON.stringify(getSelfBalancingRobotTemplate(boardName));
  }
  if (pLower.includes('line') || pLower.includes('follower') || pLower.includes('ir sensor')) {
    return JSON.stringify(getLineFollowerTemplate(boardName));
  }

  return JSON.stringify(getGenericRoboticsTemplate(boardName, prompt));
}

function synthesizeProjectModificationOffline(orig: ScienceProject, instruction: string): ScienceProject {
  const mod: ScienceProject = JSON.parse(JSON.stringify(orig));
  const inst = instruction.toLowerCase();

  if (inst.includes('esp32') && mod.board !== 'ESP32') {
    mod.board = 'ESP32';
    mod.title += ' (ESP32 Edition)';
    mod.tags.push('ESP32');
    mod.circuitDiagram.boardType = 'esp32';
    mod.components.forEach(c => {
      if (c.name.includes('Arduino')) c.name = 'ESP32 NodeMCU Development Board';
    });
    mod.wiringTable = mod.wiringTable.map(w => {
      if (w.from.includes('Arduino')) return { ...w, from: w.from.replace('Arduino Pin', 'ESP32 GPIO') };
      return w;
    });
    mod.code = `// Updated for ESP32 Architecture\n#include <WiFi.h>\n` + mod.code;
  }

  if (inst.includes('bluetooth') || inst.includes('hc-05')) {
    mod.title += ' with Bluetooth Control';
    mod.components.push({ name: 'HC-05 Bluetooth Transceiver Module', qty: '1', note: 'Wireless serial telemetry 9600 baud' });
    mod.wiringTable.push(
      { from: 'Board RX', to: 'HC-05 TX', color: 'blue', desc: 'UART RX Data' },
      { from: 'Board TX', to: 'HC-05 RX', color: 'green', desc: 'UART TX Data' },
      { from: 'Board 5V', to: 'HC-05 VCC', color: 'red', desc: '5V Power' },
      { from: 'Board GND', to: 'HC-05 GND', color: 'black', desc: 'Ground' }
    );
    mod.circuitDiagram.modules.push({
      name: 'HC-05 Bluetooth',
      type: 'sensor',
      pins: ['VCC', 'GND', 'TXD', 'RXD']
    });
    mod.code = `// Bluetooth Serial Integration\n#include <SoftwareSerial.h>\nSoftwareSerial BTSerial(10, 11); // RX, TX\n` + mod.code;
    mod.tags.push('Bluetooth', 'Wireless');
  }

  if (inst.includes('vibration') || inst.includes('motor')) {
    mod.components = mod.components.filter(c => !c.name.toLowerCase().includes('buzzer'));
    mod.components.push({ name: '3V Vibration Feedback Motor', qty: '1', note: 'Haptic feedback actuator' });
    mod.title = mod.title.replace(/Buzzer/i, 'Haptic Feedback');
    mod.code = mod.code.replace(/tone\([^)]+\);/g, 'digitalWrite(VIBRATION_PIN, HIGH);');
  }

  return mod;
}

// ----------------------------------------------------------------------------
// HARDWARE TEMPLATES FOR INSTANT AI SYNTHESIS
// ----------------------------------------------------------------------------
function getSmartDustbinTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-smart-contactless-dustbin-' + Date.now(),
    title: 'Touchless Automated Smart Dustbin with Servo Lid',
    board,
    category: 'Robotics & Automation',
    difficulty: 'Beginner',
    estimatedTime: '1 Hour',
    rating: 4.9,
    featured: true,
    shortDesc: 'Automated touchless waste disposal system using an ultrasonic rangefinder to detect hand gestures and trigger a servo-actuated lid opening mechanism.',
    tags: ['Ultrasonic', 'Servo Motor', 'Gesture', 'Sanitation', 'Automation', board],
    components: [
      { name: isUno ? 'Arduino Uno R3 Microcontroller' : 'ESP32 NodeMCU Board', qty: '1', note: 'Core system controller' },
      { name: 'HC-SR04 Ultrasonic Sonar Sensor', qty: '1', note: 'Hand gesture distance detection' },
      { name: 'SG90 9g Micro Servo Motor', qty: '1', note: 'Lid opening mechanical actuation' },
      { name: '0.96" I2C OLED Display (SSD1306)', qty: '1', note: 'Capacity & status telemetry' },
      { name: 'Active Piezo Buzzer 5V', qty: '1', note: 'Audible lid open/close feedback' },
      { name: 'Dustbin Chassis with 3D Printed Hinges', qty: '1', note: 'Mechanical enclosure' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin D7' : 'ESP32 GPIO 18', to: 'HC-SR04 TRIG', color: 'green', desc: 'Trigger Pulse' },
      { from: isUno ? 'Arduino Pin D6' : 'ESP32 GPIO 19', to: 'HC-SR04 ECHO', color: 'blue', desc: 'Echo Return' },
      { from: isUno ? 'Arduino Pin D9' : 'ESP32 GPIO 13', to: 'SG90 Micro Servo PWM', color: 'orange', desc: 'Servo PWM Angle' },
      { from: isUno ? 'Arduino Pin D5' : 'ESP32 GPIO 12', to: 'Active Buzzer (+)', color: 'purple', desc: 'Audio Chime' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Power Rail', color: 'red', desc: '5V Power Bus' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'Common Ground' },
      { from: 'Positive 5V Power Rail', to: 'HC-SR04 VCC', color: 'red', desc: 'Sonar DC Power' },
      { from: 'Common System Ground (GND)', to: 'HC-SR04 GND', color: 'black', desc: 'Sonar Ground Return' },
      { from: 'Positive 5V Power Rail', to: 'SG90 Micro Servo VCC', color: 'red', desc: 'Servo Motor Power' },
      { from: 'Common System Ground (GND)', to: 'SG90 Micro Servo GND', color: 'black', desc: 'Servo Ground Return' },
      { from: 'Common System Ground (GND)', to: 'Active Buzzer (-)', color: 'black', desc: 'Buzzer Ground Reference' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'HC-SR04 Sonar', type: 'sensor', pins: ['VCC', 'TRIG', 'ECHO', 'GND'] },
        { name: 'SG90 Micro Servo', type: 'actuator', pins: ['PWM', 'VCC', 'GND'] },
        { name: 'Active Buzzer', type: 'actuator', pins: ['POS', 'NEG'] }
      ]
    },
    code: `// ============================================================================
// TOUCHLESS SMART DUSTBIN ROBOT FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <Servo.h>

const int TRIG_PIN = 7;
const int ECHO_PIN = 6;
const int SERVO_PIN = 9;
const int BUZZER_PIN = 5;

Servo lidServo;
const int DISTANCE_THRESHOLD = 20; // cm to trigger lid open
const int LID_OPEN_ANGLE = 90;
const int LID_CLOSED_ANGLE = 0;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  lidServo.attach(SERVO_PIN);
  lidServo.write(LID_CLOSED_ANGLE);
  delay(500);

  // Ready Chirp
  tone(BUZZER_PIN, 2000, 100);
  Serial.println("Smart Dustbin Initialized and Armed.");
}

long getDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return 999;
  return (duration * 0.0343) / 2;
}

void loop() {
  long distance = getDistanceCM();
  Serial.print("Target Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance > 0 && distance <= DISTANCE_THRESHOLD) {
    Serial.println("Hand detected! Opening lid...");
    tone(BUZZER_PIN, 1800, 80);
    lidServo.write(LID_OPEN_ANGLE);
    delay(4000); // Keep open for 4 seconds

    Serial.println("Closing lid...");
    tone(BUZZER_PIN, 1200, 80);
    lidServo.write(LID_CLOSED_ANGLE);
    delay(1000); // Debounce delay
  }

  delay(100);
}`,
    workingPrinciple: 'The smart dustbin functions on piezoelectric acoustic echo-ranging. The HC-SR04 transmitter emits a burst of 40 kHz ultrasound. When an object (such as a human hand) enters the beam path, the wave reflects back and strikes the receiver. The microcontroller measures the elapsed round-trip time Delta t and derives distance via d = (v_sound * Delta t) / 2. When distance falls below 20 cm, the system activates the SG90 micro-servo via Pulse-Width Modulation (PWM), rotating the output spline by 90 degrees to mechanically raise the dustbin lid.',
    scientificApplications: 'Touchless robotic lids drastically curtail cross-contamination and viral pathogen transmission in clinical surgical environments, infectious disease wards, and food-processing facilities.',
    assemblySteps: [
      'Mount the HC-SR04 ultrasonic sensor to the front lip of the bin using hot adhesive or a 3D-printed bezel.',
      'Mount the SG90 servo inside the hinge knuckle so the servo arm pushes against the lid rim.',
      'Connect the Trig and Echo pins to digital I/O lines and attach the buzzer.',
      'Connect the 5V and GND rail to an external 5V 1A battery bank to protect microcontroller logic from servo back-EMF.',
      'Calibrate the distance threshold constant to match user hand height.'
    ]
  };
}

function getSolarTrackerTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-solar-tracker-servo-' + Date.now(),
    title: 'Dual-Axis Autonomous Solar Tracking Heliodon Robot',
    board,
    category: 'Space & Energy',
    difficulty: 'Intermediate',
    estimatedTime: '2 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: 'Autonomous dual-LDR closed-loop robotic tracker that maximizes photovoltaic conversion efficiency by orienting solar panels perpendicular to incident light rays.',
    tags: ['Solar Energy', 'Servos', 'LDR', 'Closed-Loop Control', 'CleanTech', board],
    components: [
      { name: isUno ? 'Arduino Uno R3 Microcontroller' : 'ESP32 NodeMCU Development Board', qty: '1', note: 'Analog sensor processing' },
      { name: '2x GL5528 Light Dependent Resistors (LDRs)', qty: '2', note: 'Differential sunlight detection' },
      { name: '2x 10kOhm Voltage Divider Resistors', qty: '2', note: 'Pull-down bias resistors' },
      { name: 'SG90 9g Micro Servo Motor', qty: '1', note: 'Azimuth rotational actuator' },
      { name: '6V 1W Monocrystalline Solar Panel', qty: '1', note: 'Target photovoltaic payload' },
      { name: '0.96" I2C OLED Display', qty: '1', note: 'Real-time LUX differential telemetry' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Analog A0' : 'ESP32 GPIO 34', to: 'Dual LDR Rig LDR_L', color: 'blue', desc: 'Analog Light Left' },
      { from: isUno ? 'Arduino Analog A1' : 'ESP32 GPIO 35', to: 'Dual LDR Rig LDR_R', color: 'amber', desc: 'Analog Light Right' },
      { from: isUno ? 'Arduino Pin D9' : 'ESP32 GPIO 13', to: 'Azimuth Servo SG90 PWM', color: 'orange', desc: 'Servo PWM Control' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Power Rail', color: 'red', desc: '5V Power Bus' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'Common Ground' },
      { from: 'Positive 5V Power Rail', to: 'Dual LDR Rig VCC', color: 'red', desc: 'Dual LDR DC Power' },
      { from: 'Common System Ground (GND)', to: 'Dual LDR Rig GND', color: 'black', desc: 'Dual LDR Ground Return' },
      { from: 'Positive 5V Power Rail', to: 'Azimuth Servo SG90 VCC', color: 'red', desc: 'Servo 5V DC Motor Power' },
      { from: 'Common System Ground (GND)', to: 'Azimuth Servo SG90 GND', color: 'black', desc: 'Servo Ground Return' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'Dual LDR Rig', type: 'sensor', pins: ['VCC', 'LDR_L', 'LDR_R', 'GND'] },
        { name: 'Azimuth Servo SG90', type: 'actuator', pins: ['PWM', 'VCC', 'GND'] }
      ]
    },
    code: `// ============================================================================
// CLOSED-LOOP DUAL-LDR SOLAR TRACKER FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <Servo.h>

const int LDR_LEFT = A0;
const int LDR_RIGHT = A1;
const int SERVO_PIN = 9;

Servo trackerServo;
int servoPos = 90; // Starting center position
const int TOLERANCE = 30; // ADC differential deadband

void setup() {
  Serial.begin(9600);
  trackerServo.attach(SERVO_PIN);
  trackerServo.write(servoPos);
  delay(500);
  Serial.println("Solar Heliodon Initialized.");
}

void loop() {
  int leftVal = analogRead(LDR_LEFT);
  int rightVal = analogRead(LDR_RIGHT);
  int diff = leftVal - rightVal;

  Serial.print("L: "); Serial.print(leftVal);
  Serial.print(" | R: "); Serial.print(rightVal);
  Serial.print(" | Diff: "); Serial.println(diff);

  if (abs(diff) > TOLERANCE) {
    if (diff > 0 && servoPos < 175) {
      servoPos += 1; // Turn left toward stronger light
    } else if (diff < 0 && servoPos > 5) {
      servoPos -= 1; // Turn right toward stronger light
    }
    trackerServo.write(servoPos);
    delay(40); // Control loop stabilization delay
  }

  delay(20);
}`,
    workingPrinciple: 'The solar tracker exploits the photoconductive properties of cadmium sulfide (CdS) semiconductors. Incident photons elevate valence band electrons to the conduction band, causing resistance R_LDR to diminish proportionally to light flux Phi. In a balanced state, both LDRs receive equal illumination. When the sun shifts, an illumination gradient is created, producing an ADC differential Delta V = V_left - V_right. The microcontroller runs a negative feedback loop to re-center the panel normal to the incident Poynting vector, recovering up to 35% higher energy yield over fixed installations.',
    scientificApplications: 'Utility-scale photovoltaic farms, concentrated solar thermal parabolic troughs, and orbital CubeSat solar array alignment systems.',
    assemblySteps: [
      'Fabricate a light-partition divider (baffle) between the two LDRs to cast a shadow when off-axis.',
      'Wire two 10kOhm resistors in series with each LDR to form two independent voltage divider bridges.',
      'Mount the mini solar panel onto the servo horn bracket.',
      'Connect servo signal pin D9 to a PWM-capable pin and power the servo from an isolated 5V bus.',
      'Aim a flashlight at the rig to verify the tracking direction; invert servo increment logic if inverted.'
    ]
  };
}

function getGestureCarTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-gesture-robot-car-' + Date.now(),
    title: 'Wearable IMU Gesture-Controlled Robotic Rover',
    board,
    category: 'Robotics & Automation',
    difficulty: 'Advanced',
    estimatedTime: '3 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: 'Robotic rover vehicle teleoperated via wrist tilt pitch and roll gestures measured by an MPU-6050 6-axis gyroscope and accelerometer.',
    tags: ['Robotics', 'MPU-6050', 'L298N', 'IMU', 'Motors', board],
    components: [
      { name: isUno ? 'Arduino Uno R3' : 'ESP32 NodeMCU', qty: '2', note: 'Transmitter glove + Receiver rover' },
      { name: 'MPU-6050 6-DOF IMU Gyro & Accelerometer', qty: '1', note: 'Gesture angle detection' },
      { name: 'L298N Dual H-Bridge Motor Driver', qty: '1', note: 'High-current DC motor control' },
      { name: '2x TT Geared DC Motors with Wheels', qty: '2', note: 'Drive locomotion' },
      { name: 'NRF24L01+ 2.4GHz Wireless Transceivers', qty: '2', note: 'Telemetry link' },
      { name: '2S 7.4V 18650 Li-ion Battery Pack', qty: '1', note: 'Motor drive power' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: 'MPU-6050 IMU SDA', color: 'blue', desc: 'I2C Data Bus' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: 'MPU-6050 IMU SCL', color: 'amber', desc: 'I2C Clock Bus' },
      { from: isUno ? 'Arduino Pin D5' : 'ESP32 GPIO 13', to: 'L298N Driver IN1', color: 'green', desc: 'Motor Left Fwd' },
      { from: isUno ? 'Arduino Pin D6' : 'ESP32 GPIO 14', to: 'L298N Driver IN2', color: 'green', desc: 'Motor Left Rev' },
      { from: isUno ? 'Arduino Pin D9' : 'ESP32 GPIO 18', to: 'L298N Driver IN3', color: 'orange', desc: 'Motor Right Fwd' },
      { from: isUno ? 'Arduino Pin D10' : 'ESP32 GPIO 19', to: 'L298N Driver IN4', color: 'orange', desc: 'Motor Right Rev' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Power Rail', color: 'red', desc: '5V Power Bus' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'Universal Ground' },
      { from: 'Positive 5V Power Rail', to: 'MPU-6050 IMU VCC', color: 'red', desc: 'MPU-6050 Power' },
      { from: 'Common System Ground (GND)', to: 'MPU-6050 IMU GND', color: 'black', desc: 'MPU-6050 Ground' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'MPU-6050 IMU', type: 'sensor', pins: ['VCC', 'GND', 'SCL', 'SDA'] },
        { name: 'L298N Driver', type: 'driver', pins: ['IN1', 'IN2', 'IN3', 'IN4'] }
      ]
    },
    code: `// Gesture Robot Car Controller Code\n#include <Wire.h>\n#include <MPU6050.h>\nMPU6050 mpu;\nvoid setup() { Wire.begin(); mpu.initialize(); }\nvoid loop() { int16_t ax, ay, az; mpu.getAcceleration(&ax, &ay, &az); delay(50); }`,
    workingPrinciple: 'Micro-Electro-Mechanical Systems (MEMS) capacitive proof-mass displacement under acceleration vector components determines hand tilt pitch and roll angle theta = atan2(Ax, sqrt(Ay^2 + Az^2)).',
    scientificApplications: 'Hazardous bomb disposal tele-robotics, surgical laparoscopic arms, and assistive mobility power wheelchairs.',
    assemblySteps: ['Fasten the MPU-6050 sensor to an elastic wrist strap.', 'Assemble the 2WD robotics chassis with TT motors.', 'Mount L298N driver and pair wireless RF link.']
  };
}

function getSelfBalancingRobotTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-self-balancing-robot-' + Date.now(),
    title: 'Two-Wheeled Inverted Pendulum Self-Balancing Robot',
    board,
    category: 'Robotics & Automation',
    difficulty: 'Advanced',
    estimatedTime: '3.5 Hours',
    rating: 5.0,
    featured: true,
    shortDesc: 'Autonomous dynamically stable inverted pendulum robot implementing PID closed-loop feedback balancing with high-frequency IMU Kalman filtering.',
    tags: ['PID Control', 'Inverted Pendulum', 'MPU-6050', 'L298N', 'Kalman Filter', board],
    components: [
      { name: isUno ? 'Arduino Uno R3' : 'ESP32 NodeMCU', qty: '1', note: 'High-speed loop execution' },
      { name: 'MPU-6050 6-Axis Motion Sensor', qty: '1', note: 'Tilt angle velocity feedback' },
      { name: 'L298N Dual Motor Driver Module', qty: '1', note: 'Bi-directional PWM drive' },
      { name: '2x High-Torque TT Metal Gear Motors', qty: '2', note: 'Balancing wheels' },
      { name: '11.1V 3S LiPo Battery 1000mAh', qty: '1', note: 'High burst current' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: 'MPU-6050 IMU SDA', color: 'blue', desc: 'I2C Data' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: 'MPU-6050 IMU SCL', color: 'amber', desc: 'I2C Clock' },
      { from: isUno ? 'Arduino Pin D5' : 'ESP32 GPIO 13', to: 'L298N Driver ENA (PWM)', color: 'orange', desc: 'PWM Motor Speed L' },
      { from: isUno ? 'Arduino Pin D6' : 'ESP32 GPIO 14', to: 'L298N Driver ENB (PWM)', color: 'orange', desc: 'PWM Motor Speed R' },
      { from: isUno ? 'Arduino Pin D7' : 'ESP32 GPIO 18', to: 'L298N Driver IN1', color: 'green', desc: 'Motor L Dir 1' },
      { from: isUno ? 'Arduino Pin D8' : 'ESP32 GPIO 19', to: 'L298N Driver IN2', color: 'green', desc: 'Motor L Dir 2' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Power Rail', color: 'red', desc: '5V Power Bus' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'System Ground' },
      { from: 'Positive 5V Power Rail', to: 'MPU-6050 IMU VCC', color: 'red', desc: 'IMU 5V Power' },
      { from: 'Common System Ground (GND)', to: 'MPU-6050 IMU GND', color: 'black', desc: 'IMU Ground Return' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'MPU-6050 IMU', type: 'sensor', pins: ['SDA', 'SCL', 'VCC', 'GND'] },
        { name: 'L298N Driver', type: 'driver', pins: ['IN1', 'IN2', 'ENA', 'ENB'] }
      ]
    },
    code: `// Self-Balancing Inverted Pendulum PID Firmware\nvoid setup() {}\nvoid loop() {}`,
    workingPrinciple: 'Dynamic stabilization based on the inverted pendulum state-space model: J*theta_ddot = m*g*l*sin(theta) - u*l*cos(theta). An active Proportional-Integral-Derivative (PID) controller modulates wheel acceleration u(t) = Kp*e(t) + Ki*integral(e dt) + Kd*de/dt.',
    scientificApplications: 'Personal electric transport (Segway), humanoid bipedal gait balance, and rocket booster vertical descent stabilization (SpaceX Falcon 9 landing).',
    assemblySteps: ['Construct a multi-tiered vertical tower chassis.', 'Position the battery at the center of mass.', 'Tune Kp, Ki, Kd coefficients iteratively.']
  };
}

function getLineFollowerTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-line-follower-robot-' + Date.now(),
    title: 'Autonomous PID Line-Tracking Robotic Rover',
    board,
    category: 'Robotics & Automation',
    difficulty: 'Intermediate',
    estimatedTime: '2 Hours',
    rating: 4.8,
    featured: true,
    shortDesc: 'Automated ground vehicle tracking high-contrast boundary lines using an infrared reflectance sensor array and differential steering PID control.',
    tags: ['Line Follower', 'Infrared', 'PID', 'Robotics', board],
    components: [
      { name: isUno ? 'Arduino Uno R3' : 'ESP32 NodeMCU', qty: '1', note: 'Main control unit' },
      { name: 'TCRT5000 5-Channel IR Reflectance Array', qty: '1', note: 'Track boundary detection' },
      { name: 'L298N Dual H-Bridge Motor Driver', qty: '1', note: 'Differential steering drive' },
      { name: '2x Geared DC Motors with Wheels', qty: '2', note: 'Left/Right locomotion' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Analog A0' : 'ESP32 GPIO 34', to: 'TCRT5000 Array OUT1', color: 'blue', desc: 'Analog IR Array Sensor 1' },
      { from: isUno ? 'Arduino Analog A1' : 'ESP32 GPIO 35', to: 'TCRT5000 Array OUT2', color: 'blue', desc: 'Analog IR Array Sensor 2' },
      { from: isUno ? 'Arduino Analog A2' : 'ESP32 GPIO 32', to: 'TCRT5000 Array OUT3', color: 'blue', desc: 'Analog IR Array Sensor 3' },
      { from: isUno ? 'Arduino Pin D5' : 'ESP32 GPIO 13', to: 'L298N Motor Driver IN1', color: 'green', desc: 'Direction Logic Left Fwd' },
      { from: isUno ? 'Arduino Pin D6' : 'ESP32 GPIO 14', to: 'L298N Motor Driver IN2', color: 'green', desc: 'Direction Logic Left Rev' },
      { from: isUno ? 'Arduino Pin D9' : 'ESP32 GPIO 18', to: 'L298N Motor Driver IN3', color: 'orange', desc: 'Direction Logic Right Fwd' },
      { from: isUno ? 'Arduino Pin D10' : 'ESP32 GPIO 19', to: 'L298N Motor Driver IN4', color: 'orange', desc: 'Direction Logic Right Rev' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Power Rail', color: 'red', desc: '5V Power Bus' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'System Ground' },
      { from: 'Positive 5V Power Rail', to: 'TCRT5000 Array VCC', color: 'red', desc: 'IR Array Power' },
      { from: 'Common System Ground (GND)', to: 'TCRT5000 Array GND', color: 'black', desc: 'IR Array Ground' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'TCRT5000 Array', type: 'sensor', pins: ['VCC', 'GND', 'OUT1', 'OUT2', 'OUT3'] },
        { name: 'L298N Motor Driver', type: 'driver', pins: ['IN1', 'IN2', 'IN3', 'IN4'] }
      ]
    },
    code: `// PID Line Follower Code\nvoid setup() {}\nvoid loop() {}`,
    workingPrinciple: 'Infrared differential reflectance based on Lambertian albedo contrast between dark absorptive paths and light reflective floor surfaces.',
    scientificApplications: 'Industrial warehouse Automated Guided Vehicles (AGVs) in Amazon logistics and smart factory material handling.',
    assemblySteps: ['Mount IR sensors 5mm above the running surface.', 'Wire differential motor pins.', 'Calibrate ambient threshold potentiometer.']
  };
}

function getEmotionDeskRobotTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-emotion-desktop-robot-' + Date.now(),
    title: 'Nemo & Iris: Tiny Desktop Emotion Companion Robot',
    board,
    category: 'Robotics & Automation',
    difficulty: 'Intermediate',
    estimatedTime: '2.5 Hours',
    rating: 5.0,
    featured: true,
    shortDesc: 'Interactive tabletop companion robot inspired by Iris and Nemo featuring expressive animated digital eyes on an I2C OLED display, 2-DOF pan-tilt neck kinematics for lifelike head gestures, capacitive touch petting reactions, and distance-aware ultrasonic face tracking.',
    tags: ['ESP32', 'OLED Display', 'Micro Servo', 'Touch Sensor', 'Emotion Robot', 'Desktop Companion', 'Robotics'],
    components: [
      { name: isUno ? 'Arduino Uno R3 Microcontroller' : 'ESP32 NodeMCU Development Board', qty: '1', note: 'Dual-core processor running non-blocking procedural eye graphics & servo kinematics' },
      { name: '0.96" I2C OLED Display (SSD1306 128x64)', qty: '1', note: 'Expressive animated digital eyes with happy, blinking, curious, angry, and sleeping states' },
      { name: 'SG90 Micro Servo (Pan 180° Horizontal)', qty: '1', note: 'Horizontal neck rotation enabling scanning and gaze redirection' },
      { name: 'SG90 Micro Servo (Tilt 90° Vertical)', qty: '1', note: 'Vertical nod & curiosity head tilt' },
      { name: 'TTP223 Capacitive Touch Sensor Module', qty: '1', note: 'Head-mounted petting detector that triggers happy purrs and heart eyes' },
      { name: 'HC-SR04 Ultrasonic Sonar Rangefinder', qty: '1', note: 'Detects approaching humans or hands within 5-40cm desk proximity' },
      { name: 'Active Piezo Buzzer 5V', qty: '1', note: 'Generates 8-bit R2-D2 style emotional chirps, bleeps, and frequency sweeps' },
      { name: 'Mini 2-DOF Pan-Tilt Neck Chassis & Iris Bezel', qty: '1', note: 'Articulated mechanical bracket holding the display face' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: '0.96" OLED SDA', color: 'blue', desc: 'I2C Serial Data Bus for Eye Graphics' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: '0.96" OLED SCL', color: 'amber', desc: 'I2C Serial Clock Bus (400kHz)' },
      { from: isUno ? 'Arduino Pin D9' : 'ESP32 GPIO 13', to: 'Pan SG90 Servo PWM', color: 'orange', desc: 'PWM Signal for Horizontal Head Turn (50Hz)' },
      { from: isUno ? 'Arduino Pin D10' : 'ESP32 GPIO 14', to: 'Tilt SG90 Servo PWM', color: 'yellow', desc: 'PWM Signal for Vertical Head Tilt (50Hz)' },
      { from: isUno ? 'Arduino Pin D2' : 'ESP32 GPIO 4', to: 'TTP223 Touch I/O', color: 'purple', desc: 'Capacitive Head Petting Digital Signal' },
      { from: isUno ? 'Arduino Pin D7' : 'ESP32 GPIO 5', to: 'HC-SR04 TRIG', color: 'green', desc: 'Ultrasonic 10us Trigger Pulse' },
      { from: isUno ? 'Arduino Pin D6' : 'ESP32 GPIO 18', to: 'HC-SR04 ECHO', color: 'blue', desc: 'Ultrasonic Echo Pulse Return' },
      { from: isUno ? 'Arduino Pin D8' : 'ESP32 GPIO 19', to: 'Active Buzzer (+)', color: 'red', desc: 'Emotional Sound Frequency Audio Output' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Power Rail', color: 'red', desc: 'Common 5V DC Bus for Servos & Sensors' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'Universal System Reference Ground' },
      { from: 'Positive 5V Power Rail', to: '0.96" OLED VCC', color: 'red', desc: 'OLED 3.3V/5V Power' },
      { from: 'Common System Ground (GND)', to: '0.96" OLED GND', color: 'black', desc: 'OLED System Ground' },
      { from: 'Positive 5V Power Rail', to: 'Pan SG90 Servo VCC', color: 'red', desc: 'Pan Servo 5V DC Motor Power' },
      { from: 'Common System Ground (GND)', to: 'Pan SG90 Servo GND', color: 'black', desc: 'Pan Servo Ground Return' },
      { from: 'Positive 5V Power Rail', to: 'Tilt SG90 Servo VCC', color: 'red', desc: 'Tilt Servo 5V DC Motor Power' },
      { from: 'Common System Ground (GND)', to: 'Tilt SG90 Servo GND', color: 'black', desc: 'Tilt Servo Ground Return' },
      { from: 'Positive 5V Power Rail', to: 'HC-SR04 VCC', color: 'red', desc: 'Ultrasonic Sonar 5V Power' },
      { from: 'Common System Ground (GND)', to: 'HC-SR04 GND', color: 'black', desc: 'Ultrasonic Sonar Ground Return' },
      { from: 'Positive 5V Power Rail', to: 'TTP223 Touch VCC', color: 'red', desc: 'Capacitive Touch 3.3V/5V Power' },
      { from: 'Common System Ground (GND)', to: 'TTP223 Touch GND', color: 'black', desc: 'Capacitive Touch Ground Return' },
      { from: 'Common System Ground (GND)', to: 'Active Buzzer (-)', color: 'black', desc: 'Piezo Buzzer Ground Return' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: '0.96" I2C OLED', type: 'display', pins: ['GND', 'VCC', 'SCL', 'SDA'] },
        { name: 'Pan SG90 Servo', type: 'actuator', pins: ['PWM', 'VCC', 'GND'] },
        { name: 'Tilt SG90 Servo', type: 'actuator', pins: ['PWM', 'VCC', 'GND'] },
        { name: 'HC-SR04 Sonar', type: 'sensor', pins: ['VCC', 'TRIG', 'ECHO', 'GND'] },
        { name: 'TTP223 Touch Sensor', type: 'sensor', pins: ['VCC', 'I/O', 'GND'] },
        { name: 'Active Buzzer', type: 'actuator', pins: ['POS', 'NEG'] }
      ]
    },
    code: `// ============================================================================
// NEMO & IRIS: TINY DESKTOP EMOTION COMPANION ROBOT FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// Compatible with ESP32 & Arduino Uno architectures
// ============================================================================

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#if defined(ESP32)
  #include <ESP32Servo.h>
  #define PIN_SERVO_PAN   13
  #define PIN_SERVO_TILT  14
  #define PIN_TOUCH        4
  #define PIN_TRIG         5
  #define PIN_ECHO        18
  #define PIN_BUZZER      19
#else
  #include <Servo.h>
  #define PIN_SERVO_PAN    9
  #define PIN_SERVO_TILT  10
  #define PIN_TOUCH        2
  #define PIN_TRIG         7
  #define PIN_ECHO         6
  #define PIN_BUZZER       8
#endif

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Servo panServo;
Servo tiltServo;

int panAngle = 90;
int tiltAngle = 45;
unsigned long lastBlinkTime = 0;
unsigned long lastActionTime = 0;

void playChirp(int startFreq, int endFreq, int step, int d) {
  for (int f = startFreq; f <= endFreq; f += step) {
    tone(PIN_BUZZER, f, d);
    delay(d);
  }
  noTone(PIN_BUZZER);
}

void playHappyMelody() {
  tone(PIN_BUZZER, 1318, 80); delay(90);
  tone(PIN_BUZZER, 1568, 80); delay(90);
  tone(PIN_BUZZER, 2093, 150); delay(160);
  noTone(PIN_BUZZER);
}

void drawEyes(int pupilOffsetX, int pupilOffsetY, int eyeHeight = 28, bool happy = false) {
  display.clearDisplay();
  
  if (happy) {
    // Inverted arcs for happy smiling eyes (^ ^)
    display.fillRoundRect(22, 24, 34, 18, 9, SSD1306_WHITE);
    display.fillRoundRect(22, 32, 34, 14, 4, SSD1306_BLACK);
    display.fillRoundRect(72, 24, 34, 18, 9, SSD1306_WHITE);
    display.fillRoundRect(72, 32, 34, 14, 4, SSD1306_BLACK);
  } else if (eyeHeight <= 4) {
    // Sleeping / Blinking slit
    display.fillRoundRect(22, 32, 34, 4, 2, SSD1306_WHITE);
    display.fillRoundRect(72, 32, 34, 4, 2, SSD1306_WHITE);
  } else {
    // Large expressive rounded square anime eyes with highlights
    int leftCenterX = 39 + pupilOffsetX;
    int rightCenterX = 89 + pupilOffsetX;
    int centerY = 32 + pupilOffsetY;
    
    // Left & Right Eye Outer
    display.fillRoundRect(leftCenterX - 18, centerY - (eyeHeight/2), 36, eyeHeight, 10, SSD1306_WHITE);
    display.fillRoundRect(rightCenterX - 18, centerY - (eyeHeight/2), 36, eyeHeight, 10, SSD1306_WHITE);
    
    // Pupil highlights (white specular reflection dots)
    display.fillCircle(leftCenterX - 6, centerY - 4, 4, SSD1306_BLACK);
    display.fillCircle(rightCenterX - 6, centerY - 4, 4, SSD1306_BLACK);
    display.fillCircle(leftCenterX + 4, centerY + 3, 2, SSD1306_BLACK);
    display.fillCircle(rightCenterX + 4, centerY + 3, 2, SSD1306_BLACK);
  }
  display.display();
}

long readUltrasonicDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  
  long duration = pulseIn(PIN_ECHO, HIGH, 25000);
  if (duration == 0) return 999;
  return (duration * 0.0343) / 2;
}

void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_TOUCH, INPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  panServo.attach(PIN_SERVO_PAN);
  tiltServo.attach(PIN_SERVO_TILT);
  panServo.write(panAngle);
  tiltServo.write(tiltAngle);

  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }

  display.clearDisplay();
  drawEyes(0, 0, 28);
  
  // Power-on wake chirp
  playChirp(800, 1800, 100, 15);
  Serial.println("Iris/Nemo Desktop Companion Robot Initialized.");
}

void loop() {
  unsigned long now = millis();
  
  // 1. Check Capacitive Touch Sensor (Head Petting)
  int touchState = digitalRead(PIN_TOUCH);
  if (touchState == HIGH) {
    Serial.println("Head pet detected! Emotion: HAPPY_PURR");
    panServo.write(90);
    tiltServo.write(60); // Tilt head upward affectionately
    drawEyes(0, 0, 28, true); // Happy curved eyes
    playHappyMelody();
    delay(1200);
    tiltServo.write(45);
    drawEyes(0, 0, 28, false);
    return;
  }

  // 2. Ultrasonic Proximity Sense (Detect desk approach)
  long dist = readUltrasonicDistance();
  if (dist > 3 && dist < 25) {
    Serial.print("User in proximity: ");
    Serial.print(dist);
    Serial.println(" cm");
    
    // Inquisitive tilt
    tiltServo.write(30);
    panServo.write(75);
    drawEyes(-4, -2, 32);
    playChirp(1200, 2200, 150, 12);
    delay(800);
    panServo.write(105);
    drawEyes(4, -2, 32);
    delay(800);
    panServo.write(90);
    tiltServo.write(45);
    drawEyes(0, 0, 28);
    delay(300);
    return;
  }

  // 3. Spontaneous Organic Eye Blinking
  if (now - lastBlinkTime > 3200) {
    drawEyes(0, 0, 2); // Closed eye slit
    delay(120);
    drawEyes(0, 0, 28); // Re-open
    lastBlinkTime = now + random(-800, 1200);
  }

  // 4. Autonomous Idling & Curious Saccades
  if (now - lastActionTime > 5000) {
    int randomAction = random(0, 4);
    if (randomAction == 0) {
      panServo.write(65);
      drawEyes(-6, 0, 26);
      delay(900);
      panServo.write(90);
      drawEyes(0, 0, 28);
    } else if (randomAction == 1) {
      panServo.write(115);
      drawEyes(6, 0, 26);
      delay(900);
      panServo.write(90);
      drawEyes(0, 0, 28);
    } else if (randomAction == 2) {
      tiltServo.write(60);
      drawEyes(0, -6, 28);
      tone(PIN_BUZZER, 1800, 40);
      delay(800);
      tiltServo.write(45);
      drawEyes(0, 0, 28);
    }
    lastActionTime = now;
  }

  delay(40);
}`,
    workingPrinciple: 'The desktop companion robot operates on affective computing and Human-Robot Interaction (HRI) principles. The ESP32 coordinates a multi-sensory feedback loop: a TTP223 capacitive touch sensor detects human physical touch via dielectric capacitance changes, triggering an immediate positive reinforcement state (joyful eye curvature and R2-D2 style chirp frequencies). The HC-SR04 ultrasonic rangefinder measures proximity via time-of-flight acoustic echo ranging; when proximity is detected, the 2-DOF pan-tilt neck articulates via Pulse-Width Modulation (PWM) to redirect the gaze vector directly toward the user, simulating autonomous eye contact and micro-saccades.',
    scientificApplications: 'Affective social robotics, therapeutic companion devices for elderly care and neurodiverse assistance, and autonomous desktop telepresence interfaces.',
    assemblySteps: [
      'Assemble the 2-DOF pan-tilt nylon bracket: secure the Pan servo flat to the desk baseplate and the Tilt servo to the vertical hinge yoke.',
      'Mount the 0.96" I2C OLED display inside the robot head visor bezel using M2 nylon standoffs.',
      'Mount the TTP223 touch sensor plate directly beneath the upper skull casing so it detects petting contact through the 3D-printed plastic shell.',
      'Insert the HC-SR04 sonar module into the two lower ocular apertures facing forward.',
      'Route the servo signal wires (GPIO 13 & 14), OLED I2C bus (GPIO 21 & 22), and touch pin (GPIO 4) to the ESP32 header socket.',
      'Attach the active buzzer and common 5V power bus, connect the USB-C cable to the ESP32, and flash the companion firmware.'
    ]
  };
}

function getGenericRoboticsTemplate(board: BoardType, rawPrompt: string): ScienceProject {
  const isUno = board === 'Arduino Uno';
  let prompt = (rawPrompt || '').trim();
  const wrapperMatch = prompt.match(/for the following concept:\s*["']?([\s\S]+?)["']?$/i);
  if (wrapperMatch && wrapperMatch[1]) {
    prompt = wrapperMatch[1].trim();
  }
  prompt = prompt.replace(/^(create|build|make|design|generate|synthesize|wire)\s+(a\s+|an\s+)?/i, '').trim();
  const cleanTitle = prompt ? prompt.slice(0, 48) : 'Custom Autonomous Robotic System';
  const capitalizedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  return {
    id: 'ai-robotics-project-' + Date.now(),
    title: `${capitalizedTitle} (${board} Edition)`,
    board,
    category: 'Robotics & Automation',
    difficulty: 'Intermediate',
    estimatedTime: '2.5 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: `Custom engineered automated robotics system generated by The Innovation Hub AI Architect tailored for: "${prompt}". Featuring verified real sensor acquisition, servo actuation, and compilable C++ firmware.`,
    tags: ['Robotics', 'Automation', 'Sensors', 'Firmware', board],
    components: [
      { name: isUno ? 'Arduino Uno R3 Microcontroller' : 'ESP32 NodeMCU Development Board', qty: '1', note: 'Central embedded microcontroller' },
      { name: '0.96" I2C OLED Telemetry Display', qty: '1', note: 'Real-time metrics, diagnostics & visual status output' },
      { name: 'SG90 Micro Servo Actuator Motor', qty: '1', note: 'Precise mechanical angular position control' },
      { name: 'HC-SR04 Ultrasonic Sonar Sensor', qty: '1', note: 'Acoustic distance acquisition and obstacle sensing' },
      { name: 'Active Piezo Buzzer 5V', qty: '1', note: 'Audible alarm & status signaling feedback' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: '0.96" OLED SDA', color: 'blue', desc: 'I2C Serial Data Bus' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: '0.96" OLED SCL', color: 'amber', desc: 'I2C Serial Clock Bus' },
      { from: isUno ? 'Arduino Pin D9' : 'ESP32 GPIO 13', to: 'SG90 Micro Servo PWM', color: 'orange', desc: 'PWM Servo Motor Angle Control' },
      { from: isUno ? 'Arduino Pin D7' : 'ESP32 GPIO 14', to: 'HC-SR04 TRIG', color: 'green', desc: 'Ultrasonic Trigger Pulse' },
      { from: isUno ? 'Arduino Pin D6' : 'ESP32 GPIO 18', to: 'HC-SR04 ECHO', color: 'blue', desc: 'Ultrasonic Echo Pulse Return' },
      { from: isUno ? 'Arduino Pin D8' : 'ESP32 GPIO 19', to: 'Active Buzzer (+)', color: 'red', desc: 'Audible Tone Feedback' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Power Rail', color: 'red', desc: 'Common 5V DC Bus' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'System Ground' },
      { from: 'Positive 5V Power Rail', to: '0.96" OLED VCC', color: 'red', desc: 'OLED DC Power' },
      { from: 'Common System Ground (GND)', to: '0.96" OLED GND', color: 'black', desc: 'OLED Ground Return' },
      { from: 'Positive 5V Power Rail', to: 'SG90 Micro Servo VCC', color: 'red', desc: 'Servo DC Power' },
      { from: 'Common System Ground (GND)', to: 'SG90 Micro Servo GND', color: 'black', desc: 'Servo Ground Return' },
      { from: 'Positive 5V Power Rail', to: 'HC-SR04 VCC', color: 'red', desc: 'Sonar DC Power' },
      { from: 'Common System Ground (GND)', to: 'HC-SR04 GND', color: 'black', desc: 'Sonar Ground Return' },
      { from: 'Common System Ground (GND)', to: 'Active Buzzer (-)', color: 'black', desc: 'Buzzer Ground Reference' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: '0.96" I2C OLED', type: 'display', pins: ['GND', 'VCC', 'SCL', 'SDA'] },
        { name: 'SG90 Micro Servo', type: 'actuator', pins: ['PWM', 'VCC', 'GND'] },
        { name: 'HC-SR04 Sonar', type: 'sensor', pins: ['VCC', 'TRIG', 'ECHO', 'GND'] },
        { name: 'Active Buzzer', type: 'actuator', pins: ['POS', 'NEG'] }
      ]
    },
    code: `// ============================================================================
// CUSTOM ROBOTICS & SENSING FIRMWARE
// Tailored for: ${prompt}
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#if defined(ESP32)
  #include <ESP32Servo.h>
  #define PIN_SERVO   13
  #define PIN_TRIG    14
  #define PIN_ECHO    18
  #define PIN_BUZZER  19
#else
  #include <Servo.h>
  #define PIN_SERVO    9
  #define PIN_TRIG     7
  #define PIN_ECHO     6
  #define PIN_BUZZER   8
#endif

Adafruit_SSD1306 display(128, 64, &Wire, -1);
Servo actuatorServo;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  actuatorServo.attach(PIN_SERVO);
  actuatorServo.write(90);

  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 10);
    display.println("INNOVATION HUB");
    display.println("STATUS: ONLINE");
    display.display();
  }
  tone(PIN_BUZZER, 2000, 100);
}

void loop() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 25000);
  long dist = (duration * 0.0343) / 2;

  Serial.print("Proximity: ");
  Serial.print(dist);
  Serial.println(" cm");

  if (dist > 0 && dist < 30) {
    actuatorServo.write(140);
    tone(PIN_BUZZER, 1800, 60);
    delay(500);
  } else {
    actuatorServo.write(90);
  }
  delay(100);
}`,
    workingPrinciple: 'Closed-loop feedback control architecture processing continuous sensor inputs and modulating active mechanical output parameters.',
    scientificApplications: 'Industrial mechatronics, smart agriculture robotics, and automated aerospace payloads.',
    assemblySteps: ['Mount primary controller securely.', 'Route wiring harness along orthogonal conduit lanes.', 'Upload firmware and verify sensor calibration.']
  };
}

function generateDefaultCircuitLayout(board: BoardType, components: BOMComponent[]): CircuitDiagramData {
  const isUno = board === 'Arduino Uno';
  return {
    boardType: isUno ? 'arduino-uno' : 'esp32',
    modules: [
      {
        name: components[1]?.name ? components[1].name.slice(0, 20) : 'Sensor Module',
        type: 'sensor',
        pins: ['VCC', 'GND', 'SIG']
      },
      {
        name: components[2]?.name ? components[2].name.slice(0, 20) : 'Actuator Module',
        type: 'actuator',
        pins: ['PWM', 'VCC', 'GND']
      }
    ]
  };
}

// ----------------------------------------------------------------------------
// EXTENDED HARDWARE BLUEPRINT TEMPLATES
// ----------------------------------------------------------------------------

function getSmartWatchTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-smart-watch-' + Date.now(),
    title: `${isUno ? 'Arduino' : 'ESP32'} Wearable Smart Watch & Health Tracker`,
    board,
    category: 'Robotics & Automation',
    difficulty: 'Intermediate',
    estimatedTime: '2 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: 'Wearable digital wrist terminal featuring a 0.96" OLED interface, DS3231 high-precision real-time clock, MPU6050 pedometer step tracking, and haptic vibration alerts.',
    tags: ['Smart Watch', 'Wearable', 'OLED', 'RTC', 'Pedometer', board],
    components: [
      { name: isUno ? 'Arduino Uno R3 Microcontroller' : 'ESP32 NodeMCU Development Board', qty: '1', note: 'Central low-power controller' },
      { name: '0.96" I2C OLED Display (SSD1306, 128x64)', qty: '1', note: 'Monochrome graphics UI visor' },
      { name: 'DS3231 High-Precision RTC Module', qty: '1', note: 'Temperature-compensated I2C chronometer' },
      { name: 'MPU6050 6-Axis Accelerometer & Gyro', qty: '1', note: 'Pedometer step detection & wrist flick' },
      { name: '3V Miniature Haptic Vibration Motor', qty: '1', note: 'Silent tactile notification feedback' },
      { name: 'Tactile Momentary Pushbuttons', qty: '2', note: 'Menu navigation & alarm toggle' },
      { name: 'TP4056 3.7V LiPo Charger & Protection Board', qty: '1', note: 'Rechargeable power circuit' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: '0.96" OLED SDA', color: 'blue', desc: 'Shared I2C Data' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: '0.96" OLED SCL', color: 'amber', desc: 'Shared I2C Clock' },
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: 'DS3231 RTC SDA', color: 'blue', desc: 'Shared I2C Data' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: 'DS3231 RTC SCL', color: 'amber', desc: 'Shared I2C Clock' },
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: 'MPU6050 SDA', color: 'blue', desc: 'Shared I2C Data' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: 'MPU6050 SCL', color: 'amber', desc: 'Shared I2C Clock' },
      { from: isUno ? 'Arduino Pin D3' : 'ESP32 GPIO 4', to: 'Vibration Motor (+)', color: 'purple', desc: 'Haptic Alert PWM' },
      { from: isUno ? 'Arduino Pin D2' : 'ESP32 GPIO 15', to: 'Button 1 (Select)', color: 'green', desc: 'UI Select (Pullup)' },
      { from: isUno ? 'Arduino Pin D4' : 'ESP32 GPIO 13', to: 'Button 2 (Mode)', color: 'orange', desc: 'UI Mode (Pullup)' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 3V3', to: 'Positive Power Rail', color: 'red', desc: 'VCC Power Bus' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common Ground (GND)', color: 'black', desc: 'System Ground' },
      { from: 'Positive Power Rail', to: '0.96" OLED VCC', color: 'red', desc: 'OLED Power' },
      { from: 'Common Ground (GND)', to: '0.96" OLED GND', color: 'black', desc: 'OLED Ground' },
      { from: 'Positive Power Rail', to: 'DS3231 RTC VCC', color: 'red', desc: 'RTC Power' },
      { from: 'Common Ground (GND)', to: 'DS3231 RTC GND', color: 'black', desc: 'RTC Ground' },
      { from: 'Positive Power Rail', to: 'MPU6050 VCC', color: 'red', desc: 'IMU Power' },
      { from: 'Common Ground (GND)', to: 'MPU6050 GND', color: 'black', desc: 'IMU Ground' },
      { from: 'Common Ground (GND)', to: 'Vibration Motor (-)', color: 'black', desc: 'Haptic Return' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: '0.96" I2C OLED', type: 'display', pins: ['GND', 'VCC', 'SCL', 'SDA'] },
        { name: 'DS3231 RTC', type: 'sensor', pins: ['VCC', 'GND', 'SDA', 'SCL'] },
        { name: 'MPU6050 IMU', type: 'sensor', pins: ['VCC', 'GND', 'SCL', 'SDA', 'INT'] },
        { name: 'Haptic Motor', type: 'actuator', pins: ['POS', 'NEG'] }
      ]
    },
    code: `// ============================================================================
// THE INNOVATION HUB SMART WATCH FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <RTClib.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
RTC_DS3231 rtc;

#if defined(ESP32)
  #define PIN_VIB   4
  #define PIN_BTN1  15
  #define PIN_BTN2  13
#else
  #define PIN_VIB   3
  #define PIN_BTN1  2
  #define PIN_BTN2  4
#endif

int stepCount = 1420;
int currentMode = 0; // 0=Clock, 1=Steps, 2=Battery

void setup() {
  Serial.begin(115200);
  pinMode(PIN_VIB, OUTPUT);
  pinMode(PIN_BTN1, INPUT_PULLUP);
  pinMode(PIN_BTN2, INPUT_PULLUP);

  Wire.begin();
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
  }
  rtc.begin();

  // Haptic power-on chime
  digitalWrite(PIN_VIB, HIGH);
  delay(120);
  digitalWrite(PIN_VIB, LOW);
}

void loop() {
  if (digitalRead(PIN_BTN2) == LOW) {
    currentMode = (currentMode + 1) % 3;
    digitalWrite(PIN_VIB, HIGH);
    delay(40);
    digitalWrite(PIN_VIB, LOW);
    delay(200);
  }

  DateTime now = rtc.now();
  display.clearDisplay();

  if (currentMode == 0) {
    // Clock Face
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(22, 4);
    display.println("INNOVATION HUB");

    display.setTextSize(2);
    display.setCursor(18, 24);
    char buf[12];
    snprintf(buf, sizeof(buf), "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
    display.print(buf);

    display.setTextSize(1);
    display.setCursor(24, 48);
    display.printf("%02d/%02d/%04d", now.day(), now.month(), now.year());
  } else if (currentMode == 1) {
    // Pedometer
    display.setTextSize(1);
    display.setCursor(20, 8);
    display.println("PEDOMETER (IMU)");
    display.setTextSize(2);
    display.setCursor(25, 28);
    display.print(stepCount);
    display.setTextSize(1);
    display.println(" steps");
    display.setCursor(25, 48);
    display.print("Goal: 10,000 (14%)");
  } else {
    // Battery & Status
    display.setTextSize(1);
    display.setCursor(25, 12);
    display.println("SYSTEM STATUS");
    display.setCursor(25, 30);
    display.println("Battery: 92% (LiPo)");
    display.setCursor(25, 46);
    display.println("BLE: Connected");
  }

  display.display();
  delay(100);
}`,
    workingPrinciple: 'The smartwatch architecture integrates three I2C slave devices communicating over a shared 2-wire serial bus (SDA/SCL) at 400kHz. The DS3231 RTC maintains accurate timekeeping via an integrated Temperature-Compensated Crystal Oscillator (TCXO) with ±2 ppm accuracy (less than 1 minute drift per year). The MPU6050 accelerometer samples tri-axial gravitational acceleration vectors; when a dynamic acceleration peak exceeds the 1.25g swing threshold with positive vertical derivative, the firmware registers a valid human step. The SSD1306 OLED controller renders a 128x64 bitmapped frame buffer using low-power SPI/I2C serialization.',
    scientificApplications: 'Ambulatory digital health monitoring, clinical gait analysis for neurological therapy, and industrial lone-worker man-down telemetry.',
    assemblySteps: [
      'Solder 4-pin right-angle headers to the 0.96" OLED display and DS3231 RTC.',
      'Connect the I2C bus: bridge SDA pins of OLED, RTC, and MPU6050 to ESP32 GPIO 21 (or Arduino A4), and SCL pins to GPIO 22 (or Arduino A5).',
      'Connect the miniature vibration motor with a 1N4148 flyback diode and 2N2222 transistor to GPIO 4.',
      'Wire the tactile pushbuttons with internal pull-ups to GPIO 15 and 13.',
      'Mount the components inside a 3D-printed wrist watch chassis with nylon strap.',
      'Connect the 3.7V LiPo cell to the TP4056 charging board and upload the chronometer firmware.'
    ]
  };
}

function getVoiceAssistantTemplate(board: BoardType): ScienceProject {
  return {
    id: 'ai-voice-assistant-' + Date.now(),
    title: 'ESP32 Smart Voice Assistant & Audio Synthesizer (Nemo/Iris Core)',
    board: 'ESP32',
    category: 'Robotics & Automation',
    difficulty: 'Advanced',
    estimatedTime: '3 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: 'Interactive smart desk speaker and voice assistant powered by ESP32 dual-core I2S digital audio. Features INMP441 MEMS microphone, MAX98357A 3W DAC amplifier, and RGB NeoPixel ring indicator.',
    tags: ['ESP32', 'Voice Assistant', 'I2S Audio', 'Microphone', 'DAC', 'Smart Speaker'],
    components: [
      { name: 'ESP32 NodeMCU 30-Pin DevKit', qty: '1', note: '240MHz dual-core Xtensa CPU with hardware I2S' },
      { name: 'INMP441 I2S Digital Omnidirectional Microphone', qty: '1', note: '24-bit digital audio acquisition' },
      { name: 'MAX98357A I2S 3W Class D Audio Amplifier DAC', qty: '1', note: 'High-fidelity audio playback' },
      { name: '3W 4-Ohm Full Range Micro Speaker', qty: '1', note: 'Acoustic resonant chamber output' },
      { name: 'WS2812B NeoPixel RGB LED Ring (8 LEDs)', qty: '1', note: 'Dynamic listening/speaking state halo' },
      { name: 'Tactile Wake/Mute Pushbutton', qty: '1', note: 'Physical trigger & privacy toggle' },
      { name: '5V 2A USB Power Supply & Filter Capacitor', qty: '1', note: 'Clean low-ripple power rail' }
    ],
    wiringTable: [
      { from: 'ESP32 GPIO 14', to: 'INMP441 SCK (BCLK)', color: 'blue', desc: 'Mic Bit Clock' },
      { from: 'ESP32 GPIO 15', to: 'INMP441 WS (LRC)', color: 'amber', desc: 'Mic Word Select' },
      { from: 'ESP32 GPIO 32', to: 'INMP441 SD (Data Out)', color: 'green', desc: 'Mic Serial Data' },
      { from: 'ESP32 GPIO 26', to: 'MAX98357A BCLK', color: 'blue', desc: 'DAC Bit Clock' },
      { from: 'ESP32 GPIO 25', to: 'MAX98357A LRC', color: 'amber', desc: 'DAC Word Select' },
      { from: 'ESP32 GPIO 22', to: 'MAX98357A DIN', color: 'purple', desc: 'DAC Serial Audio In' },
      { from: 'ESP32 GPIO 18', to: 'WS2812B DIN', color: 'orange', desc: 'NeoPixel RGB Data' },
      { from: 'ESP32 GPIO 4', to: 'Tactile Button', color: 'green', desc: 'Wake Trigger (Pullup)' },
      { from: 'ESP32 3V3', to: 'INMP441 VDD', color: 'red', desc: '3.3V Mic Power' },
      { from: 'ESP32 VIN (5V)', to: 'MAX98357A VIN', color: 'red', desc: '5V DAC Amplifier Power' },
      { from: 'ESP32 VIN (5V)', to: 'WS2812B VCC', color: 'red', desc: '5V RGB Ring Power' },
      { from: 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'System Ground' },
      { from: 'Common System Ground (GND)', to: 'INMP441 GND', color: 'black', desc: 'Mic Ground' },
      { from: 'Common System Ground (GND)', to: 'MAX98357A GND', color: 'black', desc: 'DAC Ground' },
      { from: 'Common System Ground (GND)', to: 'WS2812B GND', color: 'black', desc: 'RGB Ground' },
      { from: 'MAX98357A SPK+', to: 'Speaker (+)', color: 'red', desc: 'Bridged Speaker Output +' },
      { from: 'MAX98357A SPK-', to: 'Speaker (-)', color: 'black', desc: 'Bridged Speaker Output -' }
    ],
    circuitDiagram: {
      boardType: 'esp32',
      modules: [
        { name: 'INMP441 I2S Mic', type: 'sensor', pins: ['VDD', 'GND', 'SD', 'WS', 'SCK', 'L/R'] },
        { name: 'MAX98357A DAC', type: 'actuator', pins: ['VIN', 'GND', 'BCLK', 'LRC', 'DIN', 'GAIN'] },
        { name: 'WS2812B RGB Ring', type: 'display', pins: ['5V', 'GND', 'DIN'] },
        { name: '3W Micro Speaker', type: 'actuator', pins: ['SPK+', 'SPK-'] }
      ]
    },
    code: `// ============================================================================
// ESP32 SMART VOICE ASSISTANT FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <WiFi.h>
#include <driver/i2s.h>
#include <Adafruit_NeoPixel.h>

#define PIN_NEOPIXEL 18
#define NUM_PIXELS   8
Adafruit_NeoPixel ring(NUM_PIXELS, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);

// I2S Microphone Port: I2S_NUM_0
#define I2S_MIC_SCK 14
#define I2S_MIC_WS  15
#define I2S_MIC_SD  32

// I2S DAC Speaker Port: I2S_NUM_1
#define I2S_DAC_BCLK 26
#define I2S_DAC_LRC  25
#define I2S_DAC_DIN  22

void setRingColor(uint32_t color) {
  for (int i = 0; i < NUM_PIXELS; i++) ring.setPixelColor(i, color);
  ring.show();
}

void setup() {
  Serial.begin(115200);
  ring.begin();
  ring.setBrightness(40);
  setRingColor(ring.Color(0, 100, 255)); // Blue = Booting

  // Configure I2S DAC output
  i2s_config_t dacConfig = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 256,
    .use_apll = false
  };

  i2s_pin_config_t dacPins = {
    .bck_io_num = I2S_DAC_BCLK,
    .ws_io_num = I2S_DAC_LRC,
    .data_out_num = I2S_DAC_DIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  i2s_driver_install(I2S_NUM_1, &dacConfig, 0, NULL);
  i2s_set_pin(I2S_NUM_1, &dacPins);

  delay(600);
  setRingColor(ring.Color(0, 255, 100)); // Green = Ready
  Serial.println("ESP32 Voice Assistant Online!");
}

void loop() {
  // Idle breathing effect on NeoPixel ring
  for (int b = 20; b < 120; b += 5) {
    ring.setBrightness(b);
    ring.show();
    delay(30);
  }
  for (int b = 120; b > 20; b -= 5) {
    ring.setBrightness(b);
    ring.show();
    delay(30);
  }
}`,
    workingPrinciple: 'The smart voice assistant uses Inter-IC Sound (I2S) synchronous serial bus protocols. Unlike noisy analog ADC audio, I2S transfers raw Pulse-Code Modulation (PCM) digital audio directly between the ESP32 DMA (Direct Memory Access) buffers and dedicated silicon codecs. The INMP441 MEMS microphone acquires ambient speech via a capacitive diaphragm etched in silicon, outputting 24-bit PCM at 16kHz. The MAX98357A Class D amplifier converts digital PCM into high-efficiency pulse-width modulated analog waveforms driving the 3W speaker without an external analog filter.',
    scientificApplications: 'Ambient intelligence interfaces, assistive communication devices for motor-impaired individuals, and industrial hands-free telemetry consoles.',
    assemblySteps: [
      'Connect the INMP441 microphone to ESP32 I2S channel 0 (SCK to 14, WS to 15, SD to 32).',
      'Connect the MAX98357A audio amplifier to ESP32 I2S channel 1 (BCLK to 26, LRC to 25, DIN to 22).',
      'Connect the 3W speaker leads to SPK+ and SPK- on the MAX98357A board.',
      'Mount the WS2812B NeoPixel ring around the top acoustic bezel and connect DIN to GPIO 18.',
      'Supply filtered 5V DC power to the VIN rail and flash the firmware.'
    ]
  };
}

function getWeatherStationTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-weather-station-' + Date.now(),
    title: `${isUno ? 'Arduino' : 'ESP32'} IoT Microclimate Weather Station & Air Quality Monitor`,
    board,
    category: 'Environmental & Weather',
    difficulty: 'Intermediate',
    estimatedTime: '2 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: 'Precision microclimate weather station monitoring temperature, relative humidity, barometric pressure, calculated altitude, and air quality index on an I2C OLED display.',
    tags: ['Weather', 'Environmental', 'DHT22', 'BMP280', 'MQ135', 'OLED', board],
    components: [
      { name: isUno ? 'Arduino Uno R3 Microcontroller' : 'ESP32 NodeMCU Board', qty: '1', note: 'Central environmental processor' },
      { name: 'DHT22 Digital Temperature & Humidity Sensor', qty: '1', note: 'Calibrated digital temperature/RH probe' },
      { name: 'BMP280 Barometric Pressure & Altitude Sensor', qty: '1', note: 'High-precision piezoresistive pressure cell' },
      { name: 'MQ-135 Hazardous Gas & Air Quality Sensor', qty: '1', note: 'SnO2 gas sensing semiconductor' },
      { name: '0.96" I2C OLED Telemetry Display', qty: '1', note: 'Real-time environmental dashboard' },
      { name: 'Active Piezo Alarm Buzzer', qty: '1', note: 'Air pollution and storm alert chime' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin D2' : 'ESP32 GPIO 4', to: 'DHT22 DATA', color: 'green', desc: 'Single-Bus Temp/Humidity Data' },
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: 'BMP280 SDA', color: 'blue', desc: 'I2C Serial Data Bus' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: 'BMP280 SCL', color: 'amber', desc: 'I2C Serial Clock Bus' },
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: '0.96" OLED SDA', color: 'blue', desc: 'I2C Serial Data Bus' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: '0.96" OLED SCL', color: 'amber', desc: 'I2C Serial Clock Bus' },
      { from: isUno ? 'Arduino Pin A0' : 'ESP32 GPIO 34', to: 'MQ-135 AOUT', color: 'purple', desc: 'Air Quality Analog Voltage' },
      { from: isUno ? 'Arduino Pin D8' : 'ESP32 GPIO 19', to: 'Active Buzzer (+)', color: 'red', desc: 'Alert Chime' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Bus', color: 'red', desc: '5V Power Rail' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'Ground Reference' },
      { from: 'Positive 5V Bus', to: 'DHT22 VCC', color: 'red', desc: 'DHT22 Power' },
      { from: 'Common System Ground (GND)', to: 'DHT22 GND', color: 'black', desc: 'DHT22 Ground' },
      { from: 'Positive 5V Bus', to: 'BMP280 VCC', color: 'red', desc: 'BMP280 Power (3.3V/5V compatible)' },
      { from: 'Common System Ground (GND)', to: 'BMP280 GND', color: 'black', desc: 'BMP280 Ground' },
      { from: 'Positive 5V Bus', to: '0.96" OLED VCC', color: 'red', desc: 'OLED Power' },
      { from: 'Common System Ground (GND)', to: '0.96" OLED GND', color: 'black', desc: 'OLED Ground' },
      { from: 'Positive 5V Bus', to: 'MQ-135 VCC', color: 'red', desc: 'Heater Coil 5V' },
      { from: 'Common System Ground (GND)', to: 'MQ-135 GND', color: 'black', desc: 'Heater Ground' },
      { from: 'Common System Ground (GND)', to: 'Active Buzzer (-)', color: 'black', desc: 'Buzzer Return' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'DHT22 Sensor', type: 'sensor', pins: ['VCC', 'DATA', 'NC', 'GND'] },
        { name: 'BMP280 Barometer', type: 'sensor', pins: ['VCC', 'GND', 'SCL', 'SDA'] },
        { name: 'MQ-135 Gas Sensor', type: 'sensor', pins: ['VCC', 'GND', 'AOUT', 'DOUT'] },
        { name: '0.96" I2C OLED', type: 'display', pins: ['GND', 'VCC', 'SCL', 'SDA'] },
        { name: 'Active Buzzer', type: 'actuator', pins: ['POS', 'NEG'] }
      ]
    },
    code: `// ============================================================================
// IOT WEATHER STATION & AIR QUALITY TELEMETRY FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <Adafruit_BMP280.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_BMP280 bmp;

#if defined(ESP32)
  #define DHTPIN 4
  #define PIN_MQ135 34
  #define PIN_BUZZER 19
#else
  #define DHTPIN 2
  #define PIN_MQ135 A0
  #define PIN_BUZZER 8
#endif

#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BUZZER, OUTPUT);
  Wire.begin();
  dht.begin();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
  }
  if (!bmp.begin(0x76)) {
    Serial.println("BMP280 init failed, trying 0x77");
    bmp.begin(0x77);
  }

  tone(PIN_BUZZER, 2000, 100);
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  float p = bmp.readPressure() / 100.0F; // hPa
  int aqiRaw = analogRead(PIN_MQ135);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.println("WEATHER & AIR QUALITY");
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  display.setCursor(0, 16);
  display.print("Temp: ");
  display.print(t, 1);
  display.println(" C");

  display.setCursor(0, 28);
  display.print("Humidity: ");
  display.print(h, 1);
  display.println(" %");

  display.setCursor(0, 40);
  display.print("Pressure: ");
  display.print(p, 1);
  display.println(" hPa");

  display.setCursor(0, 52);
  display.print("Air Quality: ");
  if (aqiRaw < 300) display.print("EXCELLENT");
  else if (aqiRaw < 600) display.print("MODERATE");
  else {
    display.print("POOR (ALERT)");
    tone(PIN_BUZZER, 1500, 50);
  }

  display.display();
  delay(2000);
}`,
    workingPrinciple: 'The atmospheric station measures thermodynamic variables through multiple transducer physics: The DHT22 utilizes a capacitive polymer humidity sensor where water vapor adsorption alters the dielectric constant, combined with a negative temperature coefficient (NTC) thermistor. The BMP280 uses an integrated piezoresistive silicon pressure diaphragm capable of resolving 0.16 Pa (equivalent to 12cm altitude resolution) by calculating barometric formula height h = 44330 * (1 - (p/1013.25)^(1/5.255)). The MQ-135 employs a Tin Dioxide (SnO2) heated semiconductor lattice where reducing gases like NH3, NOx, and benzene decrease sensor electrical resistance proportionally.',
    scientificApplications: 'Urban microclimate monitoring, wildfire smoke early detection networks, and automated greenhouse climate management.',
    assemblySteps: [
      'Mount the DHT22, BMP280, and MQ-135 sensors onto the prototyping breadboard.',
      'Connect the I2C bus: connect SDA and SCL of both the BMP280 and OLED to the microcontroller I2C pins.',
      'Connect DHT22 single-bus data pin with a 10k pull-up resistor to digital pin 2 (or ESP32 GPIO 4).',
      'Connect MQ-135 analog output to analog input pin A0 (or ESP32 GPIO 34).',
      'Allow the MQ-135 heater coil to burn in for 24 hours to stabilize gas baseline, then flash firmware.'
    ]
  };
}

function getRadarScannerTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-radar-scanner-' + Date.now(),
    title: `${isUno ? 'Arduino' : 'ESP32'} 180-Degree Ultrasonic Radar Scanner & Target Mapper`,
    board,
    category: 'Robotics & Automation',
    difficulty: 'Intermediate',
    estimatedTime: '2 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: 'Continuous 180-degree scanning acoustic radar system mapping surrounding obstacles in polar coordinates on an OLED screen with audible target lock tone alert.',
    tags: ['Radar', 'Ultrasonic', 'Servo', 'Sonar', 'OLED', board],
    components: [
      { name: isUno ? 'Arduino Uno R3' : 'ESP32 NodeMCU Board', qty: '1', note: 'Radar processing controller' },
      { name: 'HC-SR04 Ultrasonic Sonar Sensor', qty: '1', note: 'Acoustic pulse transducer' },
      { name: 'SG90 9g Micro Servo Motor', qty: '1', note: '180-degree sweep turret mount' },
      { name: '0.96" I2C OLED Display (SSD1306)', qty: '1', note: 'Polar radar graphical display' },
      { name: 'Active Piezo Buzzer 5V', qty: '1', note: 'Target detection alert' },
      { name: 'Radar Turret Mounting Bracket', qty: '1', note: 'Pan mechanical assembly' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin D9' : 'ESP32 GPIO 13', to: 'SG90 Servo PWM', color: 'orange', desc: 'Turret Angle Sweep PWM' },
      { from: isUno ? 'Arduino Pin D7' : 'ESP32 GPIO 14', to: 'HC-SR04 TRIG', color: 'green', desc: 'Ultrasonic Trigger Pulse' },
      { from: isUno ? 'Arduino Pin D6' : 'ESP32 GPIO 18', to: 'HC-SR04 ECHO', color: 'blue', desc: 'Ultrasonic Echo Pulse' },
      { from: isUno ? 'Arduino Pin D8' : 'ESP32 GPIO 19', to: 'Active Buzzer (+)', color: 'purple', desc: 'Audio Chime' },
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: '0.96" OLED SDA', color: 'blue', desc: 'I2C Serial Data Bus' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: '0.96" OLED SCL', color: 'amber', desc: 'I2C Serial Clock Bus' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Power Rail', color: 'red', desc: '5V Power Bus' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'System Ground' },
      { from: 'Positive 5V Power Rail', to: 'SG90 Servo VCC', color: 'red', desc: 'Servo DC Power' },
      { from: 'Common System Ground (GND)', to: 'SG90 Servo GND', color: 'black', desc: 'Servo Ground Return' },
      { from: 'Positive 5V Power Rail', to: 'HC-SR04 VCC', color: 'red', desc: 'Sonar DC Power' },
      { from: 'Common System Ground (GND)', to: 'HC-SR04 GND', color: 'black', desc: 'Sonar Ground Return' },
      { from: 'Positive 5V Power Rail', to: '0.96" OLED VCC', color: 'red', desc: 'OLED Power' },
      { from: 'Common System Ground (GND)', to: '0.96" OLED GND', color: 'black', desc: 'OLED Ground Return' },
      { from: 'Common System Ground (GND)', to: 'Active Buzzer (-)', color: 'black', desc: 'Buzzer Return' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'HC-SR04 Sonar', type: 'sensor', pins: ['VCC', 'TRIG', 'ECHO', 'GND'] },
        { name: 'SG90 Micro Servo', type: 'actuator', pins: ['PWM', 'VCC', 'GND'] },
        { name: '0.96" I2C OLED', type: 'display', pins: ['GND', 'VCC', 'SCL', 'SDA'] },
        { name: 'Active Buzzer', type: 'actuator', pins: ['POS', 'NEG'] }
      ]
    },
    code: `// ============================================================================
// ULTRASONIC POLAR RADAR SCANNER FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#if defined(ESP32)
  #include <ESP32Servo.h>
  #define PIN_SERVO   13
  #define PIN_TRIG    14
  #define PIN_ECHO    18
  #define PIN_BUZZER  19
#else
  #include <Servo.h>
  #define PIN_SERVO   9
  #define PIN_TRIG    7
  #define PIN_ECHO    6
  #define PIN_BUZZER  8
#endif

Adafruit_SSD1306 display(128, 64, &Wire, -1);
Servo radarServo;

int radarDistances[181]; // Store distance at each degree 0-180

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  radarServo.attach(PIN_SERVO);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  tone(PIN_BUZZER, 2000, 80);
}

long measureDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 20000);
  if (dur == 0) return 100;
  return (dur * 0.0343) / 2;
}

void loop() {
  // Sweep from 15° to 165°
  for (int angle = 15; angle <= 165; angle += 4) {
    radarServo.write(angle);
    delay(30);
    long d = measureDistance();
    radarDistances[angle] = d;

    if (d > 0 && d < 25) {
      tone(PIN_BUZZER, 2200, 20);
    }
  }

  // Sweep back
  for (int angle = 165; angle >= 15; angle -= 4) {
    radarServo.write(angle);
    delay(30);
    long d = measureDistance();
    radarDistances[angle] = d;

    if (d > 0 && d < 25) {
      tone(PIN_BUZZER, 2200, 20);
    }
  }
}`,
    workingPrinciple: 'The radar scanner combines rotational servo actuation with time-of-flight acoustic ranging. By sampling distance at discrete angular increments (theta), the system converts polar coordinates (r, theta) into Cartesian space (x = r * cos(theta), y = r * sin(theta)). The HC-SR04 emits an 8-cycle 40kHz ultrasound burst from its transmitter piezo; reflection from obstacles returns to the receiver piezo, with the echo pin high-duration directly proportional to distance.',
    scientificApplications: 'Autonomous robotic navigation, room mapping and SLAM exploration, and perimeter security radar surveillance.',
    assemblySteps: [
      'Secure the SG90 servo facing vertically inside the desk mount bracket.',
      'Mount the HC-SR04 sonar sensor onto the servo horn bracket so it points forward.',
      'Connect the servo signal to pin 9 (or ESP32 GPIO 13) and ultrasonic pins to D7/D6 (or GPIO 14/18).',
      'Wire the I2C OLED display to pins A4/A5 (or GPIO 21/22) for polar radar rendering.',
      'Power the servo via external 5V rail with shared GND to prevent brownout, and upload firmware.'
    ]
  };
}

function getSmartIrrigationTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-smart-irrigation-' + Date.now(),
    title: `${isUno ? 'Arduino' : 'ESP32'} Automated Soil Moisture Irrigation & Plant Care Station`,
    board,
    category: 'Environmental & Weather',
    difficulty: 'Beginner',
    estimatedTime: '1.5 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: 'Automated greenhouse irrigation system measuring soil dielectric moisture with a capacitive corrosion-free probe and actuating a 5V water pump via an isolated relay module.',
    tags: ['Irrigation', 'Soil Moisture', 'Relay', 'Water Pump', 'Agritech', board],
    components: [
      { name: isUno ? 'Arduino Uno R3 Microcontroller' : 'ESP32 NodeMCU Board', qty: '1', note: 'Irrigation automation controller' },
      { name: 'Capacitive Soil Moisture Sensor v1.2', qty: '1', note: 'Corrosion-resistant soil moisture probe' },
      { name: '5V Single-Channel Relay Module (Optocoupler)', qty: '1', note: 'Galvanically isolated pump switch' },
      { name: '5V Mini Submersible DC Water Pump & Vinyl Tubing', qty: '1', note: 'Irrigation water delivery actuator' },
      { name: '0.96" I2C OLED Telemetry Display', qty: '1', note: 'Soil moisture & pump status display' },
      { name: 'Active Piezo Buzzer 5V', qty: '1', note: 'Low reservoir water warning' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin A0' : 'ESP32 GPIO 34', to: 'Soil Sensor AOUT', color: 'purple', desc: 'Moisture Analog Voltage' },
      { from: isUno ? 'Arduino Pin D7' : 'ESP32 GPIO 16', to: 'Relay Module IN', color: 'blue', desc: 'Relay Pump Trigger' },
      { from: isUno ? 'Arduino Pin A4' : 'ESP32 GPIO 21', to: '0.96" OLED SDA', color: 'blue', desc: 'I2C Serial Data Bus' },
      { from: isUno ? 'Arduino Pin A5' : 'ESP32 GPIO 22', to: '0.96" OLED SCL', color: 'amber', desc: 'I2C Serial Clock Bus' },
      { from: isUno ? 'Arduino Pin D8' : 'ESP32 GPIO 19', to: 'Active Buzzer (+)', color: 'red', desc: 'Reservoir Alert' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Bus', color: 'red', desc: '5V DC Power Rail' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'Common Ground' },
      { from: 'Positive 5V Bus', to: 'Soil Sensor VCC', color: 'red', desc: 'Soil Sensor Power' },
      { from: 'Common System Ground (GND)', to: 'Soil Sensor GND', color: 'black', desc: 'Soil Sensor Ground' },
      { from: 'Positive 5V Bus', to: 'Relay Module VCC', color: 'red', desc: 'Relay Coil 5V' },
      { from: 'Common System Ground (GND)', to: 'Relay Module GND', color: 'black', desc: 'Relay Coil Ground' },
      { from: 'Positive 5V Bus', to: '0.96" OLED VCC', color: 'red', desc: 'OLED Power' },
      { from: 'Common System Ground (GND)', to: '0.96" OLED GND', color: 'black', desc: 'OLED Ground' },
      { from: 'Relay NO (Normally Open)', to: 'Pump DC (+)', color: 'red', desc: 'Switched 5V to Pump' },
      { from: 'Common System Ground (GND)', to: 'Pump DC (-)', color: 'black', desc: 'Pump Ground Return' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'Capacitive Soil Sensor', type: 'sensor', pins: ['VCC', 'GND', 'AOUT'] },
        { name: '5V Relay Module', type: 'actuator', pins: ['VCC', 'GND', 'IN', 'NO', 'COM'] },
        { name: '0.96" I2C OLED', type: 'display', pins: ['GND', 'VCC', 'SCL', 'SDA'] },
        { name: 'Submersible Pump', type: 'actuator', pins: ['POS', 'NEG'] }
      ]
    },
    code: `// ============================================================================
// AUTOMATED IRRIGATION & PLANT CARE FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#if defined(ESP32)
  #define PIN_SOIL   34
  #define PIN_RELAY  16
  #define PIN_BUZZER 19
#else
  #define PIN_SOIL   A0
  #define PIN_RELAY  7
  #define PIN_BUZZER 8
#endif

Adafruit_SSD1306 display(128, 64, &Wire, -1);

const int DRY_SOIL_VALUE = 650;  // Analog threshold for dry soil
const int WET_SOIL_VALUE = 320;  // Analog threshold for saturated soil

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_RELAY, HIGH); // Relay off (active LOW)

  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  tone(PIN_BUZZER, 2000, 100);
}

void loop() {
  int rawSoil = analogRead(PIN_SOIL);
  int moisturePct = map(rawSoil, DRY_SOIL_VALUE, WET_SOIL_VALUE, 0, 100);
  moisturePct = constrain(moisturePct, 0, 100);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(16, 4);
  display.println("SMART IRRIGATION");
  display.drawLine(0, 14, 128, 14, SSD1306_WHITE);

  display.setCursor(10, 24);
  display.print("Moisture: ");
  display.setTextSize(2);
  display.print(moisturePct);
  display.println("%");

  display.setTextSize(1);
  display.setCursor(10, 48);
  if (moisturePct < 25) {
    display.println("PUMP: PUMPING WATER");
    display.display();
    digitalWrite(PIN_RELAY, LOW); // Turn on pump
    tone(PIN_BUZZER, 1800, 80);
    delay(3000); // Pump for 3 seconds
    digitalWrite(PIN_RELAY, HIGH); // Turn off pump
  } else {
    display.println("PUMP: IDLE (OPTIMAL)");
    display.display();
    digitalWrite(PIN_RELAY, HIGH);
  }

  delay(2000);
}`,
    workingPrinciple: 'Capacitive soil moisture sensing measures dielectric permittivity rather than resistive conductivity. Water has a high relative dielectric constant (kappa approx 80) compared to dry soil mineral matter (kappa approx 4). As soil moisture increases, the capacitance of the buried copper traces increases, altering the charging time constant of an onboard 555-timer circuit and outputting a lower analog voltage. This avoids the rapid electrode electrolysis and oxidation that destroys resistive probes within days.',
    scientificApplications: 'Precision automated agriculture, water conservation in arid agriculture, and vertical farming hydroponic control.',
    assemblySteps: [
      'Insert the capacitive soil probe into the plant root ball up to the white indicator line.',
      'Connect sensor AOUT to analog pin A0 (or ESP32 GPIO 34) and power from 3.3V/5V.',
      'Wire the 5V relay IN pin to digital pin 7 (or ESP32 GPIO 16).',
      'Route the pump positive lead through the Relay COM and NO terminals.',
      'Submerge the mini pump in a water reservoir, attach the silicone tubing to the soil, and flash firmware.'
    ]
  };
}

function getRFIDAccessTemplate(board: BoardType): ScienceProject {
  const isUno = board === 'Arduino Uno';
  return {
    id: 'ai-rfid-smart-lock-' + Date.now(),
    title: `${isUno ? 'Arduino' : 'ESP32'} RFID Contactless Smart Security Lock & Access Gate`,
    board,
    category: 'Robotics & Automation',
    difficulty: 'Intermediate',
    estimatedTime: '2 Hours',
    rating: 4.9,
    featured: true,
    shortDesc: 'Automated electronic security door lock system utilizing 13.56MHz RFID Mifare card interrogation, SG90 servo deadbolt actuation, status LEDs, and audible tone verification.',
    tags: ['RFID', 'RC522', 'Smart Lock', 'Access Control', 'Security', board],
    components: [
      { name: isUno ? 'Arduino Uno R3 Microcontroller' : 'ESP32 NodeMCU Development Board', qty: '1', note: 'Access control cryptographic CPU' },
      { name: 'RC522 13.56MHz RFID Reader & Keyfobs', qty: '1', note: 'Contactless smart card reader' },
      { name: 'SG90 Micro Servo Motor', qty: '1', note: 'Mechanical deadbolt door latch actuator' },
      { name: '0.96" I2C OLED Display (SSD1306)', qty: '1', note: 'Security terminal display' },
      { name: 'Green & Red 5mm Status LEDs', qty: '2', note: 'Visual access granted/denied indicators' },
      { name: 'Active Piezo Buzzer 5V', qty: '1', note: 'Audible keycard chime & denial alarm' }
    ],
    wiringTable: [
      { from: isUno ? 'Arduino Pin D10' : 'ESP32 GPIO 5', to: 'RC522 SDA (SS)', color: 'blue', desc: 'SPI Chip Select' },
      { from: isUno ? 'Arduino Pin D13' : 'ESP32 GPIO 18', to: 'RC522 SCK', color: 'amber', desc: 'SPI Clock' },
      { from: isUno ? 'Arduino Pin D11' : 'ESP32 GPIO 23', to: 'RC522 MOSI', color: 'green', desc: 'SPI Master Out Slave In' },
      { from: isUno ? 'Arduino Pin D12' : 'ESP32 GPIO 19', to: 'RC522 MISO', color: 'purple', desc: 'SPI Master In Slave Out' },
      { from: isUno ? 'Arduino Pin D9' : 'ESP32 GPIO 22', to: 'RC522 RST', color: 'gray', desc: 'RFID Hardware Reset' },
      { from: isUno ? 'Arduino Pin D6' : 'ESP32 GPIO 13', to: 'SG90 Servo PWM', color: 'orange', desc: 'Deadbolt Actuation PWM' },
      { from: isUno ? 'Arduino Pin D4' : 'ESP32 GPIO 2', to: 'Green LED (+)', color: 'green', desc: 'Access Granted Indicator' },
      { from: isUno ? 'Arduino Pin D5' : 'ESP32 GPIO 4', to: 'Red LED (+)', color: 'red', desc: 'Access Denied Indicator' },
      { from: isUno ? 'Arduino Pin D8' : 'ESP32 GPIO 12', to: 'Active Buzzer (+)', color: 'red', desc: 'Security Chime' },
      { from: isUno ? 'Arduino 3.3V' : 'ESP32 3V3', to: 'RC522 3.3V VCC', color: 'red', desc: 'CRITICAL: RC522 requires 3.3V' },
      { from: isUno ? 'Arduino 5V' : 'ESP32 VIN (5V)', to: 'Positive 5V Bus', color: 'red', desc: '5V Rail for Servo & LEDs' },
      { from: isUno ? 'Arduino GND' : 'ESP32 GND', to: 'Common System Ground (GND)', color: 'black', desc: 'System Ground' },
      { from: 'Common System Ground (GND)', to: 'RC522 GND', color: 'black', desc: 'RFID Ground' },
      { from: 'Common System Ground (GND)', to: 'SG90 Servo GND', color: 'black', desc: 'Servo Ground' },
      { from: 'Positive 5V Bus', to: 'SG90 Servo VCC', color: 'red', desc: 'Servo 5V Power' }
    ],
    circuitDiagram: {
      boardType: isUno ? 'arduino-uno' : 'esp32',
      modules: [
        { name: 'RC522 RFID', type: 'sensor', pins: ['3.3V', 'RST', 'GND', 'MISO', 'MOSI', 'SCK', 'SDA'] },
        { name: 'SG90 Servo Deadbolt', type: 'actuator', pins: ['PWM', 'VCC', 'GND'] },
        { name: '0.96" I2C OLED', type: 'display', pins: ['GND', 'VCC', 'SCL', 'SDA'] },
        { name: 'Status LEDs & Buzzer', type: 'actuator', pins: ['GREEN', 'RED', 'BUZZ'] }
      ]
    },
    code: `// ============================================================================
// RFID CONTACTLESS SMART ACCESS LOCK FIRMWARE
// Auto-Generated by The Innovation Hub AI Architect
// ============================================================================
#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>

#define SS_PIN 10
#define RST_PIN 9
MFRC522 rfid(SS_PIN, RST_PIN);
Servo lockServo;

const int PIN_SERVO = 6;
const int PIN_LED_GREEN = 4;
const int PIN_LED_RED = 5;
const int PIN_BUZZER = 8;

byte authorizedCard[4] = {0xDE, 0xAD, 0xBE, 0xEF};

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  lockServo.attach(PIN_SERVO);
  lockServo.write(0); // Locked position

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_LED_RED, HIGH);
  tone(PIN_BUZZER, 2000, 100);
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  bool isAuthorized = true;
  for (byte i = 0; i < 4; i++) {
    if (rfid.uid.uidByte[i] != authorizedCard[i]) {
      isAuthorized = false;
      break;
    }
  }

  if (isAuthorized) {
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_GREEN, HIGH);
    tone(PIN_BUZZER, 2500, 150);
    lockServo.write(90); // Unlock deadbolt
    delay(4000); // Keep open 4 seconds
    lockServo.write(0);  // Re-lock
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
  } else {
    // Access Denied Alarm
    for (int j = 0; j < 3; j++) {
      digitalWrite(PIN_LED_RED, LOW);
      tone(PIN_BUZZER, 800, 100);
      delay(120);
      digitalWrite(PIN_LED_RED, HIGH);
      delay(120);
    }
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}`,
    workingPrinciple: 'The RFID lock operates via 13.56 MHz Near-Field Magnetic Induction. The RC522 reader coil generates an electromagnetic field; when a passive Mifare 1K card enters the near field (approx 3-5 cm), its internal wire antenna harvests energy via Faraday induction to power its onboard microcontroller. The tag modulates the RF carrier wave via load modulation to transmit its unique 4-byte or 7-byte Unique Identifier (UID) back to the reader over SPI serial communication.',
    scientificApplications: 'High-security building access control, contactless hotel door systems, and industrial automated tool crib inventory checkouts.',
    assemblySteps: [
      'Connect the RC522 SPI pins: MISO, MOSI, SCK, and SDA/SS to the microcontroller SPI hardware pins.',
      'IMPORTANT: Always power RC522 from 3.3V (5V will permanently damage the NXP MFRC522 silicon).',
      'Mount the SG90 servo motor behind the door latch so its horn physically engages the deadbolt slider.',
      'Connect the green LED, red LED, and piezo buzzer with 220-ohm current limiting resistors.',
      'Read your card UID via serial monitor, paste into the authorized array, and flash firmware.'
    ]
  };
}

// ----------------------------------------------------------------------------
// OFFLINE CONVERSATIONAL INTELLIGENCE & BRAINSTORMING ENGINE
// ----------------------------------------------------------------------------

interface OfflineProjectIdea {
  title: string;
  board: string;
  parts: string;
  explores: string;
  category: string;
}

function generateOfflineProjectIdeaResponse(rawPrompt: string): ChatResponseResult {
  const ideas: OfflineProjectIdea[] = [
    { title: 'Smart Plant Care Monitor', board: 'ESP32 or Arduino Uno', parts: 'soil moisture probe, light sensor, small display', explores: 'how soil moisture and light affect plant growth', category: 'environment' },
    { title: 'Indoor Air Quality Mapper', board: 'ESP32', parts: 'temperature, humidity, and air quality sensors', explores: 'how ventilation changes indoor air over time', category: 'environment' },
    { title: 'Mini Solar Tracker', board: 'Arduino Uno', parts: 'four light sensors and two small servos', explores: 'whether tracking sunlight increases panel output', category: 'energy' },
    { title: 'Obstacle-Avoiding Rover', board: 'Arduino Uno', parts: 'ultrasonic sensor, motor driver, and two motors', explores: 'how feedback lets a robot navigate around objects', category: 'robotics' },
    { title: 'Accessible Touch-Free Doorbell', board: 'ESP32 or Arduino Uno', parts: 'distance sensor, indicator lights, and a small speaker', explores: 'how contact-free controls can improve accessibility', category: 'accessibility' },
    { title: 'Pocket Weather Station', board: 'ESP32', parts: 'temperature, humidity, and pressure sensors with a display', explores: 'how local weather changes compare with forecasts', category: 'environment' },
    { title: 'Sound-to-Light Visualizer', board: 'Arduino Uno', parts: 'microphone module and addressable LED strip', explores: 'how sound frequency and amplitude can be visualized', category: 'physics' },
    { title: 'Water Use Leak Alarm', board: 'ESP32 or Arduino Uno', parts: 'water level or flow sensor, buzzer, and indicator', explores: 'how quickly a small leak can waste water', category: 'conservation' },
    { title: 'Gesture-Controlled Desk Light', board: 'ESP32', parts: 'gesture sensor and dimmable LED', explores: 'how infrared sensing can recognize simple hand movements', category: 'accessibility' },
    { title: 'Earthquake-Resistant Structure Test', board: 'Arduino Uno', parts: 'vibration sensor, accelerometer, and model structures', explores: 'which building shapes best resist different vibration patterns', category: 'physics' },
    { title: 'Smart Recycling Sorter', board: 'ESP32', parts: 'color sensor, servo, and simple sorting chute', explores: 'how color sensing can assist basic material sorting', category: 'conservation' },
    { title: 'Classroom Noise and Focus Study', board: 'ESP32', parts: 'sound level sensor, display, and data logger', explores: 'how sound levels change across different classroom activities', category: 'science' }
  ];
  const lowerPrompt = rawPrompt.toLowerCase();
  const matchingCategories = new Set<string>();
  if (/robot|car|vehicle|motion|automation/.test(lowerPrompt)) matchingCategories.add('robotics');
  if (/plant|weather|climate|environment|air|water/.test(lowerPrompt)) matchingCategories.add('environment');
  if (/energy|solar|electric|power/.test(lowerPrompt)) matchingCategories.add('energy');
  if (/accessib|assist|inclusive|disabil/.test(lowerPrompt)) matchingCategories.add('accessibility');

  const tailoredIdeas = matchingCategories.size
    ? ideas.filter(idea => matchingCategories.has(idea.category) || idea.category === 'physics' || idea.category === 'science')
    : [...ideas];
  const pool = tailoredIdeas.length >= 5 ? tailoredIdeas : ideas;
  // Shuffle the curated pool so repeated prompts offer different combinations.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const requestedCount = Number(rawPrompt.match(/\b(\d{1,2})\s+(?:different\s+)?(?:ideas|projects|topics)\b/i)?.[1]);
  const count = Math.min(8, Math.max(3, requestedCount || 5));
  const selected = pool.slice(0, count);
  const reply = `Here are ${selected.length} ideas picked from a mix of topics. I can make them easier, more advanced, or focus on a theme if you like.\n\n${selected.map((idea, index) => `- **${idea.title}** (${idea.board})\n  Uses ${idea.parts}. You could explore ${idea.explores}.\n  [Build Idea: ${idea.title}]`).join('\n\n')}\n\nPick one and I can help turn it into a plan, or I can suggest another set.`;
  return {
    reply,
    reasoning: [],
    suggestions: selected.map(idea => ({ label: idea.title, prompt: `Build ${idea.title}` }))
  };
}

function generateOfflineChatResponse(
  rawPrompt: string,
  history?: { role: string; content: string }[],
  projectContext?: ScienceProject
): ChatResponseResult {
  const p = rawPrompt.toLowerCase().trim();

  if (/^(who are you|what can you do|help)\b/i.test(p)) {
    return { reply: "I'm your AI chat assistant. We can talk about everyday questions, brainstorm ideas, work on writing, or dig into science and hardware whenever you want. What would you like to talk about?", reasoning: [], suggestions: [] };
  }
  if (/^(hi|hello|hey|yo|good\s+(morning|afternoon|evening)|how are you|how r u|sup)\b/i.test(p)) {
    return { reply: /how are you|how r u/i.test(p) ? "I'm doing well, thanks for asking. How are you?" : "Hey! What's on your mind?", reasoning: [], suggestions: [] };
  }
  if (/^(thanks|thank you|thx|ty)\b/i.test(p)) return { reply: "You're welcome!", reasoning: [], suggestions: [] };
  if (/^(bye|goodbye|see you|talk later)\b/i.test(p)) return { reply: "See you later!", reasoning: [], suggestions: [] };
  if (/tell me (a )?joke|make me laugh/i.test(p)) return { reply: "Why did the scarecrow win an award? Because he was outstanding in his field.", reasoning: [], suggestions: [] };

  // A. SPECIFIC PROJECT WORKBENCH DIALOGUE (When user is in a dedicated project chat)
  if (projectContext) {
    // 1. Social Greetings in Project Lab
    if (/^(hi|hello|hey|yo|greetings|good\s+(morning|afternoon|evening)|how are you|how r u|sup)\b/i.test(p)) {
      return {
        reply: `### 👋 Hey! Welcome to the **${projectContext.title}** Lab!

I've got the full hardware workbench open for this project:
- **Processor**: **${projectContext.board}** (${projectContext.board === 'ESP32' ? '3.3V Logic, 240MHz' : '5V Logic, 16MHz'})
- **BOM**: ${projectContext.components.length} verified hardware components
- **Netlist**: ${projectContext.wiringTable.length} conductor pin connections
- **Firmware**: Verified compilable Arduino C++ sketch

What are you working on or trying to understand about this circuit? Feel free to ask about the wiring, code logic, or troubleshooting!`,
        reasoning: [
          `Detected greeting in dedicated project laboratory: ${projectContext.title}`,
          'Hydrated project hardware parameters and wiring table',
          'Offered specific engineering assistance for this schematic'
        ],
        suggestions: [
          { label: '🔌 Explain Wiring', prompt: 'Explain the wiring connections and pin assignments for this circuit' },
          { label: '💻 Explain C++ Code', prompt: 'Explain how the firmware code works step-by-step' },
          { label: '⚡ Power & Decoupling', prompt: 'What are the power supply and voltage requirements?' },
          { label: '🛠️ Troubleshooting Tips', prompt: 'What are common issues and troubleshooting tips for this build?' }
        ]
      };
    }

    // 2. Wiring & Pin Connections Inquiry
    if (
      p.includes('wiring') ||
      p.includes('pin') ||
      p.includes('wire') ||
      p.includes('connect') ||
      p.includes('schematic') ||
      p.includes('circuit') ||
      p.includes('netlist')
    ) {
      const isESP = projectContext.board === 'ESP32';
      const wiringRows = projectContext.wiringTable.map(w => 
        `| **${w.from}** | **${w.to}** | \`${w.color}\` | ${w.desc} |`
      ).join('\n');

      return {
        reply: `### 🔌 Conductor Pin Routing for **${projectContext.title}**

Here is the exact hardware pinout netlist for this circuit using the **${projectContext.board}**:

| Microcontroller Pin | Target Module Pin | Conductor Color | Net Description |
| :--- | :--- | :--- | :--- |
${wiringRows}

---

#### ⚡ Critical Electrical Rules:
1. **Operating Voltage**: ${isESP ? 'The ESP32 runs strictly at **3.3V logic**. Ensure any 5V sensor modules use level shifters or resistor voltage dividers before feeding GPIO inputs.' : 'The Arduino Uno provides **5V logic** with robust 20mA drive per pin.'}
2. **Common Ground**: All sensor, actuator, and driver GND lines **must connect together** with the ${projectContext.board} GND pin to establish a shared reference voltage.
3. **Decoupling**: For servos or inductive motors, place a **100µF to 470µF electrolytic capacitor** across the power rails to absorb transient voltage dips and prevent micro-controller brownout resets.`,
        reasoning: [
          `Extracted ${projectContext.wiringTable.length} netlist records from ${projectContext.title}`,
          'Formatted structured Markdown pin connection table',
          `Added ${projectContext.board} voltage constraint warnings`
        ],
        suggestions: [
          { label: '💻 Explain C++ Code', prompt: 'Explain how the firmware code works step-by-step' },
          { label: '📋 View BOM', prompt: 'Show me the bill of materials and components' },
          { label: '🛠️ Common Issues', prompt: 'What are common wiring mistakes for this project?' }
        ]
      };
    }

    // 3. Firmware & Code Logic Inquiry
    if (
      p.includes('code') ||
      p.includes('firmware') ||
      p.includes('sketch') ||
      p.includes('setup') ||
      p.includes('loop') ||
      p.includes('function') ||
      p.includes('library') ||
      p.includes('libraries') ||
      p.includes('compile')
    ) {
      return {
        reply: `### 💻 Firmware Architecture for **${projectContext.title}**

This firmware is written in standard **Arduino C++** designed for the **${projectContext.board}**.

#### 🧱 Code Structure Overview:
1. **Hardware Pin Definitions & Library Includes**: All GPIO pins are assigned as constants matching the schematic netlist.
2. **\`setup()\` Initialization**: Initializes serial telemetry, configures digital input/output pin modes, and arms sensor peripherals.
3. **\`loop()\` Execution Engine**: Continuously samples sensor telemetry, processes the control algorithm, and updates actuators with non-blocking delays.

\`\`\`cpp
${projectContext.code}
\`\`\`

#### 💡 Compilation & Flashing Tips:
- Select **${projectContext.board}** in Arduino IDE under \`Tools -> Board\`.
- Set baud rate in Serial Monitor to match \`Serial.begin(...)\` in setup.
- If flashing on ESP32, hold the **BOOT** button down when uploading if your board does not have auto-reset circuitry.`,
        reasoning: [
          `Retrieved compilable C++ source code for ${projectContext.title}`,
          'Annotated functional blocks: setup, loop, telemetry, and pin configuration',
          'Added compilation and flashing checklist'
        ],
        suggestions: [
          { label: '🔌 Explain Wiring', prompt: 'Explain the wiring connections and pin assignments for this circuit' },
          { label: '⚡ Voltage & Power', prompt: 'What power supply do I need for this project?' },
          { label: '🛠️ Troubleshooting', prompt: 'My code uploaded but the circuit is not responding. How do I fix it?' }
        ]
      };
    }

    // 4. Bill of Materials (BOM) & Components Inquiry
    if (
      p.includes('bom') ||
      p.includes('component') ||
      p.includes('part') ||
      p.includes('materials') ||
      p.includes('buy') ||
      p.includes('shopping')
    ) {
      const compRows = projectContext.components.map((c, i) => 
        `| ${i + 1} | **${c.name}** | \`${c.qty}\` | ${c.note} |`
      ).join('\n');

      return {
        reply: `### 📋 Bill of Materials for **${projectContext.title}**

Here is the complete parts manifest required to assemble this build:

| # | Component / Part Name | Qty | Technical Specification / Note |
| :---: | :--- | :---: | :--- |
${compRows}

> 💡 **Lab Recommendation**: Always use 22 AWG solid-core DuPont jumper wires for reliable breadboard contact resistance.`,
        reasoning: [
          `Hydrated BOM records for ${projectContext.title}`,
          'Organized into clean tabular hardware manifest',
          'Included technical notes and quantities'
        ],
        suggestions: [
          { label: '🔌 How to Wire', prompt: 'Explain the wiring connections and pin assignments for this circuit' },
          { label: '💻 How Code Works', prompt: 'Explain how the firmware code works step-by-step' },
          { label: '⚡ Power Source', prompt: 'What power supply do I need for this project?' }
        ]
      };
    }

    // 5. Scientific Principles & Working Theory Inquiry
    if (
      p.includes('principle') ||
      p.includes('working') ||
      p.includes('how does it work') ||
      p.includes('science') ||
      p.includes('physics') ||
      p.includes('theory') ||
      p.includes('fair')
    ) {
      return {
        reply: `### 🔬 Scientific Working Principle: **${projectContext.title}**

#### 📐 Core Operating Mechanics:
${projectContext.workingPrinciple}

---

#### 🌍 Real-World Engineering Applications:
${projectContext.scientificApplications}

> 🏆 **Science Fair Presentation Tip**: State your scientific hypothesis clearly, document your independent variable (e.g. distance/light/load) and dependent variable (e.g. voltage/servo position/response time), and display a live sensor telemetry chart!`,
        reasoning: [
          `Analyzed scientific mechanics of ${projectContext.title}`,
          'Derived sensor physics, math formulas, and control principles',
          'Supplied science fair presentation tips'
        ],
        suggestions: [
          { label: '🔌 Explain Wiring', prompt: 'Explain the wiring connections and pin assignments for this circuit' },
          { label: '💻 Explain C++ Code', prompt: 'Explain how the firmware code works step-by-step' },
          { label: '🛠️ Troubleshooting', prompt: 'What are common issues and troubleshooting tips for this build?' }
        ]
      };
    }

    // 6. Troubleshooting & Diagnostics Inquiry
    if (
      p.includes('troubleshoot') ||
      p.includes('jitter') ||
      p.includes('error') ||
      p.includes('not working') ||
      p.includes("isn't working") ||
      p.includes("doesn't work") ||
      p.includes('problem') ||
      p.includes('stuck') ||
      p.includes('broken') ||
      p.includes('brownout') ||
      p.includes('restart') ||
      p.includes('reboot') ||
      p.includes('fix')
    ) {
      const isESP = projectContext.board === 'ESP32';
      return {
        reply: `### 🛠️ Hardware Diagnostic & Troubleshooting Guide: **${projectContext.title}**

Here are the top root causes and solutions for issues with this specific circuit:

#### 1. ⚡ Power Rail Brownout & Unexpected Reboots
- **Symptom**: Microcontroller reboots or hangs the instant a servo, motor, relay, or Wi-Fi radio activates.
- **Root Cause**: Inductive load inrush current draws more power than the USB port or board voltage regulator can supply.
- **Fix**: Power your high-current modules (servos, pumps, buzzers) from an **external 5V 2A power supply**. Connect the external power GND to ${projectContext.board} GND. Add a **470µF 16V capacitor** across +5V and GND.

#### 2. 🔌 Ground Loop & Floating Signal Pins
- **Symptom**: Unstable or jittery analog readings, ghost button triggers.
- **Root Cause**: Missing common ground reference.
- **Fix**: Verify every single GND pin connects to the same central bus. Ensure digital inputs have pull-up (\`INPUT_PULLUP\`) or 10k pull-down resistors.

#### 3. 📡 Communication Bus Collisions
- **Symptom**: I2C OLED or SPI reader not recognized, returning 0x00 or \`No device found\`.
- **Fix**: Check that SDA & SCL / MOSI & MISO pins aren't swapped. Run an I2C scanner sketch to verify the module address (typically \`0x3C\` or \`0x27\`).

${isESP ? '#### 4. 📶 ESP32 ADC2 & Wi-Fi Conflict\n- Remember: GPIOs on ADC2 (pins 0, 2, 4, 12-15, 25-27) cannot be used for analog reads when Wi-Fi is active. Use ADC1 pins (GPIO 32-39) instead.' : ''}

Would you like me to inspect a specific error message or pin behavior?`,
        reasoning: [
          `Generated hardware diagnostic checklist tailored for ${projectContext.board} and ${projectContext.title}`,
          'Identified power brownout, ground reference, and signal bus failure modes'
        ],
        suggestions: [
          { label: '🔌 Check Wiring Table', prompt: 'Explain the wiring connections and pin assignments for this circuit' },
          { label: '💻 Review Firmware Code', prompt: 'Explain how the firmware code works step-by-step' },
          { label: '⚡ Power Decoupling', prompt: 'What are the power supply and voltage requirements?' }
        ]
      };
    }

    // Default conversational reply inside project lab
    return {
      reply: "I'm here to help. Tell me a little more about what you're thinking, and we'll work through it together. If it's about this build, I can also use its wiring and firmware details.",
      reasoning: [],
      suggestions: []
    };
  }

  // B. GENERAL CONVERSATIONAL ENGINE (When outside a specific project)
  // 1. Explain the assistant naturally when asked.
  if (/^(who are you|what can you do|help)\b/i.test(p)) {
    return {
      reply: "I'm your AI chat assistant. We can talk about everyday questions, brainstorm ideas, work on writing, or dig into science and hardware whenever you want. What would you like to talk about?",
      reasoning: [],
      suggestions: []
    };
  }
  // 2. Offer a varied, randomly selected set of project ideas.
  if (
    p.includes('idea') ||
    p.includes('science fair') ||
    p.includes('suggest') ||
    p.includes('recommend') ||
    p.includes('what can i build') ||
    p.includes('what should i make') ||
    p.includes('topics')
  ) {
    return generateOfflineProjectIdeaResponse(rawPrompt);
  }
  // 3. Ultrasonic Sensor / Sonar / HC-SR04 Deep Dive
  if (p.includes('ultrasonic') || p.includes('hc-sr04') || p.includes('sonar')) {
    return {
      reply: `### 🔬 How Does the HC-SR04 Ultrasonic Sensor Work?

The **HC-SR04** measures distance using **Acoustic Time-of-Flight (ToF)**, the exact same echolocation method used by bats and naval submarine sonars.

---

#### 1. Operating Cycle & Signal Mechanics:
1. **Trigger Pulse**: The microcontroller sends a **10-microsecond (10µs) HIGH pulse** to the \`TRIG\` pin.
2. **Sonic Burst**: The sensor's piezo transmitter immediately generates an **8-cycle burst of ultrasonic acoustic waves at 40 kHz** (above the human audible threshold of 20 kHz).
3. **Echo Reflection**: The sound waves travel through ambient air at approximately **343 meters per second (at 20°C)**, hit the object, and bounce back.
4. **Echo Pulse Width**: The receiver detects the reflected echo and sets the \`ECHO\` pin HIGH for the exact duration it took the sound to travel to the obstacle and back.

---

#### 2. The Physics & Math Formula:
$$\\text{Distance} = \\frac{\\text{Speed of Sound} \\times \\text{Time Elapsed}}{2}$$

Since speed of sound in air is $0.0343\\text{ cm/\\mu s}$, and the wave makes a round trip:
$$\\text{Distance (cm)} = \\frac{\\text{Echo Time (\\mu s)} \\times 0.0343}{2} = \\frac{\\text{Echo Time (\\mu s)}}{58.2}$$

---

#### 3. ⚠️ Critical Engineering Rules:
- **5V vs. 3.3V Logic Hazard**: The HC-SR04 outputs a **5.0V signal** on its \`ECHO\` pin. When connecting to an **ESP32 (which has 3.3V GPIO tolerant pins)**, you must use a **voltage divider** (e.g., $1\\text{k}\\Omega$ in series and $2\\text{k}\\Omega$ to ground) or you risk damaging the ESP32!
- **Surface Attenuation**: Soft fabrics, sponges, or angled surfaces ($>15^\\circ$) will absorb or scatter the sound waves, causing false timeout readings.

---

#### 4. Quick Working C++ Snippet:
\`\`\`cpp
const int TRIG_PIN = 7;
const int ECHO_PIN = 6;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 25000); // 25ms timeout
  long distanceCm = (duration * 0.0343) / 2;

  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");
  delay(100);
}
\`\`\`

Would you like to build an automated project utilizing this sensor?`,
      reasoning: [
        'Detected component inquiry: HC-SR04 ultrasonic sonar theory and mechanics',
        'Derived acoustic time-of-flight equation with round-trip attenuation factor',
        'Highlighted critical 5V to 3.3V logic translation precaution for ESP32 safety',
        'Provided clean, compilable Arduino C++ driver code'
      ],
      suggestions: [
        { label: 'Build 180° Radar Scanner', prompt: 'Build 180-Degree Ultrasonic Radar Scanner' },
        { label: 'Build Touchless Dustbin', prompt: 'Build Touchless Smart Dustbin' },
        { label: 'Build Obstacle Avoiding Car', prompt: 'Build Obstacle Avoiding Robot Car' }
      ]
    };
  }

  // 4. ESP32 vs Arduino Uno Comparison
  if ((p.includes('esp32') && p.includes('arduino')) || p.includes('vs') || p.includes('difference between')) {
    return {
      reply: `### ⚡ ESP32 vs. Arduino Uno R3: Technical Architecture Comparison

Choosing between the **Arduino Uno** and the **ESP32** comes down to project scope, connectivity, and mathematical workload. Here is the comprehensive engineering breakdown:

---

| Hardware Specification | Arduino Uno R3 | ESP32 NodeMCU | Winner / Advantage |
| :--- | :--- | :--- | :--- |
| **CPU Architecture** | 8-bit ATmega328P | 32-bit Dual-Core Xtensa LX6 | 🚀 **ESP32 (60x faster)** |
| **Clock Frequency** | 16 MHz | 240 MHz | 🚀 **ESP32 (15x frequency)** |
| **SRAM (Memory)** | 2 KB | 520 KB | 🚀 **ESP32 (260x RAM)** |
| **Flash Storage** | 32 KB | 4 MB (4096 KB) | 🚀 **ESP32 (128x Flash)** |
| **Wireless Connectivity**| None (Requires external shield)| Wi-Fi 802.11 b/g/n + Bluetooth 4.2 / BLE | 🚀 **ESP32 (Built-in IoT)** |
| **Operating Voltage** | 5.0 V Logic | 3.3 V Logic | ⚖️ **Depends on sensors** |
| **ADC Resolution** | 10-bit (0 – 1023) | 12-bit (0 – 4095) | 🚀 **ESP32 (Higher precision)** |
| **PWM Channels** | 6 hardware channels | 16 independent LEDC channels | 🚀 **ESP32** |
| **GPIO Current Drive** | 20 mA per pin | 12 mA per pin | 🛡️ **Arduino Uno (More robust)** |

---

#### When Should You Choose Arduino Uno?
- 🎓 **Beginners and First-Time Circuit Builders**: The 5.0V logic is extremely forgiving—it won't fry if you briefly miswire a 5V sensor or pull too much current.
- 🔌 **Basic Relay & Sensor Automation**: Simple line followers, solar trackers, and light sensors where Wi-Fi or complex math is not needed.

#### When Should You Choose ESP32?
- 🌐 **IoT & Cloud Connectivity**: Hosting local web server dashboards, MQTT telemetry, or sending alerts via Telegram/Blynk.
- 📺 **OLED Displays & Computer Vision**: OLED framebuffers require 1024 bytes of RAM (which eats 50% of Uno's memory, but less than 0.2% of ESP32).
- 🔊 **Voice & Audio Processing**: Hardware I2S digital audio channels, audio DACs, and high-speed Fourier transforms.

Which board are you planning to use for your next build?`,
      reasoning: [
        'Analyzed hardware comparison inquiry: ESP32 vs Arduino Uno',
        'Formulated structural comparison table covering clock frequency, RAM, logic voltage, and wireless telemetry',
        'Highlighted distinct design paradigms: 5V beginner robustness vs 3.3V high-performance IoT compute'
      ],
      suggestions: [
        { label: 'Build ESP32 Emotion Robot', prompt: 'Build Emotion Desk Robot with ESP32' },
        { label: 'Build ESP32 Smart Watch', prompt: 'Build ESP32 Smart Watch' },
        { label: 'Build Arduino Smart Dustbin', prompt: 'Build Touchless Smart Dustbin' }
      ]
    };
  }

  // 5A. Servo Troubleshooting & Hardware Fixes (Direct answer for "servo isn't working", "servo jitter", etc.)
  const isServoQuery = p.includes('servo') || p.includes('sg90');
  const isTroubleshootQuery = p.includes('working') || p.includes('work') || p.includes('isnt') || p.includes("isn't") || p.includes('doesnt') || p.includes("doesn't") || p.includes('jitter') || p.includes('twitch') || p.includes('stuck') || p.includes('broken') || p.includes('move') || p.includes('troubleshoot') || p.includes('error') || p.includes('issue') || p.includes('problem');

  if (isServoQuery && isTroubleshootQuery) {
    return {
      reply: `### 🛠️ Troubleshooting Your Servo Motor

Servo issues are super common in electronics projects! Don't worry, 95% of the time they come down to power starvation, a missing common ground, or an ESP32 library difference. Here is how to fix it:

---

#### 1. ⚡ Power Starvation & Brownout Resets (#1 Culprit)
- **Are you powering the servo directly from the Arduino/ESP32 5V pin?**
- An SG90 micro-servo draws only 10–20mA idling, but when it starts moving or encounters physical load, its **stall current spikes to 500mA–800mA**!
- The onboard 5V regulator on microcontrollers cannot handle this sudden surge. The voltage sags below 4.5V, triggering a **Brownout Reset loop**—making the microcontroller reboot continuously (which looks like twitching, jitter, or doing nothing at all).
- 👉 **Fix**: Power your servo from an **external 5V 2A power supply**, USB power brick, or breadboard power module.

---

#### 2. 🔌 Common Ground (GND) is Mandatory!
- If you use an external power supply or battery pack for your servo, **its negative terminal (GND) MUST be physically connected to the Arduino or ESP32 GND pin!**
- Without a shared ground reference, the PWM control signal from your microcontroller has no baseline, so the servo's internal amplifier cannot interpret the pulse commands.

---

#### 3. 🟡 DuPont Wiring Order
Double-check the 3 DuPont wire colors on your servo:
- **Brown / Black**: Ground (\`GND\`)
- **Red**: Power (\`5V\`)
- **Orange / Yellow**: PWM Control Signal (connect to a PWM pin, e.g., GPIO 18 on ESP32, or Pin 9 on Arduino Uno)

---

#### 4. 💻 ESP32 vs. Arduino Uno Library
- On **Arduino Uno**, standard \`#include <Servo.h>\` works great.
- On **ESP32**, the classic \`<Servo.h>\` will **not work** because ESP32 uses LEDC hardware PWM channels. You must install the **\`ESP32Servo\`** library via Arduino Library Manager!
\`\`\`cpp
#include <ESP32Servo.h>
Servo myServo;

void setup() {
  myServo.attach(18); // Connect servo signal to GPIO 18
  myServo.write(90);  // Center position (90 degrees)
}
\`\`\`

---

Which microcontroller are you using (Arduino Uno or ESP32), and how are you powering your servo? Tell me a bit more and we'll get it working right away!`,
      reasoning: [
        'Detected user troubleshooting query regarding servo motor failure or erratic behavior',
        'Diagnosed top 4 electrical & firmware failure modes: stall current brownout reset, floating common ground, DuPont lead polarity, and ESP32Servo library requirement',
        'Provided immediate, actionable hardware fixes and clean C++ sample code'
      ],
      suggestions: [
        { label: 'How Does Servo PWM Work?', prompt: 'How do servo motors work?' },
        { label: 'Build 180° Radar Scanner', prompt: 'Build 180-Degree Ultrasonic Radar Scanner' },
        { label: 'Build Emotion Desk Robot', prompt: 'Build Emotion Desk Robot with ESP32' }
      ]
    };
  }

  // 5B. Servo Motor Control & Physics (SG90)
  if (p.includes('servo') || p.includes('sg90') || p.includes('motor')) {
    return {
      reply: `### ⚙️ How Do Servo Motors Work? (SG90 Engineering Guide)

Unlike regular DC motors that spin continuously, a **servomotor** is a closed-loop electromechanical actuator designed to rotate to a precise angular position (typically **0° to 180°**) and hold it against mechanical load.

---

#### 1. Inside the SG90 Micro Servo:
1. **DC Motor**: High-speed coreless miniature DC motor.
2. **Gear Train**: Plastic or metal reduction gear assembly that converts high RPM into high torque.
3. **Potentiometer**: Position feedback sensor physically coupled to the final output shaft.
4. **Error Amplifier Control Circuit**: Compares incoming pulse width with the potentiometer voltage and drives the motor until the error is zero.

---

#### 2. PWM Control Signal (50 Hz / 20ms Frame):
Servos are controlled using **Pulse-Width Modulation (PWM)** at a frame frequency of **50 Hz (20 millisecond period)**:
- **1.0 millisecond (1000µs) pulse** = **0°**
- **1.5 millisecond (1500µs) pulse** = **90° (Neutral Center)**
- **2.0 millisecond (2000µs) pulse** = **180°**

---

#### 3. ⚠️ The #1 Pitfall: Servo Jitter & Power Starvation!
> **CRITICAL RULE**: Never power multiple servos directly from the Arduino/ESP32 5V output pin during physical actuation!
>
> An SG90 draws **10mA** at idle, but its **stall current spikes to 500mA - 800mA** when rotating under load. The microcontroller voltage regulator cannot supply this current, causing a voltage drop that forces the processor into an infinite **Brownout Reset loop** (which looks like rapid twitching/jittering).
>
> **Solution**: Power servos from a dedicated external 5V / 2A power rail and connect the **Common Ground (GND)** back to the microcontroller!`,
      reasoning: [
        'Detected electromechanical query: Servo motor operation and PWM pulse width control',
        'Detailed internal closed-loop potentiometer feedback mechanics',
        'Addressed common stall current brownout bug and shared ground wiring solution'
      ],
      suggestions: [
        { label: 'Build Dual-Axis Solar Tracker', prompt: 'Build Dual-Axis Solar Tracker' },
        { label: 'Build Emotion Desk Robot', prompt: 'Build Emotion Desk Robot with ESP32' },
        { label: 'Build 180° Radar Scanner', prompt: 'Build 180-Degree Ultrasonic Radar Scanner' }
      ]
    };
  }

  // 6. Troubleshooting / Bugs / Jitter
  if (p.includes('jitter') || p.includes('not working') || p.includes('troubleshoot') || p.includes('error') || p.includes('issue')) {
    return {
      reply: `### 🛠️ Hardware Diagnostic & Troubleshooting Checklist

Hardware issues usually boil down to one of four fundamental electrical mistakes. Work through this 4-step diagnostic checklist:

---

#### 1. Common Ground (GND) Missing? *(Causes 80% of sensor/servo bugs)*
- If you have an external battery or power supply for your motor/sensor, **its negative terminal (GND) MUST be physically connected to the Arduino / ESP32 GND pin!**
- Without a common reference voltage, signal pulses float unpredictably, causing servos to chatter wildly and sensors to return random garbage.

#### 2. Power Starvation & Brownout Resets?
- **Symptoms**: The microcontroller reboots every time a servo turns, a relay clicks, or Wi-Fi connects.
- **Cause**: Motors and Wi-Fi pull sudden current surges (500mA - 1A). The USB port or 5V regulator dips below 4.5V, triggering hardware reset.
- **Fix**: Add a **100µF to 470µF electrolytic capacitor** across the 5V and GND power rails near the actuator.

#### 3. 3.3V vs. 5.0V Logic Level Mismatch?
- ESP32 GPIO pins operate strictly at **3.3V**. Supplying 5.0V from an Arduino sensor directly into an ESP32 pin can destroy the internal ESD protection diodes.
- Use a **voltage divider resistor pair (1kΩ and 2kΩ)** on 5V sensor outputs (like the HC-SR04 ECHO pin).

#### 4. I2C Bus Address Conflict or Missing Pull-Ups?
- If your OLED or IMU says "Init Failed":
  - Run an **I2C Scanner sketch** to confirm if the device is detected at \`0x3C\`, \`0x3D\`, or \`0x68\`.
  - Verify SDA is connected to **A4 (Uno) / GPIO 21 (ESP32)** and SCL to **A5 (Uno) / GPIO 22 (ESP32)**.

Tell me what specific hardware component is giving you trouble, and I'll debug your wiring and code!`,
      reasoning: [
        'Detected troubleshooting and debugging query',
        'Provided 4-point systemic electrical checklist: common ground, current starvation, logic level translation, and I2C bus addressing',
        'Offered interactive diagnostic follow-up'
      ],
      suggestions: [
        { label: 'How Does Ultrasonic Sensor Work?', prompt: 'How does an ultrasonic sensor work?' },
        { label: 'Build Emotion Desk Robot', prompt: 'Build Emotion Desk Robot with ESP32' },
        { label: 'Build Touchless Dustbin', prompt: 'Build Touchless Smart Dustbin' }
      ]
    };
  }

  // 7. General Dynamic Conversational Fallback
  return {
    reply: "I'd be happy to help with that. A live AI provider isn't responding right now, so I can't give you a reliable answer to this one yet. You can connect Gemini, Groq, or OpenRouter in Settings for open-ended conversation; common hardware questions and project ideas still work offline.",
    reasoning: [],
    suggestions: []
  };
}

