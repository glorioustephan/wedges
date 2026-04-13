import { wedgesTW } from "./src/tw-plugin/plugin.ts";

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [wedgesTW()],
};

export default config;
