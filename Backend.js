import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import csv from "csv-parser"; // ✅ Handles your CSV file

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 1. Connect Firebase
const serviceAccount = JSON.parse(
  fs.readFileSync("C:/Users/Admin/OneDrive/Documents/ReLife/serviceAccountKey.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ✅ 2. Confirm Firebase works
app.get("/", (req, res) => {
  res.send("🔥 Firebase connection successful!");
});

// ✅ 3. Upload CSV to Firestore (run once)
console.log("Received POST request at/uploadCSV");
app.post("/uploadCSV", async (req, res) => {
  const filePath = "C:/Users/Admin/OneDrive/Documents/GitHub/ReLife/items.csv"; // 🟩 Change only if CSV name/path is different
  const items = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => items.push(row))
      .on("end", async () => {
        const batch = db.batch();
        const collectionRef = db.collection("recyclingItems");

        items.forEach((item) => {
          const docRef = collectionRef.doc();
          batch.set(docRef, item);
        });

        await batch.commit();
        res.status(200).send(`Uploaded ${items.length} items successfully to Firestore!`);
      });
  } catch (error) {
    console.error("❌ Error uploading CSV:", error);
    res.status(500).send("Error uploading CSV");
  }
});

// ✅ 4. Analyze Text
app.post("/analyze", async (req, res) => {
  try {
    const { uid, text } = req.body;

    if (!uid || !text) {
      return res.status(400).json({ error: "Missing uid or text" });
    }

    const lowerText = text.toLowerCase();

    // Fetch data from Firestore
    const snapshot = await db.collection("recyclingItems").get();
    const items = snapshot.docs.map((doc) => doc.data());

    // Analyze based on CSV data
    let isRecyclable = false;
    let isReusable = false;

    for (const item of items) {
      const name = (item.item || item.name || "").toLowerCase();
      const category = (item.category || item.type  || "").toLowerCase();

      if (lowerText.includes(name)) {
        if (category.includes("recyclable")) isRecyclable = true;
        if (category.includes("reusable")) isReusable = true;
      }
    }

    let finalCategory = "Unknown";
    if (isRecyclable && isReusable) finalCategory = "Both";
    else if (isRecyclable) finalCategory = "Recyclable";
    else if (isReusable) finalCategory = "Reusable";

    // Store result in Firestore
    await db.collection("analysis").add({
      uid,
      text,
      category: finalCategory,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      category: finalCategory,
      message: `Item categorized as ${finalCategory}`,
    });
  } catch (error) {
    console.error("❌ Error analyzing text:", error);
    res.status(500).send("Error analyzing text");
  }
});// ✅  Add User (Firestore)
app.post("/addUser", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const userRef = await db.collection("users").add({
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      message: "User added successfully!",
      id: userRef.id,
    });
  } catch (error) {
    console.error("❌ Error adding user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ✅ Get all users
app.get("/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error getting users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/uploadeditems", async (req, res) => {
  try {
    const snapshot = await db.collection("recyclingItems").get();
    const items = snapshot.docs.map(doc => doc.data());
    res.json(items);
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    res.status(500).send("Error fetching uploaded items");
  }
});
// ✅ 5. Start Server
const PORT = 5000;
app.listen(5000,"0.0.0.0" ,() => console.log("Server running on port 5000 "));