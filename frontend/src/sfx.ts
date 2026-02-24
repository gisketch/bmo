type SfxKey =
  | 'button'
  | 'tap_body'
  | 'tap_glass'
  | 'cassette_in'
  | 'cassette_out'
  | 'bmo_beepboop'
  | 'bmo_chuckle'
  | 'bmo_hmm'
  | 'tv_on'
  | 'tv_off';

const SFX_FILES = [
  'bmo_beep_1.wav',
  'bmo_boop_1.wav',
  'bmo_boop_2.wav',
  'bmo_chuckle_1.wav',
  'bmo_chuckle_2.wav',
  'hmm_1.wav',
  'hmm_2.wav',
  'hmm_3.wav',
  'button_1.wav',
  'cassette_in.wav',
  'cassette_out.wav',
  'tap_body_1.wav',
  'tap_body_2.wav',
  'tap_body_3.wav',
  'tap_glass_1.wav',
  'tap_glass_2.wav',
  'tap_glass_3.wav',
  'tv_off.wav',
  'tv_on.wav',
] as const;

const urls = SFX_FILES.map((name) => `/sfx/${name}`);

const pools = new Map<SfxKey, HTMLAudioElement[]>();
let initialized = false;

const lastPlayedAtMs = new Map<SfxKey, number>();

function playFromPoolDebounced(
  key: SfxKey,
  strategy: 'round-robin' | 'random',
  cooldownMs: number,
) {
  const now = Date.now();
  const last = lastPlayedAtMs.get(key) ?? 0;
  if (now - last < cooldownMs) return false;
  lastPlayedAtMs.set(key, now);
  playFromPool(key, strategy);
  return true;
}

function createPool(url: string, size: number) {
  const elements: HTMLAudioElement[] = [];
  for (let i = 0; i < size; i += 1) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    elements.push(audio);
  }
  return elements;
}

export function initSfx() {
  if (initialized) return;
  initialized = true;

  urls.forEach((url) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.load();
  });

  pools.set('button', createPool('/sfx/button_1.wav', 4));
  pools.set('bmo_beepboop', [
    ...createPool('/sfx/bmo_beep_1.wav', 2),
    ...createPool('/sfx/bmo_boop_1.wav', 2),
    ...createPool('/sfx/bmo_boop_2.wav', 2),
  ]);
  pools.set('bmo_chuckle', [
    ...createPool('/sfx/bmo_chuckle_1.wav', 2),
    ...createPool('/sfx/bmo_chuckle_2.wav', 2),
  ]);
  pools.set('bmo_hmm', [
    ...createPool('/sfx/hmm_1.wav', 2),
    ...createPool('/sfx/hmm_2.wav', 2),
    ...createPool('/sfx/hmm_3.wav', 2),
  ]);
  pools.set('cassette_in', createPool('/sfx/cassette_in.wav', 2));
  pools.set('cassette_out', createPool('/sfx/cassette_out.wav', 2));
  pools.set('tap_body', [
    ...createPool('/sfx/tap_body_1.wav', 2),
    ...createPool('/sfx/tap_body_2.wav', 2),
    ...createPool('/sfx/tap_body_3.wav', 2),
  ]);
  pools.set('tap_glass', [
    ...createPool('/sfx/tap_glass_1.wav', 2),
    ...createPool('/sfx/tap_glass_2.wav', 2),
    ...createPool('/sfx/tap_glass_3.wav', 2),
  ]);
  pools.set('tv_on', createPool('/sfx/tv_on.wav', 2));
  pools.set('tv_off', createPool('/sfx/tv_off.wav', 2));
}

function playFromPool(key: SfxKey, strategy: 'round-robin' | 'random') {
  const pool = pools.get(key);
  if (!pool || pool.length === 0) return;

  const idx = strategy === 'random' ? Math.floor(Math.random() * pool.length) : 0;
  const audio = pool[idx];

  if (strategy === 'round-robin' && pool.length > 1) {
    pool.push(pool.shift()!);
  }

  try {
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // Ignore autoplay/gesture restrictions
  }
}

export function playButtonSfx() {
  playFromPoolDebounced('button', 'round-robin', 80);
}

export function playTapBodySfx() {
  playFromPoolDebounced('tap_body', 'random', 80);
}

export function playTapGlassSfx() {
  playFromPoolDebounced('tap_glass', 'random', 120);
}

export function playBmoBeepBoopSfx(): boolean {
  if (Math.random() >= 0.3) return false;
  return playFromPoolDebounced('bmo_beepboop', 'random', 80);
}

export function playBmoChuckleSfx() {
  playFromPoolDebounced('bmo_chuckle', 'random', 200);
}

export function playBmoHmmSfx() {
  playFromPoolDebounced('bmo_hmm', 'random', 600);
}

export function playCassetteInSfx() {
  playFromPool('cassette_in', 'round-robin');
}

export function playCassetteOutSfx() {
  playFromPool('cassette_out', 'round-robin');
}

export function playTvOnSfx() {
  playFromPool('tv_on', 'round-robin');
}

export function playTvOffSfx() {
  playFromPool('tv_off', 'round-robin');
}
