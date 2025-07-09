import type { Knex } from 'knex';
import path from 'path';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'data', 'dictionary.db')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src', 'database', 'migrations'),
      extension: 'ts'
    },
    seeds: {
      directory: path.join(__dirname, 'src', 'database', 'seeds'),
      extension: 'ts'
    }
  },
  
  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_PATH || path.join(__dirname, 'data', 'dictionary.db')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'dist', 'database', 'migrations'),
      extension: 'js'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;