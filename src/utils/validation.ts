/**
 * Comprehensive validation utilities for forms across the app
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Phone validation
export const validatePhone = (phone: string): ValidationResult => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/\s+/g, '');
  
  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name: string, minLength = 2, maxLength = 50): ValidationResult => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (trimmedName.length < minLength) {
    return { isValid: false, error: `Name must be at least ${minLength} characters` };
  }
  
  if (trimmedName.length > maxLength) {
    return { isValid: false, error: `Name must be less than ${maxLength} characters` };
  }
  
  // Check for invalid characters
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { 
      isValid: false, 
      error: 'Password is required'
    };
  }
  
  if (password.length < 6) {
    return { 
      isValid: false, 
      error: 'Password must be at least 6 characters'
    };
  }
  
  return { isValid: true };
};

// Strong password validation (for sensitive operations)
export const validateStrongPassword = (password: string): ValidationResult & {
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChar: boolean;
  }
} => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const isValid = Object.values(requirements).every(req => req);
  
  if (!password) {
    return { 
      isValid: false, 
      error: 'Password is required',
      requirements 
    };
  }
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      requirements 
    };
  }
  
  return { isValid: true, requirements };
};

// PIN validation
export const validatePin = (pin: string, length = 4): ValidationResult => {
  if (!pin) {
    return { isValid: false, error: 'PIN is required' };
  }
  
  if (pin.length !== length) {
    return { isValid: false, error: `PIN must be exactly ${length} digits` };
  }
  
  if (!/^\d+$/.test(pin)) {
    return { isValid: false, error: 'PIN must contain only numbers' };
  }
  
  return { isValid: true };
};

// Amount validation
export const validateAmount = (amount: string, min = 0, max?: number): ValidationResult => {
  const numAmount = parseFloat(amount);
  
  if (!amount.trim()) {
    return { isValid: false, error: 'Amount is required' };
  }
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  
  if (numAmount <= min) {
    return { isValid: false, error: `Amount must be greater than ${min}` };
  }
  
  if (max && numAmount > max) {
    return { isValid: false, error: `Amount cannot exceed ${max}` };
  }
  
  return { isValid: true };
};

// Text content validation (for messages, descriptions, etc.)
export const validateTextContent = (text: string, minLength = 1, maxLength = 1000): ValidationResult => {
  const trimmedText = text.trim();
  
  if (minLength > 0 && !trimmedText) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (trimmedText.length < minLength) {
    return { isValid: false, error: `Must be at least ${minLength} characters` };
  }
  
  if (trimmedText.length > maxLength) {
    return { isValid: false, error: `Must be less than ${maxLength} characters` };
  }
  
  return { isValid: true };
};

// Date validation
export const validateDate = (dateString: string, format = 'YYYY-MM-DD'): ValidationResult => {
  if (!dateString.trim()) {
    return { isValid: false, error: 'Date is required' };
  }
  
  if (format === 'YYYY-MM-DD') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return { isValid: false, error: 'Please enter date in YYYY-MM-DD format' };
    }
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }
  
  const now = new Date();
  if (date > now) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }
  
  // Check if date is too far in the past (more than 120 years)
  if (now.getFullYear() - date.getFullYear() > 120) {
    return { isValid: false, error: 'Please enter a valid date' };
  }
  
  return { isValid: true };
};

// Multi-field form validation
export const validateForm = (fields: Record<string, any>, rules: Record<string, (value: any) => ValidationResult>): FormValidationResult => {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, rule] of Object.entries(rules)) {
    const value = fields[fieldName];
    const result = rule(value);
    
    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Utility to debounce validation for real-time feedback
export const createDebouncedValidator = (
  validator: (value: any) => ValidationResult,
  delay = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: any, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
};

// Common validation rule presets
export const ValidationRules = {
  required: (value: string) => validateTextContent(value, 1),
  email: validateEmail,
  phone: validatePhone,
  name: validateName,
  password: validatePassword,
  pin: validatePin,
  amount: validateAmount,
  date: validateDate,
  
  // Preset combinations
  requiredName: (value: string) => validateName(value),
  requiredEmail: (value: string) => validateEmail(value),
  optionalPhone: (value: string) => value.trim() ? validatePhone(value) : { isValid: true },
  shortText: (value: string) => validateTextContent(value, 1, 100),
  longText: (value: string) => validateTextContent(value, 1, 1000),
  bio: (value: string) => validateTextContent(value, 0, 200),
};