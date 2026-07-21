const PALETTE: Array<{ grad: [string, string]; halo: string }> = [
  { grad: ["#FF9A82", "#FFCB6B"], halo: "rgba(255,154,130,0.45)" },
  { grad: ["#8B7BE8", "#FF9A82"], halo: "rgba(139,123,232,0.40)" },
  { grad: ["#7CD3C5", "#8B7BE8"], halo: "rgba(124,211,197,0.45)" },
  { grad: ["#FFCB6B", "#FF9A82"], halo: "rgba(255,203,107,0.45)" },
  { grad: ["#8B7BE8", "#7CD3C5"], halo: "rgba(139,123,232,0.40)" },
  { grad: ["#FF9A82", "#8B7BE8"], halo: "rgba(255,154,130,0.45)" },
  { grad: ["#7CD3C5", "#FFCB6B"], halo: "rgba(124,211,197,0.45)" },
  { grad: ["#FFCB6B", "#7CD3C5"], halo: "rgba(255,203,107,0.45)" },
];

export function avatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}
