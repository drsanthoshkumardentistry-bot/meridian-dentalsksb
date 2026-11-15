// Copies text and says whether it worked. Some in-app browsers refuse the clipboard; then the old way is tried,
// and the caller can tell the person to copy by hand. Never throws.
export const copyText = async (text) => {
  const value = String(text == null ? "" : text);
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (e) { /* fall through to the old way */ }
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = value; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = typeof document.execCommand === "function" && document.execCommand("copy");
    document.body.removeChild(ta);
    return Boolean(ok);
  } catch (e) { return false; }
};
export const COPY_FAILED = "Could not copy. Select the text and copy it by hand.";
