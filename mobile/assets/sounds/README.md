# Notification Sound Assets

This directory contains sound files for different alert severity levels:

- `critical_alert.wav` - Urgent sound for critical alerts
- `high_alert.wav` - Standard alert sound for high priority
- `medium_alert.wav` - Subtle notification sound for medium priority  
- `low_alert.wav` - Subtle notification sound for low priority

## Sound Requirements

- Format: WAV or MP3
- Duration: 1-3 seconds recommended
- Volume: Normalized to prevent distortion
- Quality: 44.1kHz, 16-bit minimum

## Usage

These sounds are automatically loaded by the notification system based on alert severity levels. The mapping is defined in `NotificationConfig.ts`.

## Placeholder Files

The current `.wav` files are placeholders. Replace them with actual audio files before production deployment.