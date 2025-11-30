/**
 * Color Palette - Extracted from Loading Screen
 * These colors define the visual identity of the dapp and should be used consistently throughout
 */

export const colors = {
  // Primary Purple Palette
  primary: {
    light: "#8C5BFF", // Bright purple - main accent color
    medium: "#6D40C6", // Medium purple - secondary accent
    dark: "#382080", // Dark purple - tertiary accent
  },

  // Background Gradients (dark to darker)
  background: {
    light: "#110F1F", // Top gradient layer
    medium: "#0B0915", // Middle gradient layer
    dark: "#08070F", // Bottom gradient layer (darkest)
  },

  // Card/Container Backgrounds
  card: {
    light: "#120F23", // Light card background
    medium: "#1A1630", // Medium card background
  },

  // Border Colors (with opacity)
  border: {
    white05: "rgba(255, 255, 255, 0.05)", // Subtle border
    white10: "rgba(255, 255, 255, 0.1)", // More visible border
    purple40: "rgba(140, 91, 255, 0.4)", // Purple border at 40% opacity (#8C5BFF)
    purple25: "rgba(56, 32, 128, 0.25)", // Dark purple border at 25% opacity (#382080)
  },

  // Glow/Shadow Colors
  glow: {
    primary: "rgba(140, 91, 255, 0.9)", // Primary glow (#8C5BFF)
    shadow: "rgba(108, 77, 217, 0.85)", // Shadow glow (#6D40C6)
    blur35: "rgba(109, 64, 198, 0.35)", // Blur effect (#6D40C6 at 35%)
  },

  // Text Colors
  text: {
    white: "#FFFFFF",
    muted: "#9CA3AF", // Gray for muted text (if needed)
  },
} as const;

/**
 * Tailwind CSS color classes mapping
 * Use these class names in your components for consistency
 */
export const colorClasses = {
  // Background gradients
  bgGradientPrimary: "bg-gradient-to-b from-[#110F1F]/90 via-[#0B0915]/75 to-[#08070F]/90",
  bgGradientCard: "bg-gradient-to-br from-[#8C5BFF] via-[#6D40C6] to-[#382080]",

  // Background solid
  bgPrimaryLight: "bg-[#110F1F]",
  bgPrimaryMedium: "bg-[#0B0915]",
  bgPrimaryDark: "bg-[#08070F]",
  bgCardLight: "bg-[#120F23]",
  bgCardMedium: "bg-[#1A1630]",

  // Border classes
  borderWhite05: "border-white/5",
  borderWhite10: "border-white/10",
  borderPurple40: "border-[#8C5BFF]/40",
  borderPurple25: "border-[#382080]/25",

  // Text colors
  textPrimary: "text-[#8C5BFF]",
  textMedium: "text-[#6D40C6]",
  textDark: "text-[#382080]",

  // Shadow/Glow classes
  shadowPrimary: "shadow-[0_35px_80px_-40px_rgba(108,77,217,0.85)]",
  glowPrimary: "shadow-[0_0_55px_-15px_rgba(140,91,255,0.9)]",
} as const;

/**
 * Helper function to get color values programmatically
 */
export function getColor(path: string): string {
  const keys = path.split(".");
  let value: unknown = colors;
  for (const key of keys) {
    if (typeof value === "object" && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      throw new Error(`Color path "${path}" not found`);
    }
    if (value === undefined) {
      throw new Error(`Color path "${path}" not found`);
    }
  }
  if (typeof value !== "string") {
    throw new Error(`Color path "${path}" does not resolve to a string`);
  }
  return value;
}

