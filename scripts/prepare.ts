import {
  copyDirectory,
  logSummary,
  logProcessStart,
  handleProcessError,
} from "./utils";

function prepare() {
  // 复制frontend目录
  logProcessStart("Preparing frontend build");
  try {
    copyDirectory(
      "./packages/frontend/dist/",
      "./build/frontend/",
      "Copying frontend build files"
    );
    console.log("✅ Preparation completed successfully");
  } catch (error) {
    handleProcessError(error, "Preparing frontend build");
  }
  // 复制icons从assets/icons目录到build目录
  logProcessStart("Copying icons");
  try {
    console.log("process.platform:", process.platform);
    if (process.platform === "darwin") {
      copyDirectory(
        "./assets/icons/mac/icon.icns",
        "./build/icon.icns",
        "Copying mac icons to build directory"
      );
    }
    if (process.platform === "win32") {
      copyDirectory(
        "./assets/icons/win/icon.ico",
        "./build/icon.ico",
        "Copying windows icons to build directory"
      );
    }
    console.log("✅ Icons copied successfully");
  } catch (error) {
    handleProcessError(error, "Copying icons");
  }
  logSummary(["Frontend build preparation"]);
}

prepare();
