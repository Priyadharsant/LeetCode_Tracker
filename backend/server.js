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

// Feedback route (does not require DB connection)
app.use('/api/feedback', require('./routes/feedback'));

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
    console.log(`Connecting to MongoDB`);
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
    const revised = Boolean(progressEntry?.revised);
    const hydratedProblem = {
      name: problem.name,
      link: problem.link,
      solved,
      revised,
      topic: problem.topic,
      companies: problem.companies || [],
      techniques: Array.isArray(problem.techniques) && problem.techniques.length > 0
        ? problem.techniques
        : inferTechniques(problem)
    };

    if (solved && progressEntry.solvedAt) {
      hydratedProblem.solvedAt = progressEntry.solvedAt;
    }
    
    if (revised && progressEntry.revisedAt) {
      hydratedProblem.revisedAt = progressEntry.revisedAt;
    }

    return hydratedProblem;
  });
}

async function getUserProgress(username) {
  if (!username) return {};

  const usersCol = db.collection('users');
  const user = await usersCol.findOne({ username });
  
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

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.' });
    }

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

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.' });
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

app.get('/api/cheatsheet', async (req, res) => {
  try {
    const cheatsheet = await db.collection('cheatsheet').find().toArray();
    res.json(cheatsheet);
  } catch (err) {
    console.error("Error fetching cheatsheet:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all materials
app.get('/api/materials', async (req, res) => {
  try {
    const materials = await db.collection('materials').find().toArray();
    res.json(materials);
  } catch (err) {
    console.error("Error fetching materials:", err);
    res.status(500).json({ error: err.message });
  }
});

// Proxy material downloads to hide Vercel URL
app.get('/material/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const fileUrl = `${process.env.MATERIALS_BASE_URL}${filename}`;
    
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(response.status).send('Material not found');
    }
    
    // Copy headers from the remote response
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    
    // Stream the body directly to the client
    const { Readable } = require('stream');
    Readable.fromWeb(response.body).pipe(res);
  } catch (err) {
    console.error("Error proxying material:", err);
    res.status(500).send("Error fetching material");
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

// GET database backup for the current user
app.get('/api/backup', async (req, res) => {
  try {
    const username = req.header('X-Username');
    if (!username) {
      return res.status(401).json({ error: 'Unauthorized: X-Username header required' });
    }

    const usersCol = db.collection('users');
    // Fetch user without password
    const user = await usersCol.findOne({ username }, { projection: { password: 0, _id: 0 } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add metadata
    const backupData = {
      exportedAt: new Date().toISOString(),
      app: "LeetCode Tracker",
      data: user
    };

    res.json(backupData);
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

// UPDATE revised status of a specific problem inside the user's progress
app.patch('/api/levels/:level/problem/:index/revise', async (req, res) => {
  try {
    const levelId = parseInt(req.params.level);
    const index = parseInt(req.params.index);
    const { revised, revisedAt } = req.body;
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
    updateQuery[`${progressKey}.revised`] = revised;
    if (revisedAt) {
      updateQuery[`${progressKey}.revisedAt`] = revisedAt;
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

// RESET all revised status to false
app.post('/api/progress/reset-revise', async (req, res) => {
  try {
    const username = req.header('X-Username');
    const { level, keys } = req.body || {};

    if (!username) {
      return res.status(401).json({ error: 'Unauthorized: X-Username header required' });
    }

    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ username });

    if (!user || !user.progress) {
      return res.json({ success: true });
    }

    const updateQuery = { $unset: {} };
    let hasUpdates = false;

    for (const key in user.progress) {
      if (user.progress[key].revised) {
        // If level is provided, only reset if key starts with "level-"
        if (level !== undefined) {
          const [probLevel] = key.split('-');
          if (parseInt(probLevel) !== parseInt(level)) {
            continue; // skip this one
          }
        }
        // If keys array is provided, only reset if key is in the array
        if (keys !== undefined && Array.isArray(keys)) {
          if (!keys.includes(key)) {
            continue; // skip this one
          }
        }
        updateQuery.$unset[`progress.${key}.revised`] = "";
        updateQuery.$unset[`progress.${key}.revisedAt`] = "";
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await usersCol.updateOne({ username }, updateQuery);
    }

    res.json({ success: true, message: 'Reset successfully' });
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
    const user = await usersCol.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let devices = user.devices || [];
    const deviceIndex = devices.findIndex(d => d.endpoint === subscription.endpoint);
    
    if (deviceIndex >= 0) {
      devices[deviceIndex].subscription = subscription;
      devices[deviceIndex].reminderTime = reminderTime;
    } else {
      devices.push({
        endpoint: subscription.endpoint,
        subscription,
        reminderTime
      });
    }

    await usersCol.updateOne(
      { username },
      { $set: { devices } }
    );
    
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(`[API Subscribe] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/unsubscribe', async (req, res) => {
  try {
    const username = req.header('X-Username');
    const { endpoint } = req.body;
    if (!username || !endpoint) return res.status(400).json({ error: 'Missing username or endpoint' });

    const usersCol = db.collection('users');
    await usersCol.updateOne(
      { username },
      { $pull: { devices: { endpoint } } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(`[API Unsubscribe] Error:`, err);
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
      devices: { $exists: true, $ne: [] }
    }).toArray();

    for (const user of usersWithPush) {
      for (const device of user.devices) {
        if (!device.reminderTime || !device.subscription) continue;

        const [hours, minutes] = device.reminderTime.split(':').map(Number);
        
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
          title = 'Still there?';
          body = `You missed your ${device.reminderTime} practice! It's not too late.`;
        }
        // 3rd Notification (60 mins)
        else if (diffMins === 60) {
          title = 'Consistency is Key 🔑';
          body = `Don't break your streak! Just one problem is all it takes today.`;
        }

        if (title && body) {
          const payload = JSON.stringify({ title, body, icon: '/favicon.svg' });
          try {
            await webpush.sendNotification(device.subscription, payload);
            console.log(`[Cron] Escaped Push (${diffMins}m) sent to ${user.username} (device: ${device.endpoint.substring(0, 15)}...)`);
          } catch (err) {
            console.error(`[Cron] Failed to send push to ${user.username}`, err);
            if (err.statusCode === 410 || err.statusCode === 404) {
              await usersCol.updateOne(
                { username: user.username },
                { $pull: { devices: { endpoint: device.endpoint } } }
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Error in background job', err);
  }
});
