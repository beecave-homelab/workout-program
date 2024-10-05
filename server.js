const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const dataPath = path.join(__dirname, 'data', 'workout_data.json');

app.get('/api/workout', async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read workout data' });
  }
});

app.post('/api/workout', async (req, res) => {
  try {
    await fs.writeFile(dataPath, JSON.stringify(req.body, null, 2));
    res.json({ message: 'Workout data updated successfully' });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: 'Failed to update workout data' });
  }
});

app.post('/api/week', async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    const workoutData = JSON.parse(data);
    workoutData.currentWeek = req.body.week;
    await fs.writeFile(dataPath, JSON.stringify(workoutData, null, 2));
    res.json({ message: 'Week updated successfully' });
  } catch (error) {
    console.error('Error updating week:', error);
    res.status(500).json({ error: 'Failed to update week' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
