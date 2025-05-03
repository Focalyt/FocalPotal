// migrateResumeToArray.js
const mongoose = require("mongoose");
const CandidateProfile = require("./controllers/models/candidateProfile"); // path as per your structure
const dbUrl = "mongodb+srv://focalyt:Focalyt!!&&2944@focalyt-portal.y6790.mongodb.net/mmt"; // 🔁 Update with your DB URL

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log("Connected to DB");

  const candidates = await CandidateProfile.find({ "personalInfo.resume": { $exists: true, $type: "object" } });

  console.log(`Found ${candidates.length} candidates to migrate.`);

  for (let candidate of candidates) {
    const oldResume = candidate.personalInfo.resume;

    // Only convert if it's not already an array
    if (!Array.isArray(oldResume)) {
      candidate.personalInfo.resume = [{
        name: oldResume.name || "resume",
        url: oldResume.url,
        uploadedAt: oldResume.uploadedAt || new Date()
      }];

      await candidate.save();
      console.log(`Migrated candidate ID: ${candidate._id}`);
    }
  }

  console.log("Migration complete.");
  process.exit(0);
})
.catch(err => {
  console.error("Error connecting to DB or migrating:", err);
  process.exit(1);
});
