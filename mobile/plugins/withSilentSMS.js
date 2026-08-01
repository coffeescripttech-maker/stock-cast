// Expo Config Plugin for Silent SMS on Android
const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const withSilentSMS = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

    // Add SEND_SMS permission
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = androidManifest.manifest['uses-permission'];
    const hasSendSMS = permissions.some(
      (perm) => perm.$['android:name'] === 'android.permission.SEND_SMS'
    );

    if (!hasSendSMS) {
      permissions.push({
        $: {
          'android:name': 'android.permission.SEND_SMS',
        },
      });
    }

    return config;
  });
};

module.exports = withSilentSMS;
