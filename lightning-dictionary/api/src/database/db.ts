// Use connection pool for better performance and resource management
import connectionPool, { db } from '../utils/connection-pool';

// Export the pooled database connection
export default db;

// Export connection pool for advanced usage
export { connectionPool };