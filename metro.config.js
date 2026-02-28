const path = require('path');
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// プロジェクトのルートディレクトリを取得
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// 1. pnpmの構造を正しく読み込ませる設定
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// 2. 重要：エラーの出ている node_modules 内のキャッシュも監視対象に加える
config.watchFolders = [
  projectRoot,
  path.resolve(projectRoot, "node_modules"),
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Vercel(Web)ではファイル書き出しによる競合を避けるため false にしてみます
  forceWriteFileSystem: false, 
});