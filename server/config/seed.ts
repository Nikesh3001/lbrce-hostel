import { connectMongo, seedMongo } from './db';

async function runSeed() {
  console.log('--- LBRCE MERN Stack Database Seeder ---');
  await connectMongo();
  await seedMongo();
  console.log('Database seeding process completed.');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
