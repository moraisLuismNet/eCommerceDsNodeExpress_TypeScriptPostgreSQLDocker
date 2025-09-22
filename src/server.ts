import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { sequelize } from "./config/database";
import { setupAssociations } from "./models";
import swaggerSpec from "./config/swagger";
import http from "http";

// Load environment variables
dotenv.config();

// Log environment variables for debugging
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PORT: process.env.DB_PORT,
  PORT: process.env.PORT
});

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Set up model associations
setupAssociations();

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

// Import routes
import authRoutes from "./routes/authRoutes";
import recordsRoutes from "./routes/recordsRoutes";
import cartRoutes from "./routes/cartsRoutes";
import cartDetailRoutes from "./routes/cartDetailsRoutes";
import groupsRoutes from "./routes/groupsRoutes";
import ordersRoutes from "./routes/ordersRoutes";
import musicGenreRoutes from "./routes/musicGenreRoutes";
import usersRoutes from "./routes/usersRoutes";
import healthCheckRoutes from "./healthcheck";

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:4200' 
    : 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Request logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
  });
}

// Health check route (no auth required)
app.use('/health', healthCheckRoutes);

// Log the base URL for debugging
console.log('Mounting API routes at /api');

// Montar todas las rutas de la API directamente en /api
app.use('/api/auth', authRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/cart-details', cartDetailRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/music-genres', musicGenreRoutes);
app.use('/api/users', usersRoutes);

// Middleware para manejar rutas no encontradas en /api
app.use('/api', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Log all registered routes for debugging
const printRoutes = (router: any, prefix = '') => {
  router.stack.forEach((middleware: any) => {
    if (middleware.route) { // Routes registered directly on the app
      console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === 'router') { // Router middleware
      const path = middleware.regexp.toString()
        .replace('/^', '')
        .replace('\/?', '')
        .replace('(?=\/|$)', '')
        .replace(/\/(?:[^/]*)$/, '')
        .replace(/\\([^\/])/g, '$1');
      printRoutes(middleware.handle, `${prefix}${path}`);
    }
  });
};

console.log('Registered routes:');
printRoutes(app._router);

// Swagger documentation
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    validatorUrl: null,
    // Specify the base URL for all requests
    urls: [
      {
        url: '/api-docs/swagger.json',
        name: 'API v1'
      }
    ]
  },
};

// Serving the Swagger JSON file
app.get("/api-docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Serve Swagger UI documentation under /api-docs
app.use('/api-docs', 
  swaggerUi.serve,
  swaggerUi.setup(null, {
    ...swaggerOptions,
    swaggerOptions: {
      ...swaggerOptions.swaggerOptions,
      url: '/api-docs/swagger.json'
    }
  })
);

// Add a middleware to redirect /api-docs to /api-docs/
app.get('/api-docs', (req, res) => {
  res.redirect('/api-docs/');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database connection
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

// Start the server
async function startServer() {
  // Declare server variable at the function scope
  let server: ReturnType<typeof app.listen>;

  try {
    console.log('🚀 Starting server...');
    
    // Initialize database connection
    const isDbConnected = await initializeDatabase();
    
    if (!isDbConnected) {
      console.error('❌ Could not connect to the database after multiple attempts. Exiting...');
      process.exit(1);
    }

    // Sync database models with the database
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Syncing database models...');
      try {
        // Force re-creation of tables in development
        await sequelize.sync({ force: true });
        console.log('✅ Database synced successfully');
      } catch (syncError) {
        console.error('❌ Error syncing database:', syncError);
        process.exit(1);
      }
    }

    // Convert port to number
    const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
    
    // Start the server
    return new Promise<void>((resolve, reject) => {
      server = app.listen(portNumber, '0.0.0.0', () => {
        console.log(`\n=== Server Started ===`);
        console.log(`🚀 Server is running on port ${portNumber}`);
        console.log(`📚 API Documentation: http://localhost:${portNumber}/api-docs`);
        console.log(`🌐 Health Check: http://localhost:${portNumber}/health`);
        console.log(`🔌 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
        console.log(`========================\n`);
        resolve();
      });

      // Handle server errors
      server.on('error', (error: NodeJS.ErrnoException) => {
        console.error('❌ Server error:', error);
        
        if (error.syscall !== 'listen') {
          reject(error);
          return;
        }

        switch (error.code) {
          case 'EACCES':
            console.error(`Port ${portNumber} requires elevated privileges`);
            process.exit(1);
            break;
          case 'EADDRINUSE':
            console.error(`Port ${portNumber} is already in use`);
            process.exit(1);
            break;
          default:
            reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the application
startServer();

export { app };
