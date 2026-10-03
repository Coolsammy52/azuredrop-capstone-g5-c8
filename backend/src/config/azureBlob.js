/**
 * Azure Blob Storage helper - ONLY used to turn a stored files.file_url into a
 * short-lived, read-only SAS URL for temporary share links.
 * Upload/delete logic belongs to the upload feature, not here.
 *
 * Two auth modes (project requirement: "Managed Identity or secure credentials"):
 *  1. Managed Identity (preferred on the Azure VM): set AZURE_STORAGE_ACCOUNT_NAME.
 *     Signs a user-delegation SAS. The VM identity needs the roles
 *     "Storage Blob Data Reader" + "Storage Blob Delegator" on the storage account.
 *     (Locally, DefaultAzureCredential falls back to `az login`.)
 *  2. Connection string (local dev): set AZURE_STORAGE_CONNECTION_STRING.
 */
require('dotenv').config();
const {
  BlobServiceClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} = require('@azure/storage-blob');

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

let serviceClient = null;
let useManagedIdentity = false;

if (accountName) {
  const { DefaultAzureCredential } = require('@azure/identity');
  serviceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );
  useManagedIdentity = true;
} else if (connectionString) {
  serviceClient = BlobServiceClient.fromConnectionString(connectionString);
}

const isConfigured = () => serviceClient !== null;

/**
 * Build a read-only SAS URL for the blob that file_url points to.
 *
 * @param {string} fileUrl    value of files.file_url (https://<account>.blob.core.windows.net/<container>/<blob>)
 * @param {Date}   expiresOn  when the SAS stops working
 * @param {string} filename   suggested download name
 * @returns {Promise<string>}
 */
async function generateReadUrl(fileUrl, expiresOn, filename) {
  const blobUrl = new URL(fileUrl);

  // Refuse to sign anything that isn't in our own storage account.
  if (blobUrl.host !== new URL(serviceClient.url).host) {
    throw new Error('file_url does not belong to the configured storage account');
  }

  const [container, ...blobParts] = blobUrl.pathname.split('/').filter(Boolean);
  const blobName = decodeURIComponent(blobParts.join('/'));
  if (!container || !blobName) {
    throw new Error('file_url is not a valid blob URL');
  }

  const safeName = String(filename || blobName).replace(/["\\\r\n]/g, '_');
  const blobClient = serviceClient.getContainerClient(container).getBlobClient(blobName);
  const startsOn = new Date(Date.now() - 5 * 60 * 1000); // tolerate clock skew
  const options = {
    permissions: BlobSASPermissions.parse('r'),
    startsOn,
    expiresOn,
    contentDisposition: `attachment; filename="${safeName}"`,
  };

  if (!useManagedIdentity) return blobClient.generateSasUrl(options);

  const delegationKey = await serviceClient.getUserDelegationKey(startsOn, expiresOn);
  const sas = generateBlobSASQueryParameters(
    { containerName: container, blobName, ...options },
    delegationKey,
    accountName
  ).toString();
  return `${blobClient.url}?${sas}`;
}

module.exports = { isConfigured, generateReadUrl };
