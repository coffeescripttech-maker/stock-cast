/**
 * TypeScript declarations for the Chromium-native BarcodeDetector API.
 * Not part of lib.dom yet, so we declare it here.
 * Supported in Chrome desktop / Electron / Android Chrome.
 */
interface BarcodeDetectorOptions {
  formats?: string[];
}

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  rawValue: string;
  format: string;
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}
