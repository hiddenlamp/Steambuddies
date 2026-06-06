const mongoose = require('mongoose');

const uri = "mongodb+srv://roshan810290_db_user:Rc0RoB5ofiYYBsco@cluster0.00lxdht.mongodb.net/steambuddies?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log("Connected successfully");
  process.exit(0);
}).catch(err => {
  console.error("Connection error:", err);
  process.exit(1);
});
