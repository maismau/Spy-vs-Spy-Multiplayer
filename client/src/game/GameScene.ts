import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { SplitScreen } from './SplitScreen';
import { ActionType, ActionSystem, type PlayerState } from './ActionSystem';
import { MissionSystem } from './MissionSystem';

export class GameScene extends Phaser.Scene {
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

    constructor() {
        super('GameScene');
    }

    create() {
        this.socket = io('https://spy.spy.maldonado.top');
        this.socket.emit('joinRoom', 'game-1');

        this.socket.on('opponentAction', (action: ActionType) => {
            console.log('Opponent selected:', action);
            this.playerB.actionSelected = action;
            if (this.playerA.actionSelected) {
                this.resolveTurn();
            }
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

        this.hpTextB = this.add.text(this.scale.width / 2 + 20, 20, 'HP: 5', { fontSize: '20px' });
        this.missionTextB = this.add.text(this.scale.width / 2 + 20, 50, 'Mission: -', { fontSize: '20px' });

        // Action Buttons for Player A (Visual Representation)
        this.createButton(100, 500, 'Attack', () => this.handleAction('A', ActionType.Attack));
        this.createButton(200, 500, 'Defense', () => this.handleAction('A', ActionType.Defense));
        this.createButton(300, 500, 'Mission', () => this.handleAction('A', ActionType.Planning));

        // Action Buttons for Player B
        this.createButton(this.scale.width / 2 + 100, 500, 'Attack', () => this.handleAction('B', ActionType.Attack));
        this.createButton(this.scale.width / 2 + 200, 500, 'Defense', () => this.handleAction('B', ActionType.Defense));
        this.createButton(this.scale.width / 2 + 300, 500, 'Mission', () => this.handleAction('B', ActionType.Planning));
        
        this.add.text(this.scale.width / 2, 550, 'Click actions for BOTH to resolve turn', { fontSize: '16px' }).setOrigin(0.5);
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

    private handleAction(playerId: string, action: ActionType) {
        if (playerId === 'A') {
            this.playerA.actionSelected = action;
            this.socket.emit('submitAction', { roomId: 'game-1', action });
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

        this.hpTextB.setText(`HP: ${this.playerB.hp}`);
        this.missionTextB.setText(`Mission: ${this.missionB.getCurrentStageName()} (${this.missionB.progress}/5)`);
    }

    private checkVictory() {
        if (this.playerA.hp <= 0 || this.missionB.isComplete()) {
            alert('Player B Wins!');
            this.scene.restart();
        } else if (this.playerB.hp <= 0 || this.missionA.isComplete()) {
            alert('Player A Wins!');
            this.scene.restart();
        }
    }

    update() {}
}
