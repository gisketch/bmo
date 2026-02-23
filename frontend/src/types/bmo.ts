/**
 * Mouth visual states for the BMO face.
 *
 * Static states render a fixed SVG shape.
 * Talk states animate through 3 frames at 150 ms intervals.
 */
export enum MouthState {
  /** Simple upward curve */
  Smile = 0,
  /** Simple downward curve */
  Sad = 1,
  /** Open mouth with teeth + tongue, smile shape */
  OpenSmile = 2,
  /** Animated: cycles OpenSmile → ClosedSmile → MouthOh */
  TalkHappy = 3,
  /** Tall elliptical "O" shape */
  MouthOh = 4,
  /** Open mouth inverted frown with teeth + tongue */
  OpenSad = 5,
  /** Animated: cycles OpenSad → ClosedSad → MouthOh */
  TalkSad = 6,
}

/**
 * Eye visual states for the BMO face.
 *
 * Only `Normal` is implemented now. The enum exists so new states
 * (e.g. `Happy`, `Angry`, `Sleepy`) can be added without restructuring.
 */
export enum EyeState {
  Normal = 'normal',
}

/**
 * LED indicator states for the BMO body.
 */
export enum LedState {
  /** Dark blue — agent offline / disconnected */
  Offline = 'offline',
  /** Blue — connected (idle, listening, thinking) */
  Connected = 'connected',
  /** Green + volume-reactive glow — agent speaking */
  Talking = 'talking',
}

/** LED color mapping */
export const LED_COLORS: Record<LedState, { base: string; glow: string }> = {
  [LedState.Offline]:   { base: '#0E3A6B', glow: 'transparent' },
  [LedState.Connected]: { base: '#165BA9', glow: 'transparent' },
  [LedState.Talking]:   { base: '#22C55E', glow: 'rgba(34, 197, 94, 0.4)' },
};

/**
 * High-level visual state that the BMO face can be in.
 * Each state maps to a combination of MouthState + EyeState.
 */
export interface AgentVisualState {
  mouth: MouthState;
  eye: EyeState;
}

/**
 * Predefined agent visual states mapped from LiveKit agent states.
 */
export const AGENT_VISUAL_STATES = {
  listening: { mouth: MouthState.Smile, eye: EyeState.Normal } as AgentVisualState,
  talking: { mouth: MouthState.TalkHappy, eye: EyeState.Normal } as AgentVisualState,
  thinking: { mouth: MouthState.MouthOh, eye: EyeState.Normal } as AgentVisualState,
  offline: { mouth: MouthState.Sad, eye: EyeState.Normal } as AgentVisualState,
} as const;

/**
 * BMO screen page modes.
 */
export type BmoPage = 'face' | 'status';

/**
 * Status data returned by the agent's getStatus RPC.
 */
export interface StatusData {
  /** Fish Audio TTS credit balance in dollars, or null if unavailable */
  tts_balance: number | null;
  /** DeepGram STT balance in dollars, or null if unavailable */
  stt_balance: number | null;
  /** LLM requests processed today */
  llm_requests_today: number;
}
