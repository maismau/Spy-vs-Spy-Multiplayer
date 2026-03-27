import Phaser from 'phaser';

/**
 * Utility to track and log missing assets that the game attempts to load.
 * Keeping this simple: it maintains a set of missing keys and logs them 
 * to console or ideally can be retrieved to update a local JSON file.
 */
export class AssetTracker {
    private static missingAssets: Set<string> = new Set();

    /**
     * Checks if a texture exists in the Phaser cache.
     * If not, records it as missing.
     */
    static check(scene: Phaser.Scene, key: string): boolean {
        if (!scene.textures.exists(key)) {
            if (!this.missingAssets.has(key)) {
                this.missingAssets.add(key);
                console.warn(`[AssetTracker] Missing Asset detected: ${key}`);
                
                // In a real dev environment, we would use an API call 
                // to write this to missing_assets.json.
                // For now, we use console logging as the primary signal.
                this.logToMetadata(key);
            }
            return false;
        }
        return true;
    }

    private static logToMetadata(_key: string) {
        // This is a placeholder for a future back-end sync if necessary.
        // For the current setup, the assistant will manually update the 
        // missing_assets.json by reading the logs or assuming demand.
    }

    static getMissing(): string[] {
        return Array.from(this.missingAssets);
    }
}
