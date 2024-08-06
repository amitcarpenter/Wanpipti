import { DataSource } from 'typeorm';
import { User } from './entities/User';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'Wanpipti',
  synchronize: false,
  logging: false,
  entities: [User], // Add your entity classes here
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
