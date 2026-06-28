const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function main() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
        const dbName = process.env.DB_NAME || "leetcode_tracker";
        const API_KEY = process.env.YOUTUBE_API_KEY;

        if (!API_KEY) {
            console.error("Error: YOUTUBE_API_KEY is not defined in your .env file.");
            return;
        }

        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(mongoUri, { dbName });
        console.log(`Connected to MongoDB database: ${dbName}`);

        const db = mongoose.connection.db;
        const problemsCol = db.collection('problems');
        const data = await problemsCol.find().toArray();
        console.log(`Found ${data.length} problems in database.`);

        let updatedCount = 0;
        let alreadyUpdated = 0;
        let quotaExceeded = false;
        let failed = 0;

        for (const problem of data) {
            // Skip problems that already have a videoId
            if (problem.videoId) {
                alreadyUpdated++;
                continue;
            }

            if (quotaExceeded) {
                break;
            }

            const problemName = problem.name;
            console.log(`Fetching video for: "${problemName}"`);

            try {
                const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(problemName)}&maxResults=1&type=video&key=${API_KEY}`;
                const res = await fetch(url);
                const json = await res.json();

                if (res.status === 403) {
                    console.error("YouTube API quota exceeded or access forbidden. Stopping execution.");
                    quotaExceeded = true;
                    break;
                }

                if (!res.ok) {
                    console.error(`Error fetching for "${problemName}":`, json.error ? json.error.message : json);
                    failed++;
                    continue;
                }

                if (json.items && json.items.length > 0) {
                    const videoId = json.items[0].id.videoId;
                    await problemsCol.updateOne(
                        { _id: problem._id },
                        { $set: { videoId: videoId } }
                    );
                    console.log(`Updated "${problemName}" -> ${videoId}`);
                    updatedCount++;
                } else {
                    console.log(`No video found for "${problemName}"`);
                }

                // Delay between requests to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (err) {
                console.error(`Failed to process "${problemName}":`, err.message);
            }
        }
        console.log(`Failed to process ${failed} problems.`)
        console.log(`Already updated ${alreadyUpdated} documents with video IDs.`);
        console.log(`\nExecution complete. Updated ${updatedCount} documents with video IDs.`);

    } catch (error) {
        console.error("Error connecting to MongoDB", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

main();