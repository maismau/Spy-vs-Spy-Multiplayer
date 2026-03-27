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
    consecutivePlans: number;       // consecutive Planning actions (for failure mechanic)
    actionSelected: ActionType | null;
    activeEffects: PlayerEffects;   // queued for this turn
    // New fields
    shieldActiveTurns: number;      // > 0 means shield persists (decrements each turn)
    lastHeal1Turn: number;          // turn number of last HEAL_1 use (-99 = never)
    currentTurn: number;            // monotonically increasing turn counter
    consecutiveMissions: number;    // how many consecutive Plans used (for mission overlay stack)
}

export function planFailureChance(consecutivePlans: number): number {
    return Math.min(consecutivePlans * 0.25, 0.75); // cap at 75%
}

export interface TurnResult {
    planAFailed: boolean;
    planBFailed: boolean;
    /** Whether A was actually attacked (for shield persist logic) */
    aWasHit: boolean;
    bWasHit: boolean;
}

export function createPlayer(id: string): PlayerState {
    return {
        id,
        hp: 5,
        maxHp: 6,
        missionProgress: 0,
        missionPoints: 0,
        permanentItems: [],
        consecutivePlans: 0,
        actionSelected: null,
        activeEffects: emptyEffects(),
        shieldActiveTurns: 0,
        lastHeal1Turn: -99,
        currentTurn: 0,
        consecutiveMissions: 0,
    };
}

export class ActionSystem {
    static resolveTurn(
        playerA: PlayerState,
        playerB: PlayerState,
        missionA: { progress: number; maxProgress: number },
        missionB: { progress: number; maxProgress: number },
        planAFailedOverride?: boolean,
        planBFailedOverride?: boolean
    ): TurnResult {
        const actionA = playerA.actionSelected;
        const actionB = playerB.actionSelected;
        if (!actionA || !actionB) return { planAFailed: false, planBFailed: false, aWasHit: false, bWasHit: false };

        // ── Increment turn counter ───────────────────────────────────
        playerA.currentTurn += 1;
        playerB.currentTurn += 1;

        // ── 0. Roll for Plan failure ─────────────────────────────────
        const planAFailed = planAFailedOverride ?? (actionA === ActionType.Planning &&
            Math.random() < planFailureChance(playerA.consecutivePlans));
        const planBFailed = planBFailedOverride ?? (actionB === ActionType.Planning &&
            Math.random() < planFailureChance(playerB.consecutivePlans));

        // ── 1. Inject permanent item effects based on chosen action ──
        injectPermanentEffects(
            { permanentItems: playerA.permanentItems, activeEffects: playerA.activeEffects },
            actionA
        );
        injectPermanentEffects(
            { permanentItems: playerB.permanentItems, activeEffects: playerB.activeEffects },
            actionB
        );

        // ── 1b. Apply persisted shield (if active from last turn) ────
        if (playerA.shieldActiveTurns > 0 && actionA !== ActionType.Defense) {
            // Shield carried over but player chose different action — still active for this turn only
            playerA.activeEffects.shieldCarryover = true;
        }
        if (playerB.shieldActiveTurns > 0 && actionB !== ActionType.Defense) {
            playerB.activeEffects.shieldCarryover = true;
        }

        // ── 2. Apply HEAL ────────────────────────────────────────────
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
            if (playerA.activeEffects.weaponBoost) dmgToB += 2;
            if (playerB.activeEffects.weaponBoost) dmgToA += 2;
            if (playerA.activeEffects.weaponRecoil) { dmgToB += 1; dmgToA += 1; }
            if (playerB.activeEffects.weaponRecoil) { dmgToA += 1; dmgToB += 1; }
        } else if (actionA === ActionType.Attack && actionB === ActionType.Defense) {
            dmgToA = 1;
        } else if (actionA === ActionType.Attack) {
            dmgToB = 1;
            if (playerA.activeEffects.weaponBoost) dmgToB += 2;
            if (playerA.activeEffects.weaponRecoil) { dmgToB += 1; dmgToA += 1; }
        } else if (actionB === ActionType.Attack && actionA === ActionType.Defense) {
            dmgToB = 1;
        } else if (actionB === ActionType.Attack) {
            dmgToA = 1;
            if (playerB.activeEffects.weaponBoost) dmgToA += 2;
            if (playerB.activeEffects.weaponRecoil) { dmgToA += 1; dmgToB += 1; }
        }

        // ── 5. SHIELD REDUCE (perm: always) ─────────────────────────
        if (playerA.activeEffects.shieldReduce && actionB === ActionType.Attack) {
            dmgToA = Math.min(dmgToA, 1);
        }
        if (playerB.activeEffects.shieldReduce && actionA === ActionType.Attack) {
            dmgToB = Math.min(dmgToB, 1);
        }

        // ── 6. SHIELD RETALIATE (perm: on defense) ───────────────────
        if (playerA.activeEffects.shieldRetaliate && actionB === ActionType.Attack) dmgToB += 1;
        if (playerB.activeEffects.shieldRetaliate && actionA === ActionType.Attack) dmgToA += 1;

        // ── 6b. Persisted shield carryover blocks damage ─────────────
        // If a player had shieldCarryover and is attacked, negate damage
        if (playerA.activeEffects.shieldCarryover && actionB === ActionType.Attack) {
            dmgToA = 0;
        }
        if (playerB.activeEffects.shieldCarryover && actionA === ActionType.Attack) {
            dmgToB = 0;
        }

        // ── 7. Apply final damage ────────────────────────────────────
        const aWasHit = dmgToA > 0;
        const bWasHit = dmgToB > 0;
        playerA.hp -= dmgToA;
        playerB.hp -= dmgToB;

        // ── 8. Mission Progress ──────────────────────────────────────
        if (actionA === ActionType.Planning && !planAFailed) {
            playerA.missionProgress += 1;
            playerA.missionPoints += 1;
            missionA.progress += 1;
            playerA.consecutivePlans += 1;
            playerA.consecutiveMissions += 1;
        } else {
            playerA.consecutivePlans = 0;
        }
        // Reset mission overlay on attack or defense
        if (actionA === ActionType.Attack || actionA === ActionType.Defense) {
            playerA.consecutiveMissions = 0;
        }

        if (actionB === ActionType.Planning && !planBFailed) {
            playerB.missionProgress += 1;
            playerB.missionPoints += 1;
            missionB.progress += 1;
            playerB.consecutivePlans += 1;
            playerB.consecutiveMissions += 1;
        } else {
            playerB.consecutivePlans = 0;
        }
        if (actionB === ActionType.Attack || actionB === ActionType.Defense) {
            playerB.consecutiveMissions = 0;
        }

        // ── 9. Shield Persist Logic ──────────────────────────────────
        // If player chose Defense AND was NOT hit → shield persists 1 more turn
        if (actionA === ActionType.Defense && !aWasHit) {
            playerA.shieldActiveTurns = 1;
        } else {
            // Was hit, or chose non-defense → consume/reset shield
            playerA.shieldActiveTurns = Math.max(0, playerA.shieldActiveTurns - 1);
        }
        if (actionB === ActionType.Defense && !bWasHit) {
            playerB.shieldActiveTurns = 1;
        } else {
            playerB.shieldActiveTurns = Math.max(0, playerB.shieldActiveTurns - 1);
        }

        // ── 10. Consume single-use effects ───────────────────────────
        playerA.actionSelected = null;
        playerB.actionSelected = null;
        playerA.activeEffects = emptyEffects();
        playerB.activeEffects = emptyEffects();

        return { planAFailed, planBFailed, aWasHit, bWasHit };
    }
}
