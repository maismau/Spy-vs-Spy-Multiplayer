import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { SplitScreen } from './SplitScreen';
import { ActionType, ActionSystem, createPlayer, type PlayerState, planFailureChance } from './ActionSystem';
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
    private inventoryTextA!: Phaser.GameObjects.Text;
    private shopFeedbackText!: Phaser.GameObjects.Text;

    private planAFailed = false;
    private planBFailed = false;

    private isResolving = false;
    private buttonsA: Phaser.GameObjects.Text[] = [];

    private shopOpen = false;
    private shopPanel: Phaser.GameObjects.Text[] = [];
    private shopToggleBtn!: Phaser.GameObjects.Text;

    private camAObjects: Phaser.GameObjects.GameObject[] = [];
    private camBObjects: Phaser.GameObjects.GameObject[] = [];

    constructor() { super('OnlineMultiplayerScene'); }

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

        this.statusTextA = this.addA(this.add.text(20, 450, '', {
            fontSize: '13px', color: '#aaffaa', backgroundColor: '#00000088', padding: { x: 5, y: 3 }
        }));
        this.inventoryTextA = this.addA(this.add.text(20, 472, '', {
            fontSize: '13px', color: '#aaeeff', backgroundColor: '#00000088', padding: { x: 5, y: 3 }
        }));
        this.addA(this.add.text(200, 565, '🌐 Online Mode', { fontSize: '15px', color: '#00ffff' }).setOrigin(0.5));

        // Socket
        this.socket = io('https://spy.spy.maldonado.top');
        this.socket.emit('joinRoom', 'game-1');

        this.socket.on('opponentAction', (data: { action: ActionType, planFailed: boolean }) => {
            this.playerB.actionSelected = data.action;
            this.planBFailed = data.planFailed;
            if (this.playerA.actionSelected) this.resolveTurn();
        });

        this.socket.on('opponentBoughtPowerUp', ({ itemId, permanent }: { itemId: string; permanent: boolean }) => {
            const item = SHOP_CATALOG.find(i => i.id === itemId);
            if (!item) return;
            if (permanent) {
                if (!this.playerB.permanentItems.includes(itemId)) this.playerB.permanentItems.push(itemId);
            } else {
                applyPowerUp(this.playerB.activeEffects, item);
            }
        });

        camA.ignore(this.camBObjects);
        camB.ignore(this.camAObjects);
        this.updateUI();
    }

    // ── UI Builders ──────────────────────────────────────────────────

    private buildPlayerAUI() {
        this.hpTextA = this.addA(this.add.text(20, 20, '', { fontSize: '20px', color: '#fff', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.mpTextA = this.addA(this.add.text(20, 50, '', { fontSize: '16px', color: '#ffe066', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.missionTextA = this.addA(this.add.text(20, 76, '', { fontSize: '14px', color: '#bbb', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.addA(this.add.text(20, 106, '← Menu', { color: '#aaa', fontSize: '13px' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.cleanupAndReturn()));
    }

    private buildPlayerBUI() {
        this.hpTextB = this.addB(this.add.text(1020, 20, '', { fontSize: '20px', color: '#fff', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.mpTextB = this.addB(this.add.text(1020, 50, '', { fontSize: '16px', color: '#ffe066', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.missionTextB = this.addB(this.add.text(1020, 76, '', { fontSize: '14px', color: '#bbb', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.addB(this.add.text(1020, 106, '👤 Oponente', { fontSize: '13px', color: '#aaa' }));
    }

    private buildTurnResultText() {
        this.turnResultText = this.addA(this.add.text(200, 290, '', {
            fontSize: '20px', color: '#ffff00', stroke: '#000', strokeThickness: 4,
            backgroundColor: '#00000099', padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setAlpha(0));
        this.shopFeedbackText = this.addA(this.add.text(200, 325, '', {
            fontSize: '13px', color: '#aaffaa', backgroundColor: '#00000066', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setAlpha(0));
    }

    private buildActionButtons() {
        const style = { backgroundColor: '#333', padding: { x: 10, y: 6 }, fontSize: '16px', color: '#fff' };
        const defs: [number, string, ActionType][] = [
            [30, '⚔ Attack', ActionType.Attack],
            [145, '🛡 Defense', ActionType.Defense],
            [270, '📋 Plan', ActionType.Planning],
        ];
        for (const [x, label, act] of defs) {
            const btn = this.add.text(x, 505, label, style)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.handleAction(act))
                .on('pointerover', () => { if (!this.isResolving) btn.setStyle({ backgroundColor: '#555' }); })
                .on('pointerout', () => { if (!this.isResolving) btn.setStyle({ backgroundColor: '#333' }); });
            this.buttonsA.push(btn);
            this.camAObjects.push(btn);
        }
    }

    private buildShopPanel() {
        this.shopToggleBtn = this.addA(this.add.text(295, 445, '🛒 Shop', {
            backgroundColor: '#225522', padding: { x: 8, y: 4 }, fontSize: '14px', color: '#aaffaa'
        }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toggleShop()));

        let col = 0, row = 0;
        for (const item of SHOP_CATALOG) {
            const x = 20 + col * 190;
            const y = 130 + row * 75;
            const tag = item.duration === 'PERMANENT' ? '🔁' : '✨';
            const btn = this.add.text(x, y,
                `${tag} ${randomDisplayName(item)}\n${item.description}\n💰 ${item.cost} MP`, {
                fontSize: '11px', color: '#fff', backgroundColor: '#333344',
                padding: { x: 7, y: 4 }, wordWrap: { width: 175 }
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

    private addA<T extends Phaser.GameObjects.GameObject>(obj: T): T { this.camAObjects.push(obj); return obj; }
    private addB<T extends Phaser.GameObjects.GameObject>(obj: T): T { this.camBObjects.push(obj); return obj; }

    // ── Shop ─────────────────────────────────────────────────────────

    private toggleShop() {
        if (this.isResolving) return;
        this.shopOpen = !this.shopOpen;
        this.shopPanel.forEach(b => b.setVisible(this.shopOpen));
        this.shopToggleBtn.setText(this.shopOpen ? '❌ Fechar' : '🛒 Shop');
        if (this.shopOpen) this.refreshShopState();
    }

    private refreshShopState() {
        let i = 0;
        for (const item of SHOP_CATALOG) {
            const btn = this.shopPanel[i++];
            const owned = item.duration === 'PERMANENT' && this.playerA.permanentItems.includes(item.id);
            const canAfford = this.playerA.missionPoints >= item.cost;
            btn.setStyle({ color: (!canAfford || owned) ? '#666' : '#fff' });
        }
    }

    private buyPowerUp(item: PowerUpItem) {
        if (this.isResolving) return;
        if (this.playerA.missionPoints < item.cost) { this.showFeedback('❌ MP insuficiente', '#ff4444'); return; }
        const owned = item.duration === 'PERMANENT' && this.playerA.permanentItems.includes(item.id);
        if (owned) { this.showFeedback('⚠ Já possui este item', '#ffaa00'); return; }

        this.playerA.missionPoints -= item.cost;

        if (item.duration === 'PERMANENT') {
            this.playerA.permanentItems.push(item.id);
        } else {
            applyPowerUp(this.playerA.activeEffects, item);
        }

        this.socket.emit('buyPowerUp', {
            roomId: 'game-1',
            itemId: item.id,
            permanent: item.duration === 'PERMANENT'
        });

        this.showFeedback(`✅ ${randomDisplayName(item)}!`, '#aaffaa');
        this.updateUI();
        this.refreshShopState();
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

        // Roll for plan failure locally for sync
        this.planAFailed = action === ActionType.Planning && 
            Math.random() < planFailureChance(this.playerA.consecutivePlans);

        this.socket.emit('submitAction', { 
            roomId: 'game-1', 
            action, 
            planFailed: this.planAFailed 
        });
        this.buttonsA.forEach(btn => {
            const active = btn.text.includes(action === ActionType.Attack ? 'Attack' :
                action === ActionType.Defense ? 'Defense' : 'Plan');
            btn.setStyle({ backgroundColor: active ? '#aa8800' : '#222' });
        });
        if (this.playerA.actionSelected && this.playerB.actionSelected) this.resolveTurn();
    }

    private resolveTurn() {
        if (this.isResolving) return;
        this.isResolving = true;
        const actionA = this.playerA.actionSelected;
        const actionB = this.playerB.actionSelected;
        const result = ActionSystem.resolveTurn(
            this.playerA, this.playerB, this.missionA, this.missionB,
            this.planAFailed, this.planBFailed
        );
        this.updateUI();

        let msg = `⚔ ${actionA}  vs  👤 ${actionB}`;
        if (result.planAFailed) msg = `❌ PLANO FALHOU!\n${msg}`;
        if (result.planBFailed) msg += `\n👤 PLANO FALHOU!`;

        this.turnResultText.setText(msg).setAlpha(1);
        this.time.delayedCall(2000, () => {
            this.turnResultText.setAlpha(0);
            this.isResolving = false;
            this.buttonsA.forEach(btn => btn.setStyle({ backgroundColor: '#333' }));
            this.updateStatusBadge();
            this.checkVictory();
        });
    }

    // ── UI Update ─────────────────────────────────────────────────────

    private updateUI() {
        this.hpTextA.setText(`❤ HP: ${this.playerA.hp} / ${this.playerA.maxHp}`);
        this.mpTextA.setText(`💰 MP: ${this.playerA.missionPoints}`);
        this.missionTextA.setText(`📋 Missão: ${this.missionA.getCurrentStageName()}  ${this.missionA.progress}/${this.missionA.maxProgress}`);

        this.hpTextB.setText(`❤ HP: ${this.playerB.hp} / ${this.playerB.maxHp}`);
        this.mpTextB.setText(`💰 MP: ${this.playerB.missionPoints}`);
        this.missionTextB.setText(`📋 Missão: ${this.missionB.getCurrentStageName()}  ${this.missionB.progress}/${this.missionB.maxProgress}`);

        this.updateStatusBadge();
        this.updateInventoryBadge();
        this.updateButtonTexts();
    }

    private updateButtonTexts() {
        const planBtn = this.buttonsA[2];
        if (planBtn) {
            const chance = planFailureChance(this.playerA.consecutivePlans);
            const percent = Math.floor(chance * 100);
            planBtn.setText(`📋 Plan (${percent}%)`);
            planBtn.setStyle({ color: percent > 0 ? '#ff6666' : '#ffffff' });
        }
    }

    private updateStatusBadge() {
        const fx = this.playerA.activeEffects;
        const parts: string[] = [];
        if (fx.heal > 0) parts.push(`🩺+${fx.heal}`);
        if (fx.weaponBoost) parts.push('💥x3');
        if (fx.sabotagePlan) parts.push('🕊💣All');
        if (fx.sabotagePlanII) parts.push('🕊-2');
        this.statusTextA.setText(parts.length ? 'Ativos: ' + parts.join(' ') : '');
    }

    private updateInventoryBadge() {
        if (this.playerA.permanentItems.length === 0) { this.inventoryTextA.setText(''); return; }
        const icons = this.playerA.permanentItems.map(id =>
            id === 'SHIELD_1' ? '🛡⚡' : id === 'SHIELD_2' ? '🛡-1' : id === 'WEAPON_1' ? '🌀+1' : id
        );
        this.inventoryTextA.setText('🎒 ' + icons.join(' '));
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
