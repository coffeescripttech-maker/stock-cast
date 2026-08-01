/**
 * SafeHaven Mobile App Entry Point
 * 
 * This file is the very first thing that runs in the app.
 * We apply polyfills here before any React Native code loads.
 */

// Apply polyfills FIRST before any other imports
import './src/utils/polyfills';

// Now import the main app
import { registerRootComponent } from 'expo';
import App from './App';

// Register the main component
registerRootComponent(App);