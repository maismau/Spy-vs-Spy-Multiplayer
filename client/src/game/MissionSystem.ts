export class MissionSystem {
    public progress: number = 0;
    public maxProgress: number = 8;
    public stages: string[] = [
        'Pesquisa',       // 1
        'Blueprint',      // 2
        'Montagem',       // 3
        'Combustível',    // 4
        'Mira',           // 5
        'Armamento',      // 6
        'Lançamento',     // 7
        'Vitória',        // 8 (win)
    ];

    advance() {
        if (this.progress < this.maxProgress) {
            this.progress++;
            return true;
        }
        return false;
    }

    getCurrentStageName() {
        if (this.progress === 0) return 'Inativo';
        return this.stages[this.progress - 1] || 'Completo';
    }

    /** Returns 0 (none) through 8 (win). Used to pick server_lv_N sprite. */
    getServerLevel(): number {
        return Math.min(this.progress, this.maxProgress);
    }

    isComplete() {
        return this.progress >= this.maxProgress;
    }
}
