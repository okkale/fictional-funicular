// Resolved brand colors for code that cannot use CSS variables (canvas).
export function themeColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (n) => s.getPropertyValue(n).trim();
  return {
    bg: v("--bg"), text: v("--text"), surface2: v("--surface-2"),
    accent: v("--accent"), accentDeep: v("--wine"), blue: v("--blue-glow"),
  };
}
