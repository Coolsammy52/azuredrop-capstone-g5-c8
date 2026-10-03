const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "AzureDrop API"
    });
});

app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`AzureDrop API running on port ${PORT}`);
});
