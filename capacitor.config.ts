import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.jomaricandido.cestdelicieux",
  appName: "C’est Délicieux",
  webDir: "dist",
  android: { backgroundColor: "#191d19" },
  server: { androidScheme: "https" },
  plugins: {
    SystemBars: {
      style: "DARK",
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
    },
  },
};
export default config;
