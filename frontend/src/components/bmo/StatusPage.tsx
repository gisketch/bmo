import type { StatusData } from '../../types/bmo';

interface StatusPageProps {
  /** Status data from the agent RPC, null when not yet fetched */
  statusData: StatusData | null;
  /** Whether the agent is connected to the room */
  agentConnected: boolean;
  /** Whether the first fetch is in progress */
  loading: boolean;
}

/** Max balance references for progress bar calculation */
const TTS_MAX = 5.0;
const STT_MAX = 10.0;
const BAR_WIDTH = 10;

/**
 * Renders an ASCII progress bar: [|||||     ]
 */
function progressBar(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  const filled = Math.round(ratio * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  return `[${'|'.repeat(filled)}${' '.repeat(empty)}]`;
}

/**
 * Formats a balance value for display.
 */
function formatBalance(
  value: number | null | undefined,
  max: number,
  label: string,
): string {
  if (value === null || value === undefined) {
    return `${label}: N/A`;
  }
  const bar = progressBar(value, max);
  return `${label}: ${bar} $${value.toFixed(2)}`;
}

/**
 * StatusPage — Monospaced terminal-style status display.
 * Shows agent connectivity, TTS/STT balance bars, and LLM request count.
 */
export default function StatusPage({ statusData, agentConnected, loading }: StatusPageProps) {
  const agentStatus = agentConnected ? 'Connected' : 'Disconnected';

  const ttsLine = loading && !statusData
    ? 'TTS: ...'
    : formatBalance(statusData?.tts_balance, TTS_MAX, 'TTS');

  const sttLine = loading && !statusData
    ? 'STT: ...'
    : formatBalance(statusData?.stt_balance, STT_MAX, 'STT');

  const llmLine = loading && !statusData
    ? 'LLM: ...'
    : `LLM: ${statusData?.llm_requests_today ?? 'N/A'} reqs today`;

  return (
    <div
      className="flex flex-col items-start justify-center w-full h-full px-8 py-8 gap-3"
      style={{ fontFamily: "'Geist Mono', monospace" }}
    >
      <StatusLine label="BMO" value={agentStatus} highlight />
      <StatusLine label="" value={ttsLine} raw />
      <StatusLine label="" value={sttLine} raw />
      <StatusLine label="" value={llmLine} raw />
    </div>
  );
}

function StatusLine({
  label,
  value,
  highlight,
  raw,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  raw?: boolean;
}) {
  const textColor = highlight ? '#0D4538' : '#1a5c4a';

  if (raw) {
    return (
      <div
        className="text-sm tracking-wide whitespace-pre"
        style={{ color: textColor }}
      >
        {value}
      </div>
    );
  }

  return (
    <div
      className="text-sm tracking-wide"
      style={{ color: textColor }}
    >
      <span className="font-bold">{label}:</span> {value}
    </div>
  );
}
