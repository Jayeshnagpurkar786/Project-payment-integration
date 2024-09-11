const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create a new pool instance
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
  ssl: {
    rejectUnauthorized: false // Set to true if you want to enforce SSL validation
  }
}); // Correctly close the pool configuration object

// Connect to the database
pool.connect()
  .then(() => console.log('Connected to the database'))
  .catch((err) => {
    console.error('Connection error', err.stack);
    process.exit(1); // Exit the process with an error code
  });

// Export the pool for use in other modules
module.exports = { pool };
