import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface MemoryItem {
  id: string;
  memory: string;
  category: string;
  created_at: string;
  updated_at: string;
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

function sortMemories(items: MemoryItem[], asc: boolean): MemoryItem[] {
  return [...items].sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime();
    const db = new Date(b.created_at || 0).getTime();
    return asc ? da - db : db - da;
  });
}

const FONT_PIXEL = { fontFamily: "'Pixeloid', monospace" } as const;
const FONT_MONO = { fontFamily: "'Geist Mono', monospace" } as const;

const PIN_STORAGE_KEY = 'bmo-pin';

function PinGate({ onUnlock }: { onUnlock: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored) onUnlock(stored);
  }, [onUnlock]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pin || checking) return;
      setChecking(true);
      try {
        const resp = await fetch(`/api/memories?pin=${pin}`);
        if (resp.ok) {
          localStorage.setItem(PIN_STORAGE_KEY, pin);
          onUnlock(pin);
        } else {
          setError(true);
          setPin('');
          inputRef.current?.focus();
        }
      } catch {
        setError(true);
        setPin('');
        inputRef.current?.focus();
      } finally {
        setChecking(false);
      }
    },
    [pin, onUnlock, checking],
  );

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <div className="text-[#3FD4B6] text-2xl font-bold tracking-widest" style={FONT_PIXEL}>
          BMO MEMORIES
        </div>
        <div className="text-[#3FD4B6]/60 text-sm tracking-wide" style={FONT_MONO}>
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
          style={FONT_MONO}
          placeholder="····"
        />
        {error && (
          <div className="text-red-400 text-xs tracking-wide" style={FONT_MONO}>
            Wrong PIN
          </div>
        )}
        <button
          type="submit"
          disabled={checking || !pin}
          className="mt-2 px-6 py-2 bg-[#3FD4B6]/20 border border-[#3FD4B6]/40 rounded-lg text-[#3FD4B6] text-sm tracking-wider hover:bg-[#3FD4B6]/30 transition-colors cursor-pointer disabled:opacity-50"
          style={FONT_MONO}
        >
          {checking ? 'CHECKING...' : 'UNLOCK'}
        </button>
      </form>
    </div>
  );
}

