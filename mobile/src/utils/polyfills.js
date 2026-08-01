/**
 * React Native Polyfills
 * 
 * This file contains polyfills to fix various React Native compatibility issues.
 * MUST be imported before any React Native modules.
 */

// Global error handler to catch NONE property errors
if (typeof global !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('Cannot assign to read-only property') && message.includes('NONE')) {
      console.warn('Suppressed NONE property error:', message);
      return;
    }
    return originalConsoleError.apply(console, args);
  };
}

// Aggressive Event polyfill - patch before React Native loads
(function() {
  if (typeof global !== 'undefined') {
    // Store original Event if it exists
    const OriginalEvent = global.Event;
    
    if (OriginalEvent) {
      // Create a completely new Event constructor that avoids the NONE property issue
      function SafeEvent(type, eventInitDict) {
        // Create event using original constructor
        let event;
        try {
          event = new OriginalEvent(type, eventInitDict);
        } catch (error) {
          // If original fails, create a minimal event object
          event = {
            type: type,
            bubbles: eventInitDict?.bubbles || false,
            cancelable: eventInitDict?.cancelable || false,
            composed: eventInitDict?.composed || false,
            target: null,
            currentTarget: null,
            eventPhase: 0,
            timeStamp: Date.now(),
            defaultPrevented: false,
            isTrusted: false,
            preventDefault: function() { this.defaultPrevented = true; },
            stopPropagation: function() {},
            stopImmediatePropagation: function() {}
          };
        }
        
        // Safely handle NONE property
        if (event && typeof event === 'object') {
          try {
            // Try to make NONE writable if it exists
            const descriptor = Object.getOwnPropertyDescriptor(event, 'NONE');
            if (descriptor && !descriptor.writable) {
              Object.defineProperty(event, 'NONE', {
                value: 0,
                writable: true,
                enumerable: false,
                configurable: true
              });
            } else if (event.NONE === undefined) {
              // Add NONE property if it doesn't exist
              Object.defineProperty(event, 'NONE', {
                value: 0,
                writable: true,
                enumerable: false,
                configurable: true
              });
            }
          } catch (error) {
            // If we can't modify NONE, try to delete and recreate
            try {
              delete event.NONE;
              event.NONE = 0;
            } catch (deleteError) {
              // Last resort: ignore the error and continue
              console.warn('Could not fix NONE property, continuing anyway');
            }
          }
        }
        
        return event;
      }
      
      // Copy static properties and constants
      SafeEvent.prototype = OriginalEvent.prototype;
      SafeEvent.NONE = 0;
      SafeEvent.CAPTURING_PHASE = 1;
      SafeEvent.AT_TARGET = 2;
      SafeEvent.BUBBLING_PHASE = 3;
      
      // Replace global Event
      global.Event = SafeEvent;
      console.log('✅ Aggressive Event polyfill applied');
    }
    
    // Also patch WebSocket to prevent related errors
    const OriginalWebSocket = global.WebSocket;
    if (OriginalWebSocket) {
      function SafeWebSocket(url, protocols) {
        try {
          const ws = new OriginalWebSocket(url, protocols);
          
          // Wrap event handlers to catch NONE errors
          const originalAddEventListener = ws.addEventListener;
          ws.addEventListener = function(type, listener, options) {
            const wrappedListener = function(event) {
              try {
                return listener.call(this, event);
              } catch (error) {
                if (error.message && error.message.includes('NONE')) {
                  console.warn('Caught NONE property error in WebSocket event, ignoring');
                  return;
                }
                throw error;
              }
            };
            return originalAddEventListener.call(this, type, wrappedListener, options);
          };
          
          return ws;
        } catch (error) {
          console.warn('WebSocket creation failed:', error);
          // Return a mock WebSocket
          return {
            readyState: 3, // CLOSED
            close: () => {},
            send: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
            onopen: null,
            onclose: null,
            onmessage: null,
            onerror: null
          };
        }
      }
      
      // Copy static properties
      SafeWebSocket.CONNECTING = 0;
      SafeWebSocket.OPEN = 1;
      SafeWebSocket.CLOSING = 2;
      SafeWebSocket.CLOSED = 3;
      
      global.WebSocket = SafeWebSocket;
      console.log('✅ Safe WebSocket polyfill applied');
    }
  }
})();

export default {};