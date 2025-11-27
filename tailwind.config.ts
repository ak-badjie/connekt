import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                midnight: "#0a0a0f",
                gold: "#f59e0b",
                primary: {
                    DEFAULT: "#008080", // Teal
                    teal: "#008080",
                    orange: "#FFA500",
                }
            },
        },
    },
    plugins: [],
};
export default config;
