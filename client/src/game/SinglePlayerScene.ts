import Phaser from 'phaser';
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

export class SinglePlayerScene extends Phaser.Scene {
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

    private isResolving = false;
    private buttonsA: Phaser.GameObjects.Text[] = [];

    private shopOpen = false;
    private shopPanel: Phaser.GameObjects.Text[] = [];
    private shopToggleBtn!: Phaser.GameObjects.Text;

    private camAObjects: Phaser.GameObjects.GameObject[] = [];
    private camBObjects: Phaser.GameObjects.GameObject[] = [];

    constructor() { super('SinglePlayerScene'); }

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
        this.addA(this.add.text(200, 565, '⚔ Your Turn', { fontSize: '15px', color: '#00ff00' }).setOrigin(0.5));

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
            .on('pointerdown', () => this.scene.start('MainMenuScene')));
    }

    private buildPlayerBUI() {
        this.hpTextB = this.addB(this.add.text(1020, 20, '', { fontSize: '20px', color: '#fff', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.mpTextB = this.addB(this.add.text(1020, 50, '', { fontSize: '16px', color: '#ffe066', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.missionTextB = this.addB(this.add.text(1020, 76, '', { fontSize: '14px', color: '#bbb', backgroundColor: '#00000088', padding: { x: 5, y: 3 } }));
        this.addB(this.add.text(1020, 106, '🤖 PC', { fontSize: '13px', color: '#aaa' }));
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
                .on('pointerdown', () => this.handlePlayerAction(act))
                .on('pointerover', () => { if (!this.isResolving) btn.setStyle({ backgroundColor: '#555' }); })
                .on('pointerout', () => { if (!this.isResolving) btn.setStyle({ backgroundColor: '#333' }); });
            this.buttonsA.push(btn);
            this.camAObjects.push(btn);
        }
    }

    private buildShopPanel() {
        this.shopToggleBtn = this.addA(
            this.add.text(295, 445, '🛒 Shop', {
                backgroundColor: '#225522', padding: { x: 8, y: 4 }, fontSize: '14px', color: '#aaffaa'
            }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toggleShop())
        );

        let col = 0, row = 0;
        for (const item of SHOP_CATALOG) {
            const x = 20 + col * 190;
            const y = 130 + row * 75;
            const isPerm = item.duration === 'PERMANENT';
            const tag = isPerm ? '🔁' : '✨';
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
            const alreadyOwned = item.duration === 'PERMANENT' && this.playerA.permanentItems.includes(item.id);
            const canAfford = this.playerA.missionPoints >= item.cost;
            btn.setStyle({ color: (!canAfford || alreadyOwned) ? '#666' : '#fff' });
            btn.setInteractive(canAfford && !alreadyOwned ? { useHandCursor: true } : {});
        }
    }

    private buyPowerUp(item: PowerUpItem) {
        if (this.isResolving) return;
        if (this.playerA.missionPoints < item.cost) { this.showFeedback('❌ MP insuficiente', '#ff4444'); return; }
        const alreadyOwned = item.duration === 'PERMANENT' && this.playerA.permanentItems.includes(item.id);
        if (alreadyOwned) { this.showFeedback('⚠ Já possui este item', '#ffaa00'); return; }

        this.playerA.missionPoints -= item.cost;

        if (item.duration === 'PERMANENT') {
            this.playerA.permanentItems.push(item.id);
        } else {
            applyPowerUp(this.playerA.activeEffects, item);
        }

        this.showFeedback(`✅ ${randomDisplayName(item)}!`, '#aaffaa');
        this.updateUI();
        this.refreshShopState();
    }

    private showFeedback(msg: string, color: string) {
        this.shopFeedbackText.setText(msg).setColor(color).setAlpha(1);
        this.time.delayedCall(1800, () => this.shopFeedbackText.setAlpha(0));
    }

    // ── AI Shopping ──────────────────────────────────────────────────

    private aiShop() {
        const affordable = SHOP_CATALOG.filter(i =>
            this.playerB.missionPoints >= i.cost &&
            !(i.duration === 'PERMANENT' && this.playerB.permanentItems.includes(i.id))
        );
        if (affordable.length === 0 || Math.random() < 0.45) return;
        const choice = affordable[Math.floor(Math.random() * affordable.length)];
        this.playerB.missionPoints -= choice.cost;
        if (choice.duration === 'PERMANENT') {
            this.playerB.permanentItems.push(choice.id);
        } else {
            applyPowerUp(this.playerB.activeEffects, choice);
        }
        console.log(`[AI] bought: ${choice.id}`);
    }

    // ── Turn Flow ────────────────────────────────────────────────────

    private handlePlayerAction(action: ActionType) {
        if (this.isResolving) return;
        if (this.shopOpen) this.toggleShop();
        this.playerA.actionSelected = action;
        this.highlightAction(action);
        const actions = [ActionType.Attack, ActionType.Defense, ActionType.Planning];
        this.playerB.actionSelected = actions[Math.floor(Math.random() * actions.length)];
        this.aiShop();
        this.isResolving = true;
        this.time.delayedCall(600, () => this.resolveTurn());
    }

    private highlightAction(action: ActionType) {
        this.buttonsA.forEach(btn => {
            const label = btn.text;
            const active = label.includes(action === ActionType.Attack ? 'Attack' :
                action === ActionType.Defense ? 'Defense' : 'Plan');
            btn.setStyle({ backgroundColor: active ? '#aa8800' : '#222' });
        });
    }

    private resolveTurn() {
        const actionA = this.playerA.actionSelected;
        const actionB = this.playerB.actionSelected;

        const result = ActionSystem.resolveTurn(this.playerA, this.playerB, this.missionA, this.missionB);
        this.updateUI();

        let msg = `⚔ ${actionA}  vs  🤖 ${actionB}`;
        if (result.planAFailed) msg = `❌ PLANO FALHOU!\n${msg}`;
        if (result.planBFailed) msg += `\n🤖 PLANO FALHOU!`;

        this.turnResultText.setText(msg).setAlpha(1);
        this.time.delayedCall(2000, () => {
            this.turnResultText.setAlpha(0);
            this.isResolving = false;
            this.buttonsA.forEach(btn => btn.setStyle({ backgroundColor: '#333' }));
            this.updateStatusBadge();
            this.checkVictory();
        });
    }

    // ── UI Update ────────────────────────────────────────────────────

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
        const planBtn = this.buttonsA[2]; // Plan is at index 2
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
        if (this.playerA.permanentItems.length === 0) {
            this.inventoryTextA.setText('');
            return;
        }
        const icons: string[] = this.playerA.permanentItems.map(id => {
            if (id === 'SHIELD_1') return '🛡⚡';
            if (id === 'SHIELD_2') return '🛡-1';
            if (id === 'WEAPON_1') return '🌀+1';
            return id;
        });
        this.inventoryTextA.setText('🎒 ' + icons.join(' '));
    }

    private checkVictory() {
        if (this.playerA.hp <= 0 || this.missionB.isComplete()) {
            alert('💀 GAME OVER — O PC Venceu!');
            this.scene.start('MainMenuScene');
        } else if (this.playerB.hp <= 0 || this.missionA.isComplete()) {
            alert('🏆 VITÓRIA — Você Ganhou!');
            this.scene.start('MainMenuScene');
        }
    }

    update() {}
}
