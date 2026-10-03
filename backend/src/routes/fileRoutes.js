const express = require("express");
const multer = require("multer");

const authenticateToken = require("../middleware/authMiddleware");
const {
    uploadFile,
    getFiles,
    downloadFile
} = require("../controllers/fileController");

const router = express.Router();

const allowedMimeTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/jpeg",
    "image/png"
]);

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error("File type is not allowed"));
        }

        cb(null, true);
    }
});

router.post(
    "/upload",
    authenticateToken,
    upload.single("file"),
    uploadFile
);

router.get(
    "/",
    authenticateToken,
    getFiles
);

router.get(
    "/:id/download",
    authenticateToken,
    downloadFile
);

module.exports = router;
