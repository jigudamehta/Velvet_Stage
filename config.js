/**
 * Velvet Stage — Backend Configuration
 * 
 * Paste your deployed Google Apps Script Web App URL below:
 * Example: "https://script.google.com/macros/s/AKfycb.../exec"
 */
window.VELVET_STAGE_API_URL = "https://script.google.com/macros/s/AKfycbwMf5gltS3VvoWPW9LL43L0u-YW4SDXb3SNXRXk9bG-cdhTT3oqe4hGKEOcZH6mTT-cJQ/exec";

// Export configuration helper
window.getApiUrl = function() {
  return window.VELVET_STAGE_API_URL && window.VELVET_STAGE_API_URL.trim() !== ""
    ? window.VELVET_STAGE_API_URL.trim()
    : null;
};
