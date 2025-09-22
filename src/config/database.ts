import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

console.log('Database configuration:', {
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres'
});

// PostgreSQL configuration
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'eCommerceDs',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  logging: (msg) => console.log(`[Sequelize] ${msg}`),
  define: {
    timestamps: false,
    freezeTableName: true,
    underscored: false,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: false,
    connectTimeout: 60000
  },
  retry: {
    max: 5,
    timeout: 30000
  }
});

// Test the connection
async function testConnection() {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Attempting to connect to database (Attempt ${retries + 1}/${maxRetries})...`);
      await sequelize.authenticate();
      console.log('✅ Connection to PostgreSQL has been established successfully.');
      return true;
    } catch (error) {
      retries++;
      console.error(`❌ Unable to connect to the database (Attempt ${retries}/${maxRetries}):`, error);
      
      if (retries === maxRetries) {
        console.error('❌ Max retries reached. Could not connect to the database.');
        return false;
      }
      
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return false;
}

// Export the connection test function
export const initializeDatabase = async () => {
  return await testConnection();
};

export { sequelize };
