const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");
const { withStorybook } = require("@storybook/react-native/withStorybook");

const config = getDefaultConfig(__dirname);

// One three.js for the whole bundle. Its package exports give `import`
// (our code) three.module.js and `require` (react-three-fiber's native CJS
// build) three.cjs; two copies break three's instanceof checks and the
// native scene renders black.
const THREE = path.join(__dirname, "node_modules/three/build/three.module.js");
config.resolver.resolveRequest = (context, moduleName, platform) =>
  moduleName === "three"
    ? { type: "sourceFile", filePath: THREE }
    : context.resolveRequest(context, moduleName, platform);

module.exports = withStorybook(config);
