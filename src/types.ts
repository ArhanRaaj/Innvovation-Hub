// ============================================================================
// OMNILAB SCIENCE PROJECTS - TYPE DEFINITIONS
// ============================================================================

export type BoardType = 'Arduino Uno' | 'ESP32';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type WireColor = 'red' | 'black' | 'blue' | 'amber' | 'green' | 'purple' | 'orange' | 'yellow' | 'white' | 'gray';

export type DisplayHardwareMode = 'oled' | 'lcd';

export type WireRoutingStyle = 'orthogonal' | 'curved';

export type CircuitViewMode = 'real' | 'vector';

export type WireFilterMode = 'all' | 'power' | 'signals';

export interface WireConnection {
  from: string;
  to: string;
  color: WireColor;
  desc: string;
}

export interface BOMComponent {
  name: string;
  qty: string;
  note: string;
}

export interface CircuitModulePinout {
  name: string;
  type: 'sensor' | 'actuator' | 'display' | 'driver' | 'power';
  pins: string[];
}

export interface CircuitDiagramData {
  boardType: 'arduino-uno' | 'esp32';
  modules: CircuitModulePinout[];
}

export interface ScienceProject {
  id: string;
  title: string;
  shortDesc: string;
  board: BoardType;
  category: string;
  difficulty: DifficultyLevel;
  estimatedTime: string;
  rating: number;
  featured: boolean;
  tags: string[];
  components: BOMComponent[];
  workingPrinciple: string;
  wiringTable: WireConnection[];
  circuitDiagram: CircuitDiagramData;
  code: string;
  assemblySteps: string[];
  scientificApplications: string;
}

export interface FilterState {
  currentBoard: string;
  currentCategory: string;
  currentDifficulty: string;
  currentSort: string;
  searchQuery: string;
  bookmarkedIds: Set<string>;
  displayHardware: DisplayHardwareMode;
  wireRoutingStyle: WireRoutingStyle;
  circuitViewMode: CircuitViewMode;
  wireFilter?: WireFilterMode;
  activeModalProjectId: string | null;
  activeModalTab: string;
  viewLayout?: 'grid' | 'table';
}

export interface Point2D {
  x: number;
  y: number;
  name?: string;
}
