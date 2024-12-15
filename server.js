const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.API_PORT || 5001;
const host = '0.0.0.0';

app.use(cors());
app.use(bodyParser.json());

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create workout_data table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS workout_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();

app.get('/api/workout', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT data FROM workout_data ORDER BY updated_at DESC LIMIT 1');
    if (rows.length > 0) {
      res.json(JSON.parse(rows[0].data));
    } else {
      // Return initial data if no data exists
      const initialData = require('./src/app/initial_data.json');
      res.json(initialData);
    }
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read workout data' });
  }
});

app.post('/api/workout', async (req, res) => {
  try {
    await pool.execute(
      'INSERT INTO workout_data (data) VALUES (?)',
      [JSON.stringify(req.body)]
    );
    res.json({ message: 'Workout data updated successfully' });
  } catch (error) {
    console.error('Error writing data:', error);
    res.status(500).json({ error: 'Failed to update workout data' });
  }
});

app.post('/api/week', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT data FROM workout_data ORDER BY updated_at DESC LIMIT 1');
    if (rows.length > 0) {
      const workoutData = JSON.parse(rows[0].data);
      workoutData.currentWeek = req.body.week;
      
      await pool.execute(
        'INSERT INTO workout_data (data) VALUES (?)',
        [JSON.stringify(workoutData)]
      );
      
      res.json({ message: 'Week updated successfully' });
    } else {
      res.status(404).json({ error: 'No workout data found' });
    }
  } catch (error) {
    console.error('Error updating week:', error);
    res.status(500).json({ error: 'Failed to update week' });
  }
});

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
