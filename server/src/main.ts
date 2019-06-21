import {NestFactory} from '@nestjs/core';
import * as bodyParser from 'body-parser';

import {ApplicationModule} from './modules/app.module';

declare const module: any;

async function bootstrap() {
    const app = await NestFactory.create(ApplicationModule);
    app.use(bodyParser.json());
    app.setGlobalPrefix('/api');
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
        });
    });

    await app.listen(3000)
        .then(() => {
            console.info(`http://localhost:3000`);
        })
        .catch(console.error);

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}

bootstrap();
