const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (component: string, message: string, data?: unknown) => {
    if (isDev) console.log(`[${component}] ${message}`, data ?? '');
  },
  warn: (component: string, message: string, data?: unknown) => {
    console.warn(`[${component}] ${message}`, data ?? '');
  },
  error: (component: string, message: string, error?: unknown) => {
    console.error(`[${component}] ${message}`, error ?? '');
  },
};
