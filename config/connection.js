const { MongoClient } = require("mongodb");

const state = {
  db: null,
};

// Use environment variable OR fallback to localhost
const url = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";
const dbName = "shopping";

const client = new MongoClient(url);

const connect = async (cb) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    state.db = db;
    return cb();
  } catch (err) {
    return cb(err);
  }
};

const get = () => state.db;

module.exports = {
  connect,
  get,
};
