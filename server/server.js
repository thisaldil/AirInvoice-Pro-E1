const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = 5000;

app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/mern-project", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello, MERN stack!");
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
