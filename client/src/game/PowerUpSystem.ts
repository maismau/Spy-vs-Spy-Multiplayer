// ============================================================
// PowerUpSystem.ts — Spy vs Spy Power-Up Shop (v2)
// ============================================================

/** How long a power-up lasts */
export type ItemDuration = 'SINGLE_USE' | 'PERMANENT';

/** When a permanent item triggers */
export type TriggerCondition = 'ON_ATTACK' | 'ON_DEFENSE' | 'ALWAYS' | 'ON_PURCHASE';

export const EffectType = {
    HEAL: 'HEAL',                        // +N HP immediately on purchase
    SHIELD_RETALIATE: 'SHIELD_RETALIATE',// Perm: attacker takes +1 when you defend
    SHIELD_REDUCE: 'SHIELD_REDUCE',      // Perm: always reduces incoming weapon dmg to base 1
    WEAPON_RECOIL: 'WEAPON_RECOIL',      // Perm optional: +1 dmg, take 1 recoil (applies on attack)
    WEAPON_BOOST: 'WEAPON_BOOST',        // Single-use: next attack deals 3 dmg
    SABOTAGE_PLAN: 'SABOTAGE_PLAN',      // Single-use: destroy ALL enemy MP + missionProgress
    SABOTAGE_PLAN_II: 'SABOTAGE_PLAN_II',// Single-use: reduce enemy mission win progress by 2
} as const;

export type EffectType = typeof EffectType[keyof typeof EffectType];

/** Queued single-turn effects waiting to be resolved */
export interface PlayerEffects {
    heal: number;
    shieldRetaliate: boolean;   // from permanent item — injected each turn when defending
    shieldReduce: boolean;      // from permanent item — always injected
    weaponRecoil: boolean;      // from permanent item — injected each turn when attacking
    weaponBoost: boolean;       // single-use queued
    sabotagePlan: boolean;      // single-use queued (destroy all)
    sabotagePlanII: boolean;    // single-use queued (−2 win progress)
}

export function emptyEffects(): PlayerEffects {
    return {
        heal: 0,
        shieldRetaliate: false,
        shieldReduce: false,
        weaponRecoil: false,
        weaponBoost: false,
        sabotagePlan: false,
        sabotagePlanII: false,
    };
}

export interface PowerUpItem {
    id: string;
    effectType: EffectType;
    duration: ItemDuration;
    trigger: TriggerCondition;
    cost: number;
    value: number;
    displayNames: string[];
    description: string;
}

