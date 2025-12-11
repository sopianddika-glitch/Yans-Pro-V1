
// services/cryptoService.ts

const KEY_STORAGE_KEY = 'yans-pro-crypto-key';
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // bytes

/**
 * Retrieves the encryption key from localStorage or creates a new one.
 * This key is used for symmetrical encryption of user data.
 */
async function getOrCreateKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem(KEY_STORAGE_KEY);
    if (storedKey) {
        const jwk = JSON.parse(storedKey);
        // Import the key from JWK format
        return await crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: ALGORITHM },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // If no key is found, generate a new one
    const newKey = await crypto.subtle.generateKey(
        { name: ALGORITHM, length: 256 },
        true, // Key is extractable to be stored
        ['encrypt', 'decrypt']
    );

    // Export the key to JWK format and store it in localStorage
    const jwk = await crypto.subtle.exportKey('jwk', newKey);
    localStorage.setItem(KEY_STORAGE_KEY, JSON.stringify(jwk));
    return newKey;
}

function bufferToBase64(buffer: Uint8Array): string {
    const CHUNK_SIZE = 8192;
    let result = '';
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const chunk = buffer.subarray(i, i + CHUNK_SIZE);
        result += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(result);
}

/**
 * Encrypts a plaintext string using AES-GCM.
 * An Initialization Vector (IV) is generated and prepended to the ciphertext.
 * The result is a base64 string, suitable for storage.
 */
export async function encryptData(plaintext: string): Promise<string> {
    try {
        const key = await getOrCreateKey();
        // The IV must be unique for each encryption with the same key
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const encoder = new TextEncoder();
        const encodedPlaintext = encoder.encode(plaintext);

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            key,
            encodedPlaintext
        );

        // Combine IV and ciphertext into a single buffer
        const ivAndCiphertext = new Uint8Array(iv.length + ciphertext.byteLength);
        ivAndCiphertext.set(iv);
        ivAndCiphertext.set(new Uint8Array(ciphertext), iv.length);

        // Convert buffer to a base64 string for easy storage in localStorage
        // Using chunked conversion to prevent stack overflow on large data
        return bufferToBase64(ivAndCiphertext);
    } catch (e) {
        console.error("Encryption failed:", e);
        // Fallback to returning plaintext if encryption fails to prevent data loss.
        return plaintext;
    }
}

/**
 * Decrypts a base64 encoded ciphertext string using AES-GCM.
 * Assumes the IV is prepended to the ciphertext.
 */
export async function decryptData(base64Ciphertext: string): Promise<string | null> {
    try {
        const key = await getOrCreateKey();
        
        // Convert base64 string back to a buffer
        const ivAndCiphertext = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));
        
        // Extract the IV and the actual ciphertext
        const iv = ivAndCiphertext.slice(0, IV_LENGTH);
        const ciphertext = ivAndCiphertext.slice(IV_LENGTH);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (e) {
        // If decryption fails, it might be unencrypted legacy data.
        // A simple check for valid JSON can distinguish.
        try {
            JSON.parse(base64Ciphertext);
            // It is valid JSON, so we return it as plaintext.
            // console.log("Data appears to be unencrypted legacy JSON, returning as is.");
            return base64Ciphertext;
        } catch (jsonError) {
             // If it's not valid JSON either, then it's likely corrupted encrypted data.
             // Suppress console.warn to avoid user alarm during dev cycles or key changes.
            // console.debug("Decryption failed and data is not valid JSON. Data may be corrupt or key is incorrect.");
            return null; // Return null to indicate failure.
        }
    }
}
