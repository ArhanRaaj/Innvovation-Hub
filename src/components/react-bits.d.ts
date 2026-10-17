import React from 'react';

declare module './AeroShards.jsx' {
  export interface AeroShardsProps {
    shardColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    lightMode?: boolean;
    placement?: 'full' | 'left' | 'right' | 'center';
    material?: 'glass' | 'chrome';
    count?: number;
    shardSize?: number;
    spread?: number;
    twist?: number;
    billow?: number;
    speed?: number;
    scale?: number;
    depthOfField?: number;
    glow?: number;
    grain?: number;
    vignette?: number;
    intro?: boolean;
    mouseInteraction?: boolean;
    mouseStrength?: number;
    markers?: 'plus' | 'dots' | 'none';
    pulseOnClick?: boolean;
    holdToGather?: boolean;
    parallax?: number;
    paused?: boolean;
    dpr?: number;
    className?: string;
    style?: React.CSSProperties;
    onError?: (err?: any) => void;
  }
  export default function AeroShards(props: AeroShardsProps): React.JSX.Element;
}

declare module './PromptBar.jsx' {
  export interface PromptBarSource {
    key: string;
    name: string;
    description?: string;
    icon?: any;
    attach?: boolean;
  }
  export interface PromptBarCommand {
    key: string;
    name: string;
    description?: string;
  }
  export interface PromptBarModel {
    key: string;
    name: string;
    tag?: string;
  }
  export interface PromptBarProps {
    placeholder?: string;
    sources?: PromptBarSource[];
    commands?: PromptBarCommand[];
    models?: PromptBarModel[];
    defaultModel?: string;
    efforts?: string[];
    defaultEffort?: string;
    onEffortChange?: (effort: string) => void;
    busy?: boolean;
    onSend?: (text: string, options?: any) => void;
    onStop?: () => void;
    onAttach?: () => string | string[] | Promise<string | string[]> | void;
    onDictate?: () => string | Promise<string> | void;
    background?: string;
    color?: string;
    menuBackground?: string;
    sparkColor?: string;
    sparkBoost?: number;
    width?: number;
    radius?: number;
    maxRows?: number;
    morphDuration?: number;
    squash?: number;
    tilt?: number;
    pressScale?: number;
    className?: string;
  }
  export default function PromptBar(props: PromptBarProps): React.JSX.Element;
}

declare module './SpringCheck.jsx' {
  export interface SpringCheckProps {
    label?: React.ReactNode;
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    color?: string;
    fillColor?: string;
    checkColor?: string;
    boxSize?: number;
    boxRadius?: number;
    fontSize?: number;
    bounce?: number;
    strikeLag?: number;
    doneOpacity?: number;
    strike?: 'left' | 'center' | 'right' | 'none';
    ariaLabel?: string;
    className?: string;
  }
  export default function SpringCheck(props: SpringCheckProps): React.JSX.Element;
}

declare module './ElectricBorder.jsx' {
  export interface ElectricBorderProps {
    children?: React.ReactNode;
    color?: string;
    glowColor?: string;
    speed?: number;
    chaos?: number;
    spread?: number;
    strands?: number;
    thickness?: number;
    borderRadius?: number;
    className?: string;
    style?: React.CSSProperties;
  }
  export default function ElectricBorder(props: ElectricBorderProps): React.JSX.Element;
}

declare module './ThoughtLine.jsx' {
  export interface ThoughtLineProps {
    working?: boolean;
    steps?: string[];
    label?: string;
    doneLabel?: string;
    glyph?: string;
    fontSize?: number;
    collapsible?: boolean;
    showTimer?: boolean;
    onSettle?: (seconds: number) => void;
  }
  export default function ThoughtLine(props: ThoughtLineProps): React.JSX.Element;
}
