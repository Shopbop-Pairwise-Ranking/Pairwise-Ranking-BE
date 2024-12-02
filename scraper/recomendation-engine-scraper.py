from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv


load_dotenv()


personalize_runtime = boto3.client(
    'personalize-runtime',
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)


app = Flask(__name__)

# Configurations
CAMPAIGN_ARN = "arn:aws:personalize:us-east-2:043309352636:campaign/campaign-1"
DYNAMODB_TABLE_NAME = "Rankings"

def get_recommendations(user_id, num_results=5):
    """
    Fetch recommendations from AWS Personalize.
    """
    try:
        response = personalize_runtime.get_recommendations(
            campaignArn=CAMPAIGN_ARN,
            userId=user_id,
            numResults=num_results
        )
        return response.get('itemList', [])
    except ClientError as e:
        print(f"Failed to fetch recommendations: {e}")
        return []

def write_to_dynamo(user_id, category_id, item_list, latest_ranking_id):
    """
    Write recommendations to DynamoDB.
    """
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)
    try:
        response = table.update_item(
            Key={
                'categoryId': category_id,
                'userId': user_id
            },
            UpdateExpression="SET rankings.#rankingId.recommendations = :newRecommendations",
            ExpressionAttributeNames={
                "#rankingId": latest_ranking_id
            },
            ExpressionAttributeValues={
                ":newRecommendations": item_list
            },
            ReturnValues="UPDATED_NEW"
        )
        return response
    except ClientError as e:
        print(f"Failed to write to DynamoDB: {e}")
        return None

@app.route('/recommendations', methods=['POST'])
def recommendations_endpoint():
    """
    API endpoint to get and save recommendations.
    """
    data = request.json
    user_id = data.get("userId")
    category_id = data.get("categoryId")
    latest_ranking_id = data.get("latestRankingId")
    num_results = data.get("numResults", 5)

    if not user_id or not category_id or not latest_ranking_id:
        return jsonify({"error": "Missing required parameters"}), 400

    # Fetch recommendations
    recommendations = get_recommendations(user_id, num_results)
    item_list = [item["itemId"] for item in recommendations]

    if item_list:
        write_response = write_to_dynamo(user_id, category_id, item_list, latest_ranking_id)
        if write_response:
            return jsonify({
                "message": "Recommendations fetched and saved successfully.",
                "recommendations": item_list
            })
        else:
            return jsonify({"error": "Failed to write recommendations to DynamoDB"}), 500
    else:
        return jsonify({"error": "No recommendations found"}), 404
