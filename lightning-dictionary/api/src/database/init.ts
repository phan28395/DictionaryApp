import db from './db';

export async function initDatabase() {
  try {
    // Run migrations
    await db.migrate.latest();
    console.log('Database migrations completed successfully');
    
    // Verify tables exist
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Database tables:', tables.map((t: any) => t.name).join(', '));
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function closeDatabase() {
  await db.destroy();
}