interface MemoryModalProps {
  mode: 'add' | 'edit';
  initial?: MemoryItem;
  categories: string[];
  onClose: () => void;
  onSave: (data: { memory: string; category: string }) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

function MemoryModal({ mode, initial, categories, onClose, onSave, onDelete }: MemoryModalProps) {
  const [text, setText] = useState(initial?.memory ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'uncategorized');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const finalCategory = useCustom ? (customCategory.trim() || 'uncategorized') : category;
    setSaving(true);
    const ok = await onSave({ memory: trimmed, category: finalCategory });
    setSaving(false);
    if (ok) onClose();
  }, [text, category, customCategory, useCustom, onSave, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  const allCategories = useMemo(() => {
    const set = new Set([...CATEGORY_ORDER, ...categories]);
    return Array.from(set);
  }, [categories]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1a1a2e] flex flex-col"
      onKeyDown={handleKeyDown}
    >
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#3FD4B6]/10">
        <h2 className="text-lg font-bold tracking-widest text-[#3FD4B6]" style={FONT_PIXEL}>
          {mode === 'add' ? 'NEW MEMORY' : 'EDIT MEMORY'}
        </h2>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs bg-transparent border border-[#e0e0e0]/20 rounded text-[#e0e0e0]/60 hover:text-[#e0e0e0] transition-colors cursor-pointer"
          style={FONT_MONO}
        >
          Cancel
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-6 px-6 py-6 max-w-3xl mx-auto w-full overflow-y-auto">
        <div className="flex flex-col gap-2">
          <label className="text-xs tracking-[0.15em] uppercase text-[#3FD4B6]/60" style={FONT_MONO}>
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setUseCustom(false); }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                  !useCustom && category === cat
                    ? 'bg-[#3FD4B6]/20 border-[#3FD4B6]/50 text-[#3FD4B6]'
                    : 'bg-[#16213e]/60 border-[#3FD4B6]/10 text-[#e0e0e0]/50 hover:border-[#3FD4B6]/30 hover:text-[#e0e0e0]/70'
                }`}
                style={FONT_MONO}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                useCustom
                  ? 'bg-[#3FD4B6]/20 border-[#3FD4B6]/50 text-[#3FD4B6]'
                  : 'bg-[#16213e]/60 border-[#3FD4B6]/10 text-[#e0e0e0]/50 hover:border-[#3FD4B6]/30 hover:text-[#e0e0e0]/70'
              }`}
              style={FONT_MONO}
            >
              + Custom
            </button>
          </div>
          {useCustom && (
            <input
              autoFocus
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="custom_category"
              className="mt-1 w-60 bg-[#0f1b35] text-[#e0e0e0] text-sm rounded-md px-3 py-2 outline-none border border-[#3FD4B6]/30 focus:border-[#3FD4B6]/60"
              style={FONT_MONO}
            />
          )}
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs tracking-[0.15em] uppercase text-[#3FD4B6]/60" style={FONT_MONO}>
            Memory
          </label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={saving}
            className="flex-1 min-h-[200px] w-full bg-[#0f1b35] text-[#e0e0e0] text-sm rounded-lg px-4 py-3 outline-none border border-[#3FD4B6]/20 focus:border-[#3FD4B6]/50 resize-none"
            style={FONT_MONO}
            placeholder="Enter a memory..."
          />
        </div>
      </div>

      <footer className="flex items-center justify-between px-6 py-4 border-t border-[#3FD4B6]/10">
        <div>
          {mode === 'edit' && initial && onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400" style={FONT_MONO}>Delete?</span>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    const ok = await onDelete(initial.id);
                    setDeleting(false);
                    if (ok) onClose();
                  }}
                  disabled={deleting}
                  className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/40 rounded text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
                  style={FONT_MONO}
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="px-3 py-1 text-xs bg-transparent border border-[#e0e0e0]/20 rounded text-[#e0e0e0]/60 hover:text-[#e0e0e0] transition-colors cursor-pointer"
                  style={FONT_MONO}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1 text-xs bg-red-500/10 border border-red-500/30 rounded text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                style={FONT_MONO}
              >
                Delete
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs bg-transparent border border-[#e0e0e0]/20 rounded-lg text-[#e0e0e0]/60 hover:text-[#e0e0e0] transition-colors cursor-pointer disabled:opacity-50"
            style={FONT_MONO}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="px-6 py-2 text-xs bg-[#3FD4B6]/20 border border-[#3FD4B6]/40 rounded-lg text-[#3FD4B6] hover:bg-[#3FD4B6]/30 transition-colors cursor-pointer disabled:opacity-50"
            style={FONT_MONO}
          >
            {saving ? 'Saving...' : mode === 'add' ? 'Add Memory' : 'Save Changes'}
          </button>
        </div>
      </footer>
    </div>
  );
}

