import { Configuration } from "electron-builder";

const productName = "FlowTune";
const electronLanguages = ["en", "zh_CN"];
const { APP_BUNDLE_ID, IDENTITY, APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID } =
  process.env;

console.log(`APP_BUNDLE_ID: ${APP_BUNDLE_ID}`);
console.log(`IDENTITY: ${IDENTITY}`);
console.log(`APPLE_TEAM_ID: ${APPLE_TEAM_ID}`);

const options: Configuration = {
  appId: APP_BUNDLE_ID || "com.flowtune.app",
  productName: productName,
  files: ["./build/**/*"],
  extends: null,
  buildDependenciesFromSource: false,
  mac: {
    type: "distribution",
    category: "public.app-category.productivity",
    gatekeeperAssess: false,
    electronLanguages,
    identity: IDENTITY || null,
    hardenedRuntime: true,
    entitlements: "assets/plist/entitlements.mac.plist",
    entitlementsInherit: "assets/plist/entitlements.mac.plist",
    ...(APPLE_TEAM_ID && {
      provisioningProfile: undefined,
      teamId: APPLE_TEAM_ID,
    }),
    extendInfo: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleLocalizations: electronLanguages,
      CFBundleDevelopmentRegion: "en",
    },
    // 配置代码签名
    ...(IDENTITY && {
      signIgnore: ["node_modules", "build/node_modules"],
    }),
    notarize: APPLE_ID && APPLE_ID_PASSWORD && APPLE_TEAM_ID && true,
  },
  dmg: {
    //backgroundColor: '#f1f1f6',
    // background: "assets/dmg-bg.png",
    //icon: 'assets/dmg-icon.icns',
    // iconSize: 160,
    // window: {
    //   width: 600,
    //   height: 420,
    // },
    // contents: [
    //   {
    //     x: 150,
    //     y: 200,
    //   },
    //   {
    //     x: 450,
    //     y: 200,
    //     type: "link",
    //     path: "/Applications",
    //   },
    // ],
    sign: false,
    artifactName:
      "${productName}_mac_${arch}_${version}(${buildVersion}).${ext}",
  },
  win: {
    icon: "assets/icon.ico",
    //requestedExecutionLevel: 'requireAdministrator'
  },
  nsis: {
    installerIcon: "assets/installer-icon.ico",
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    shortcutName: productName,
    artifactName:
      "${productName}_windows_installer_${arch}_${version}(${buildVersion}).${ext}",
  },
  portable: {
    artifactName:
      "${productName}_windows_portable_${arch}_${version}(${buildVersion}).${ext}",
  },
  linux: {
    icon: "assets/app.icns",
    artifactName:
      "${productName}_linux_${arch}_${version}(${buildVersion}).${ext}",
    category: "Utility",
    synopsis: "An App for hosts management and switching.",
    desktop: {
      entry: {
        Exec: `${productName} %U`,
        Icon: productName,
        Type: "Application",
        Categories: "Utility;Network;",
      },
      desktopActions: {
        NewWindow: {
          Name: productName,
          Exec: `${productName} --new-window %U`,
          OnlyShowIn: "Unity;GNOME;KDE;XFCE;LXQt;MATE;",
        },
      },
    },
  },
  publish: null,
  // publish: {
  //   provider: "github",
  //   owner: "daqi",
  //   repo: "flowtune",
  // },
  compression: "maximum",
  removePackageScripts: true,
  nodeGypRebuild: false,
  npmRebuild: false,
};

export default options;
