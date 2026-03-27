import { ActionType } from '../ActionSystem';
import { EffectType } from '../PowerUpSystem';

export interface VisualSituation {
    background: string;
    object: string;
    effect?: string;
    overlay?: string;
    description: string; // Internal narrativization
}

export class VisualEngine {
    // 🎨 Library of backgrounds
    private static BACKGROUNDS = [
        'lab_secret', 'control_room', 'spy_office', 
        'rooftop_night', 'underground_base'
    ];

    // 🎭 Asset Lists (Objects)
    private static ATTACK_OBJECTS = ['bomb', 'duck', 'cake', 'banana', 'laser'];
    private static DEFENSE_OBJECTS = ['shield_basic', 'mirror_shield', 'umbrella', 'trash_can', 'balloon'];
    private static PLANNING_OBJECTS = ['blueprint', 'magnifying_glass', 'encrypted_laptop', 'coffee_cup'];

    // 🔬 Mission Evolution (Stages 0-7)
    private static MISSION_OBJECTS = [
        'blueprint_draft',  // Stage 0
        'empty_tube',       // Stage 1
        'chemical_mix',     // Stage 2
        'sparking_reaction',// Stage 3
        'unstable_core',    // Stage 4
        'containment_shell',// Stage 5
        'critical_failure', // Stage 6
        'super_weapon',     // Stage 7 (Victory ready)
    ];

    /**
     * Maps a game action to a random visual situation.
     * Logic: 70% coherent, 30% absurd.
     */
    static getActionVisual(action: ActionType, playerProgress: number): VisualSituation {
        const bg = this.randomBackground();
        let obj = 'placeholder';
        let desc = '';

        const isAbsurd = Math.random() < 0.3;

        if (isAbsurd) {
            obj = this.randomItem(['rubber_chicken', 'toilet_paper', 'giant_magnet', 'potted_plant', 'anvil']);
            desc = 'A situação escalou para o absurdo total.';
        } else {
            switch (action) {
                case ActionType.Attack:
                    obj = this.randomItem(this.ATTACK_OBJECTS);
                    desc = `Atacando com um(a) ${obj}.`;
                    break;
                case ActionType.Defense:
                    obj = this.randomItem(this.DEFENSE_OBJECTS);
                    desc = `Defendendo usando ${obj}.`;
                    break;
                case ActionType.Planning:
                    obj = this.MISSION_OBJECTS[playerProgress] || this.randomItem(this.PLANNING_OBJECTS);
                    desc = `Trabalhando no estágio ${playerProgress}: ${obj}.`;
                    break;
            }
        }

        return {
            background: bg,
            object: obj,
            description: desc
        };
    }

    /**
     * Specialized visual for Power-Up purchases
     */
    static getPowerUpVisual(effect: EffectType): VisualSituation {
        let obj = 'shop_item';
        let effectIcon = 'glimmer';

        switch (effect) {
            case EffectType.HEAL: 
                obj = 'syringe_small'; 
                effectIcon = 'heal_sparkle';
                break;
            case EffectType.SHIELD_RETALIATE: 
            case EffectType.SHIELD_REDUCE:
                obj = 'shield_upgrade'; 
                effectIcon = 'shield_aura';
                break;
            case EffectType.WEAPON_RECOIL:
            case EffectType.WEAPON_BOOST:
                obj = 'weapon_part'; 
                effectIcon = 'power_surge';
                break;
            case EffectType.SABOTAGE_PLAN:
            case EffectType.SABOTAGE_PLAN_II:
                obj = 'virus_chip'; 
                effectIcon = 'glitch_smoke';
                break;
        }

        return {
            background: 'shop_corner',
            object: obj,
            effect: effectIcon,
            description: `Ativando upgrade: ${effect}.`
        };
    }

    private static randomBackground(): string {
        return this.randomItem(this.BACKGROUNDS);
    }

    private static randomItem<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
