import Phaser from 'phaser';
import { preloadLayerAssets, LAYER_ASSETS } from './visual/LayeredVisualEngine';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    preload() {
        preloadLayerAssets(this);
    }

    create() {
        const { width, height } = this.scale;

        // ── Background ─────────────────────────────────────────
        if (this.textures.exists(LAYER_ASSETS.bgHome)) {
            const img = this.add.image(width / 2, height / 2, LAYER_ASSETS.bgHome).setDepth(0);
            const scaleX = width / img.width;
            const scaleY = height / img.height;
            img.setScale(Math.max(scaleX, scaleY));
        }

        // ── Overlay panel for readability ──────────────────────
        this.add.rectangle(width / 2, height / 2, 400, 320, 0x000000, 0.55)
            .setDepth(1);

        // Title
        this.add.text(width / 2, height / 4, 'Spy vs Spy: Double Reality', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(2);

        // Subtitle
        this.add.text(width / 2, height / 4 + 44, 'Choose Game Mode', {
            fontSize: '20px',
            color: '#cccccc',
        }).setOrigin(0.5).setDepth(2);

        // Buttons
        this.createButton(width / 2, height / 2, '1 Player (vs PC)', () => {
            this.scene.start('SinglePlayerScene');
        });

        this.createButton(width / 2, height / 2 + 70, '2 Players (Online)', () => {
            this.scene.start('OnlineMultiplayerScene');
        });

        this.createButton(width / 2, height / 2 + 140, 'Settings', () => {
            alert('Settings incoming!');
        });
    }

    private createButton(x: number, y: number, label: string, callback: () => void) {
        const btn = this.add.text(x, y, label, {
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 },
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            fixedWidth: 300
        })
        .setOrigin(0.5)
        .setDepth(2)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', callback)
        .on('pointerover', () => btn.setStyle({ backgroundColor: '#666666' }))
        .on('pointerout', () => btn.setStyle({ backgroundColor: '#444444' }));
    }
}
