export class MissionSystem {
    public progress: number = 0;
    public maxProgress: number = 5;
    public stages: string[] = [
        'Blueprint',
        'Assembly',
        'Fueling',
        'Targeting',
        'Launch'
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

    isComplete() {
        return this.progress >= this.maxProgress;
    }
}
