// Polyfills for React Native - must be loaded before any other code
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

// Event polyfill
if (typeof global.Event === 'undefined') {
  global.Event = function Event(type, options = {}) {
    this.type = type;
    this.target = options.target || null;
    this.currentTarget = options.currentTarget || null;
    this.bubbles = options.bubbles || false;
    this.cancelable = options.cancelable || false;
    this.defaultPrevented = false;
    this.eventPhase = 0;
    this.timeStamp = Date.now();
    
    this.preventDefault = function() {
      this.defaultPrevented = true;
    };
    
    this.stopPropagation = function() {
      // No-op
    };
    
    this.stopImmediatePropagation = function() {
      // No-op
    };
  };
}

// EventTarget polyfill
if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = function EventTarget() {
    this._listeners = {};
  };
  
  global.EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }
    this._listeners[type].push(listener);
  };
  
  global.EventTarget.prototype.removeEventListener = function(type, listener, options) {
    if (this._listeners[type]) {
      const index = this._listeners[type].indexOf(listener);
      if (index > -1) {
        this._listeners[type].splice(index, 1);
      }
    }
  };
  
  global.EventTarget.prototype.dispatchEvent = function(event) {
    if (this._listeners[event.type]) {
      event.target = this;
      event.currentTarget = this;
      this._listeners[event.type].forEach(listener => {
        try {
          listener.call(this, event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
    return !event.defaultPrevented;
  };
}

// CustomEvent polyfill
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = function CustomEvent(type, options = {}) {
    const event = new global.Event(type, options);
    event.detail = options.detail || null;
    return event;
  };
}

// AbortController polyfill
if (typeof global.AbortController === 'undefined') {
  global.AbortController = function AbortController() {
    this.signal = {
      aborted: false,
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() { return true; }
    };
    
    this.abort = function() {
      this.signal.aborted = true;
    };
  };
}

// AbortSignal polyfill
if (typeof global.AbortSignal === 'undefined') {
  global.AbortSignal = {
    aborted: false,
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() { return true; }
  };
}

// Window.confirm polyfill for React Native
if (typeof global.window !== 'undefined' && typeof global.window.confirm === 'undefined') {
  global.window.confirm = function(message) {
    // In React Native, we can't do synchronous alerts, so we'll return true by default
    // The proper approach is to use Alert.alert with callbacks
    console.warn('window.confirm called in React Native environment. Use Alert.alert instead.');
    return true;
  };
}

console.log('✅ Polyfills loaded successfully');