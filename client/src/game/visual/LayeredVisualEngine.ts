// ============================================================
// LayeredVisualEngine.ts — Sprite-layer visual manager (v2)
// ============================================================
// Layer order (back → front):
//   1. bg_vida_NN        — HP 00..06 background
//   2. server_lvl_NN     — mission progress level 1..7 + win
//   3. powerup sprites   — permanent=always, single-use=1 turn
//   4. mission_N         — stacks 1-3 after consecutive Plans
//   5. Point_availible   — shows when missionPoints > 0
//   6. fx_fire_01        — shows when HP == 1
// ============================================================
// World layout:
//   Player A panel: world X  0..1280 (camera scrolls from 0)
//   Player B panel: world X  1280..2560 (camera scrolls from 1280)
// ============================================================

import Phaser from 'phaser';
import type { PlayerState } from '../ActionSystem';

// ── Asset texture key constants ────────────────────────────────
export const LAYER_ASSETS = {
    bgVida: (n: number) => `bg_vida_${String(n).padStart(2, '0')}`,
    // server uses "lvl" with double-l, zero-padded; level 8 = win
    serverLv: (n: number) => n >= 8 ? 'win' : `server_lvl_${String(n).padStart(2, '0')}`,
    mission: (n: number) => `${n}_mission`,  // keys: 1_mission, 2_mission, 3_mission
    pointAvailable: 'Point_availible',
    fxFire: 'fx_fire_01',
    bgHome: 'bg_home',
};

// Maps shop item IDs → powerup image texture keys (filename without .png)
export const POWERUP_IMAGE_MAP: Record<string, string> = {
    'HEAL_1':     'powerup_HEAL_1',
    'HEAL_2':     'powerup_HEAL_2',
    'SHIELD_1':   'powerup_SHIELD_1',
    'SHIELD_2':   'powerup_SHIELD_2',
    'WEAPON_1':   'powerup_weapon_1',
    'WEAPON_2':   'powerup_weapon_2',
    'WEAPON_3':   'powerup_weapon_3',
    'SABOTAGE_2': 'powerup_sabotage_2',
};

// All shop item IDs (order determines display position)
export const SHOP_ITEM_IDS = ['HEAL_1', 'HEAL_2', 'SHIELD_1', 'SHIELD_2', 'WEAPON_1', 'WEAPON_2', 'WEAPON_3', 'SABOTAGE_2'];

/** Preload all visual layer assets. Call from the scene's preload(). */
export function preloadLayerAssets(scene: Phaser.Scene): void {
    const base = 'assets/objects';
    // bg_vida 00..06
    for (let i = 0; i <= 6; i++) {
        const key = LAYER_ASSETS.bgVida(i);
        scene.load.image(key, `${base}/${key}.png`);
    }
    // server_lvl_01..07 + win
    for (let i = 1; i <= 7; i++) {
        const key = LAYER_ASSETS.serverLv(i);
        scene.load.image(key, `${base}/${key}.png`);
    }
    scene.load.image('win', `${base}/win.png`);
    // mission overlays: 1_mission.png, 2_mission.png, 3_mission.png
    // Note: 2_Mission.png and 3_mission.png also exist — Windows FS is case-insensitive
    for (let i = 1; i <= 3; i++) {
        const key = LAYER_ASSETS.mission(i);
        // Try lowercase first; Windows will resolve 2_Mission.png too
        scene.load.image(key, `${base}/${key}.png`);
    }
    // misc overlays
    scene.load.image(LAYER_ASSETS.pointAvailable, `${base}/Point_availible.png`);
    scene.load.image(LAYER_ASSETS.fxFire,         `${base}/fx_fire_01.png`);
    scene.load.image(LAYER_ASSETS.bgHome,         `${base}/bg_home.png`);
    // powerup images — keyed by image filename (mixed case as on disk)
    for (const [, imgKey] of Object.entries(POWERUP_IMAGE_MAP)) {
        scene.load.image(imgKey, `${base}/${imgKey}.png`);
    }
    scene.load.image('powerup_Heal_ready', `${base}/powerup_Heal_ready.png`);
}

