import {Module} from '@nestjs/common';
import {GameModule} from './game_2/game.module';

@Module({
    imports: [
        GameModule
    ],
})
export class ApplicationModule {
}
