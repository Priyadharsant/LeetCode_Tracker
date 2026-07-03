const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'leetcode_tracker';

const PROBLEMS_JSON = path.join(__dirname, '..', 'data', 'problems.json');
const DUMP_JSON = path.join(__dirname, 'leetcode_tracker.problems.json');

const getSlug = (link) => {
  if (!link) return null;
  const match = link.match(/\/problems\/([^\/]+)/);
  return match ? match[1].toLowerCase().trim() : null;
};

const slugifyName = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

async function main() {
  let client;
  try {
    console.log("Fetching LeetCode difficulties from API...");
    const response = await fetch('https://leetcode.com/api/problems/all/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch LeetCode API: ${response.statusText}`);
    }
    
    const leetcodeData = await response.json();
    console.log(`Fetched ${leetcodeData.stat_status_pairs.length} problems from LeetCode API.`);

    const difficultyMap = {};
    const titleToDifficultyMap = {};

    leetcodeData.stat_status_pairs.forEach(p => {
      const slug = p.stat.question__title_slug;
      const title = p.stat.question__title;
      const diffLevel = p.difficulty.level; // 1: Easy, 2: Medium, 3: Hard
      const diffStr = diffLevel === 1 ? 'Easy' : diffLevel === 2 ? 'Medium' : 'Hard';
      
      if (slug) difficultyMap[slug.toLowerCase().trim()] = diffStr;
      if (title) titleToDifficultyMap[title.toLowerCase().trim()] = diffStr;
    });

    const getDifficultyForProblem = (name, link) => {
      const slug = getSlug(link);
      const nameSlug = slugifyName(name);
      return difficultyMap[slug] || difficultyMap[nameSlug] || titleToDifficultyMap[name.toLowerCase().trim()] || 'Medium';
    };

    // 1. Update problems.json
    console.log(`Updating local problems JSON file: ${PROBLEMS_JSON}...`);
    if (fs.existsSync(PROBLEMS_JSON)) {
      const localLevels = JSON.parse(fs.readFileSync(PROBLEMS_JSON, 'utf8'));
      let updatedProblemsCount = 0;
      
      localLevels.forEach(lvl => {
        lvl.problems.forEach(p => {
          const diff = getDifficultyForProblem(p.name, p.link);
          p.difficulty = diff;
          updatedProblemsCount++;
        });
      });
      
      fs.writeFileSync(PROBLEMS_JSON, JSON.stringify(localLevels, null, 2), 'utf8');
      console.log(`Updated ${updatedProblemsCount} problems in ${PROBLEMS_JSON}.`);
    } else {
      console.warn(`File not found: ${PROBLEMS_JSON}`);
    }

    // 2. Update leetcode_tracker.problems.json
    console.log(`Updating database dump JSON file: ${DUMP_JSON}...`);
    if (fs.existsSync(DUMP_JSON)) {
      const localProblems = JSON.parse(fs.readFileSync(DUMP_JSON, 'utf8'));
      let updatedDumpCount = 0;
      
      localProblems.forEach(p => {
        const diff = getDifficultyForProblem(p.name, p.link);
        p.difficulty = diff;
        updatedDumpCount++;
      });
      
      fs.writeFileSync(DUMP_JSON, JSON.stringify(localProblems, null, 2), 'utf8');
      console.log(`Updated ${updatedDumpCount} problems in ${DUMP_JSON}.`);
    } else {
      console.warn(`File not found: ${DUMP_JSON}`);
    }

    // 3. Update MongoDB Atlas database
    console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log(`Connected to database: ${DB_NAME}`);
    
    const db = client.db(DB_NAME);
    const problemsCol = db.collection('problems');
    
    const dbProblems = await problemsCol.find().toArray();
    console.log(`Found ${dbProblems.length} problems in the Atlas database.`);
    
    let dbUpdatedCount = 0;
    for (const p of dbProblems) {
      const diff = getDifficultyForProblem(p.name, p.link);
      const res = await problemsCol.updateOne(
        { _id: p._id },
        { $set: { difficulty: diff } }
      );
      if (res.modifiedCount > 0) {
        dbUpdatedCount++;
      }
    }
    
    console.log(`Successfully updated ${dbUpdatedCount} problem documents in MongoDB Atlas problems collection.`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed.");
    }
  }
}

main();
