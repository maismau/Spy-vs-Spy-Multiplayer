import { type PlayerEffects, emptyEffects } from './PowerUpSystem';

export const ActionType = {
    Attack: 'ATTACK',
    Defense: 'DEFENSE',
    Upgrade: 'UPGRADE',
    Planning: 'PLANNING',
    Execute: 'EXECUTE'
} as const;

export type ActionType = typeof ActionType[keyof typeof ActionType];

export interface PlayerState {
    id: string;
    hp: number;
    maxHp: number;
    missionProgress: number;
    missionPoints: number;      // spendable currency
    actionSelected: ActionType | null;
    activeEffects: PlayerEffects;
}

export function createPlayer(id: string): PlayerState {
    return {
        id,
        hp: 5,
        maxHp: 10,
        missionProgress: 0,
        missionPoints: 0,
        actionSelected: null,
        activeEffects: emptyEffects(),
    };
}

export class ActionSystem {
    static resolveTurn(playerA: PlayerState, playerB: PlayerState) {
        const actionA = playerA.actionSelected;
        const actionB = playerB.actionSelected;

        if (!actionA || !actionB) return;

        // ── 1. Apply HEAL effects ───────────────────────────────────
        playerA.hp = Math.min(playerA.maxHp, playerA.hp + playerA.activeEffects.heal);
        playerB.hp = Math.min(playerB.maxHp, playerB.hp + playerB.activeEffects.heal);

        // ── 2. Compute base damage ──────────────────────────────────
        let dmgToA = 0;
        let dmgToB = 0;

        if (actionA === ActionType.Attack && actionB === ActionType.Attack) {
            dmgToA = 2;
            dmgToB = 2;
        } else if (actionA === ActionType.Attack && actionB === ActionType.Defense) {
            dmgToA = 1; // Penalty for attacking into a defense
        } else if (actionA === ActionType.Attack) {
            dmgToB = 1;
            if (playerA.activeEffects.weaponBoost) dmgToB += 2;
            if (playerA.activeEffects.weaponRecoil) { dmgToB += 1; dmgToA += 1; }
        } else if (actionB === ActionType.Attack && actionA === ActionType.Defense) {
            dmgToB = 1; // Penalty for attacking into a defense
        } else if (actionB === ActionType.Attack) {
            dmgToA = 1;
            if (playerB.activeEffects.weaponBoost) dmgToA += 2;
            if (playerB.activeEffects.weaponRecoil) { dmgToA += 1; dmgToB += 1; }
        }

        // ── 3. Apply SHIELD effects ─────────────────────────────────
        // Shield Reduce: reduce incoming damage
        if (playerA.activeEffects.shieldReduce) dmgToA = Math.max(0, dmgToA - 2);
        if (playerB.activeEffects.shieldReduce) dmgToB = Math.max(0, dmgToB - 2);

        // Shield Retaliate: attacker takes +1 if they attacked us
        if (playerA.activeEffects.shieldRetaliate && actionB === ActionType.Attack) dmgToB += 1;
        if (playerB.activeEffects.shieldRetaliate && actionA === ActionType.Attack) dmgToA += 1;

        // ── 4. Apply SABOTAGE ───────────────────────────────────────
        if (playerA.activeEffects.sabotagePlan) { playerB.missionPoints = 0; playerB.missionProgress = 0; }
        if (playerB.activeEffects.sabotagePlan) { playerA.missionPoints = 0; playerA.missionProgress = 0; }

        // ── 5. Apply damage ─────────────────────────────────────────
        playerA.hp -= dmgToA;
        playerB.hp -= dmgToB;

        // ── 6. Mission Progress (Planning grants 1 point) ───────────
        if (actionA === ActionType.Planning) {
            playerA.missionProgress += 1;
            playerA.missionPoints += 1;
        }
        if (actionB === ActionType.Planning) {
            playerB.missionProgress += 1;
            playerB.missionPoints += 1;
        }

        // ── 7. Reset ────────────────────────────────────────────────
        playerA.actionSelected = null;
        playerB.actionSelected = null;
        playerA.activeEffects = emptyEffects();
        playerB.activeEffects = emptyEffects();
    }
}
