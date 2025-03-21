// Debug system configuration
const debugConfig = {
  enabled: true, // Enable by default for development
  logLevel: 'debug', // Default log level
  categories: {
    system: true,
    ui: true,
    file: true,
    ffmpeg: true,
    wasm: true,
    video: true,
    settings: true
  }
};

// Log levels and their priority
const LOG_LEVELS = {
  error: 4,
  warn: 3,
  info: 2,
  debug: 1,
  trace: 0
};

// Create debug indicator element
function createDebugIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'debugIndicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #0f0;
    padding: 5px 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    cursor: pointer;
  `;
  indicator.textContent = 'DEBUG ON';

  // Toggle debug on click
  indicator.addEventListener('click', () => {
    enableDebug(!debugConfig.enabled);
    indicator.textContent = debugConfig.enabled ? 'DEBUG ON' : 'DEBUG OFF';
    indicator.style.color = debugConfig.enabled ? '#0f0' : '#f00';
  });
  document.body.appendChild(indicator);

  console.log('Debug indicator created');
}

// Ensure the logs container exists and is properly styled
function ensureLogsContainer() {
  let logsElement = document.getElementById('logs');
  if (!logsElement) {
    console.warn('Logs container not found, creating one');
    logsElement = document.createElement('div');
    logsElement.id = 'logs';
    logsElement.className = 'logs';
    document.body.appendChild(logsElement);
  }

  // Apply styles to ensure logs are visible
  logsElement.style.cssText = `
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-family: monospace;
    padding: 10px;
    border-radius: 5px;
    margin-top: 20px;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
  `;

  return logsElement;
}

// Append log to UI log element
function appendToUILog(level, category, args) {
  const logsElement = ensureLogsContainer();

  // Format the message
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return '[Object]';
      }
    }
    return arg;
  }).join(' ');

  // Create log entry with appropriate styling
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${level}`;
  logEntry.innerHTML = `<span class="log-timestamp">[${new Date().toLocaleTimeString()}]</span> <span class="log-level">[${level.toUpperCase()}]</span> <span class="log-category">[${category}]</span> ${message}`;
  // Add color based on level
  switch (level) {
    case 'error':
      logEntry.style.color = '#ff5555';
      break;
    case 'warn':
      logEntry.style.color = '#ffaa00';
      break;
    case 'info':
      logEntry.style.color = '#55aaff';
      break;
    case 'debug':
      logEntry.style.color = '#aaaaaa';
      break;
  }

  logsElement.appendChild(logEntry);
  logsElement.scrollTop = logsElement.scrollHeight;

  // Log that we've added to the UI (but don't create an infinite loop!)
  console.log(`UI Log [${level}] [${category}]: ${message}`);
}

// Main debug log function
function debug(category, level, ...args) {
  // Skip if debug is disabled or category is disabled
  if (!debugConfig.enabled || !debugConfig.categories[category]) return;

  // Skip if log level is higher than configured level
  if (LOG_LEVELS[level] > LOG_LEVELS[debugConfig.logLevel]) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`;

  // Use appropriate console method based on level
  switch (level) {
    case 'error':
      console.error(prefix, ...args);
      break;
    case 'warn':
      console.warn(prefix, ...args);
      break;
    case 'info':
      console.info(prefix, ...args);
      break;
    case 'debug':
    case 'trace':
    default:
      console.log(prefix, ...args);
  }

  // Also add to UI logs if appropriate
  appendToUILog(level, category, args);
}

// Enable/disable debug mode
function enableDebug(enable = true) {
  debugConfig.enabled = enable;
  localStorage.setItem('debugEnabled', enable.toString());

  // Log the state change
  if (enable) {
    console.log('Debug mode enabled');
  } else {
    console.log('Debug mode disabled');
  }
}

// Enable/disable specific category
function enableCategory(category, enable = true) {
  if (debugConfig.categories.hasOwnProperty(category)) {
    debugConfig.categories[category] = enable;
    console.log(`Debug category '${category}' ${enable ? 'enabled' : 'disabled'}`);
  } else {
    console.warn(`Unknown debug category: ${category}`);
  }
}

// Set log level
function setLogLevel(level) {
  if (LOG_LEVELS.hasOwnProperty(level)) {
    debugConfig.logLevel = level;
    localStorage.setItem('debugLogLevel', level);
    console.log(`Debug log level set to: ${level}`);
  } else {
    console.warn(`Unknown log level: ${level}`);
  }
}

// Initialize debug settings from localStorage
function initDebug() {
  console.log("Initializing debug system");

  // Restore debug settings from localStorage if available
  const storedDebugEnabled = localStorage.getItem('debugEnabled');
  if (storedDebugEnabled !== null) {
    debugConfig.enabled = storedDebugEnabled === 'true';
  }

  const storedLogLevel = localStorage.getItem('debugLogLevel');
  if (storedLogLevel && LOG_LEVELS[storedLogLevel] !== undefined) {
    debugConfig.logLevel = storedLogLevel;
  }

  // Create debug controls if debug is enabled
  if (debugConfig.enabled) {
    createDebugIndicator();
    ensureLogsContainer(); // Ensure logs container exists
  }

  console.log('Debug system initialized', {
    enabled: debugConfig.enabled,
    logLevel: debugConfig.logLevel,
    categories: debugConfig.categories
  });

  // Log a test message to verify it's working
  debug('system', 'info', 'Debug system initialized', {
    enabled: debugConfig.enabled,
    logLevel: debugConfig.logLevel,
    categories: debugConfig.categories
  });
}

// Create log convenience methods
const debugLog = {
  error: (category, ...args) => debug(category, 'error', ...args),
  warn: (category, ...args) => debug(category, 'warn', ...args),
  info: (category, ...args) => debug(category, 'info', ...args),
  debug: (category, ...args) => debug(category, 'debug', ...args),
  trace: (category, ...args) => debug(category, 'trace', ...args)
};

// Export the debug system to the window object
window.debugSystem = {
  init: initDebug,
  enable: enableDebug,
  enableCategory: enableCategory,
  setLogLevel: setLogLevel,
  log: debugLog
};

// Initialize immediately if in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log("Auto-initializing debug system (development environment detected)");
  initDebug();
}