// Security Configuration and Utilities
export const SECURITY_CONFIG = {
  // Session management
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
  SESSION_WARNING_TIME: 15 * 60 * 1000, // 15 minutes before expiry
  
  // Rate limiting
  LOGIN_ATTEMPTS_LIMIT: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  API_RATE_LIMIT: 100, // requests per minute
  API_RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Input validation
  MAX_EMAIL_LENGTH: 254,
  MAX_NAME_LENGTH: 100,
  MAX_TEXT_LENGTH: 1000,
  
  // CSRF protection
  CSRF_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  
  // File upload security
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }
};

// Input validation functions
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && 
         email.length <= SECURITY_CONFIG.MAX_EMAIL_LENGTH &&
         email.length > 0;
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  return password.length >= SECURITY_CONFIG.MIN_PASSWORD_LENGTH &&
         password.length <= SECURITY_CONFIG.MAX_PASSWORD_LENGTH &&
         SECURITY_CONFIG.PASSWORD_REGEX.test(password);
};

export const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  return name.length > 0 && 
         name.length <= SECURITY_CONFIG.MAX_NAME_LENGTH &&
         /^[a-zA-Z\s\-'\.]+$/.test(name);
};

export const validateText = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  return text.length > 0 && 
         text.length <= SECURITY_CONFIG.MAX_TEXT_LENGTH;
};

// Input sanitization functions
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, ''); // Remove data: protocol
};

export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
  
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
};

// Rate limiting utilities
export class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requests = this.requests.get(identifier);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// CSRF protection utilities
export const generateCSRFToken = () => {
  return crypto.randomUUID();
};

export const validateCSRFToken = (token, storedToken) => {
  return token && storedToken && token === storedToken;
};

// File upload security
export const validateFileUpload = (file) => {
  if (!file) return { valid: false, error: 'No file provided' };
  
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB limit` 
    };
  }
  
  if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'File type not allowed' 
    };
  }
  
  return { valid: true };
};

// Security middleware utilities
export const addSecurityHeaders = (response) => {
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

export const createSecureResponse = (body, status = 200, headers = {}) => {
  const response = new Response(body, { 
    status, 
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
  
  return addSecurityHeaders(response);
};

// Logging and monitoring
export const logSecurityEvent = (event, details, level = 'info') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    level,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ip: 'client-ip-would-be-here', // In production, get from request context
  };
  
  console.log(`[SECURITY ${level.toUpperCase()}]`, logEntry);
  
  // In production, send to security monitoring service
  // await sendToSecurityService(logEntry);
};

// Export all security utilities
export default {
  SECURITY_CONFIG,
  validateEmail,
  validatePassword,
  validateName,
  validateText,
  sanitizeInput,
  sanitizeHTML,
  RateLimiter,
  generateCSRFToken,
  validateCSRFToken,
  validateFileUpload,
  addSecurityHeaders,
  createSecureResponse,
  logSecurityEvent,
};
