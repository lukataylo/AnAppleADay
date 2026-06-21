// Palette and gradient, matched to the reference app and the web PWA.
export const palette = {
  bgTop: "#1a0509",
  bgMid: "#4a0e1c",
  bgBottom: "#8a1a2a",
  bgAccent: "#c4364a",
  ink: "#ffffff",
  inkDim: "rgba(255,255,255,0.62)",
  inkFaint: "rgba(255,255,255,0.16)",
  accent: "#ffd27a",
  accentSoft: "rgba(255,210,122,0.16)",
  cardBorder: "rgba(255,255,255,0.12)",
  cardFill: "rgba(40,10,18,0.55)",
  danger: "#ff6b6b",
  dangerFill: "rgba(255,80,80,0.16)",
};

export const gradient = {
  colors: [palette.bgTop, palette.bgMid, palette.bgBottom, palette.bgAccent],
  locations: [0, 0.35, 0.75, 1] as [number, number, number, number],
};

export const radius = 22;
