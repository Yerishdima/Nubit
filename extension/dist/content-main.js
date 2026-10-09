"use strict";
(() => {
  // src/content/main.ts
  (() => {
    const W = window;
    if (W.__nubitMainLoaded) return;
    W.__nubitMainLoaded = true;
    let navResponse = null;
    document.addEventListener("yt-navigate-finish", (e) => {
      navResponse = e?.detail?.response ?? null;
    });
    function getPlayerResponse() {
      const player = document.getElementById("movie_player");
      try {
        const r = player?.getPlayerResponse?.();
        if (r?.videoDetails?.videoId) return r;
      } catch {
      }
      if (navResponse?.playerResponse?.videoDetails) return navResponse.playerResponse;
      return W.ytInitialPlayerResponse;
    }
    function getPageData() {
      const app = document.querySelector("ytd-app");
      const candidates = [app?.data?.response, navResponse?.response, W.ytInitialData];
      for (const c of candidates) if (c && typeof c === "object" && (c.contents || c.header || c.metadata)) return c;
      return null;
    }
    function clone(x) {
      try {
        return JSON.parse(JSON.stringify(x));
      } catch {
        return null;
      }
    }
    window.addEventListener("message", (e) => {
      if (e.source !== window || !e.data || e.data.source !== "nubit-iso") return;
      const { id, type } = e.data;
      let payload = null;
      try {
        if (type === "watch") payload = { playerResponse: clone(getPlayerResponse()), data: clone(getPageData()) };
        else if (type === "page") payload = { data: clone(getPageData()) };
        else if (type === "player") payload = { playerResponse: clone(getPlayerResponse()) };
      } catch (err) {
        payload = { error: String(err) };
      }
      window.postMessage({ source: "nubit-main", id, payload }, "*");
    });
  })();
})();
