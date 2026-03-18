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
    missionProgress: number;
    actionSelected: ActionType | null;
}

export class ActionSystem {
    static resolveTurn(playerA: PlayerState, playerB: PlayerState) {
        const actionA = playerA.actionSelected;
        const actionB = playerB.actionSelected;

        if (!actionA || !actionB) return;

        // Simple Matrix Implementation (MVP)
        if (actionA === ActionType.Attack && actionB === ActionType.Attack) {
            playerA.hp -= 2;
            playerB.hp -= 2;
        } else if (actionA === ActionType.Attack && actionB === ActionType.Defense) {
            // Blocked
        } else if (actionA === ActionType.Attack) {
            playerB.hp -= 1;
        } else if (actionB === ActionType.Attack && actionA === ActionType.Defense) {
            // Blocked
        } else if (actionB === ActionType.Attack) {
            playerA.hp -= 1;
        }

        // Mission Progress Logic
        if (actionA === ActionType.Planning) playerA.missionProgress += 1;
        if (actionB === ActionType.Planning) playerB.missionProgress += 1;

        // Reset actions
        playerA.actionSelected = null;
        playerB.actionSelected = null;
    }
}
