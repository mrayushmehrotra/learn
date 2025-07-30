/**
 * Validates if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
const isValidUrl = (url) => {
  if (!url) return true; // Allow empty URLs
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitizes the avatar URL
 * @param {string} avatar - The avatar URL to sanitize
 * @returns {string} Sanitized avatar URL or empty string
 */
const sanitizeAvatarUrl = (avatar) => {
  if (!avatar) return "";
  return isValidUrl(avatar) ? avatar : "";
};

/**
 * Adds rank to an array of users based on their position in the sorted list
 * @param {Array} users - Array of user documents from MongoDB
 * @returns {Array} Array of users with added rank property
 */
const calculateRanks = (users) => {
  return users.map((user, index) => ({
    ...user.toObject(),
    rank: index + 1,
  }));
};

module.exports = {
  calculateRanks,
  sanitizeAvatarUrl,
  isValidUrl,
};
