process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { inferTechniques } = require('./techniques');
const webpush = require('web-push');
const cron = require('node-cron');

// Configure Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:developer@leetcode-tracker.local',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys are missing! Push notifications will not work.');
}

const app = express();
app.use(cors());
app.use(express.json());

let db;

app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  next();
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'leetcode_tracker';

if (!process.env.MONGO_URI) {
  console.warn('Warning: MONGO_URI is not set. Falling back to local MongoDB at mongodb://127.0.0.1:27017');
}

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017';
const configuredMongoUri = process.env.MONGO_URI;
const primaryMongoUri = configuredMongoUri || DEFAULT_MONGO_URI;

const client = new MongoClient(primaryMongoUri, { serverSelectionTimeoutMS: 5000 });

function startServer() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

async function connectWithFallback() {
  try {
    console.log(`Connecting to MongoDB at ${primaryMongoUri}`);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to Database');
    const dbGeneral = client.db('General');
    app.use('/api/movies', require('./routes/movies')(dbGeneral));
    startServer();
  } catch (error) {
    console.error('MongoDB connection error:', error);

    if (configuredMongoUri && configuredMongoUri.startsWith('mongodb+srv://') && primaryMongoUri !== DEFAULT_MONGO_URI) {
      console.warn('Falling back to local MongoDB at', DEFAULT_MONGO_URI);
      const fallbackClient = new MongoClient(DEFAULT_MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      try {
        await fallbackClient.connect();
        db = fallbackClient.db(DB_NAME);
        console.log('Connected to local MongoDB');
        const dbGeneralLocal = fallbackClient.db('General');
        app.use('/api/movies', require('./routes/movies')(dbGeneralLocal));
        startServer();
      } catch (fallbackError) {
        console.error('Local MongoDB fallback failed:', fallbackError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

connectWithFallback();

function problemProgressKey(problem) {
  return `${problem.level}-${problem.levelIndex}`;
}

function applyUserProgress(problems, progress = {}) {
  return problems.map(problem => {
    const progressEntry = progress[problemProgressKey(problem)];
    const solved = Boolean(progressEntry?.solved);
    const hydratedProblem = {
      name: problem.name,
      link: problem.link,
      solved,
      topic: problem.topic,
      companies: problem.companies || [],
      techniques: Array.isArray(problem.techniques) && problem.techniques.length > 0
        ? problem.techniques
        : inferTechniques(problem)
    };

    if (solved && progressEntry.solvedAt) {
      hydratedProblem.solvedAt = progressEntry.solvedAt;
    }

    return hydratedProblem;
  });
}

async function getUserProgress(username) {
  if (!username) return {};

  const usersCol = db.collection('users');
  const user = await usersCol.findOne({ username });
  console.log(user,"njn");
  
  return user?.progress || {};
}

function groupProblemsByLevel(problems, progress = {}) {
  const levelMap = new Map();

  problems.forEach(problem => {
    if (!levelMap.has(problem.level)) {
      levelMap.set(problem.level, {
        level: problem.level,
        goal: problem.levelGoal,
        total: 0,
        problems: []
      });
    }

    const level = levelMap.get(problem.level);
    level.problems.push({
      ...problem,
      solved: Boolean(progress[problemProgressKey(problem)]?.solved),
      solvedAt: progress[problemProgressKey(problem)]?.solvedAt
    });
  });

  return Array.from(levelMap.values())
    .sort((a, b) => a.level - b.level)
    .map(level => ({
      ...level,
      problems: applyUserProgress(
        level.problems.sort((a, b) => a.levelIndex - b.levelIndex),
        progress
      ),
      total: level.problems.length
    }));
}

// Simple signup endpoint (with password hashing)
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const usersCol = db.collection('users');
    const exists = await usersCol.findOne({ username });
    if (exists) return res.status(409).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword, progress: {}, createdAt: new Date() };
    const result = await usersCol.insertOne(newUser);

    // return minimal user object and a mock token
    res.json({ username: newUser.username, token: `mock-token-${result.insertedId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Simple login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ username });
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Compare hashed password (also support legacy plain text passwords temporarily)
    let isValid = false;
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      isValid = (user.password === password);
    }

    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    await usersCol.updateOne({ username }, { $set: { lastActive: new Date() } });

    res.json({ username: user.username, token: `mock-token-${user._id}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Change password endpoint
app.post('/api/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ username });
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    let isValid = false;
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isValid = await bcrypt.compare(oldPassword, user.password);
    } else {
      isValid = (user.password === oldPassword);
    }

    if (!isValid) return res.status(401).json({ error: 'Incorrect old password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usersCol.updateOne({ username }, { $set: { password: hashedPassword } });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET all levels and their problems
app.get('/api/levels', async (req, res) => {
  try {
    const problemsCol = db.collection('problems');
    const problems = await problemsCol.find({}, { projection: { _id: 0 } })
      .sort({ level: 1, levelIndex: 1 })
      .toArray();
    const username = req.header('X-Username');
    if (username) {
      await db.collection('users').updateOne({ username }, { $set: { lastActive: new Date() } });
    }
    const progress = await getUserProgress(username);
    const levels = groupProblemsByLevel(problems, progress);
    res.json(levels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET topics
app.get('/api/topics', async (req, res) => {
  try {
    const problemsCol = db.collection('problems');
    const problems = await problemsCol.find({}, { projection: { _id: 0 } })
      .sort({ topic: 1, level: 1, levelIndex: 1 })
      .toArray();
    const progress = await getUserProgress(req.header('X-Username'));
    const topicsMap = {};

    problems.forEach(problem => {
      if (!topicsMap[problem.topic]) {
        topicsMap[problem.topic] = [];
      }
      topicsMap[problem.topic].push(...applyUserProgress([problem], progress));
    });

    const topicsList = Object.keys(topicsMap).map(topic => ({
      name: topic,
      problems: topicsMap[topic],
      total: topicsMap[topic].length
    }));

    res.json(topicsList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET topic information
app.get('/api/topic-info', async (req, res) => {
  try {
    const topicInfoCol = db.collection('topic_info');
    // Fetch all topic documents and format them as an array, excluding _id
    const topicInfo = await topicInfoCol.find({}, { projection: { _id: 0 } }).toArray();
    res.json(topicInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE solved status of a specific problem inside the user's progress
app.patch('/api/levels/:level/problem/:index', async (req, res) => {
  try {
    const levelId = parseInt(req.params.level);
    const index = parseInt(req.params.index);
    const { solved, solvedAt } = req.body;
    const username = req.header('X-Username');

    if (!username) {
      return res.status(401).json({ error: 'Unauthorized: X-Username header required' });
    }

    const problemsCol = db.collection('problems');
    const problem = await problemsCol.findOne({ level: levelId, levelIndex: index });
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progressKey = `progress.${levelId}-${index}`;

    const updateQuery = {};
    updateQuery[progressKey] = { solved };
    if (solvedAt) {
      updateQuery[progressKey].solvedAt = solvedAt;
    }

    await usersCol.updateOne(
      { username },
      { $set: updateQuery }
    );

    res.json({ success: true, message: 'Updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Push Notification Routes ---

app.get('/api/notifications/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/notifications/subscribe', async (req, res) => {
  try {
    const { subscription, reminderTime } = req.body;
    const username = req.header('X-Username');
    if (!username) return res.status(401).json({ error: 'Unauthorized: X-Username header required' });

    const usersCol = db.collection('users');
    await usersCol.updateOne(
      { username },
      { $set: { pushSubscription: subscription, reminderTime } }
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(`[API Subscribe] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// --- Background Notification Cron Job ---
// Running every minute on the dot
cron.schedule('* * * * *', async () => {
  if (!db) return;
  const now = new Date();
  
  try {
    const usersCol = db.collection('users');
    const usersWithPush = await usersCol.find({
      reminderTime: { $exists: true, $ne: null },
      pushSubscription: { $exists: true, $ne: null }
    }).toArray();

    for (const user of usersWithPush) {
      const [hours, minutes] = user.reminderTime.split(':').map(Number);
      
      // Calculate scheduled time for today
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Difference in minutes
      const diffMins = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);

      let title = null;
      let body = null;

      // 1st Notification (0 mins)
      if (diffMins === 0) {
        title = 'Time to Practice!';
        body = `Hey ${user.username}, your daily DSA session is calling. Keep your streak alive!`;
      } 
      // 2nd Notification (15 mins)
      else if (diffMins === 15) {
        if (!user.lastActive || new Date(user.lastActive).getTime() < scheduledTime.getTime()) {
          title = 'Missed Session!';
          body = `Hey ${user.username}, you missed your session 15 mins ago! Come back!`;
        }
      }
      // 3rd Notification (30 mins)
      else if (diffMins === 30) {
        if (!user.lastActive || new Date(user.lastActive).getTime() < scheduledTime.getTime()) {
          title = 'Final Reminder!';
          body = `Hey ${user.username}, your DSA streak is at risk. Practice now!`;
        }
      }

      if (title && body) {
        const payload = JSON.stringify({
          title,
          body,
          icon: '/vite.svg',
          badge: '/vite.svg'
        });

        try {
          await webpush.sendNotification(user.pushSubscription, payload);
          console.log(`[Cron] Escaped Push (${diffMins}m) sent to ${user.username}`);
        } catch (err) {
          console.error(`[Cron] Failed to send push to ${user.username}`, err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            await usersCol.updateOne({ username: user.username }, { $unset: { pushSubscription: "" } });
          }
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Error in background job', err);
  }
});
