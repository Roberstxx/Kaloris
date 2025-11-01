/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  return { valid: true, message: '' };
};

/**
 * Validate physical data ranges
 */
export const validatePhysicalData = (data: {
  age?: number;
  weightKg?: number;
  heightCm?: number;
}): { valid: boolean; message: string } => {
  if (data.age !== undefined && (data.age < 15 || data.age > 120)) {
    return { valid: false, message: 'La edad debe estar entre 15 y 120 años' };
  }
  if (data.weightKg !== undefined && (data.weightKg < 30 || data.weightKg > 300)) {
    return { valid: false, message: 'El peso debe estar entre 30 y 300 kg' };
  }
  if (data.heightCm !== undefined && (data.heightCm < 100 || data.heightCm > 250)) {
    return { valid: false, message: 'La altura debe estar entre 100 y 250 cm' };
  }
  return { valid: true, message: '' };
};
