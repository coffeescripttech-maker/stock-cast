#!/usr/bin/env node

/**
 * Notification System Integration Test Runner
 * 
 * Runs comprehensive integration tests for the notification system
 * including end-to-end flows, cross-platform behavior, and accessibility.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔔 Running Notification System Integration Tests...\n');

try {
  // Run integration tests with specific configuration
  const testCommand = [
    'npx jest',
    '--testPathPattern=NotificationIntegration.test.ts',
    '--setupFilesAfterEnv=src/services/notifications/__tests__/setup.ts',
    '--verbose',
    '--coverage',
    '--coverageDirectory=coverage/notifications',
    '--collectCoverageFrom=src/services/notifications/**/*.ts',
    '--collectCoverageFrom=src/components/**/Badge*.tsx',
    '--collectCoverageFrom=src/components/**/Connected*.tsx',
    '--collectCoverageFrom=src/screens/**/*Screen.tsx',
    '--testTimeout=10000'
  ].join(' ');

  console.log('Running command:', testCommand);
  console.log('─'.repeat(60));

  execSync(testCommand, { 
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('\n✅ All notification integration tests passed!');
  console.log('\n📊 Test Coverage Report:');
  console.log('   - Badge System: Components and Context');
  console.log('   - Audio/Haptic Services: Cross-platform behavior');
  console.log('   - Settings Integration: UI and persistence');
  console.log('   - Navigation Handling: Deep linking and fallbacks');
  console.log('   - Accessibility: Screen reader and focus management');

} catch (error) {
  console.error('\n❌ Integration tests failed:');
  console.error(error.message);
  
  console.log('\n🔧 Troubleshooting Tips:');
  console.log('   1. Ensure all notification services are properly implemented');
  console.log('   2. Check that badge context is properly connected');
  console.log('   3. Verify settings screen integration is complete');
  console.log('   4. Test individual components before running integration tests');
  
  process.exit(1);
}

console.log('\n🎉 Notification system integration is complete and tested!');
console.log('\nNext steps:');
console.log('   - Run property-based tests for comprehensive coverage');
console.log('   - Test on physical devices for haptic feedback');
console.log('   - Verify accessibility with screen readers');
console.log('   - Performance test with high notification volumes');