// Like setInterval for background refreshes, but lighter on the server: no new call while the last
// one is still running, none while the tab is hidden, and one catch-up call when the tab is shown
// again after a skipped refresh. Returns a stop function (use it where clearInterval was used).
export const pollWhileVisible = (fn, ms) => {
  let busy = false;
  let missed = false;
  const tick = () => {
    if (document.hidden) { missed = true; return; }
    if (busy) return;
    missed = false;
    let result;
    try { result = fn(); } catch (e) { return; /* the page shows its own errors */ }
    if (result && typeof result.then === "function") {
      busy = true;
      result.then(() => { busy = false; }, () => { busy = false; });
    }
  };
  const onVisibility = () => { if (!document.hidden && missed) tick(); };
  const id = setInterval(tick, ms);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVisibility);
  };
};
