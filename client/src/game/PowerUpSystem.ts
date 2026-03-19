// ============================================================
// PowerUpSystem.ts — Spy vs Spy Power-Up Shop
// ============================================================

export const EffectType = {
    HEAL: 'HEAL',
    SHIELD_RETALIATE: 'SHIELD_RETALIATE',   // Attacker takes extra 1 dmg
    SHIELD_REDUCE: 'SHIELD_REDUCE',          // Incoming damage reduced by 2
    WEAPON_RECOIL: 'WEAPON_RECOIL',          // +1 dmg dealt, but take 1 recoil
    WEAPON_BOOST: 'WEAPON_BOOST',            // Next attack does +2 dmg
    SABOTAGE_PLAN: 'SABOTAGE_PLAN',          // Destroys all enemy mission points
} as const;

export type EffectType = typeof EffectType[keyof typeof EffectType];

// Active effects queued for end-of-turn resolution
export interface PlayerEffects {
    heal: number;
    shieldRetaliate: boolean;
    shieldReduce: boolean;
    weaponRecoil: boolean;
    weaponBoost: boolean;
    sabotagePlan: boolean;
}

export function emptyEffects(): PlayerEffects {
    return {
        heal: 0,
        shieldRetaliate: false,
        shieldReduce: false,
        weaponRecoil: false,
        weaponBoost: false,
        sabotagePlan: false,
    };
}

export interface PowerUpItem {
    id: string;
    effectType: EffectType;
    cost: number;
    value: number;          // numeric power (heal amount, damage boost, etc.)
    displayNames: string[]; // random pick of spy-flavoured names
    description: string;
}

export const SHOP_CATALOG: PowerUpItem[] = [
    {
        id: 'HEAL_1',
        effectType: EffectType.HEAL,
        cost: 1,
        value: 2,
        displayNames: ['Limpeza de Feridas', 'Boo-Boo Kit', 'Curativo Improvisado', 'Esparadrapo Top Secret'],
        description: 'Restaura 2 HP',
    },
    {
        id: 'HEAL_2',
        effectType: EffectType.HEAL,
        cost: 3,
        value: 4,
        displayNames: ['Soro de Emergência', "Dr. Boom's Juice", 'Vacina Explosiva', 'Elixir Censurado'],
        description: 'Restaura 4 HP',
    },
    {
        id: 'SHIELD_1',
        effectType: EffectType.SHIELD_RETALIATE,
        cost: 2,
        value: 1,
        displayNames: ['Chapéu de Lata', 'The Tin Tomato', 'Capacete Clandestino', 'Frigideira Tática'],
        description: 'Atacante recebe +1 de dano ao te atacar',
    },
    {
        id: 'SHIELD_2',
        effectType: EffectType.SHIELD_REDUCE,
        cost: 2,
        value: 2,
        displayNames: ['Espelho de Aço', 'Paranoia Plate', 'Colete de Terceira Mão', 'Armadura de Alumínio'],
        description: 'Dano recebido reduzido em 2 neste turno',
    },
    {
        id: 'WEAPON_1',
        effectType: EffectType.WEAPON_RECOIL,
        cost: 2,
        value: 2,
        displayNames: ['Mola Surpresa', 'Spring-O-Matic', 'Chicote Elástico', 'Espiral da Discórdia'],
        description: 'Ataque faz 2 de dano, mas você toma 1 de recuo',
    },
    {
        id: 'WEAPON_2',
        effectType: EffectType.WEAPON_BOOST,
        cost: 3,
        value: 2,
        displayNames: ['Canhão Bolso', 'Pocket Cannon', 'Miniatura Letal', 'Projétil Surpreso'],
        description: 'Próximo ataque faz 3 de dano',
    },
    {
        id: 'WEAPON_3',
        effectType: EffectType.SABOTAGE_PLAN,
        cost: 3,
        value: 0,
        displayNames: ['Pomba-Sabotadora', 'Plan Shredder', 'Pombinha do Caos', 'Trituradora de Planos'],
        description: 'Destrói todos os pontos de missão do inimigo',
    },
];

export function randomDisplayName(item: PowerUpItem): string {
    const names = item.displayNames;
    return names[Math.floor(Math.random() * names.length)];
}

export function applyPowerUp(
    effects: PlayerEffects,
    item: PowerUpItem
): void {
    switch (item.effectType) {
        case EffectType.HEAL:
            effects.heal += item.value;
            break;
        case EffectType.SHIELD_RETALIATE:
            effects.shieldRetaliate = true;
            break;
        case EffectType.SHIELD_REDUCE:
            effects.shieldReduce = true;
            break;
        case EffectType.WEAPON_RECOIL:
            effects.weaponRecoil = true;
            break;
        case EffectType.WEAPON_BOOST:
            effects.weaponBoost = true;
            break;
        case EffectType.SABOTAGE_PLAN:
            effects.sabotagePlan = true;
            break;
    }
}
