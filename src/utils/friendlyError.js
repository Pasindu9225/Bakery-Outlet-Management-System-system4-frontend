// Turns any error (fetch, axios, our own throws) into plain words: what happened + what to do.
// Second argument: a string = context put in front (e.g. "Couldn't save the adjustment"), or
// { context, fallback } where `fallback` is a plain message used only when nothing better is known.
const GENERIC = "Something went wrong. Try again; if it keeps happening, tell your manager.";
const OFFLINE = "Can't reach the server. Check the internet connection, then try again.";
const BY_STATUS = {
  400: "Some details aren't valid. Check the form and try again.",
  401: "Your session has ended. Please sign in again.",
  403: "You don't have permission for this. Ask an admin if you need it.",
  404: "It wasn't found - it may have been removed. Refresh and try again.",
  409: "It was changed by someone else. Refresh and try again.",
  422: "Some details aren't valid. Check the form and try again.",
};
const serverProblem = "The server had a problem. Try again in a minute; if it keeps happening, tell your manager.";
const TECHNICAL = /unknown error|unexpected token|json|undefined|null|is not a function|cannot read|status code|\bstatus\b|http|\b\d{3}\b/i;

const statusText = (status) => BY_STATUS[status] || (status >= 500 ? serverProblem : null);

export const friendlyError = (err, opts) => {
  let { context, fallback } = typeof opts === "string" ? { context: opts } : (opts || {});
  if (fallback && fallback.trim().split(/\s+/).length < 2) fallback = undefined; // "Error" says nothing
  if (context && context.trim().split(/\s+/).length < 2) context = undefined;
  const msg = String((err && err.message) || "").trim();
  const status = err?.response?.status || Number((msg.match(/\b([45]\d\d)\b/) || [])[1]) || undefined;
  let text;
  if ((!status && /failed to fetch|networkerror|network error|load failed/i.test(msg)) || err?.code === "ERR_NETWORK") {
    text = OFFLINE;
  } else if (typeof err?.response?.data?.message === "string" && err.response.data.message.trim()
    && !TECHNICAL.test(err.response.data.message)) {
    text = err.response.data.message.trim();
  } else if (msg && !TECHNICAL.test(msg)) {
    text = msg;
  } else if (fallback) {
    text = fallback.trim();
  } else if (status && statusText(status)) {
    text = statusText(status);
    // "Failed to fetch users: 500" -> "Couldn't fetch users. <what happened>"
    const what = msg.match(/^(?:failed to|error)\s+(.+?)\s*[:(-]?\s*\(?\b[45]\d\d\b/i);
    if (!context && what) context = `Couldn't ${what[1].replace(/[:\s]+$/, "")}`;
  } else {
    text = GENERIC;
  }
  return context ? `${context.replace(/[.:\s]+$/, "")}. ${text}` : text;
};
