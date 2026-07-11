const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Every teammate's `expo prebuild` generates a fresh, random debug.keystore
// by default, which breaks Google Sign-In (its SHA-1 must match the value
// registered on the Android OAuth client in Google Cloud Console). This
// plugin overwrites the generated keystore with the one committed to the
// repo so everyone shares the same debug signing certificate.
const withSharedDebugKeystore = (config) => {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const src = path.join(config.modRequest.projectRoot, "shared-debug.keystore");
      const dest = path.join(config.modRequest.platformProjectRoot, "app", "debug.keystore");

      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }

      return config;
    },
  ]);
};

module.exports = withSharedDebugKeystore;
