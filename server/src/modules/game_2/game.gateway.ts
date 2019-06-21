import {WebSocketGateway} from '@nestjs/websockets/utils/socket-gateway.decorator';
import {OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketServer} from '@nestjs/websockets';
import {Player} from './player';


@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server;
    crazy = {
        target: 5,
        player: null
    };
    players: Map<string, Player> = new Map();
    coin: any = {
        x: 400,
        y: 250
    };

    async handleConnection(socket: SocketIO.Socket) {
        const player: Player = new Player(socket.id);
        this.players.set(socket.id, player);
        this.server.emit('onAllPlayers', this.allPlayers());
        socket.broadcast.emit('onAddPlayer', this.fromMap(player));
    }

    async handleDisconnect(socket: SocketIO.Socket) {
        this.players.delete(socket.id);
        console.log('disconnected', socket.id);
        socket.broadcast.emit('onRemovePlayer', socket.id);
    }

    @SubscribeMessage('updatePositionPlayer')
    async updatePositionPlayer(client: SocketIO.Socket, player: Player) {
        this.players.set(client.id, player);
        client.broadcast.emit('onReloadPlayer', this.fromMap(this.players.get(client.id)));
    }

    @SubscribeMessage('updatePlayer')
    async updatePlayer(client: SocketIO.Socket, data: {lose: string, won: string}) {
        let player: Player = this.players.get(data.won);
            player.score.eaten += 1;
        console.log('asd', client.id);
        this.players.delete(data.lose);
        this.server.emit('onReloadScore', {
            id: data.won,
            score: player.score,
            test:'asd'
        });
    }

    @SubscribeMessage('updatePositionCoin')
    async updatePositionCoin() {
        this.server.emit('onPositionCoin', this.coin);
    }

    @SubscribeMessage('updateScore')
    async updateScore(client: SocketIO.Socket, data: { player: Player, type: string }) {
        let player: Player = this.players.get(data.player.id);
        if (player) {

            this.coin = {
                x: this.randomInt(50, 750),
                y: this.randomInt(50, 500)
            };

            if (data.type === 'coin') {
                player.score.strong += 1;
            } else {
                console.log('eaten');
                //player.score.eaten += 1;
            }

            if (!this.crazy.player && player.score.strong === this.crazy.target) {
                this.crazy.player = player;
                this.crazy.player.score.strong = 0;
            }

            this.server.emit('onReloadScore', {
                id: data.player.id,
                score: player.score,
                crazy: !!this.crazy.player
            });

            this.server.emit('onPositionCoin', this.coin);

            setTimeout(() => {
                this.crazy.player = null;
            }, 400);
        }
    }


    private allPlayers(): string {
        return JSON.stringify(Array.from((this.players)));
    }

    private fromMap(player: Player): string {
        return JSON.stringify(player);
    }

    private randomInt(low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    }

}
