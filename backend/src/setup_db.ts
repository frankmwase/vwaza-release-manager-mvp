import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const createDb = async () => {
    const dbName = 'vwaza_mvp';
    const connectionString = process.env.DATABASE_URL || '';
    // Basic parsing to connect to 'postgres' db instead of target db
    const url = new URL(connectionString);
    url.pathname = 'postgres';

    const client = new Client({
        connectionString: url.toString(),
    });

    try {
        await client.connect();

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${dbName}...`);
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`Database ${dbName} created.`);
        } else {
            console.log(`Database ${dbName} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
};

createDb();
