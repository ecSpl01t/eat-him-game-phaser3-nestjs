export class Player {
    id: string;
    x: number = this.randomInt(50, 700);
    y: number = this.randomInt(50, 550);
    score: any = {
        strong: 0,
        eaten: 0
    };

    active: boolean = true;

    nickname: string;

    constructor(id: string, data?: Player) {
        this.id = id;

        if(data) {
            Object.assign(this, data);
        }
    }

    private randomInt(low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    }

}
