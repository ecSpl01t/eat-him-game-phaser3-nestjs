import 'phaser';
import GameScene from './game';

const config: any = {
    type: Phaser.AUTO,
    parent: 'content',
    physics: {
        default: 'arcade'
    },
    width: 770,
    height: 600,
    backgroundColor: "#3498db",
    scene: [
        GameScene
    ]
};

new Phaser.Game(config);
