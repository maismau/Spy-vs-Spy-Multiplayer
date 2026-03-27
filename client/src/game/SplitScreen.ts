export class SplitScreen {
    private scene: Phaser.Scene;
    private width: number;
    private height: number;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        const { width, height } = scene.scale;
        this.width = width;
        this.height = height;
    }

    setup() {
        const halfW = this.width / 2;

        // Player A viewport (Left half of canvas) — views world starting at x=0
        this.scene.cameras.main.setSize(halfW, this.height);
        this.scene.cameras.main.setScroll(0, 0);
        this.scene.cameras.main.setName('PlayerA');
        this.scene.cameras.main.setBackgroundColor('#1a1a1a');

        // Player B viewport (Right half of canvas) — views world starting at x=width (1280)
        const existingCamB = this.scene.cameras.getCamera('PlayerB');
        if (existingCamB) {
            this.scene.cameras.remove(existingCamB);
        }

        const camB = this.scene.cameras.add(halfW, 0, halfW, this.height);
        camB.setName('PlayerB');
        camB.setScroll(this.width, 0); // Player B world starts at x=1280
        camB.setBackgroundColor('#1a1a1a');

        // Divider line
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(4, 0x000000, 1);
        graphics.lineBetween(halfW, 0, halfW, this.height);
        graphics.setScrollFactor(0);

        return { camA: this.scene.cameras.main, camB };
    }
}
