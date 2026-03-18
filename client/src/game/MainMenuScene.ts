import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // Title
        this.add.text(width / 2, height / 4, 'Spy vs Spy: Double Reality', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 4 + 40, 'Choose Game Mode', {
            fontSize: '20px',
            color: '#cccccc'
        }).setOrigin(0.5);

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
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', callback)
        .on('pointerover', () => btn.setStyle({ backgroundColor: '#666666' }))
        .on('pointerout', () => btn.setStyle({ backgroundColor: '#444444' }));
    }
}
