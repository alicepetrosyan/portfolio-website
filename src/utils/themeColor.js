export function themeColor(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}