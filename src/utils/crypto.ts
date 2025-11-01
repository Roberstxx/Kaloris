/**
 * Generate a random salt for password hashing
 */
export const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hash a password with a salt using PBKDF2
 */
export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const saltData = encoder.encode(salt);
  
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  return Array.from(new Uint8Array(bits), byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
};

/**
 * Verify a password against a hash and salt
 */
export const verifyPassword = async (
  password: string,
  hash: string,
  salt: string
): Promise<boolean> => {
  const newHash = await hashPassword(password, salt);
  return newHash === hash;
};
