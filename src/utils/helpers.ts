export function getContrastingTextColor(hexColor) {
  // Remove the '#' if present
  hexColor = hexColor.replace("#", "");

  // Convert the hex color to RGB
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate the luminance of the color
  let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // If luminance is greater than 128, the color is light, so we return black text, otherwise white
  return luminance > 128 ? "#000000" : "#FFFFFF";
}

export function rgbaToInt(r, g, b, a) {
  return r | (g << 8) | (b << 16) | (a << 24);
}

export function formatMinutes(minutes: number): string {
  const mins  = Math.round(minutes % 60);      // Get the remaining minutes, rounded
  const days  = Math.floor(minutes / (60*24)); // Get the whole days
  const hours = Math.floor(minutes / 60) % 24; // Get the whole hours

  // Create a readable string
  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  result += `${mins}m`;

  return result.trim();
}
