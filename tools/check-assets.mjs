import { readFile, stat } from "node:fs/promises";
const manifest = JSON.parse(
  await readFile("public/assets/manifest.json", "utf8"),
);
let total = 0;
for (const image of manifest) {
  const file = await stat("public" + image.output);
  if (file.size !== image.bytes) throw Error("Asset mismatch " + image.output);
  if (image.width > 1920 || image.height > 1920)
    throw Error("Oversized dimensions");
  const budget = image.output.includes("editorial-") ? 600000 : 250000;
  if (file.size > budget) throw Error("Asset over budget: " + image.output);
  total += file.size;
}
console.log(
  `${manifest.length} optimized assets passed; ${(total / 1048576).toFixed(2)} MB total.`,
);
