// Isolated-world side of the MAIN-world bridge (see main.ts).

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const pending = new Map<string, (payload: Any) => void>();
let seq = 0;

window.addEventListener('message', (e: MessageEvent) => {
  if (e.source !== window || !e.data || e.data.source !== 'nubit-main') return;
  const cb = pending.get(e.data.id);
  if (cb) {
    pending.delete(e.data.id);
    cb(e.data.payload);
  }
});

export function askMain<T = Any>(type: 'watch' | 'page' | 'player', timeoutMs = 1500): Promise<T | null> {
  return new Promise((resolve) => {
    const id = `n${++seq}_${Date.now()}`;
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, timeoutMs);
    pending.set(id, (payload) => {
      clearTimeout(timer);
      resolve(payload as T);
    });
    window.postMessage({ source: 'nubit-iso', id, type }, '*');
  });
}
