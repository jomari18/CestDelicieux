import { spawnSync } from "node:child_process";
import { readFile, copyFile, writeFile, mkdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = process.cwd(),
  toolchain = JSON.parse(
    (await readFile(".local-tools/android/toolchain.json", "utf8")).replace(
      /^\uFEFF/,
      "",
    ),
  );
const env = {
  ...process.env,
  JAVA_HOME: toolchain.javaHome,
  ANDROID_HOME: toolchain.sdkRoot,
  GRADLE_USER_HOME: path.join(root, ".local-tools/android/gradle-cache"),
};
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    shell: command.endsWith(".bat") || command.endsWith(".cmd"),
    stdio: "inherit",
  });
  if (result.status !== 0)
    throw Error(`${path.basename(command)} failed (${result.status})`);
}
const key = path.join(root, ".local-tools/android/debug.keystore");
try {
  await access(key);
} catch {
  run(path.join(toolchain.javaHome, "bin/keytool.exe"), [
    "-genkeypair",
    "-keystore",
    key,
    "-storepass",
    "android",
    "-keypass",
    "android",
    "-alias",
    "androiddebugkey",
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-dname",
    "CN=Android Debug,O=Android,C=US",
  ]);
}
run("npm.cmd", ["run", "check:bundle"]);
run(
  "gradlew.bat",
  [
    "--no-daemon",
    "--max-workers=2",
    "--no-watch-fs",
    "--stacktrace",
    "assembleDebug",
  ],
  path.join(root, "android"),
);
const apk = path.join(
  root,
  "android/app/build/outputs/apk/debug/app-debug.apk",
);
run(path.join(toolchain.sdkRoot, "build-tools/36.0.0/apksigner.bat"), [
  "verify",
  "--verbose",
  apk,
]);
run(path.join(toolchain.sdkRoot, "build-tools/36.0.0/aapt.exe"), [
  "dump",
  "badging",
  apk,
]);
await mkdir("outputs", { recursive: true });
await copyFile(apk, "outputs/CestDelicieux-debug.apk");
const hash = createHash("sha256")
  .update(await readFile(apk))
  .digest("hex");
await writeFile(
  "outputs/CestDelicieux-debug.apk.sha256",
  `${hash}  CestDelicieux-debug.apk\n`,
);
console.log(`Verified APK SHA256 ${hash}`);
