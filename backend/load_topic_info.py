"""
Load topicInfo.json into MongoDB collection: topic_info
Usage: python load_topic_info.py
Requires: pip install pymongo python-dotenv
"""

import json
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGO_URI = os.environ["MONGO_URI"]
DB_NAME = os.environ["DB_NAME"]
COLLECTION = "topic_info"
JSON_FILE = os.path.join(os.path.dirname(__file__), "data", "topicInfo.json")

def load():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    col = db[COLLECTION]

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        docs = json.load(f)

    col.drop()  # fresh load every time

    result = col.insert_many(docs)
    print(f"Inserted {len(result.inserted_ids)} topic info documents into '{COLLECTION}'")
    client.close()

if __name__ == "__main__":
    load()
