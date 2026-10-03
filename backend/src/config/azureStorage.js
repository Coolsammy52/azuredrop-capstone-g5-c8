const {
    BlobServiceClient
} = require("@azure/storage-blob");

require("dotenv").config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not configured");
}

if (!containerName) {
    throw new Error("AZURE_STORAGE_CONTAINER is not configured");
}

const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);

const containerClient =
    blobServiceClient.getContainerClient(containerName);

module.exports = {
    blobServiceClient,
    containerClient,
    containerName
};
