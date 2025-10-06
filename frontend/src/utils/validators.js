// src/utils/validators.js

// Validate email format
export const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

// Validate password (min 6 chars)
export const validatePassword = (password) => {
  return password.length >= 6;
};

// Validate name (non-empty)
export const validateName = (name) => {
  return name.trim().length > 0;
};
