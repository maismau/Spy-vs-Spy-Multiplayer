import Phaser from 'phaser';
import { SplitScreen } from './SplitScreen';
import { ActionType, ActionSystem, type PlayerState } from './ActionSystem';
import { MissionSystem } from './MissionSystem';

export class SinglePlayerScene extends Phaser.Scene {
    private splitScreen!: SplitScreen;
    private playerA!: PlayerState;
    private playerB!: PlayerState; // The AI
    private missionA!: MissionSystem;
    private missionB!: MissionSystem;

    private hpTextA!: Phaser.GameObjects.Text;
    private hpTextB!: Phaser.GameObjects.Text;
    private missionTextA!: Phaser.GameObjects.Text;
    private missionTextB!: Phaser.GameObjects.Text;

    constructor() {
        super('SinglePlayerScene');
    }

    create() {
        // Back Button
        this.add.text(20, 80, '< Back to Menu', { color: '#fff' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start('MainMenuScene');
            });

        this.splitScreen = new SplitScreen(this);
        this.splitScreen.setup();

        this.playerA = { id: 'A', hp: 5, missionProgress: 0, actionSelected: null };
        this.playerB = { id: 'B', hp: 5, missionProgress: 0, actionSelected: null };
        this.missionA = new MissionSystem();
        this.missionB = new MissionSystem();

        // UI Setup
        this.hpTextA = this.add.text(20, 20, 'HP: 5', { fontSize: '20px' });
        this.missionTextA = this.add.text(20, 50, 'Mission: -', { fontSize: '20px' });

        this.hpTextB = this.add.text(this.scale.width / 2 + 20, 20, 'PC HP: 5', { fontSize: '20px' });
        this.missionTextB = this.add.text(this.scale.width / 2 + 20, 50, 'Mission: -', { fontSize: '20px' });

        // Action Buttons for Player A (Visual Representation)
        this.createButton(100, 500, 'Attack', () => this.handlePlayerAction(ActionType.Attack));
        this.createButton(200, 500, 'Defense', () => this.handlePlayerAction(ActionType.Defense));
        this.createButton(300, 500, 'Mission', () => this.handlePlayerAction(ActionType.Planning));

        // Note: No buttons for Player B in Single Player, AI decides.
        
        this.add.text(this.scale.width / 2, 550, 'Select an action to play against the PC', { fontSize: '16px' }).setOrigin(0.5);
    }

    private createButton(x: number, y: number, label: string, callback: () => void) {
        const btn = this.add.text(x, y, label, {
            backgroundColor: '#444',
            padding: { x: 10, y: 5 },
            fontSize: '18px'
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', callback)
        .on('pointerover', () => btn.setStyle({ backgroundColor: '#666' }))
        .on('pointerout', () => btn.setStyle({ backgroundColor: '#444' }));
    }

    private handlePlayerAction(action: ActionType) {
        this.playerA.actionSelected = action;
        
        // Simple AI logic: Randomly select an action
        const actions = [ActionType.Attack, ActionType.Defense, ActionType.Planning];
        this.playerB.actionSelected = actions[Math.floor(Math.random() * actions.length)];

        this.resolveTurn();
    }

    private resolveTurn() {
        // Handle planning specifically for the local mission tracking override
        if (this.playerA.actionSelected === ActionType.Planning) this.missionA.advance();
        if (this.playerB.actionSelected === ActionType.Planning) this.missionB.advance();

        ActionSystem.resolveTurn(this.playerA, this.playerB);
        this.updateUI();
        this.checkVictory();
    }

    private updateUI() {
        this.hpTextA.setText(`HP: ${this.playerA.hp}`);
        this.missionTextA.setText(`Mission: ${this.missionA.getCurrentStageName()} (${this.missionA.progress}/5)`);

        this.hpTextB.setText(`PC HP: ${this.playerB.hp}`);
        this.missionTextB.setText(`Mission: ${this.missionB.getCurrentStageName()} (${this.missionB.progress}/5)`);
    }

    private checkVictory() {
        if (this.playerA.hp <= 0 || this.missionB.isComplete()) {
            alert('PC Wins!');
            this.scene.start('MainMenuScene');
        } else if (this.playerB.hp <= 0 || this.missionA.isComplete()) {
            alert('Player Wins!');
            this.scene.start('MainMenuScene');
        }
    }

    update() {}
}
