import { wedgesTW } from "./packages/ui/src/tw-plugin/plugin.ts";

/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  tailwindFunctions: ["clsx", "cn", "cva"],
  darkMode: "class",
  plugins: [wedgesTW()],
};

export default config;
