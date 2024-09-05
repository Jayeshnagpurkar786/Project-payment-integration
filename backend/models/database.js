import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log("Connected to database");

    // Perform a query
    const result = await client.query('SELECT * FROM rzp_payments');
    console.log("Query result:", result);

    // Send the query result as a JSON response
    res.status(200).json(result.rows);

    // Release the client back to the pool
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
