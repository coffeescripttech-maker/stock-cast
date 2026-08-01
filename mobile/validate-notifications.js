/**
 * Simple validation script for notification infrastructure
 */

const fs = require('fs');
const path = require('path');

function validateNotificationFiles() {
  const requiredFiles = [
    'src/types/notification.ts',
    'src/services/notifications/NotificationManager.ts',
    'src/services/notifications/PermissionHandler.ts',
    'src/services/notifications/NotificationInitializer.ts',
    'src/services/notifications/NotificationConfig.ts',
    'src/services/notifications/index.ts',
    'assets/sounds/critical_alert.wav',
    'assets/sounds/high_alert.wav',
    'assets/sounds/medium_alert.wav',
    'assets/sounds/low_alert.wav'
  ];

  const results = {
    success: true,
    existing: [],
    missing: []
  };

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      results.existing.push(file);
    } else {
      results.missing.push(file);
      results.success = false;
    }
  });

  return results;
}

function validatePackageJson() {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = ['expo-notifications'];
  const missing = [];
  
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      missing.push(dep);
    }
  });

  return {
    success: missing.length === 0,
    missing
  };
}

function validateAppJson() {
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  const hasNotificationPlugin = appJson.expo.plugins.some(plugin => 
    plugin === 'expo-notifications' || 
    (Array.isArray(plugin) && plugin[0] === 'expo-notifications')
  );

  return {
    success: hasNotificationPlugin,
    hasPlugin: hasNotificationPlugin
  };
}

function printResults() {
  console.log('=== Notification Infrastructure Validation ===\n');

  // Validate files
  const fileResults = validateNotificationFiles();
  console.log('📁 File Structure:');
  if (fileResults.success) {
    console.log('✅ All required files exist');
  } else {
    console.log('❌ Missing files:');
    fileResults.missing.forEach(file => console.log(`  - ${file}`));
  }
  console.log(`   Found: ${fileResults.existing.length}/${fileResults.existing.length + fileResults.missing.length} files\n`);

  // Validate package.json
  const packageResults = validatePackageJson();
  console.log('📦 Dependencies:');
  if (packageResults.success) {
    console.log('✅ All required dependencies installed');
  } else {
    console.log('❌ Missing dependencies:');
    packageResults.missing.forEach(dep => console.log(`  - ${dep}`));
  }
  console.log();

  // Validate app.json
  const appResults = validateAppJson();
  console.log('⚙️  Configuration:');
  if (appResults.success) {
    console.log('✅ expo-notifications plugin configured');
  } else {
    console.log('❌ expo-notifications plugin not found in app.json');
  }
  console.log();

  // Overall status
  const overallSuccess = fileResults.success && packageResults.success && appResults.success;
  console.log('🎯 Overall Status:');
  if (overallSuccess) {
    console.log('✅ Notification infrastructure setup complete!');
    console.log('   Ready to implement badge counters, audio alerts, and haptic feedback.');
  } else {
    console.log('❌ Notification infrastructure setup incomplete');
    console.log('   Please address the issues above before proceeding.');
  }

  console.log('\n=== End Validation ===');
}

// Run validation
printResults();