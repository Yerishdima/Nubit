// Runs in the page's MAIN world: reads YouTube's own data objects and hands them to the isolated
// content script via window.postMessage. Nothing here touches chrome.* APIs.
(() => {
  type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const W = window as Any;
  if (W.__nubitMainLoaded) return;
  W.__nubitMainLoaded = true;

  let navResponse: Any = null;
  document.addEventListener('yt-navigate-finish', (e: Event) => {
    navResponse = (e as CustomEvent)?.detail?.response ?? null;
  });

  function getPlayerResponse(): Any {
    const player = document.getElementById('movie_player') as Any;
    try {
      const r = player?.getPlayerResponse?.();
      if (r?.videoDetails?.videoId) return r;
    } catch {
      /* player not ready */
    }
    if (navResponse?.playerResponse?.videoDetails) return navResponse.playerResponse;
    return W.ytInitialPlayerResponse;
  }

  function getPageData(): Any {
    const app = document.querySelector('ytd-app') as Any;
    const candidates = [app?.data?.response, navResponse?.response, W.ytInitialData];
    for (const c of candidates) if (c && typeof c === 'object' && (c.contents || c.header || c.metadata)) return c;
    return null;
  }

  function clone(x: unknown): unknown {
    try {
      return JSON.parse(JSON.stringify(x));
    } catch {
      return null;
    }
  }

  window.addEventListener('message', (e: MessageEvent) => {
    if (e.source !== window || !e.data || e.data.source !== 'nubit-iso') return;
    const { id, type } = e.data as { id: string; type: string };
    let payload: unknown = null;
    try {
      if (type === 'watch') payload = { playerResponse: clone(getPlayerResponse()), data: clone(getPageData()) };
      else if (type === 'page') payload = { data: clone(getPageData()) };
      else if (type === 'player') payload = { playerResponse: clone(getPlayerResponse()) };
    } catch (err) {
      payload = { error: String(err) };
    }
    window.postMessage({ source: 'nubit-main', id, payload }, '*');
  });
})();
