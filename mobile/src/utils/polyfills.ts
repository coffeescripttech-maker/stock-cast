/**
 * Polyfills for React Native compatibility issues
 * Fixes the "Cannot assign to read-only property 'NONE'" error
 */

// Fix for WebSocket Event NONE property error
if (typeof global !== 'undefined') {
  // Patch the Event constructor to avoid NONE property assignment
  const originalEvent = global.Event;
  
  if (originalEvent) {
    try {
      // Create a wrapper that prevents NONE property assignment
      global.Event = function(type: string, eventInitDict?: EventInit) {
        const event = new originalEvent(type, eventInitDict);
        
        // Prevent assignment to NONE property
        Object.defineProperty(event, 'NONE', {
          value: 0,
          writable: false,
          enumerable: true,
          configurable: false
        });
        
        return event;
      } as any;
      
      // Copy static properties
      Object.setPrototypeOf(global.Event, originalEvent);
      Object.assign(global.Event, originalEvent);
      
    } catch (error) {
      console.warn('Could not patch Event constructor:', error);
    }
  }
}

// Additional polyfills for React Native compatibility
if (typeof global !== 'undefined') {
  // Ensure console methods exist
  if (!global.console) {
    global.console = {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
      debug: () => {},
    } as any;
  }
  
  // Polyfill for missing fetch timeout
  const originalFetch = global.fetch;
  if (originalFetch) {
    global.fetch = function(input: RequestInfo | URL, init?: RequestInit & { timeout?: number }) {
      if (init?.timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), init.timeout);
        
        return originalFetch(input, {
          ...init,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      }
      
      return originalFetch(input, init);
    };
  }
}

export {};