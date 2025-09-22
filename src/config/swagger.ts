import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
const { version } = require("../../package.json");

// Get the absolute path to the routes directory
const routesPath = path.join(__dirname, '../routes');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "eCommerce API Documentation",
      version,
      description: "Complete API documentation for the e-commerce system",
      contact: {
        name: "Technical Support",
        email: "morais.luism.net@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT authentication token"
        },
      },
    },
    security: [
      {
        BearerAuth: []
      }
    ],
  },
  // Find documentation in all .ts files inside the routes folder
  apis: [
    `${routesPath}/*.ts`,
    `${routesPath}/*/*.ts`
  ],
};

// Generate the Swagger specification
const specs = swaggerJsdoc(options);

export default specs;
