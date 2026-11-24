// The warning shown before the first manual axis move. It is shown until it is confirmed once, per
// browser, so that it doesn't get in the way of normal use.

const STORAGE_KEY = "ha-bambulab-move-axis-warning-confirmed";

// Fallback for when localStorage is not available.
let confirmedThisSession = false;

export function isMoveAxisWarningConfirmed(): boolean {
  if (confirmedThisSession) return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch (err) {
    console.warn("Failed to read move axis warning state:", err);
    return false;
  }
}

export function setMoveAxisWarningConfirmed(): void {
  confirmedThisSession = true;
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch (err) {
    console.warn("Failed to save move axis warning state:", err);
  }
}
