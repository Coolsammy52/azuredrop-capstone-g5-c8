import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3000';
const ALLOWED_TYPES = [
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'image/jpeg', 'image/png'
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function FileManagement() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch files from /Files/search (supports pagination and uploader details)
  const fetchFiles = async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(${API_BASE_URL}/Files/search?page=${currentPage}&limit=${limit});
      if (!response.ok) throw new Error('Failed to fetch files.');
      const data = await response.json();
      setFiles(data.files || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(page);
  }, [page]);

  // Handle file upload with validations
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setUploadProgress(null);
    setSuccessMessage(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not allowed.');
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      setError('File size must not exceed 10 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      setUploadProgress('Uploading...');
      const response = await fetch(${API_BASE_URL}/Files/upload, {
        method: 'POST',
        headers: {
          // Add Authorization header here if tokens are implemented
          // 'Authorization': Bearer ${token}
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'File upload failed.');
      }

      setSuccessMessage('File uploaded successfully!');
      fetchFiles(page); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  // Handle file deletion (Requires backend delete endpoint)
  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(${API_BASE_URL}/Files/${fileId}, {
        method: 'DELETE',
        headers: {
          // Add Authorization header here
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file.');
      }

      setSuccessMessage('File deleted successfully.');
      fetchFiles(page); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">File Management</h1>

      {/* Upload Section */}
      <div className="mb-8">
        <label className="block mb-2 font-medium">Upload File (Max 10 MB)</label>
        <input
          type="file"
          onChange={handleUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploadProgress && <p className="mt-2 text-blue-600 animate-pulse">{uploadProgress}</p>}
      </div>

      {/* Status Messages */}
      {error && <div className="mb-4 p-4 text-red-700 bg-red-100 rounded border border-red-200">{error}</div>}
      {successMessage && <div className="mb-4 p-4 text-green-700 bg-green-100 rounded border border-green-200">{successMessage}</div>}

      {/* File List Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Files</h2>
        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading files...</div>
        ) : files.length === 0 ? (
          <p className="text-gray-500">No files found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{file.filename}</p>
                  <p className="text-sm text-gray-500">{(file.file_size / 1024).toFixed(2)} KB | {file.file_type}</p>
                  {file.uploader && <p className="text-xs text-blue-500">Uploaded by: {file.uploader.name}</p>}
                </div>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  disabled={loading}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1 || loading}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-700">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages || loading}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}