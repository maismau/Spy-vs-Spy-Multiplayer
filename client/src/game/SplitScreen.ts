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

        // Player B viewport (Right)
        const camB = this.scene.cameras.add(this.width / 2, 0, this.width / 2, this.height);
        camB.setName('PlayerB');

        // Add a divider
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(4, 0x000000, 1);
        graphics.lineBetween(this.width / 2, 0, this.width / 2, this.height);
        graphics.setScrollFactor(0); // Divider stays in place
    }
}
