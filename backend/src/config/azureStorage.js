const {
    BlobServiceClient
} = require("@azure/storage-blob");

require("dotenv").config();

/**
 * Blob Storage client used for upload and download.
 *
 * Two ways to sign in (the same rule as config/azureBlob.js, which makes share links):
 *  1. Managed Identity (use this on the Azure VM): set AZURE_STORAGE_ACCOUNT_NAME.
 *     No key is stored. The VM's identity needs the role "Storage Blob Data Contributor"
 *     (and "Storage Blob Delegator" for share links) on the storage account.
 *  2. Connection string (local development): set AZURE_STORAGE_CONNECTION_STRING.
 *     It contains an account key, so keep it out of git.
 * If AZURE_STORAGE_ACCOUNT_NAME is set it wins, so leave it unset when using a connection string.
 */
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

if (!accountName && !connectionString) {
    throw new Error(
        "Set AZURE_STORAGE_ACCOUNT_NAME (managed identity) or AZURE_STORAGE_CONNECTION_STRING"
    );
}

if (!containerName) {
    throw new Error("AZURE_STORAGE_CONTAINER is not configured");
}

let blobServiceClient;

if (accountName) {
    const { DefaultAzureCredential } = require("@azure/identity");
    blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        new DefaultAzureCredential()
    );
} else {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
}

const containerClient =
    blobServiceClient.getContainerClient(containerName);

module.exports = {
    blobServiceClient,
    containerClient,
    containerName
};
