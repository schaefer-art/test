// app/fonts.ts
import {
  Inter,
  Lora,
  Merriweather,
  Bangers,
  Petit_Formal_Script,
  Spectral,
} from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const lora = Lora({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

export const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-merriweather",
  display: "swap",
});

export const bangers = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bangers",
  display: "swap",
});

export const petitFormalScript = Petit_Formal_Script({
  subsets: ["latin"],
  weight: "400",               // only available weight
  variable: "--font-petit-formal-script",
  display: "swap",
});

export const spectral = Spectral({
  subsets: ["latin"],
  weight: "400",               
  variable: "--font-spectral",
  display: "swap",
});
