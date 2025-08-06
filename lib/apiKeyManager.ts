// lib/apiKeyManager.ts

export class ApiKeyManager {
  private keys: string[];
  private currentIndex: number;

  constructor(keysEnvVar: string) {
    const keysString = process.env[keysEnvVar];
    if (!keysString) {
      throw new Error(`Environment variable ${keysEnvVar} is not set.`);
    }

    this.keys = keysString.split(',').map(key => key.trim()).filter(Boolean);
    if (this.keys.length === 0) {
      throw new Error(`No valid API keys found in ${keysEnvVar}.`);
    }

    this.currentIndex = 0;
    console.log(`API Key Manager for ${keysEnvVar} initialized with ${this.keys.length} keys.`);
  }

  /**
   * Gets the next API key in a round-robin fashion.
   */
  public getNextKey(): string {
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }
}

// Create singleton instances for each service
export const geminiKeyManager = new ApiKeyManager('GEMINI_API_KEYS');
export const deepgramKeyManager = new ApiKeyManager('DEEPGRAM_API_KEYS');
