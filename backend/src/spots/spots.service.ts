import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Spot } from './entities/spot.entity';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// 型定義なしでもビルドできるように require を使用（メインエントリのみ利用）
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csvParse = require('csv-parse') as typeof import('csv-parse');

type CsvRecord = {
  name?: string;
  category?: string;
  lat?: string;
  long?: string;
  address?: string;
};

@Injectable()
export class SpotsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SpotsService.name);

  constructor(
    @InjectRepository(Spot)
    private readonly spotRepository: Repository<Spot>,
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.importFromCsvDirectory();
  }

  async findAll(): Promise<
    { id: number; name: string; category: string | null; address: string | null; lat: number; lng: number }[]
  > {
    const rows = await this.dataSource.query(
      `
      SELECT
        id,
        name,
        category,
        address,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng
      FROM spot
    `,
    );

    return rows.map((row: any) => ({
      id: Number(row.id),
      name: row.name as string,
      category: (row.category ?? null) as string | null,
      address: (row.address ?? null) as string | null,
      lat: Number(row.lat),
      lng: Number(row.lng),
    }));
  }

  private async importFromCsvDirectory(): Promise<void> {
    const baseDir = process.cwd();
    const csvDir = process.env.CSV_DIR ?? path.join(baseDir, 'data', 'csv');

    this.logger.log(`Importing CSV files from: ${csvDir}`);

    let files: string[];
    try {
      files = await fs.readdir(csvDir);
    } catch (error) {
      this.logger.warn(`CSV directory not found or not readable: ${csvDir}`);
      return;
    }

    const csvFiles = files.filter((name) => name.toLowerCase().endsWith('.csv'));
    if (csvFiles.length === 0) {
      this.logger.log('No CSV files found. Skipping import.');
      return;
    }

    // 全削除してから再インポート（冪等性を担保）
    this.logger.log('Clearing existing spots before CSV import...');
    await this.dataSource.query('TRUNCATE TABLE spot RESTART IDENTITY CASCADE');

    for (const file of csvFiles) {
      const fullPath = path.join(csvDir, file);
      await this.importSingleCsv(fullPath);
    }
  }

  private async importSingleCsv(filePath: string): Promise<void> {
    this.logger.log(`Importing CSV: ${filePath}`);

    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      this.logger.error(`Failed to read CSV file: ${filePath}`, error as Error);
      return;
    }

    let records: CsvRecord[];
    try {
      records = await new Promise<CsvRecord[]>((resolve, reject) => {
        csvParse.parse(
          content,
          {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          },
          (err: Error | undefined, output: CsvRecord[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(output);
            }
          },
        );
      });
    } catch (error) {
      this.logger.error(`Failed to parse CSV file: ${filePath}`, error as Error);
      return;
    }

    for (const [index, record] of records.entries()) {
      const name = record.name?.trim();
      const category = record.category?.trim() ?? null;
      const address = record.address?.trim() ?? null;
      const lat = record.lat ? Number(record.lat) : NaN;
      const lng = record.long ? Number(record.long) : NaN;

      if (!name || Number.isNaN(lat) || Number.isNaN(lng)) {
        this.logger.warn(
          `Skipping invalid row #${index + 1} in ${filePath}: name=${name}, lat=${record.lat}, long=${record.long}`,
        );
        continue;
      }

      try {
        await this.dataSource.query(
          `
          INSERT INTO spot (name, category, address, location)
          VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)
        `,
          [name, category, address, lng, lat],
        );
      } catch (error) {
        this.logger.error(`Failed to insert row #${index + 1} from ${filePath}`, error as Error);
      }
    }
  }
}

