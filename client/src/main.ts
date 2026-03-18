import Phaser from 'phaser';
import { MainMenuScene } from './game/MainMenuScene';
import { OnlineMultiplayerScene } from './game/OnlineMultiplayerScene';
import { SinglePlayerScene } from './game/SinglePlayerScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainMenuScene, SinglePlayerScene, OnlineMultiplayerScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    }
};

new Phaser.Game(config);
