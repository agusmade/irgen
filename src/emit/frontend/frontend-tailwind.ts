import path from "node:path";
import type { Project } from "ts-morph";

export function emitTailwindConfig(project: Project, outDir: string) {
  project.createSourceFile(path.join(outDir, "tailwind.config.js"), `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
  `.trim(), { overwrite: true });

  project.createSourceFile(path.join(outDir, "postcss.config.js"), `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
  `.trim(), { overwrite: true });
}
