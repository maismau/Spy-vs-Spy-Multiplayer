import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { SplitScreen } from './SplitScreen';
import { ActionType, ActionSystem, createPlayer, type PlayerState } from './ActionSystem';
import { MissionSystem } from './MissionSystem';
import {
    SHOP_CATALOG,
    applyPowerUp,
    randomDisplayName,
    type PowerUpItem,
} from './PowerUpSystem';

const ITEMS_PER_ROW = 2;

export class OnlineMultiplayerScene extends Phaser.Scene {
    private socket!: Socket;
    private splitScreen!: SplitScreen;
    private playerA!: PlayerState;
    private playerB!: PlayerState;
    private missionA!: MissionSystem;
    private missionB!: MissionSystem;

    private hpTextA!: Phaser.GameObjects.Text;
    private mpTextA!: Phaser.GameObjects.Text;
    private hpTextB!: Phaser.GameObjects.Text;
    private mpTextB!: Phaser.GameObjects.Text;
    private missionTextA!: Phaser.GameObjects.Text;
    private missionTextB!: Phaser.GameObjects.Text;
    private turnResultText!: Phaser.GameObjects.Text;
    private statusTextA!: Phaser.GameObjects.Text;
    private shopFeedbackText!: Phaser.GameObjects.Text;

    private isResolving: boolean = false;
    private buttonsA: Phaser.GameObjects.Text[] = [];

    private shopOpen: boolean = false;
    private shopPanel: Phaser.GameObjects.Text[] = [];
    private shopToggleBtn!: Phaser.GameObjects.Text;

    private camAObjects: Phaser.GameObjects.GameObject[] = [];
    private camBObjects: Phaser.GameObjects.GameObject[] = [];

    constructor() {
        super('OnlineMultiplayerScene');
    }

    create() {
        this.isResolving = false;
        this.buttonsA = [];
        this.shopPanel = [];
        this.shopOpen = false;
        this.camAObjects = [];
        this.camBObjects = [];

        this.splitScreen = new SplitScreen(this);
        const { camA, camB } = this.splitScreen.setup();

        this.playerA = createPlayer('A');
        this.playerB = createPlayer('B');
        this.missionA = new MissionSystem();
        this.missionB = new MissionSystem();

        this.buildPlayerAUI();
        this.buildPlayerBUI();
        this.buildTurnResultText();
        this.buildActionButtons();
        this.buildShopPanel();

        this.statusTextA = this.addCamA(this.add.text(20, 460, '', {
            fontSize: '14px', color: '#aaffaa', backgroundColor: '#00000088', padding: { x: 6, y: 3 }
        }));

        this.addCamA(this.add.text(200, 565, '🌐 Online Mode', {
            fontSize: '16px', color: '#00ffff'
        }).setOrigin(0.5));

        // Socket
        this.socket = io('https://spy.spy.maldonado.top');
        this.socket.emit('joinRoom', 'game-1');

        this.socket.on('opponentAction', (action: ActionType) => {
            this.playerB.actionSelected = action;
            if (this.playerA.actionSelected) this.resolveTurn();
        });

        this.socket.on('opponentBoughtPowerUp', (itemId: string) => {
            const item = SHOP_CATALOG.find(i => i.id === itemId);
            if (item) applyPowerUp(this.playerB.activeEffects, item);
        });

        camA.ignore(this.camBObjects);
        camB.ignore(this.camAObjects);

        this.updateUI();
    }

    // ── UI Builders ──────────────────────────────────────────────────

