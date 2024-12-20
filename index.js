const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const otproutes = require("./routes/Otproutes");
const bodyParser = require("body-parser");
const cors = require("cors");
dotenv.config();

const app = express();
app.use(cors());
const PORT = 3005;

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/otp", otproutes);
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Error connecting"));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
