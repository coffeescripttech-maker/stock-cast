/**
 * Event Polyfill for React Native NONE Property Error
 * 
 * This polyfill fixes the "Cannot assign to read-only property 'NONE'" error
 * that occurs in React Native's WebSocket/Event system.
 */

// Only apply polyfill if we're in React Native environment
if (typeof global !== 'undefined' && global.Event) {
  const OriginalEvent = global.Event;
  
  // Create a patched Event constructor
  function PatchedEvent(type, eventInitDict) {
    const event = new OriginalEvent(type, eventInitDict);
    
    // Make NONE property writable if it exists and is read-only
    if (event.NONE !== undefined) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(event, 'NONE');
        if (descriptor && !descriptor.writable) {
          Object.defineProperty(event, 'NONE', {
            value: event.NONE,
            writable: true,
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable
          });
        }
      } catch (error) {
        // If we can't modify the property, create a new one
        try {
          delete event.NONE;
          event.NONE = 0; // Default value for NONE
        } catch (deleteError) {
          // If all else fails, just ignore the error
          console.warn('Could not fix NONE property:', deleteError);
        }
      }
    }
    
    return event;
  }
  
  // Copy static properties from original Event
  Object.setPrototypeOf(PatchedEvent, OriginalEvent);
  Object.setPrototypeOf(PatchedEvent.prototype, OriginalEvent.prototype);
  
  // Copy static constants
  if (OriginalEvent.NONE !== undefined) {
    PatchedEvent.NONE = OriginalEvent.NONE;
  }
  if (OriginalEvent.CAPTURING_PHASE !== undefined) {
    PatchedEvent.CAPTURING_PHASE = OriginalEvent.CAPTURING_PHASE;
  }
  if (OriginalEvent.AT_TARGET !== undefined) {
    PatchedEvent.AT_TARGET = OriginalEvent.AT_TARGET;
  }
  if (OriginalEvent.BUBBLING_PHASE !== undefined) {
    PatchedEvent.BUBBLING_PHASE = OriginalEvent.BUBBLING_PHASE;
  }
  
  // Replace global Event with patched version
  global.Event = PatchedEvent;
  
  console.log('✅ Event polyfill applied to fix NONE property error');
}

export default {};