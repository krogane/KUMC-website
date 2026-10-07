import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/og", { recursive: true });
for (const name of [
  "campus",
  "campus-wide",
  "treasure",
  "gunfight",
  "athletic",
])
  await sharp(`src/assets/${name}.jpg`)
    .resize(1200, 630, { fit: "cover" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(`public/og/${name}.jpg`);
await sharp("src/assets/campus-wide.jpg")
  .resize(1200, 630, { fit: "cover" })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile("public/og/default.jpg");
