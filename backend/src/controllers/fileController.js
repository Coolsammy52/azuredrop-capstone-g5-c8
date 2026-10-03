const {
    containerClient,
    containerName
} = require("../config/azureStorage");

const pool = require("../config/db");

function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");
}

async function uploadFile(req, res) {
    let blockBlobClient = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                error: "No file uploaded"
            });
        }

        const file = req.file;
        const safeFilename = sanitizeFilename(file.originalname);

        const blobName =
            `users/${req.user.id}/${Date.now()}-${safeFilename}`;

        blockBlobClient =
            containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(file.buffer, {
            blobHTTPHeaders: {
                blobContentType: file.mimetype
            }
        });

        const fileUrl = blockBlobClient.url;

        try {
            const result = await pool.query(
                `INSERT INTO files
                    (user_id, filename, file_type, file_size, category, file_url)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, user_id, filename, file_type, file_size,
                           category, file_url, uploaded_at`,
                [
                    req.user.id,
                    file.originalname,
                    file.mimetype,
                    file.size,
                    "other",
                    fileUrl
                ]
            );

            return res.status(201).json({
                message: "File uploaded successfully",
                file: result.rows[0]
            });
        } catch (databaseError) {
            await blockBlobClient.deleteIfExists();

            throw databaseError;
        }

    } catch (error) {
        console.error("File upload error:", error);

        return res.status(500).json({
            error: "File upload failed"
        });
    }
}

async function getFiles(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, filename, file_type, file_size,
                    category, file_url, uploaded_at
             FROM files
             WHERE user_id = $1
             ORDER BY uploaded_at DESC`,
            [req.user.id]
        );

        return res.json({
            files: result.rows
        });

    } catch (error) {
        console.error("Get files error:", error);

        return res.status(500).json({
            error: "Unable to retrieve files"
        });
    }
}

async function downloadFile(req, res) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, filename, file_type, file_url
             FROM files
             WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "File not found"
            });
        }

        const file = result.rows[0];

        const blobUrl = new URL(file.file_url);
        const containerPrefix = `/${containerName}/`;

        if (!blobUrl.pathname.startsWith(containerPrefix)) {
            return res.status(500).json({
                error: "Invalid file storage path"
            });
        }

        const blobName = decodeURIComponent(
            blobUrl.pathname.slice(containerPrefix.length)
        );

        const blockBlobClient =
            containerClient.getBlockBlobClient(blobName);

        const downloadResponse =
            await blockBlobClient.download();

        res.setHeader(
            "Content-Type",
            file.file_type
        );

        const safeDownloadFilename =
            sanitizeFilename(file.filename);

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeDownloadFilename}"`
        );

        downloadResponse.readableStreamBody.pipe(res);

    } catch (error) {
        console.error("File download error:", error);

        return res.status(500).json({
            error: "File download failed"
        });
    }
}

module.exports = {
    uploadFile,
    getFiles,
    downloadFile
};
