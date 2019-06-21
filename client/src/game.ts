import GameSocket from './game.socket';
import {Player} from '../../server/src/modules/game_2/player';

class GameScene extends Phaser.Scene {
    animation: Phaser.Tweens.Tween;

    player: Phaser.Physics.Arcade.Sprite;
    players: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
    playersGroup: Phaser.GameObjects.Group;

    coin: Phaser.Physics.Arcade.Sprite;

    scoreText: Phaser.GameObjects.Text;

    arrow: Phaser.Types.Input.Keyboard.CursorKeys;

    gameSocket: GameSocket = new GameSocket();
    gamePlayer: Player;

    crazy: {
        [key: string]: any,
        player: Phaser.Physics.Arcade.Sprite,
        animation: Phaser.Tweens.Tween
    } = {
        target: 5,
        player: null,
        time: 7000,
        animation: null,
        speed: 4
    };

    constructor() {
        super({
            key: 'GameScene'
        });
    }

    preload(): void {
        this.load.image('player', 'assets/player.png');
        this.load.image('coin', 'assets/coin.png');
    }

    create(): void {
        this.gameSocket.setAPI({
            addPlayer: this.addPlayer.bind(this),
            removePlayer: this.removePlayer.bind(this),
            reloadPlayer: this.reloadPlayer.bind(this),
            runCrazy: this.runCrazy.bind(this),
            setCoinPosition: this.setCoinPosition.bind(this),
            setTextScore: this.setTextScore.bind(this)
        });

        this.playersGroup = this.physics.add.group();

        this.gameSocket.getPlayers().forEach((player: Player, key: string) => this.addPlayer(key, player));
        this.gamePlayer = this.gameSocket.getPlayer();

        this.player = this.players.get(this.gamePlayer.id);
        this.player.setTint(0x00ffa5);
        this.player.setCollideWorldBounds();

        this.coin = this.physics.add.sprite(-20, -20, 'coin');
        this.gameSocket.updatePositionCoin();
        this.scoreText = this.add.text(20, 20, 'eaten: ' + this.gamePlayer.score.eaten, {
            font: '20px Arial',
            fill: '#fff'
        });

        this.arrow = this.input.keyboard.createCursorKeys();
    }

    update(timestep: number, delta: number): void {
        this.physics.overlap(this.player, this.coin, this.eatCoin.bind(this));
        this.physics.overlap(this.playersGroup, this.coin, this.groupEatCoin.bind(this));
        this.physics.overlap(this.player, this.playersGroup, this.eatHim.bind(this));

        this.onMoving();

        this.gameSocket.updatePositionPlayer(this.player.x, this.player.y);
    }

    onMoving() {
        let step: number = (this.crazy.player) ? this.crazy.speed : 3;

        if (this.arrow.right.isDown) {
            this.player.x += step;
        } else if (this.arrow.left.isDown) {
            this.player.x -= step;
        }

        if (this.arrow.down.isDown) {
            this.player.y += step;
        } else if (this.arrow.up.isDown) {
            this.player.y -= step;
        }
    }

    addPlayer(id: string, gamePlayer: Player): void {
        let sprite: Phaser.Physics.Arcade.Sprite = this.physics.add.sprite(gamePlayer.x, gamePlayer.y, 'player');

        sprite.setData('player', gamePlayer);
        sprite.setDataEnabled();
        sprite.setCollideWorldBounds();
        this.playersGroup.add(sprite);
        this.players.set(id, sprite);
    }

    removePlayer(id: string): void {
        let player: Phaser.Physics.Arcade.Sprite = this.players.get(id);
        player.destroy();
        this.players.delete(id);
    }

    reloadPlayer(id: string, gamePlayer: Player) {
        let player: Phaser.Physics.Arcade.Sprite = this.players.get(id);
        player.x = gamePlayer.x;
        player.y = gamePlayer.y;
    }

    setCoinPosition(x, y): void {
        this.coin.x = x;
        this.coin.y = y;
        if (!this.crazy.player) {
            this.coin.setVisible(true);
            this.coin.setActive(true);
        }
    }

    runCrazy(id: string) {
        this.crazyMode(this.players.get(id));
    }

    crazyMode(sprite: Phaser.Physics.Arcade.Sprite) {
        let gamePlayer: Player = sprite.getData('player');

        this.coin.setVisible(false);
        this.coin.setActive(true);
        this.crazy.player = sprite;

        this.crazy.animation = this.tweens.add({
            targets: this.crazy.player,
            duration: 200,
            scaleX: 1.5,
            scaleY: 1.5,
            repeat: -1,
            yoyo: true,
        });

        this.crazy.player.setTint(0xf4427d);

        this.time.addEvent({
            delay: this.crazy.time,
            callback: () => {
                if (this.crazy.player) {
                    this.crazy.player.setTint((this.gamePlayer.id === gamePlayer.id) ? 0x00ffa5 : 0xffffff);
                    this.crazy.player.setScale(1, 1);
                    this.crazy.player = null;
                }
                this.crazy.animation.remove();
                this.coin.setVisible(true);
            },
        });
    }

    setTextScore(player: Player): void {
        if(this.gamePlayer.id === player.id){
            this.scoreText.text = 'eaten: '+ this.gamePlayer.score.eaten;
        }
    }

    groupEatCoin() {
        this.coin.setVisible(false);
    }

    eatCoin(somePlayer: Phaser.Physics.Arcade.Sprite) {
        if (this.coin.active) {
            this.coin.setActive(false);
            this.coin.setVisible(false);
            this.gameSocket.updateScore(somePlayer.getData('player'), 'coin');

            this.animation = this.tweens.add({
                targets: somePlayer,
                duration: 200,
                scaleX: 1.2,
                scaleY: 1.2,
                yoyo: true,
            });
        }
    }

    eatHim(player1: Phaser.Physics.Arcade.Sprite, player2: Phaser.Physics.Arcade.Sprite) {
        if (this.crazy.player) {
            let gamePlayerWon: Player = this.crazy.player.getData('player');
            let playerLose: Phaser.Physics.Arcade.Sprite = gamePlayerWon.id !== player1.getData('player').id ? player1 : player2;

            if (playerLose.active) {
                this.gameSocket.updateScore(this.crazy.player.getData('player'), 'eaten');

                playerLose.setActive(false);
                playerLose.setTint(0x000000);

                this.tweens.add({
                    targets: playerLose,
                    duration: 600,
                    scaleX: 0,
                    scaleY: 0,
                });

                this.time.addEvent({
                    delay: 600,
                    callback: () => {
                        playerLose.setVisible(false);
                        this.players.delete(playerLose.getData('player').id);
                        playerLose.destroy();

                    },
                });
            }
        }
    }
}

export default GameScene;
