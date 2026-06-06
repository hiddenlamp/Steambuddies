require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("./src/models/Event");

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/steambuddies");
    console.log("Connected to MongoDB.");

    const count = await Event.countDocuments();
    if (count === 0) {
      await Event.create([
        {
          title: { en: "STEAM Innovation Day Expo", hi: "STEAM इनोवेशन डे एक्सपो" },
          type: { en: "Offline", hi: "ऑफ़लाइन" },
          dateStr: "25 Dec",
          themeColor: "indigo",
          isActive: true
        },
        {
          title: { en: "Junior Coding Hackathon", hi: "जूनियर कोडिंग हैकाथॉन" },
          type: { en: "Online", hi: "ऑनलाइन" },
          dateStr: "05 Jan",
          themeColor: "cyan",
          isActive: true
        }
      ]);
      console.log("Seeded 2 events successfully.");
    } else {
      console.log(`Events collection already has ${count} events.`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error seeding events:", err);
    process.exit(1);
  }
};

seedEvents();
