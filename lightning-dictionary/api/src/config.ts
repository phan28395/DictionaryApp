export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  dictionaryPath: process.env.DICTIONARY_PATH || '../../data/processed/dictionary.json',
  cache: {
    maxAge: 3600, // 1 hour in seconds
    sMaxAge: 86400, // 24 hours for shared caches
  },
  search: {
    maxResults: 50,
    minQueryLength: 2,
  },
};