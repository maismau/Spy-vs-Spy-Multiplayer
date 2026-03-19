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
    private turnResultText!: Phaser.GameObjects.Text;
    private isResolving: boolean = false;
    private buttonsA: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('SinglePlayerScene');
    }

    create() {
        this.isResolving = false;
        this.buttonsA = [];
        this.splitScreen = new SplitScreen(this);
        const { camA, camB } = this.splitScreen.setup();

        this.playerA = { id: 'A', hp: 5, missionProgress: 0, actionSelected: null };
        this.playerB = { id: 'B', hp: 5, missionProgress: 0, actionSelected: null };
        this.missionA = new MissionSystem();
        this.missionB = new MissionSystem();

        // UI Setup - Player A (Camera A looks at 0,0)
        this.hpTextA = this.add.text(20, 20, 'HP: 5', { fontSize: '24px', color: '#ffffff', backgroundColor: '#00000088' });
        this.missionTextA = this.add.text(20, 50, 'Mission: -', { fontSize: '18px', color: '#ffffff', backgroundColor: '#00000088' });
        
        // Back Button
        this.add.text(20, 80, '< Back to Menu', { color: '#fff' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MainMenuScene'));

        // UI Setup - Player B (Camera B looks at 1000,0)
        this.hpTextB = this.add.text(1020, 20, 'PC HP: 5', { fontSize: '24px', color: '#ffffff', backgroundColor: '#00000088' });
        this.missionTextB = this.add.text(1020, 50, 'Mission: -', { fontSize: '18px', color: '#ffffff', backgroundColor: '#00000088' });

        // Turn Result Text (Center of both screens? No, let's put it in Cam A view for now)
        this.turnResultText = this.add.text(this.scale.width / 4, 300, '', { 
            fontSize: '24px', 
            color: '#ffff00', 
            stroke: '#000', 
            strokeThickness: 4 
        }).setOrigin(0.5).setAlpha(0);

        // Action Buttons for Player A
        this.buttonsA.push(this.createButton(100, 500, 'Attack', () => this.handlePlayerAction(ActionType.Attack)));
        this.buttonsA.push(this.createButton(200, 500, 'Defense', () => this.handlePlayerAction(ActionType.Defense)));
        this.buttonsA.push(this.createButton(300, 500, 'Mission', () => this.handlePlayerAction(ActionType.Planning)));

        // Configure Camera Culling (Optional but cleaner)
        // Cam A should only see 0-400, Cam B should only see 1000-1400.
        // In simple mode, objects placed at 1000 won't be seen by Cam A anyway (scrollX=0).
        
        const yourTurnText = this.add.text(200, 560, 'Your Turn', { fontSize: '18px', color: '#00ff00' }).setOrigin(0.5);

        // --- CAMERA CULLING ---
        // Setup which camera sees which objects to avoid overlap
        camA.ignore([this.hpTextB, this.missionTextB]);
        camB.ignore([this.hpTextA, this.missionTextA, this.turnResultText, yourTurnText, ...this.buttonsA]);

        this.updateUI(); // Ensure HP is visible on first render
    }

    private createButton(x: number, y: number, label: string, callback: () => void) {
        const btn = this.add.text(x, y, label, {
            backgroundColor: '#444',
            padding: { x: 10, y: 5 },
            fontSize: '18px'
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', callback)
        .on('pointerover', () => { if (!this.isResolving) btn.setStyle({ backgroundColor: '#666' }) })
        .on('pointerout', () => { if (!this.isResolving && this.playerA.actionSelected !== label.toUpperCase()) btn.setStyle({ backgroundColor: '#444' }) });
        
        return btn;
    }

    private handlePlayerAction(action: ActionType) {
        if (this.isResolving) return;

        this.playerA.actionSelected = action;
        
        // Highlight clicked button
        this.buttonsA.forEach(btn => {
            if (btn.text.toUpperCase() === action) {
                btn.setStyle({ backgroundColor: '#aa8800' }); // Highlight Gold
            } else {
                btn.setStyle({ backgroundColor: '#222' }); // Dim others
            }
        });

        // Simple AI logic
        const actions = [ActionType.Attack, ActionType.Defense, ActionType.Planning];
        this.playerB.actionSelected = actions[Math.floor(Math.random() * actions.length)];

        this.isResolving = true;
        
        // Phase 1: Selection Delay
        this.time.delayedCall(800, () => this.resolveTurn());
    }

    private resolveTurn() {
        const actionA = this.playerA.actionSelected;
        const actionB = this.playerB.actionSelected;

        // Visual Message
        let resultMsg = `P1: ${actionA} | PC: ${actionB}`;
        this.turnResultText.setText(resultMsg).setAlpha(1);

        // Logic
        if (actionA === ActionType.Planning) this.missionA.advance();
        if (actionB === ActionType.Planning) this.missionB.advance();
        ActionSystem.resolveTurn(this.playerA, this.playerB);

        this.updateUI();

        // Phase 2: Result Display Delay
        this.time.delayedCall(2000, () => {
            this.turnResultText.setAlpha(0);
            this.isResolving = false;
            this.buttonsA.forEach(btn => btn.setStyle({ backgroundColor: '#444' }));
            this.checkVictory();
        });
    }

    private updateUI() {
        this.hpTextA.setText(`HP: ${this.playerA.hp}`);
        this.missionTextA.setText(`Mission: ${this.missionA.getCurrentStageName()}\nProgress: ${this.missionA.progress}/5`);

        this.hpTextB.setText(`PC HP: ${this.playerB.hp}`);
        this.missionTextB.setText(`Mission: ${this.missionB.getCurrentStageName()}\nProgress: ${this.missionB.progress}/5`);
    }

    private checkVictory() {
        if (this.playerA.hp <= 0 || this.missionB.isComplete()) {
            alert('GAME OVER - PC Wins!');
            this.scene.start('MainMenuScene');
        } else if (this.playerB.hp <= 0 || this.missionA.isComplete()) {
            alert('VICTORY - You Win!');
            this.scene.start('MainMenuScene');
        }
    }

    update() {}
}
