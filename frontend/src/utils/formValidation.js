export const VALIDATION_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  clubNameMax: 100,
  bioMax: 500,
  specializationMax: 80,
  facilitiesMax: 300,
  sportMax: 40,
  titleMax: 100,
  descriptionMax: 500,
  addressMax: 180,
  locationNameMax: 80,
  messageMax: 500,
  imageMaxBytes: 5 * 1024 * 1024,
  attachmentMaxBytes: 10 * 1024 * 1024,
};

export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(email));
}

export function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 8;
}

export function isWithinLength(value, min, max) {
  const text = normalizeText(value);
  return text.length >= min && text.length <= max;
}

export function getNumberInRange(value, min, max) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

export function isDateRangeValid(startDate, endDate) {
  if (!startDate || !endDate) return false;
  return new Date(startDate) <= new Date(endDate);
}

export function isTimeRangeValid(startTime, endTime) {
  if (!startTime || !endTime) return false;
  return startTime < endTime;
}

export function validateFile(file, { maxBytes = VALIDATION_LIMITS.imageMaxBytes, allowNonImages = false } = {}) {
  if (!file) return "Please choose a file.";
  if (!allowNonImages && !file.type.startsWith("image/")) {
    return "Please upload an image file.";
  }
  if (file.size > maxBytes) {
    return `File is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))}MB.`;
  }
  return null;
}
