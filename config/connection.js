const { MongoClient } = require("mongodb");

const state = {
  db: null,
};

// MongoDB Atlas connection string
const url = process.env.MONGO_URL || "mongodb+srv://failasbash650:failas650@cluster0.2jhflva.mongodb.net/shopping?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "shopping";

// Optional config for better compatibility
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connect = async (cb) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    state.db = db;
    console.log("✅ MongoDB Atlas Connected");
    return cb();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    return cb(err);
  }
};

const get = () => state.db;

module.exports = {
  connect,
  get,
};