function MemoryCard({
  item,
  onEdit,
}: {
  item: MemoryItem;
  onEdit: (item: MemoryItem) => void;
}) {
  const dateStr = item.created_at
    ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div
      onClick={() => onEdit(item)}
      className="group flex items-start gap-3 px-4 py-3 rounded-lg bg-[#16213e]/60 hover:bg-[#16213e] transition-colors border border-transparent hover:border-[#3FD4B6]/10 cursor-pointer"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-[#3FD4B6]/40 mt-2 shrink-0" />
      <div className="flex-1 min-w-0">
        <div
          className="text-sm text-[#e0e0e0]/80 group-hover:text-[#e0e0e0] transition-colors"
          style={FONT_MONO}
        >
          {item.memory}
        </div>
        {dateStr && (
          <div className="text-[10px] text-[#3FD4B6]/25 mt-1" style={FONT_MONO}>
            {dateStr}
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
  const [sortAsc, setSortAsc] = useState(false);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: MemoryItem } | null>(null);

  const fetchMemories = useCallback(async (pinCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/memories?pin=${pinCode}`);
      if (!resp.ok) {
        if (resp.status === 401) {
          localStorage.removeItem(PIN_STORAGE_KEY);
          setUnlocked(false);
          setPin('');
          return;
        }
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

  const handleUnlock = useCallback((pinCode: string) => {
    setPin(pinCode);
    setUnlocked(true);
  }, []);

  const handleLock = useCallback(() => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    setUnlocked(false);
    setPin('');
    setMemories([]);
  }, []);

  useEffect(() => {
    if (unlocked && pin) fetchMemories(pin);
  }, [unlocked, pin, fetchMemories]);

  const handleEdit = useCallback(
    async (data: { memory: string; category: string }): Promise<boolean> => {
      if (!modal?.item) return false;
      try {
        const resp = await fetch(`/api/memories/${modal.item.id}?pin=${pin}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memory: data.memory, category: data.category }),
        });
        if (!resp.ok) return false;
        setMemories((prev) =>
          prev.map((m) =>
            m.id === modal.item!.id ? { ...m, memory: data.memory, category: data.category } : m,
          ),
        );
        return true;
      } catch {
        return false;
      }
    },
    [pin, modal],
  );

  const handleDelete = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const resp = await fetch(`/api/memories/${id}?pin=${pin}`, { method: 'DELETE' });
        if (!resp.ok) return false;
        setMemories((prev) => prev.filter((m) => m.id !== id));
        return true;
      } catch {
        return false;
      }
    },
    [pin],
  );

  const handleAdd = useCallback(
    async (data: { memory: string; category: string }): Promise<boolean> => {
      try {
        const resp = await fetch(`/api/memories?pin=${pin}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!resp.ok) return false;
        await fetchMemories(pin);
        return true;
      } catch {
        return false;
      }
    },
    [pin, fetchMemories],
  );

  const existingCategories = useMemo(() => {
    const cats = new Set(memories.map((m) => m.category || 'uncategorized'));
    return Array.from(cats);
  }, [memories]);

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-3 py-1 text-xs bg-[#3FD4B6]/10 border border-[#3FD4B6]/30 rounded text-[#3FD4B6]/70 hover:bg-[#3FD4B6]/20 hover:text-[#3FD4B6] transition-colors cursor-pointer"
              style={FONT_PIXEL}
            >
              BMO
            </button>
            <h1
              className="text-xl font-bold tracking-widest text-[#3FD4B6]"
              style={FONT_PIXEL}
            >
              MEMORIES
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#3FD4B6]/50" style={FONT_MONO}>
              {memories.length}
            </span>
            <button
              onClick={() => setSortAsc((p) => !p)}
              title={sortAsc ? 'Oldest first' : 'Newest first'}
              className="px-2 py-1 text-xs bg-[#3FD4B6]/10 border border-[#3FD4B6]/30 rounded text-[#3FD4B6]/70 hover:bg-[#3FD4B6]/20 hover:text-[#3FD4B6] transition-colors cursor-pointer"
              style={FONT_MONO}
            >
              {sortAsc ? '↑' : '↓'}
            </button>
            <button
              onClick={() => setModal({ mode: 'add' })}
              title="Add memory"
              className="px-2 py-1 text-xs bg-[#3FD4B6]/10 border border-[#3FD4B6]/30 rounded text-[#3FD4B6]/70 hover:bg-[#3FD4B6]/20 hover:text-[#3FD4B6] transition-colors cursor-pointer"
              style={FONT_MONO}
            >
              +
            </button>
            <button
              onClick={() => fetchMemories(pin)}
              disabled={loading}
              className="px-3 py-1 text-xs bg-[#3FD4B6]/10 border border-[#3FD4B6]/30 rounded text-[#3FD4B6]/70 hover:bg-[#3FD4B6]/20 hover:text-[#3FD4B6] transition-colors cursor-pointer disabled:opacity-50"
              style={FONT_MONO}
            >
              {loading ? '...' : '↻'}
            </button>
            <button
              onClick={handleLock}
              className="px-3 py-1 text-xs bg-red-500/10 border border-red-500/30 rounded text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
              style={FONT_MONO}
            >
              Lock
            </button>
          </div>
        </header>

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            style={FONT_MONO}
          >
            {error}
          </div>
        )}

        {loading && memories.length === 0 ? (
          <div className="text-center py-16 text-[#3FD4B6]/40 text-sm" style={FONT_MONO}>
            Loading memories...
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {allCategories.map((cat) => {
              const sorted = sortMemories(grouped[cat], sortAsc);
              return (
                <section key={cat}>
                  <h2
                    className="text-xs font-bold tracking-[0.2em] uppercase text-[#3FD4B6]/70 mb-3 border-b border-[#3FD4B6]/10 pb-2"
                    style={FONT_MONO}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                    <span className="ml-2 text-[#3FD4B6]/30 font-normal">
                      ({sorted.length})
                    </span>
                  </h2>
                  <div className="flex flex-col gap-1">
                    {sorted.map((item) => (
                      <MemoryCard
                        key={item.id}
                        item={item}
                        onEdit={(it) => setModal({ mode: 'edit', item: it })}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <MemoryModal
          mode={modal.mode}
          initial={modal.item}
          categories={existingCategories}
          onClose={() => setModal(null)}
          onSave={modal.mode === 'add' ? handleAdd : handleEdit}
          onDelete={modal.mode === 'edit' ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
