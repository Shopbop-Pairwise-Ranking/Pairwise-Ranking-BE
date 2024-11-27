import requests
import boto3
import json
import os
from dotenv import load_dotenv
from decimal import Decimal

load_dotenv()

dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

table_name = "Products"
table = dynamodb.Table(table_name)

SHOPBOP_API_URL = "https://api.shopbop.com/public/search"
HEADERS = {
    "accept": "application/json",
    "Client-Id": "Shopbop-UW-Team1-2024",
    "Client-Version": "1.0.0",
}

def fetch_shopbop_data(category, limit, offset):
    params = {
        "lang": "en-US",
        "currency": "USD",
        "q": category,
        "limit": limit,
        "allowOutOfStockItems": "true",
        "dept": "WOMENS",
        "offset": offset,
    }
    response = requests.get(SHOPBOP_API_URL, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()

def transform_data(products, category):
    transformed = []
    for product_data in products:
        product = product_data.get("product", {})
        if not product:
            continue

        transformed_item = {
            "productSin": product.get("productSin"),
            "productCode": product.get("productCode"),
            "shortDescription": product.get("shortDescription"),
            "designerName": product.get("designerName"),
            "designerCode": product.get("designerCode"),
            "designerFolderId": product.get("designerFolderId"),
            "price": Decimal(str(product.get("retailPrice", {}).get("usdPrice", 0))),
            "imageURL": "",
            "categoryID": category,
            "gender": product.get("gender"),
        }

        colors = product.get("colors", [])
        if colors and colors[0].get("images"):
            transformed_item["imageURL"] = colors[0]["images"][0].get("src", "")

        transformed.append(transformed_item)

    return transformed

def save_to_dynamodb(data):
    with table.batch_writer() as batch:
        for item in data:
            batch.put_item(Item=item)

def decimal_to_json_serializable(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def save_to_json(data, filename):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    folder = os.path.join(script_dir, 'products_data')
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, filename)
    with open(filepath, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False, default=decimal_to_json_serializable)
    print(f"Data saved to {filepath}")

def scrape_category(category):
    limit = 100
    offset = 0
    scraped_data = []

    print(f"Starting to scrape category: {category}")
    initial_response = fetch_shopbop_data(category, limit, offset)
    total_records = initial_response.get("totalResults", 1000)

    print(f"Total records to fetch for category '{category}': {total_records}")

    while len(scraped_data) < total_records:
        response_data = fetch_shopbop_data(category, limit, offset)
        products = response_data.get("products", [])
        if not products:
            print(f"No more products found for category {category}.")
            break

        transformed_data = transform_data(products, category)
        scraped_data.extend(transformed_data)

        offset += limit

    print(f"Saving {len(scraped_data)} records for category {category} to DynamoDB...")
    save_to_dynamodb(scraped_data)

    json_filename = f"{category}_data.json"
    print(f"Saving {len(scraped_data)} records for category {category} to {json_filename}...")
    save_to_json(scraped_data, json_filename)

    print(f"Successfully saved {len(scraped_data)} records for category {category}.\n")

if __name__ == "__main__":
    categories = ["jeans", "skirts", "jackets", "dresses"]

    for category in categories:
        scrape_category(category)

    print("Scraping, saving to database, and JSON file process completed for all categories.")