export const SHOP_CATALOG: PowerUpItem[] = [
    // ── HEAL ────────────────────────────────────────────────────────
    {
        id: 'HEAL_1',
        effectType: EffectType.HEAL,
        duration: 'SINGLE_USE',
        trigger: 'ON_PURCHASE',
        cost: 1,
        value: 2,
        displayNames: ['Limpeza de Feridas', 'Boo-Boo Kit', 'Curativo Top Secret', 'Esparadrapo de Campo'],
        description: 'Restaura 2 HP (uso único)',
    },
    {
        id: 'HEAL_2',
        effectType: EffectType.HEAL,
        duration: 'SINGLE_USE',
        trigger: 'ON_PURCHASE',
        cost: 3,
        value: 4,
        displayNames: ['Soro de Emergência', "Dr. Boom's Juice", 'Elixir Censurado', 'Vacina Explosiva'],
        description: 'Restaura 4 HP (uso único)',
    },

    // ── SHIELDS ─────────────────────────────────────────────────────
    {
        id: 'SHIELD_1',
        effectType: EffectType.SHIELD_RETALIATE,
        duration: 'PERMANENT',
        trigger: 'ON_DEFENSE',
        cost: 2,
        value: 1,
        displayNames: ['Chapéu de Lata', 'The Tin Tomato', 'Frigideira Tática', 'Capacete Clandestino'],
        description: '🔁 Perm: ao defender, atacante toma +1 dano',
    },
    {
        id: 'SHIELD_2',
        effectType: EffectType.SHIELD_REDUCE,
        duration: 'PERMANENT',
        trigger: 'ALWAYS',
        cost: 2,
        value: 0,
        displayNames: ['Espelho de Aço', 'Paranoia Plate', 'Armadura de Alumínio', 'Colete de Terceira Mão'],
        description: '🔁 Perm: armas inimigas causam dano base (1)',
    },

    // ── WEAPONS ─────────────────────────────────────────────────────
    {
        id: 'WEAPON_1',
        effectType: EffectType.WEAPON_RECOIL,
        duration: 'PERMANENT',
        trigger: 'ON_ATTACK',
        cost: 2,
        value: 0,
        displayNames: ['Mola Surpresa', 'Spring-O-Matic', 'Chicote Elástico', 'Espiral da Discórdia'],
        description: '🔁 Perm (opc): atacar faz 2 dano, mas toma 1 de recuo',
    },
    {
        id: 'WEAPON_2',
        effectType: EffectType.WEAPON_BOOST,
        duration: 'SINGLE_USE',
        trigger: 'ON_ATTACK',
        cost: 3,
        value: 0,
        displayNames: ['Canhão Bolso', 'Pocket Cannon', 'Miniatura Letal', 'Projétil Surpreso'],
        description: '✨ Único: próximo ataque faz 3 dano',
    },

    // ── SABOTAGE ────────────────────────────────────────────────────
    {
        id: 'WEAPON_3',
        effectType: EffectType.SABOTAGE_PLAN,
        duration: 'SINGLE_USE',
        trigger: 'ON_PURCHASE',
        cost: 3,
        value: 0,
        displayNames: ['Pomba-Sabotadora', 'Plan Shredder', 'Pombinha do Caos', 'Trituradora de Planos'],
        description: '✨ Único: destrói TODOS os pontos de missão do inimigo',
    },
    {
        id: 'SABOTAGE_2',
        effectType: EffectType.SABOTAGE_PLAN_II,
        duration: 'SINGLE_USE',
        trigger: 'ON_PURCHASE',
        cost: 2,
        value: 2,
        displayNames: ['Desvio de Rota', 'Blueprint Eraser', 'Sabotagem Cirúrgica', 'Estraga-Planos Lite'],
        description: '✨ Único: remove 2 do progresso de missão inimigo',
    },
];

export function randomDisplayName(item: PowerUpItem): string {
    const names = item.displayNames;
    return names[Math.floor(Math.random() * names.length)];
}

/** Queue a SINGLE_USE effect for end-of-turn resolution */
export function applyPowerUp(
    effects: PlayerEffects,
    item: PowerUpItem
): void {
    if (item.duration !== 'SINGLE_USE') return; // permanents go into inventory
    switch (item.effectType) {
        case EffectType.HEAL:
            effects.heal += item.value;
            break;
        case EffectType.WEAPON_BOOST:
            effects.weaponBoost = true;
            break;
        case EffectType.SABOTAGE_PLAN:
            effects.sabotagePlan = true;
            break;
        case EffectType.SABOTAGE_PLAN_II:
            effects.sabotagePlanII = true;
            break;
    }
}

/** Inject permanent item effects based on the chosen action */
export function injectPermanentEffects(
    player: { permanentItems: string[]; activeEffects: PlayerEffects },
    chosenAction: string
): void {
    for (const id of player.permanentItems) {
        const item = SHOP_CATALOG.find(i => i.id === id);
        if (!item) continue;
        switch (item.effectType) {
            case EffectType.SHIELD_RETALIATE:
                if (chosenAction === 'DEFENSE') player.activeEffects.shieldRetaliate = true;
                break;
            case EffectType.SHIELD_REDUCE:
                player.activeEffects.shieldReduce = true; // always
                break;
            case EffectType.WEAPON_RECOIL:
                if (chosenAction === 'ATTACK') player.activeEffects.weaponRecoil = true;
                break;
        }
    }
}
