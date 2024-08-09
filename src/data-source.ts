import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'Wanpipti',
  synchronize: false,
  logging: false,
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
