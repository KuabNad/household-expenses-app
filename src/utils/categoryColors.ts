export const CATEGORY_COLORS = [
  '#D62828',
  '#F77F00',
  '#F2B705',
  '#2E8B57',
  '#00897B',
  '#0077B6',
  '#3949AB',
  '#6A1B9A',
  '#C2185B',
  '#8E3B46',
  '#6D4C41',
  '#455A64',
  '#7CB342',
  '#00A6A6',
  '#1565C0',
  '#7B1FA2',
  '#E64A19',
  '#5D6B1D',
] as const;

const LEGACY_COLOR_MAP: Record<string, string> = {
  '#315C4C': '#2E8B57',
  '#D28B5C': '#F77F00',
  '#6F8FA6': '#0077B6',
  '#A16E83': '#C2185B',
  '#7D9363': '#7CB342',
  '#C5A53D': '#F2B705',
  '#B85C5C': '#D62828',
  '#7B6FA6': '#6A1B9A',
  '#4F94A3': '#00897B',
  '#D66A8A': '#C2185B',
  '#8A6D3B': '#6D4C41',
  '#4C8C6B': '#2E8B57',
  '#D35F45': '#E64A19',
  '#5B72B2': '#3949AB',
  '#9A63A8': '#7B1FA2',
  '#777E7B': '#455A64',
  '#2E86AB': '#0077B6',
  '#E09F3E': '#F77F00',
};

export function strongerCategoryColor(color?: string) {
  if (!color) return CATEGORY_COLORS[0];
  return LEGACY_COLOR_MAP[color.toUpperCase()] ?? color;
}
