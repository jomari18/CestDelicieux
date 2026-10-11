import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
mkdirSync("outputs/audit", { recursive: true });
const cli =
  process.env.PLAYWRIGHT_CLI ??
  "C:/Users/Mojxd/AppData/Roaming/npm/playwright-cli.cmd";
for (const file of [
  "auth-audit.js",
  "public-audit.js",
  "workflow-audit.js",
  "resilience-audit.js",
  "review-regressions.js",
]) {
  const result = spawnSync(
    cli,
    ["-s=cest-audit", "run-code", `--filename=tests/browser/${file}`],
    { shell: true, encoding: "utf8" },
  );
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status !== 0 || result.stdout?.includes("### Error"))
    process.exit(1);
}
