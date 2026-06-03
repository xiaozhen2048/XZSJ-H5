const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const ACTIVATIONS_FILE = path.join(DATA_DIR, 'activations.json');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// === Routes (to be added in Task 10) ===

app.get('/api/courses', (req, res) => {
  const data = readJSON(COURSES_FILE);
  res.json(data || { categories: [] });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
