import requests
import boto3
import pandas as pd
from typing import Dict, List, Optional

class ShopbopDataManager:
    def __init__(self):
        # Shopbop API configuration
        self.base_url = "https://api.shopbop.com"
        self.headers = {
            'accept': 'application/json',
            'Client-Id': 'Shopbop-UW-Team1-2024',  # Change to your team number
            'Client-Version': '1.0.0'
        }
        
        # DynamoDB setup (for rankings)
        self.dynamodb = boto3.resource('dynamodb')
        self.rankings_table = self.dynamodb.Table('Rankings')

    def search_products(self, 
                       query: str, 
                       department: str = "WOMENS",
                       limit: int = 40) -> pd.DataFrame:
        """Search products using Shopbop API"""
        endpoint = f"{self.base_url}/public/search"
        
        params = {
            'q': query,
            'dept': department,
            'lang': 'en-US',
            'currency': 'USD',
            'limit': limit,
            'allowOutOfStockItems': 'false'
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params)
            response.raise_for_status()
            products = response.json().get('products', [])
            return pd.DataFrame(products)
        except Exception as e:
            print(f"Error searching products: {str(e)}")
            return pd.DataFrame()

    def get_products_by_category(self, 
                               category_id: str,
                               department: str = "WOMENS",
                               limit: int = 40) -> pd.DataFrame:
        """Get products by category ID"""
        endpoint = f"{self.base_url}/public/categories/{category_id}/products"
        
        params = {
            'dept': department,
            'lang': 'en-US',
            'currency': 'USD',
            'limit': limit,
            'allowOutOfStockItems': 'false'
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params)
            response.raise_for_status()
            products = response.json().get('products', [])
            return pd.DataFrame(products)
        except Exception as e:
            print(f"Error getting products by category: {str(e)}")
            return pd.DataFrame()

    def get_categories(self, department: str = "WOMENS") -> pd.DataFrame:
        """Get all categories"""
        endpoint = f"{self.base_url}/public/folders"
        
        params = {
            'dept': department,
            'lang': 'en-US'
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params)
            response.raise_for_status()
            categories = response.json()
            return pd.DataFrame(categories)
        except Exception as e:
            print(f"Error getting categories: {str(e)}")
            return pd.DataFrame()

    def get_product_rankings(self, category_id: str = None) -> pd.DataFrame:
        """Get rankings from DynamoDB"""
        try:
            if category_id:
                response = self.rankings_table.query(
                    IndexName='CategoryIndex',
                    KeyConditionExpression='categoryId = :cat',
                    ExpressionAttributeValues={':cat': category_id}
                )
            else:
                response = self.rankings_table.scan()
            
            items = response.get('Items', [])
            return pd.DataFrame(items)
        except Exception as e:
            print(f"Error getting rankings: {str(e)}")
            return pd.DataFrame()

    def update_ranking(self, 
                      winner_id: str, 
                      loser_id: str, 
                      category_id: str) -> bool:
        """Update product rankings after comparison"""
        try:
            # Update winner
            self.rankings_table.update_item(
                Key={
                    'productId': winner_id,
                    'categoryId': category_id
                },
                UpdateExpression='ADD wins :inc, totalComparisons :inc',
                ExpressionAttributeValues={
                    ':inc': 1
                }
            )
            
            # Update loser
            self.rankings_table.update_item(
                Key={
                    'productId': loser_id,
                    'categoryId': category_id
                },
                UpdateExpression='ADD losses :inc, totalComparisons :inc',
                ExpressionAttributeValues={
                    ':inc': 1
                }
            )
            
            return True
        except Exception as e:
            print(f"Error updating rankings: {str(e)}")
            return False

# Example usage
def main():
    manager = ShopbopDataManager()
    
    # Get some dresses
    dresses_df = manager.search_products(query="dress", limit=10)
    print("\nDresses Search Results:")
    print(dresses_df[['name', 'price', 'brand']].head())
    
    # Get categories
    categories_df = manager.get_categories()
    print("\nCategories:")
    print(categories_df.head())
    
    # Get products from a specific category
    if not categories_df.empty:
        category_id = categories_df.iloc[0]['id']
        category_products_df = manager.get_products_by_category(category_id)
        print(f"\nProducts in category {category_id}:")
        print(category_products_df[['name', 'price', 'brand']].head())

if __name__ == "__main__":
    main()
