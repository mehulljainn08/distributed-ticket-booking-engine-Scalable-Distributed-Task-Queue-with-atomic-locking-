const express = require("express");
const app = express();

app.use(express.json());

app.post("/book", (req, res) => {
  console.log("Received:", req.body);

  return res.status(202).json({
    message: "Booking queued"
  });
});

app.listen(8080, () => {
  console.log("Mock Go Server running on port 8080");
});