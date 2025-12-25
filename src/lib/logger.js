const isDevelopment = import.meta.env.DEV;

export const logger = {
  realtime: (message, payload) => {
    if (isDevelopment) {
      console.log(`[Realtime] ${message}:`, payload);
    }
  },

  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[Debug] ${message}`, ...args);
    }
  },

  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(`[Info] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    console.warn(`[Warn] ${message}`, ...args);
  },

  error: (message, ...args) => {
    console.error(`[Error] ${message}`, ...args);
  },
};
