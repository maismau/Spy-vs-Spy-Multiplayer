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
        // Player A viewport (Left)
        this.scene.cameras.main.setSize(this.width / 2, this.height);
        this.scene.cameras.main.setName('PlayerA');
        this.scene.cameras.main.setBackgroundColor('#1a1a1a'); // Dark background

        // Player B viewport (Right) - Remove existing if present to avoid accumulation on restart
        const existingCamB = this.scene.cameras.getCamera('PlayerB');
        if (existingCamB) {
            this.scene.cameras.remove(existingCamB);
        }

        const camB = this.scene.cameras.add(this.width / 2, 0, this.width / 2, this.height);
        camB.setName('PlayerB');
        camB.setScroll(1000, 0); // Offset Player B's view in the world
        camB.setBackgroundColor('#1a1a1a');

        // Add a divider
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(4, 0x000000, 1);
        graphics.lineBetween(this.width / 2, 0, this.width / 2, this.height);
        graphics.setScrollFactor(0); // Divider stays in place
        
        return { camA: this.scene.cameras.main, camB };
    }
}
