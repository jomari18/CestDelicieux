import { readFile, readdir } from "node:fs/promises";
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`,
      ),
    )
  ).flat();
}
let combined = "";
for (const path of await files("dist")) {
  if (/\.(js|html|css|json)$/.test(path))
    combined += await readFile(path, "utf8");
}
if (
  /sb_secret_[A-Za-z0-9_-]{12,}|SUPABASE_SERVICE_ROLE_KEY|ORS_API_KEY|[A-Z]:[\\/]Users[\\/]/i.test(
    combined,
  )
)
  throw Error("Sensitive configuration or developer path found in bundle");
if (
  !combined.includes("xjcmygnnbkdnetkdsfyq.supabase.co") ||
  !combined.includes("sb_publishable_")
)
  throw Error(
    "Build is missing the dedicated restaurant public backend configuration",
  );
const cap = await readFile("capacitor.config.ts", "utf8");
if (/server\s*:\s*\{[^}]*\burl\s*:/.test(cap))
  throw Error(
    "Production native app must bundle assets, not use a development server",
  );
console.log(
  "PASS bundle: restaurant public configuration present; no server secrets/local paths/development server URL.",
);
