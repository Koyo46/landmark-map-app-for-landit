import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GeocodingModule } from './geocoding/geocoding.module';
import { Spot } from './spots/entities/spot.entity';
import { SpotsModule } from './spots/spots.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db', // docker-composeのサービス名
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'spot_db',
      entities: [Spot],
      // spot テーブルは db/init/01_init.sql で作成（PostGIS geography は synchronize で扱いづらいため）
      synchronize: false,
    }),
    GeocodingModule,
    SpotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
