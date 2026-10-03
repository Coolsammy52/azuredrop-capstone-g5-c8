const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const fileRoutes = require("./routes/fileRoutes");
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

// Categories, search, share links, metadata. Mounted BEFORE /files so that
// /files/search and /files/categories are not treated as /files/:id.
app.use("/", require("./routes/featureRoutes"));

app.use("/files", fileRoutes);

app.use((err, req, res, next) => {
    if (err instanceof require("multer").MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                error: "File size must not exceed 10 MB"
            });
        }

        return res.status(400).json({
            error: "File upload error"
        });
    }

    if (err && err.message === "File type is not allowed") {
        return res.status(400).json({
            error: "File type is not allowed"
        });
    }

    next(err);
});

// Final handler for errors from the share/search/category/metadata routes.
app.use(require("./utils/http").errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`AzureDrop API running on port ${PORT}`);
});
