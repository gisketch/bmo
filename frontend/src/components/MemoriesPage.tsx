import { useCallback, useEffect, useRef, useState } from 'react';

interface MemoryItem {
  id: string;
  memory: string;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  relationships: 'Relationships',
  preferences: 'Preferences',
  goals: 'Goals',
  personal_facts: 'Personal Facts',
  uncategorized: 'Uncategorized',
};

const CATEGORY_ORDER = ['personal_facts', 'relationships', 'preferences', 'goals', 'uncategorized'];

function groupByCategory(memories: MemoryItem[]): Record<string, MemoryItem[]> {
  const groups: Record<string, MemoryItem[]> = {};
  for (const mem of memories) {
    const cat = mem.category || 'uncategorized';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(mem);
  }
  return groups;
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (pin === '4869') {
        onUnlock();
      } else {
        setError(true);
        setPin('');
        inputRef.current?.focus();
      }
    },
    [pin, onUnlock],
  );

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <div className="text-[#3FD4B6] text-2xl font-bold tracking-widest" style={{ fontFamily: "'Pixeloid', monospace" }}>
          BMO MEMORIES
        </div>
        <div className="text-[#3FD4B6]/60 text-sm tracking-wide" style={{ fontFamily: "'Geist Mono', monospace" }}>
          Enter PIN to continue
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setError(false);
            setPin(e.target.value.replace(/\D/g, ''));
          }}
          className="w-40 text-center text-2xl tracking-[0.5em] bg-[#16213e] border-2 border-[#3FD4B6]/30 rounded-lg px-4 py-3 text-[#3FD4B6] outline-none focus:border-[#3FD4B6]/70 transition-colors"
          style={{ fontFamily: "'Geist Mono', monospace" }}
          placeholder="····"
        />
        {error && (
          <div className="text-red-400 text-xs tracking-wide" style={{ fontFamily: "'Geist Mono', monospace" }}>
            Wrong PIN
          </div>
        )}
        <button
          type="submit"
          className="mt-2 px-6 py-2 bg-[#3FD4B6]/20 border border-[#3FD4B6]/40 rounded-lg text-[#3FD4B6] text-sm tracking-wider hover:bg-[#3FD4B6]/30 transition-colors cursor-pointer"
          style={{ fontFamily: "'Geist Mono', monospace" }}
        >
          UNLOCK
        </button>
      </form>
    </div>
  );
}

function MemoryCard({
  item,
  onSave,
}: {
  item: MemoryItem;
  onSave: (id: string, newText: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.memory);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(item.memory);
  }, [item.memory]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const handleSave = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === item.memory) {
      setEditing(false);
      setDraft(item.memory);
      return;
    }
    setSaving(true);
    const ok = await onSave(item.id, trimmed);
    setSaving(false);
    if (ok) setEditing(false);
    else setDraft(item.memory);
  }, [draft, item, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(item.memory);
    setEditing(false);
  }, [item.memory]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') handleCancel();
    },
    [handleSave, handleCancel],
  );

  return (
    <div className="group flex items-start gap-3 px-4 py-3 rounded-lg bg-[#16213e]/60 hover:bg-[#16213e] transition-colors border border-transparent hover:border-[#3FD4B6]/10">
      <div className="w-1.5 h-1.5 rounded-full bg-[#3FD4B6]/40 mt-2 shrink-0" />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="w-full bg-[#0f1b35] text-[#e0e0e0] text-sm rounded-md px-3 py-2 outline-none border border-[#3FD4B6]/30 focus:border-[#3FD4B6]/60 resize-none overflow-hidden"
              style={{ fontFamily: "'Geist Mono', monospace" }}
              rows={1}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 text-xs bg-[#3FD4B6]/20 border border-[#3FD4B6]/40 rounded text-[#3FD4B6] hover:bg-[#3FD4B6]/30 transition-colors cursor-pointer disabled:opacity-50"
                style={{ fontFamily: "'Geist Mono', monospace" }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-3 py-1 text-xs bg-transparent border border-[#e0e0e0]/20 rounded text-[#e0e0e0]/60 hover:text-[#e0e0e0] transition-colors cursor-pointer disabled:opacity-50"
                style={{ fontFamily: "'Geist Mono', monospace" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="text-sm text-[#e0e0e0]/80 cursor-pointer hover:text-[#e0e0e0] transition-colors"
            style={{ fontFamily: "'Geist Mono', monospace" }}
            title="Click to edit"
          >
            {item.memory}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MemoriesPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async (pinCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/memories?pin=${pinCode}`);
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setMemories(data.memories || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUnlock = useCallback(() => {
    setPin('4869');
    setUnlocked(true);
  }, []);

  useEffect(() => {
    if (unlocked) fetchMemories('4869');
  }, [unlocked, fetchMemories]);

  const handleSave = useCallback(
    async (id: string, newText: string): Promise<boolean> => {
      try {
        const resp = await fetch(`/api/memories/${id}?pin=${pin}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memory: newText }),
        });
        if (!resp.ok) return false;
        setMemories((prev) =>
          prev.map((m) => (m.id === id ? { ...m, memory: newText } : m)),
        );
        return true;
      } catch {
        return false;
      }
    },
    [pin],
  );

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />;

  const grouped = groupByCategory(memories);
  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]?.length);
  const extraCategories = Object.keys(grouped)
    .filter((c) => !CATEGORY_ORDER.includes(c))
    .sort();
  const allCategories = [...sortedCategories, ...extraCategories];

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#e0e0e0]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <h1
            className="text-xl font-bold tracking-widest text-[#3FD4B6]"
            style={{ fontFamily: "'Pixeloid', monospace" }}
          >
            BMO MEMORIES
          </h1>
          <div className="flex items-center gap-4">
            <span
              className="text-xs text-[#3FD4B6]/50"
              style={{ fontFamily: "'Geist Mono', monospace" }}
            >
              {memories.length} memories
            </span>
            <button
              onClick={() => fetchMemories(pin)}
              disabled={loading}
              className="px-3 py-1 text-xs bg-[#3FD4B6]/10 border border-[#3FD4B6]/30 rounded text-[#3FD4B6]/70 hover:bg-[#3FD4B6]/20 hover:text-[#3FD4B6] transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "'Geist Mono', monospace" }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            style={{ fontFamily: "'Geist Mono', monospace" }}
          >
            {error}
          </div>
        )}

        {loading && memories.length === 0 ? (
          <div
            className="text-center py-16 text-[#3FD4B6]/40 text-sm"
            style={{ fontFamily: "'Geist Mono', monospace" }}
          >
            Loading memories...
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {allCategories.map((cat) => (
              <section key={cat}>
                <h2
                  className="text-xs font-bold tracking-[0.2em] uppercase text-[#3FD4B6]/70 mb-3 border-b border-[#3FD4B6]/10 pb-2"
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                >
                  {CATEGORY_LABELS[cat] || cat}
                  <span className="ml-2 text-[#3FD4B6]/30 font-normal">
                    ({grouped[cat].length})
                  </span>
                </h2>
                <div className="flex flex-col gap-1">
                  {grouped[cat].map((item) => (
                    <MemoryCard key={item.id} item={item} onSave={handleSave} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