interface SingleUsePowerupState {
    shopId: string; // shop item ID (e.g. 'HEAL_1')
    turnsLeft: number;
}

/**
 * Manages all visual sprite layers for ONE player's panel.
 *
 * @param worldX  Starting X in WORLD coordinates for this panel (0 for Player A, 1280 for Player B)
 * @param panelW  Width of the panel in world pixels
 * @param panelH  Height of the panel in world pixels
 */
export class LayeredVisualEngine {
    private scene: Phaser.Scene;
    private worldX: number;
    private panelW: number;
    private panelH: number;
    private camObjects: Phaser.GameObjects.GameObject[];

    private bgVidaSprites: Map<string, Phaser.GameObjects.Image> = new Map();
    private serverSprites: Map<string, Phaser.GameObjects.Image> = new Map();
    private missionSprites: Map<string, Phaser.GameObjects.Image> = new Map();
    private powerupSprites: Map<string, Phaser.GameObjects.Image> = new Map(); // keyed by shopId
    private pointAvailableSprite!: Phaser.GameObjects.Image;
    private fxFireSprite!: Phaser.GameObjects.Image;

    private activeServerLevel = 0;
    private activeBgVida = -1;
    private singleUsePowerups: SingleUsePowerupState[] = [];

    constructor(
        scene: Phaser.Scene,
        worldX: number,
        panelW: number,
        panelH: number,
        camObjects: Phaser.GameObjects.GameObject[]
    ) {
        this.scene = scene;
        this.worldX = worldX;
        this.panelW = panelW;
        this.panelH = panelH;
        this.camObjects = camObjects;
    }

    /** Call in create() AFTER preload. Builds all sprites at correct world coords. */
    build(): void {
        const cx = this.worldX + this.panelW / 2;
        const cy = this.panelH / 2;

        // ── 1. bg_vida sprites ───────────────────────────────────────
        for (let i = 0; i <= 6; i++) {
            const key = LAYER_ASSETS.bgVida(i);
            const img = this.safeImage(cx, cy, key, 0);
            this.coverPanel(img);
            img.setVisible(false);
            this.bgVidaSprites.set(key, img);
        }

        // ── 2. server level sprites ──────────────────────────────────
        for (let i = 1; i <= 8; i++) {
            const key = LAYER_ASSETS.serverLv(i);
            const img = this.safeImage(cx, cy, key, 10);
            this.coverPanel(img);
            img.setVisible(false);
            this.serverSprites.set(key, img);
        }

        // ── 3. powerup icon sprites ──────────────────────────────────
        let px = this.worldX + 10;
        let py = this.panelH - 50;
        for (const shopId of SHOP_ITEM_IDS) {
            const imgKey = POWERUP_IMAGE_MAP[shopId];
            if (!imgKey) continue;
            const img = this.safeImage(px, py, imgKey, 20);
            img.setDisplaySize(44, 44);
            img.setVisible(false);
            this.powerupSprites.set(shopId, img);
            px += 50;
            if (px > this.worldX + this.panelW - 55) { px = this.worldX + 10; py -= 50; }
        }

        // ── 4. mission overlay sprites ───────────────────────────────
        const missionX = this.worldX + 10;
        for (let i = 1; i <= 3; i++) {
            const key = LAYER_ASSETS.mission(i);
            const img = this.safeImage(missionX, 80 + (i - 1) * 38, key, 30);
            img.setOrigin(0, 0.5);
            img.setDisplaySize(160, 32);
            img.setVisible(false);
            this.missionSprites.set(key, img);
        }

        // ── 5. point_available ───────────────────────────────────────
        this.pointAvailableSprite = this.safeImage(
            this.worldX + this.panelW - 60, 30, LAYER_ASSETS.pointAvailable, 30
        );
        this.pointAvailableSprite.setDisplaySize(52, 52);
        this.pointAvailableSprite.setVisible(false);

        // ── 6. fx_fire overlay ───────────────────────────────────────
        this.fxFireSprite = this.safeImage(cx, cy, LAYER_ASSETS.fxFire, 100);
        this.coverPanel(this.fxFireSprite);
        this.fxFireSprite.setVisible(false);
        this.fxFireSprite.setAlpha(0.65);

        // Show start bg (HP=5 → bg_vida_05)
        this.showBgVida(5);
    }

