import icongen from "icon-gen";
import { join } from "path";
import { __dirname } from "./utils";
import { ensureDirSync, moveSync, removeSync } from "fs-extra";

const basePath = join(__dirname, "../assets/icons");

async function main() {
  // Generate Windows icon (.ico)
  await icongen(
    join(basePath, "icon-win.png"),
    join(basePath),
    {
      ico: { name: "icon" },
      report: true,
    }
  );
  // Generate macOS icon (.icns)
  await icongen(
    join(basePath, "icon-mac.png"),
    join(basePath),
    {
      icns: { name: "icon" },
      report: true,
    }
  );
  // Generate linux icons
  const linuxIconSizes = [16, 24, 32, 48, 64, 128, 256, 512];
  const tmpPath = join(basePath, ".icons");
  const outputPath = join(basePath, "icons");
  const prefix = "icon-";
  removeSync(outputPath);
  ensureDirSync(tmpPath);
  await icongen(
    join(basePath, "icon-win.png"),
    tmpPath,
    {
      favicon: { name: prefix, pngSizes: linuxIconSizes, icoSizes: [] },
      report: true,
    }
  );
  linuxIconSizes.forEach((size) => {
    console.log(`Moving: ${prefix}${size}.png to ${size}x${size}.png`);
    moveSync(join(tmpPath, `${prefix}${size}.png`), join(outputPath, `${size}x${size}.png`), { overwrite: true });
  });
  removeSync(tmpPath);
}

main();
