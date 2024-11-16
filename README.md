# Pairwise-Ranking-BE
Shopbop's pairwise ranking system backend is built with Node.js and integrates with the Shopbop API to pull product data, handle user inputs, and store ranking data in DynamoDB. This backend uses AWS services, including Lambda and API Gateway, for a scalable and serverless deployment.

The code requires node.js to be installed. Specifically, we are using express, body-parser and fs which can be installed to the system by running npm install.

This code has 2 api endpoints, one which posts the data to the database. This data is stored in a file called rankings.json. Next, there's a get api which fetches the data from rankings.json and sorts the average ranking score in descending order and displays the data to the frontend. 
