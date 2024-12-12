# Pairwise Ranking Backend

## Repository Link

[GitHub Repository](https://github.com/Shopbop-Pairwise-Ranking/Pairwise-Ranking-BE/)

---

## Project Overview

The Pairwise Ranking Backend provides a RESTful API to support a pairwise ranking system for Amazon Shopbop products. This system allows users to rank products dynamically and receive personalized recommendations. Built using Node.js, the project integrates AWS DynamoDB and AWS Personalize to deliver a scalable and efficient solution for personalized user experiences.

### Key Features

- **User Authentication**: Secure user login and signup using JWT-based authentication.
- **Pairwise Ranking**: Enables users to rank products against each other and updates their relative scores dynamically.
- **Product Recommendations**: Fetches personalized product recommendations using AWS Personalize.
- **Trending Products**: Dynamically calculates trending scores for products based on user interactions and updates them regularly.
- **Category Filtering**: Provides category-specific recommendations and rankings.

---

## Setup Steps

### Prerequisites

- **Node.js**: Ensure you have Node.js installed (version 14.x or higher).
- **AWS Account**: Set up AWS DynamoDB and AWS Personalize.
- **Environment Variables**: Configure the `.env` file with required credentials.

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/Shopbop-Pairwise-Ranking/Pairwise-Ranking-BE.git
   ```

2. Navigate to the project directory:

   ```bash
   cd Pairwise-Ranking-BE
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add the following environment variables:

   ```plaintext
   PORT=3000
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_aws_region
   PERSONALIZE_CAMPAIGN_ARN=your_campaign_arn
   JWT_SECRET=your_jwt_secret
   USERS_TABLE=Users
   RANKINGS_TABLE=Rankings
   PRODUCTS_TABLE=Products
   TRENDING_TABLE=Trending
   SALT_ROUNDS=14
   ```

5. Start the server:

   ```bash
   npm start
   ```

   The server will run on `http://localhost:3000` by default.

---

## How the Code Works

### Code Structure

The project is organized into the following key components:

#### Configurations

- `config/dynamoDBConfig.js`: Sets up and configures the DynamoDB client.
- `config/personalizeRuntimeConfig.js`: Configures AWS Personalize Runtime for fetching recommendations.

#### Controllers

- `controllers/authController.js`: Handles user authentication, signup, login, and JWT generation.
- `controllers/rankingController.js`: Processes pairwise rankings and updates product scores dynamically.
- `controllers/productController.js`: Manages product data, including retrieval by category and gender.
- `controllers/recommendationController.js`: Fetches and saves personalized recommendations.
- `controllers/trendingController.js`: Calculates and retrieves trending products based on interactions.

#### Models

- `models/usersModel.js`: Manages user data in DynamoDB, including login and signup operations.
- `models/productsModel.js`: Interfaces with DynamoDB for product data, including updates to Elo ratings.
- `models/rankingsModel.js`: Handles ranking-related operations in DynamoDB.
- `models/trendingModel.js`: Retrieves and updates trending product scores.

#### Routes

- `routes/authRoute.js`: Defines endpoints for user authentication.
- `routes/productRoute.js`: Provides product-related endpoints.
- `routes/rankingRoute.js`: Handles endpoints for pairwise ranking.
- `routes/trendingRoute.js`: Retrieves trending products.

#### Trending Scores Updater (Lambda)

- `trending-lambda/trendingScoresUpdater.js`: This script is implemented as a separate AWS Lambda function that runs daily at 12 midnight. It calculates and updates trending scores for products in DynamoDB based on user interactions and product performance metrics.

#### Utility Scripts

- `utils/helper.js`: Includes helper functions used across the application.
- `utils/jwtUtils.js`: Utility functions for JWT operations.
- `utils/passwordUtils.js`: Handles password hashing and verification.

#### Scraper

- `scraper/scraper.py`: A Python script that interacts with the Amazon Shopbop search API to fetch product data across categories. The fetched data is stored in DynamoDB for further processing.
- `scraper/products_data/`: Contains sample scraped product data in JSON format.

#### Service Layer

- `service/personalizeRecommendationService.js`: Handles interaction with AWS Personalize to fetch recommendations.

#### Entry Point

- `server.js`: The main entry point that sets up the Express application and initializes routes.

---

## API Endpoints

Here is an overview of the API endpoints:

### Authentication Endpoints
- **POST /login**: Logs in an existing user.
  - **Body**: `{ username, password }`
  - **Response**: JWT token.

- **POST /signup**: Registers a new user.
  - **Body**: `{ username, password }`
  - **Response**: User details and JWT token.

### Product Endpoints
- **GET /products**: Retrieves all products available.
  - **Response**: Array of products.

### Ranking Endpoints
- **POST /update-ranking/user/:userId/category/:categoryId**: Submits a pairwise ranking for two products.
  - **Params**: `userId`, `categoryId`.
  - **Body**: `{ productAId, productBId, winnerId }`
  - **Response**: Updated rankings for the products.

- **GET /latest-ranking**: Fetches the latest ranking data for a user.
  - **Response**: User-specific ranking data.

### Recommendation Endpoints
- **GET /recommendations**: Fetches personalized product recommendations for the logged-in user.
  - **Response**: Array of recommended products.

### Trending Endpoints
- **GET /trending-products**: Retrieves trending products across all categories.
  - **Response**: Array of trending products with scores.

---

## What Works and What Doesn’t

### What Works

- **Authentication**: User authentication is implemented and functional.
- **Ranking System**: Pairwise ranking and Elo score updates work as expected.
- **AWS Integration**: Successfully integrates AWS DynamoDB for data storage and AWS Personalize for recommendations.
- **Trending Products**: Calculates trending scores and updates them dynamically.
- **API Endpoints**: Provides RESTful API endpoints for all key functionalities.

### What Doesn’t Work

- **Edge Cases for Rankings**: Some edge cases, such as tie scenarios or inconsistent ranking patterns, need further refinement.
- **Recommendation Accuracy**: Recommendations depend heavily on AWS Personalize training; fine-tuning is required for optimal results.
- **Error Handling**: Needs improved error handling for AWS service failures and invalid user inputs.

---

## Next Steps

1. **Refine Ranking Logic**: Improve the Elo ranking algorithm to handle edge cases and provide more consistent results.
2. **Optimize Recommendations**: Enhance AWS Personalize model training for better recommendation accuracy.
3. **Add Unit Tests**: Increase test coverage for critical components.
4. **Improve Scalability**: Optimize database queries and API response times to handle higher traffic volumes.
5. **Integrating Social Media**: Enable feature to share recommendations on social media platform.
