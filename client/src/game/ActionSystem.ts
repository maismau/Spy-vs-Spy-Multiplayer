import { type PlayerEffects, emptyEffects, injectPermanentEffects } from './PowerUpSystem';

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
    missionPoints: number;          // spendable MP currency
    permanentItems: string[];       // IDs of owned permanent power-ups
    actionSelected: ActionType | null;
    activeEffects: PlayerEffects;   // queued for this turn
}

export function createPlayer(id: string): PlayerState {
    return {
        id,
        hp: 5,
        maxHp: 10,
        missionProgress: 0,
        missionPoints: 0,
        permanentItems: [],
        actionSelected: null,
        activeEffects: emptyEffects(),
    };
}

export class ActionSystem {
    static resolveTurn(
        playerA: PlayerState,
        playerB: PlayerState,
        missionA: { progress: number; maxProgress: number },
        missionB: { progress: number; maxProgress: number }
    ) {
        const actionA = playerA.actionSelected;
        const actionB = playerB.actionSelected;
        if (!actionA || !actionB) return;

        // ── 1. Inject permanent item effects based on chosen action ──
        injectPermanentEffects(
            { permanentItems: playerA.permanentItems, activeEffects: playerA.activeEffects },
            actionA
        );
        injectPermanentEffects(
            { permanentItems: playerB.permanentItems, activeEffects: playerB.activeEffects },
            actionB
        );

        // ── 2. Apply HEAL (single-use, resolved immediately) ─────────
        playerA.hp = Math.min(playerA.maxHp, playerA.hp + playerA.activeEffects.heal);
        playerB.hp = Math.min(playerB.maxHp, playerB.hp + playerB.activeEffects.heal);

        // ── 3. Apply SABOTAGE effects ────────────────────────────────
        if (playerA.activeEffects.sabotagePlan) {
            playerB.missionPoints = 0;
            playerB.missionProgress = 0;
            missionB.progress = 0;
        }
        if (playerB.activeEffects.sabotagePlan) {
            playerA.missionPoints = 0;
            playerA.missionProgress = 0;
            missionA.progress = 0;
        }
        if (playerA.activeEffects.sabotagePlanII) {
            const reduction = Math.min(2, missionB.progress);
            missionB.progress -= reduction;
            playerB.missionProgress -= reduction;
        }
        if (playerB.activeEffects.sabotagePlanII) {
            const reduction = Math.min(2, missionA.progress);
            missionA.progress -= reduction;
            playerA.missionProgress -= reduction;
        }

        // ── 4. Compute base damage ───────────────────────────────────
        let dmgToA = 0;
        let dmgToB = 0;

        if (actionA === ActionType.Attack && actionB === ActionType.Attack) {
            dmgToA = 2;
            dmgToB = 2;
            // Weapon boosts split 50/50 on mutual attack
            if (playerA.activeEffects.weaponBoost) dmgToB += 2;
            if (playerB.activeEffects.weaponBoost) dmgToA += 2;
            // Weapon recoil
            if (playerA.activeEffects.weaponRecoil) { dmgToB += 1; dmgToA += 1; }
            if (playerB.activeEffects.weaponRecoil) { dmgToA += 1; dmgToB += 1; }
        } else if (actionA === ActionType.Attack && actionB === ActionType.Defense) {
            dmgToA = 1; // penalty for attacking into defense
        } else if (actionA === ActionType.Attack) {
            dmgToB = 1;
            if (playerA.activeEffects.weaponBoost) dmgToB += 2;
            if (playerA.activeEffects.weaponRecoil) { dmgToB += 1; dmgToA += 1; }
        } else if (actionB === ActionType.Attack && actionA === ActionType.Defense) {
            dmgToB = 1; // penalty for attacking into defense
        } else if (actionB === ActionType.Attack) {
            dmgToA = 1;
            if (playerB.activeEffects.weaponBoost) dmgToA += 2;
            if (playerB.activeEffects.weaponRecoil) { dmgToA += 1; dmgToB += 1; }
        }

        // ── 5. Apply SHIELD REDUCE (perm: always; cancels weapon upgrades → base 1) ─
        // SHIELD_REDUCE: incoming weapon damage is capped to base 1 (no boosts apply)
        if (playerA.activeEffects.shieldReduce && actionB === ActionType.Attack) {
            dmgToA = Math.min(dmgToA, 1);
        }
        if (playerB.activeEffects.shieldReduce && actionA === ActionType.Attack) {
            dmgToB = Math.min(dmgToB, 1);
        }

        // ── 6. Apply SHIELD RETALIATE (perm: on defense) ────────────
        if (playerA.activeEffects.shieldRetaliate && actionB === ActionType.Attack) dmgToB += 1;
        if (playerB.activeEffects.shieldRetaliate && actionA === ActionType.Attack) dmgToA += 1;

        // ── 7. Apply final damage ────────────────────────────────────
        playerA.hp -= dmgToA;
        playerB.hp -= dmgToB;

        // ── 8. Mission Progress (Planning grants 1 MP + 1 progress) ──
        if (actionA === ActionType.Planning) {
            playerA.missionProgress += 1;
            playerA.missionPoints += 1;
            missionA.progress += 1;
        }
        if (actionB === ActionType.Planning) {
            playerB.missionProgress += 1;
            playerB.missionPoints += 1;
            missionB.progress += 1;
        }

        // ── 9. Consume single-use effects; keep permanent slots ──────
        playerA.actionSelected = null;
        playerB.actionSelected = null;
        playerA.activeEffects = emptyEffects();
        playerB.activeEffects = emptyEffects();
    }
}
