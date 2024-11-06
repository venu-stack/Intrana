// Import required dependencies
const dotenv = require('dotenv'); // For loading environment variables
const path = require('path'); // For handling file paths
const Joi = require('joi'); // For schema validation

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define validation schema for environment variables
const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number().default(3000), // Server port number with default 3000
    MONGODB_URL: Joi.string().required().description('Mongo DB url'), // MongoDB connection URL
    JWT_TOKEN_SECRET: Joi.string().required().description('JWT_TOKEN_SECRET is required.'), // Secret for JWT tokens
    ACCESS_SECRET: Joi.string().required().description('ACCESS_SECRET is required'), // AWS access secret
    REGION: Joi.string().required().description('REGION is required'), // AWS region
    SUBGRAPH_API: Joi.string().required().description('SUBGRAPH_API is required'), // GraphQL API endpoint
    SENDER_EMAIL: Joi.string().required().description('SENDER_EMAIL is required'), // Email sender address
    SENDER_PASSWORD: Joi.string().required().description('SENDER_PASSWORD is required'), // Email sender password

    BUCKET: Joi.string().required().description('BUCKET is required'), // S3 bucket name
    EMAIL_USER: Joi.string().required().description('EMAIL_USER is required'), // SMTP email user
    SMTP_SECRET_ACCESS_KEY: Joi.string().required().description('SMTP_SECRET_ACCESS_KEY is required'), // SMTP secret key
    SMTP_ACCESS_KEY: Joi.string().required().description('SMTP_ACCESS_KEY is required'), // SMTP access key
    MARKET_PLACE_CONTRACT_ADDRESS: Joi.string().required().description('MARKET_PLACE_CONTRACT_ADDRESS is required'), // Smart contract address
    XDC_RPC_URL: Joi.string().required().description('XDC_RPC_URL is required'), // XDC network RPC URL
    BASEURL: Joi.string().required().description('BASEURL is required'), // Base URL for the application
  })
  .unknown();

// Validate environment variables against schema
const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

// Throw error if validation fails
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export configuration object
module.exports = {
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  JWT_TOKEN_SECRET: envVars.JWT_TOKEN_SECRET,
  SUBGRAPH_API: envVars.SUBGRAPH_API,
  SENDER_EMAIL: envVars.SENDER_EMAIL,
  SENDER_PASSWORD: envVars.SENDER_PASSWORD,
  s3: {
    bucket: envVars.BUCKET,
    accessKey: envVars.ACCESS_KEY,
    accessSecret: envVars.ACCESS_SECRET,
    region: envVars.REGION
  },
  smtp: {
    EMAIL_USER: envVars.EMAIL_USER,
    SMTP_SECRET_ACCESS_KEY: envVars.SMTP_SECRET_ACCESS_KEY,
    SMTP_ACCESS_KEY: envVars.SMTP_ACCESS_KEY
  },
  contract: {
    MARKET_PLACE_CONTRACT_ADDRESS: envVars.MARKET_PLACE_CONTRACT_ADDRESS,
    XDC_RPC_URL: envVars.XDC_RPC_URL
  },
  BASEURL: envVars.BASEURL
};
