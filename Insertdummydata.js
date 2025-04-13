const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTable = async () => {
  const createQuery = `
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL
    );
  `;

  try {
    const client = await pool.connect();
    await client.query(createQuery);
    console.log('Table created successfully (if it didn\'t exist)');
    client.release();
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

const generateDummyData = () => {
  const dummyData = [];
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  letters.forEach((letter) => {
    for (let i = 1; i <= 5; i++) {
      const name = `${letter.toUpperCase()} Item ${i}`;
      const description = `This is a description for ${letter.toUpperCase()} Item ${i}. It is used to demonstrate search functionality.`;

      dummyData.push({ name, description });
    }
  });

  return dummyData;
};

const insertData = async () => {
  const data = generateDummyData();

  try {
    const client = await pool.connect();

    for (const item of data) {
      await client.query(
        'INSERT INTO items(name, description) VALUES($1, $2)',
        [item.name, item.description]
      );
    }

    console.log('Dummy data inserted successfully!');
    client.release();
  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    pool.end();
  }
};

const run = async () => {
  await createTable();
  await insertData();
};

run();
