/*
Load data/problems.json into MongoDB collection: problems

Each problem is stored as its own document:
{
  name,
  link,
  level,
  levelGoal,
  levelIndex,
  topic,
  techniques
}
*/

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { inferTechniques } = require('./techniques');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'leetcode_tracker';
const JSON_FILE = path.join(__dirname, 'data', 'problems.json');

async function load() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const db = client.db(DB_NAME);
  const sourceLevels = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

  const problems = sourceLevels.flatMap(levelDoc =>
    levelDoc.problems.map((problem, index) => ({
      name: problem.name,
      link: problem.link,
      level: levelDoc.level,
      levelGoal: levelDoc.goal,
      levelIndex: index,
      topic: problem.topic || 'Misc / General',
      techniques: inferTechniques(problem)
    }))
  );

  const problemsCol = db.collection('problems');
  await problemsCol.drop().catch(err => {
    if (err.codeName !== 'NamespaceNotFound') throw err;
  });

  await db.collection('levels').drop().catch(err => {
    if (err.codeName !== 'NamespaceNotFound') throw err;
  });

  await problemsCol.insertMany(problems);
  await problemsCol.createIndex({ level: 1, levelIndex: 1 }, { unique: true });
  await problemsCol.createIndex({ topic: 1 });
  await problemsCol.createIndex({ techniques: 1 });

  console.log(`Inserted ${problems.length} problem documents into 'problems'`);
  console.log("Dropped old nested 'levels' collection");
  await client.close();
}

load().catch(error => {
  console.error(error);
  process.exit(1);
});
