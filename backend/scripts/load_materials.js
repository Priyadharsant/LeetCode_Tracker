const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || 'leetcode_tracker';

const materialsData = [
  {
    title: "Master Guide",
    subtitle: "PDF Document",
    endpoint: "DSA_Complete_Master_Guide.pdf",
    type: "pdf"
  },
  {
    title: "Problem Recognition",
    subtitle: "Cheat Sheet PDF",
    endpoint: "DSA_Problem_Recognition_Cheat_Sheet.pdf",
    type: "pdf"
  }
];

async function seedMaterials() {
  console.log('Connecting to database...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected correctly to server');
    
    const db = client.db(dbName);
    const materialsCol = db.collection('materials');

    // Clear existing materials (if any) to avoid duplicates
    console.log('Clearing existing materials...');
    await materialsCol.deleteMany({});

    console.log('Inserting new materials...');
    const result = await materialsCol.insertMany(materialsData);
    console.log(`Successfully inserted ${result.insertedCount} materials.`);
    
  } catch (err) {
    console.error('An error occurred:', err);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

seedMaterials();