    private buildPlayerAUI() {
        this.hpTextA = this.addCamA(this.add.text(20, 20, '', {
            fontSize: '22px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 6, y: 3 }
        }));
        this.mpTextA = this.addCamA(this.add.text(20, 52, '', {
            fontSize: '18px', color: '#ffe066', backgroundColor: '#00000088', padding: { x: 6, y: 3 }
        }));
        this.missionTextA = this.addCamA(this.add.text(20, 82, '', {
            fontSize: '15px', color: '#bbbbbb', backgroundColor: '#00000088', padding: { x: 6, y: 3 }
        }));
        this.addCamA(
            this.add.text(20, 120, '← Menu', { color: '#aaa', fontSize: '14px' })
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.cleanupAndReturn())
        );
    }

    private buildPlayerBUI() {
        this.hpTextB = this.addCamB(this.add.text(1020, 20, '', {
            fontSize: '22px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 6, y: 3 }
        }));
        this.mpTextB = this.addCamB(this.add.text(1020, 52, '', {
            fontSize: '18px', color: '#ffe066', backgroundColor: '#00000088', padding: { x: 6, y: 3 }
        }));
        this.missionTextB = this.addCamB(this.add.text(1020, 82, '', {
            fontSize: '15px', color: '#bbbbbb', backgroundColor: '#00000088', padding: { x: 6, y: 3 }
        }));
        this.addCamB(this.add.text(1020, 116, '👤 Oponente', { fontSize: '14px', color: '#aaa' }));
    }

    private buildTurnResultText() {
        this.turnResultText = this.addCamA(
            this.add.text(200, 300, '', {
                fontSize: '22px', color: '#ffff00', stroke: '#000', strokeThickness: 4,
                backgroundColor: '#00000088', padding: { x: 10, y: 6 }
            }).setOrigin(0.5).setAlpha(0)
        );
        this.shopFeedbackText = this.addCamA(
            this.add.text(200, 340, '', {
                fontSize: '14px', color: '#aaffaa', backgroundColor: '#00000066', padding: { x: 6, y: 3 }
            }).setOrigin(0.5).setAlpha(0)
        );
    }

    private buildActionButtons() {
        const btnStyle = { backgroundColor: '#333', padding: { x: 12, y: 6 }, fontSize: '18px', color: '#fff' };
        const actions: [number, string, ActionType][] = [
            [60, '⚔ Attack', ActionType.Attack],
            [185, '🛡 Defense', ActionType.Defense],
            [315, '📋 Plan', ActionType.Planning],
        ];
        for (const [x, label, action] of actions) {
            const btn = this.add.text(x, 510, label, btnStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.handleAction(action))
                .on('pointerover', () => { if (!this.isResolving) btn.setStyle({ backgroundColor: '#555' }); })
                .on('pointerout', () => { if (!this.isResolving) btn.setStyle({ backgroundColor: '#333' }); });
            this.buttonsA.push(btn);
            this.camAObjects.push(btn);
        }
    }

    private buildShopPanel() {
        this.shopToggleBtn = this.addCamA(
            this.add.text(310, 455, '🛒 Shop', {
                backgroundColor: '#225522', padding: { x: 10, y: 5 }, fontSize: '16px', color: '#aaffaa'
            }).setInteractive({ useHandCursor: true })
              .on('pointerdown', () => this.toggleShop())
        );

        let col = 0, row = 0;
        for (const item of SHOP_CATALOG) {
            const x = 20 + col * 195;
            const y = 155 + row * 80;
            const name = randomDisplayName(item);
            const btn = this.add.text(x, y,
                `${name}\n${item.description}\n💰 ${item.cost} MP`, {
                    fontSize: '12px', color: '#fff', backgroundColor: '#333344',
                    padding: { x: 8, y: 5 }, wordWrap: { width: 175 }
                })
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.buyPowerUp(item))
                .on('pointerover', () => btn.setStyle({ backgroundColor: '#555577' }))
                .on('pointerout', () => btn.setStyle({ backgroundColor: '#333344' }))
                .setVisible(false);
            this.shopPanel.push(btn);
            this.camAObjects.push(btn);
            col++;
            if (col >= ITEMS_PER_ROW) { col = 0; row++; }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private addCamA<T extends Phaser.GameObjects.GameObject>(obj: T): T {
        this.camAObjects.push(obj);
        return obj;
    }

    private addCamB<T extends Phaser.GameObjects.GameObject>(obj: T): T {
        this.camBObjects.push(obj);
        return obj;
    }

    // ── Shop Logic ────────────────────────────────────────────────────

    private toggleShop() {
        if (this.isResolving) return;
        this.shopOpen = !this.shopOpen;
        this.shopPanel.forEach(btn => btn.setVisible(this.shopOpen));
        this.shopToggleBtn.setText(this.shopOpen ? '❌ Fechar' : '🛒 Shop');
        if (this.shopOpen) this.refreshShopButtonState();
    }

    private refreshShopButtonState() {
        let i = 0;
        for (const item of SHOP_CATALOG) {
            const btn = this.shopPanel[i++];
            btn.setStyle({ color: this.playerA.missionPoints >= item.cost ? '#ffffff' : '#777777' });
        }
    }

    private buyPowerUp(item: PowerUpItem) {
        if (this.isResolving) return;
        if (this.playerA.missionPoints < item.cost) {
            this.showFeedback('❌ Pontos insuficientes!', '#ff4444');
            return;
        }
        this.playerA.missionPoints -= item.cost;
        applyPowerUp(this.playerA.activeEffects, item);
        this.socket.emit('buyPowerUp', { roomId: 'game-1', itemId: item.id });

        const name = randomDisplayName(item);
        this.showFeedback(`✅ ${name} ativado!`, '#aaffaa');
        this.updateUI();
        this.refreshShopButtonState();
    }

    private showFeedback(msg: string, color: string) {
        this.shopFeedbackText.setText(msg).setColor(color).setAlpha(1);
        this.time.delayedCall(1800, () => this.shopFeedbackText.setAlpha(0));
    }

    // ── Turn Flow ─────────────────────────────────────────────────────

    private handleAction(action: ActionType) {
        if (this.isResolving) return;
        if (this.shopOpen) this.toggleShop();

        this.playerA.actionSelected = action;
        this.socket.emit('submitAction', { roomId: 'game-1', action });

        this.buttonsA.forEach(btn => {
            const isSelected = btn.text.includes(action === ActionType.Attack ? 'Attack' :
                action === ActionType.Defense ? 'Defense' : 'Plan');
            btn.setStyle({ backgroundColor: isSelected ? '#aa8800' : '#222' });
        });

        if (this.playerA.actionSelected && this.playerB.actionSelected) this.resolveTurn();
    }

    private resolveTurn() {
        if (this.isResolving) return;
        this.isResolving = true;

        const actionA = this.playerA.actionSelected;
        const actionB = this.playerB.actionSelected;

        if (actionA === ActionType.Planning) this.missionA.advance();
        if (actionB === ActionType.Planning) this.missionB.advance();

        ActionSystem.resolveTurn(this.playerA, this.playerB);
        this.updateUI();

        this.turnResultText.setText(`⚔ ${actionA}  vs  👤 ${actionB}`).setAlpha(1);

        this.time.delayedCall(2000, () => {
            this.turnResultText.setAlpha(0);
            this.isResolving = false;
            this.buttonsA.forEach(btn => btn.setStyle({ backgroundColor: '#333' }));
            this.updateStatusBadge();
            this.checkVictory();
        });
    }

    // ── UI Updates ────────────────────────────────────────────────────

    private updateUI() {
        this.hpTextA.setText(`❤ HP: ${this.playerA.hp} / ${this.playerA.maxHp}`);
        this.mpTextA.setText(`💰 MP: ${this.playerA.missionPoints}`);
        this.missionTextA.setText(`📋 Missão: ${this.missionA.getCurrentStageName()}  ${this.missionA.progress}/5`);

        this.hpTextB.setText(`❤ HP: ${this.playerB.hp} / ${this.playerB.maxHp}`);
        this.mpTextB.setText(`💰 MP: ${this.playerB.missionPoints}`);
        this.missionTextB.setText(`📋 Missão: ${this.missionB.getCurrentStageName()}  ${this.missionB.progress}/5`);

        this.updateStatusBadge();
    }

    private updateStatusBadge() {
        const fx = this.playerA.activeEffects;
        const parts: string[] = [];
        if (fx.heal > 0) parts.push(`🩺+${fx.heal}`);
        if (fx.shieldRetaliate) parts.push('🛡⚡');
        if (fx.shieldReduce) parts.push('🛡-2');
        if (fx.weaponBoost) parts.push('💥+2');
        if (fx.weaponRecoil) parts.push('🌀x2');
        if (fx.sabotagePlan) parts.push('🕊💣');
        this.statusTextA.setText(parts.length ? 'Ativos: ' + parts.join(' ') : '');
    }

    private checkVictory() {
        if (this.playerA.hp <= 0 || this.missionB.isComplete()) {
            alert('💀 DERROTA! Oponente Venceu.');
            this.cleanupAndReturn();
        } else if (this.playerB.hp <= 0 || this.missionA.isComplete()) {
            alert('🏆 VITÓRIA! Você Ganhou.');
            this.cleanupAndReturn();
        }
    }

    private cleanupAndReturn() {
        this.socket?.disconnect();
        this.scene.start('MainMenuScene');
    }

    update() {}
}
