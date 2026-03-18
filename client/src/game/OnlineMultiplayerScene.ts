import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { SplitScreen } from './SplitScreen';
import { ActionType, ActionSystem, type PlayerState } from './ActionSystem';
import { MissionSystem } from './MissionSystem';

export class OnlineMultiplayerScene extends Phaser.Scene {
    private socket!: Socket;
    private splitScreen!: SplitScreen;
    private playerA!: PlayerState;
    private playerB!: PlayerState;
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
        super('OnlineMultiplayerScene');
    }

    create() {
        this.splitScreen = new SplitScreen(this);
        const { camA, camB } = this.splitScreen.setup();

        this.playerA = { id: 'A', hp: 5, missionProgress: 0, actionSelected: null };
        this.playerB = { id: 'B', hp: 5, missionProgress: 0, actionSelected: null };
        this.missionA = new MissionSystem();
        this.missionB = new MissionSystem();

        // UI Setup - Player A
        this.hpTextA = this.add.text(20, 20, 'HP: 5', { fontSize: '20px' });
        this.missionTextA = this.add.text(20, 50, 'Mission: -', { fontSize: '20px' });
        
        // Back Button
        this.add.text(20, 80, '< Back to Menu', { color: '#fff' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.socket?.disconnect();
                this.scene.start('MainMenuScene');
            });

        // UI Setup - Player B (Cam B looks at 1000,0)
        this.hpTextB = this.add.text(1020, 20, 'OPPONENT HP: 5', { fontSize: '20px' });
        this.missionTextB = this.add.text(1020, 50, 'Mission: -', { fontSize: '20px' });

        this.turnResultText = this.add.text(this.scale.width / 4, 300, '', { 
            fontSize: '24px', color: '#ffff00', stroke: '#000', strokeThickness: 4 
        }).setOrigin(0.5).setAlpha(0);

        // Socket Setup
        this.socket = io('https://spy.spy.maldonado.top');
        this.socket.emit('joinRoom', 'game-1');

        this.socket.on('opponentAction', (action: ActionType) => {
            console.log('Opponent selected:', action);
            this.playerB.actionSelected = action;
            if (this.playerA.actionSelected) {
                this.resolveTurn();
            }
        });

        // Action Buttons for Local Player A
        this.buttonsA.push(this.createButton(100, 500, 'Attack', () => this.handleAction('A', ActionType.Attack)));
        this.buttonsA.push(this.createButton(200, 500, 'Defense', () => this.handleAction('A', ActionType.Defense)));
        this.buttonsA.push(this.createButton(300, 500, 'Mission', () => this.handleAction('A', ActionType.Planning)));
        
        this.add.text(200, 560, 'ONLINE MODE', { fontSize: '18px', color: '#00ffff' }).setOrigin(0.5);

        // Camera Culling
        camA.ignore([this.hpTextB, this.missionTextB]);
        camB.ignore([this.hpTextA, this.missionTextA, this.turnResultText, ...this.buttonsA]);
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

    private handleAction(playerId: string, action: ActionType) {
        if (this.isResolving) return;

        if (playerId === 'A') {
            this.playerA.actionSelected = action;
            this.socket.emit('submitAction', { roomId: 'game-1', action });

            // Highlight
            this.buttonsA.forEach(btn => {
                if (btn.text.toUpperCase() === action) btn.setStyle({ backgroundColor: '#aa8800' });
                else btn.setStyle({ backgroundColor: '#222' });
            });
        } else {
            // Player B is controlled by socket in MVP
            // this.playerB.actionSelected = action; 
        }

        // If both selected, resolve
        if (this.playerA.actionSelected && this.playerB.actionSelected) {
            this.resolveTurn();
        }
    }

    private resolveTurn() {
        if (this.isResolving) return;
        this.isResolving = true;

        const actionA = this.playerA.actionSelected;
        const actionB = this.playerB.actionSelected;

        this.turnResultText.setText(`P1: ${actionA} | OPP: ${actionB}`).setAlpha(1);

        // Handle planning specifically for the local mission tracking override
        if (actionA === ActionType.Planning) this.missionA.advance();
        if (actionB === ActionType.Planning) this.missionB.advance();
        ActionSystem.resolveTurn(this.playerA, this.playerB);

        this.updateUI();

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

        this.hpTextB.setText(`OPPONENT HP: ${this.playerB.hp}`);
        this.missionTextB.setText(`Mission: ${this.missionB.getCurrentStageName()}\nProgress: ${this.missionB.progress}/5`);
    }

    private checkVictory() {
        if (this.playerA.hp <= 0 || this.missionB.isComplete()) {
            alert('DEFEAT! Opponent Wins.');
            this.scene.start('MainMenuScene');
        } else if (this.playerB.hp <= 0 || this.missionA.isComplete()) {
            alert('VICTORY! You Win.');
            this.scene.start('MainMenuScene');
        }
    }

    update() {}
}
