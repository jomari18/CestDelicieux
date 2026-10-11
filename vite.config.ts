import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readPublicConfig } from "./src/lib/config";
export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = {
      ...loadEnv(mode, process.cwd(), "VITE_"),
      ...Object.fromEntries(
        Object.entries(process.env).filter(([name]) =>
          name.startsWith("VITE_"),
        ),
      ),
    };
    const config = readPublicConfig(env);
    if (!config.ok) throw Error(config.message);
    if (
      Object.keys(env).some((name) =>
        /ORS_API_KEY|SERVICE_ROLE|SECRET/i.test(name),
      )
    )
      throw Error("Server secrets must not have VITE_ prefixes");
  }
  return {
    plugins: [react()],
    build: { target: "es2022" },
    server: {
      watch: {
        ignored: ["**/.local-tools/**", "**/.local-db/**", "**/.superpowers/**", "**/android/**", "**/outputs/**"],
      },
    },
  };
});
