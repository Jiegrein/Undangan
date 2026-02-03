import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = process.env.DATA_PATH || './data/guests.json';

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static('public'));

interface Guest {
  id: string;
  name: string;
  pax: number;
  invitedBy: string;
}

function readGuests(): Guest[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    console.error('Error reading guests file');
  }
  return [];
}

function writeGuests(guests: Guest[]): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(guests, null, 2));
}

app.get('/api/guests', (_, res) => {
  res.json(readGuests());
});

app.post('/api/guests', (req, res) => {
  const guests = readGuests();
  const newGuest: Guest = {
    id: Date.now().toString(),
    name: req.body.name,
    pax: req.body.pax,
    invitedBy: req.body.invitedBy
  };
  guests.push(newGuest);
  writeGuests(guests);
  res.json(newGuest);
});

app.put('/api/guests/:id', (req, res) => {
  const guests = readGuests();
  const index = guests.findIndex(g => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Guest not found' });
  }
  guests[index] = { ...guests[index], ...req.body };
  writeGuests(guests);
  res.json(guests[index]);
});

app.delete('/api/guests/:id', (req, res) => {
  const guests = readGuests();
  const filtered = guests.filter(g => g.id !== req.params.id);
  writeGuests(filtered);
  res.json({ success: true });
});

// SPA fallback - serve index.html for non-API routes
app.get('*', (_, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