    /**
     * Sync all layers to current game state.
     * @param player           Player state
     * @param serverLevel      0=hidden, 1-7=progress, 8=win
     * @param consecutivePlans Consecutive Plan actions (1-3 overlays shown)
     * @param activatedSingleUseIds Shop IDs of single-use items activated this turn
     */
    update(
        player: PlayerState,
        serverLevel: number,
        consecutivePlans: number,
        activatedSingleUseIds: string[] = []
    ): void {
        // 1. Background
        this.showBgVida(Math.max(0, Math.min(6, player.hp)));

        // 2. Server level
        this.showServerLevel(serverLevel);

        // 3. Powerup sprites
        // Tick down existing single-use
        this.singleUsePowerups = this.singleUsePowerups
            .map(s => ({ ...s, turnsLeft: s.turnsLeft - 1 }))
            .filter(s => s.turnsLeft > 0);
        // Register newly activated single-use items
        for (const shopId of activatedSingleUseIds) {
            if (!this.singleUsePowerups.find(s => s.shopId === shopId)) {
                this.singleUsePowerups.push({ shopId, turnsLeft: 1 });
            }
        }
        // Update sprite visibility per shop item ID
        for (const shopId of SHOP_ITEM_IDS) {
            const sprite = this.powerupSprites.get(shopId);
            if (!sprite) continue;
            const isPermanent = player.permanentItems.includes(shopId);
            const isTempActive = this.singleUsePowerups.some(s => s.shopId === shopId);
            sprite.setVisible(isPermanent || isTempActive);
        }

        // 4. Mission overlays
        const cap = Math.min(consecutivePlans, 3);
        for (let i = 1; i <= 3; i++) {
            this.missionSprites.get(LAYER_ASSETS.mission(i))?.setVisible(i <= cap);
        }

        // 5. Point available
        this.pointAvailableSprite.setVisible(player.missionPoints > 0);

        // 6. Fire overlay
        this.fxFireSprite.setVisible(player.hp <= 1 && player.hp > 0);
    }

    /** Hide mission overlays immediately (call on Attack or Defense) */
    clearMissionOverlays(): void {
        for (let i = 1; i <= 3; i++) {
            this.missionSprites.get(LAYER_ASSETS.mission(i))?.setVisible(false);
        }
    }

    // ── Private Helpers ───────────────────────────────────────────────

    private showBgVida(level: number): void {
        if (level === this.activeBgVida) return;
        if (this.activeBgVida >= 0) {
            this.bgVidaSprites.get(LAYER_ASSETS.bgVida(this.activeBgVida))?.setVisible(false);
        }
        this.bgVidaSprites.get(LAYER_ASSETS.bgVida(level))?.setVisible(true);
        this.activeBgVida = level;
    }

    private showServerLevel(level: number): void {
        if (level === this.activeServerLevel) return;
        if (this.activeServerLevel > 0) {
            this.serverSprites.get(LAYER_ASSETS.serverLv(this.activeServerLevel))?.setVisible(false);
        }
        if (level > 0) {
            this.serverSprites.get(LAYER_ASSETS.serverLv(level))?.setVisible(true);
        }
        this.activeServerLevel = level;
    }

    /**
     * Scale an image to COVER the panel (preserving aspect ratio, cropping edges if needed).
     * Prevents squeezing.
     */
    private coverPanel(img: Phaser.GameObjects.Image): void {
        if (img.width === 0 || img.height === 0) return; // placeholder / missing texture
        const scaleX = this.panelW / img.width;
        const scaleY = this.panelH / img.height;
        img.setScale(Math.max(scaleX, scaleY));
    }

    /** Creates an image safely; if texture missing, uses invisible placeholder. */
    private safeImage(x: number, y: number, key: string, depth: number): Phaser.GameObjects.Image {
        const exists = this.scene.textures.exists(key);
        const img = exists
            ? this.scene.add.image(x, y, key).setDepth(depth)
            : this.scene.add.image(x, y, '__DEFAULT').setDepth(depth).setAlpha(0);
        this.camObjects.push(img);
        return img;
    }
}
