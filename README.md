# Pairwise-Ranking-BE

Project Overview
The Shopbop Recommendation and Ranking System is a backend implementation designed to support personalized recommendations, rankings, and trending product updates for an e-commerce platform. It leverages AWS DynamoDB for data storage and AWS Personalize for recommendation services, enabling dynamic and personalized shopping experiences for users. 

Features
- User Authentication: Supports user login and signup with secure password handling and JWT-based authentication.
- Product Recommendations: Utilizes AWS Personalize to provide tailored product suggestions based on user activity and rankings.
- Dynamic Rankings: Implements an Elo rating system to dynamically rank products based on user preferences.
- Trending Products: Calculates trending scores for products based on performance metrics like wins, losses, and Elo ratings.
- Category-Based Filtering: Offers category-specific product recommendations and rankings.

Key Components

Configurations
- dynamoDBConfig.js: Sets up and configures the DynamoDB client.
- personalizeRuntimeConfig.js: Configures AWS Personalize Runtime for fetching recommendations.

Controllers
- authController.js: Handles user authentication (login, signup) and password encryption.
- productController.js: Fetches products by category and gender, while excluding ranked or recommended items.
- rankingController.js: Manages user rankings and updates product Elo ratings based on matchups.
- recommendationController.js: Fetches and saves personalized recommendations for users.
- trendingController.js: Retrieves trending products for specific categories.

Models
- productsModel.js: Interfaces with DynamoDB to fetch and update product data, including Elo ratings.
- rankingsModel.js: Manages user rankings and recommendations in DynamoDB.
- trendingModel.js: Retrieves trending product data from DynamoDB.
- usersModel.js: Handles user-related database operations such as fetching and updating user details.

Data Files
- rankings.json: Stores sample ranking data for testing and development purposes.

Utility Scripts
- trendingScoresUpdater.js: A script that calculates trending scores for products and updates the trending table in DynamoDB.
