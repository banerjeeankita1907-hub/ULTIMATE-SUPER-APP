"\"\"\"
Seed script to populate the database with sample data
Run with: python seed_data.py
\"\"\"
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import uuid
from auth import get_password_hash

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_database():
    print(\"🌱 Seeding database with sample data...\")
    
    # Create sample users
    sample_users = [
        {
            \"id\": str(uuid.uuid4()),
            \"email\": \"demo@superapp.com\",
            \"username\": \"demo_user\",
            \"hashed_password\": get_password_hash(\"demo123\"),
            \"full_name\": \"Demo User\",
            \"bio\": \"I love using the Super App! 🚀\",
            \"avatar_url\": None,
            \"role\": \"user\",
            \"created_at\": datetime.now(timezone.utc).isoformat(),
            \"followers\": [],
            \"following\": [],
            \"points\": 250,
            \"badges\": [\"Early Adopter\", \"Social Butterfly\"]
        },
        {
            \"id\": str(uuid.uuid4()),
            \"email\": \"alice@superapp.com\",
            \"username\": \"alice\",
            \"hashed_password\": get_password_hash(\"alice123\"),
            \"full_name\": \"Alice Johnson\",
            \"bio\": \"Tech enthusiast and productivity expert\",
            \"avatar_url\": None,
            \"role\": \"user\",
            \"created_at\": datetime.now(timezone.utc).isoformat(),
            \"followers\": [],
            \"following\": [],
            \"points\": 180,
            \"badges\": [\"Productivity Master\"]
        },
        {
            \"id\": str(uuid.uuid4()),
            \"email\": \"bob@superapp.com\",
            \"username\": \"bob_seller\",
            \"hashed_password\": get_password_hash(\"bob123\"),
            \"full_name\": \"Bob Smith\",
            \"bio\": \"Selling amazing products!\",
            \"avatar_url\": None,
            \"role\": \"seller\",
            \"created_at\": datetime.now(timezone.utc).isoformat(),
            \"followers\": [],
            \"following\": [],
            \"points\": 320,
            \"badges\": [\"Top Seller\", \"5-Star Rating\"]
        }
    ]
    
    # Clear existing data
    await db.users.delete_many({})
    await db.posts.delete_many({})
    await db.products.delete_many({})
    await db.notes.delete_many({})
    await db.tasks.delete_many({})
    
    # Insert users
    await db.users.insert_many(sample_users)
    print(f\"✅ Created {len(sample_users)} sample users\")
    
    # Create sample posts
    sample_posts = [
        {
            \"id\": str(uuid.uuid4()),
            \"user_id\": sample_users[0]['id'],
            \"username\": sample_users[0]['username'],
            \"user_avatar\": None,
            \"content\": \"Just discovered this amazing Super App! It has everything I need - social, AI, shopping, and productivity tools all in one place! 🎉\",
            \"image_url\": None,
            \"tags\": [\"superapp\", \"amazing\"],
            \"likes\": [],
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"user_id\": sample_users[1]['id'],
            \"username\": sample_users[1]['username'],
            \"user_avatar\": None,
            \"content\": \"The AI features are mind-blowing! Just generated some amazing content with GPT-5.2 🤖✨\",
            \"image_url\": None,
            \"tags\": [\"ai\", \"gpt\"],
            \"likes\": [],
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"user_id\": sample_users[2]['id'],
            \"username\": sample_users[2]['username'],
            \"user_avatar\": None,
            \"content\": \"Check out my new products in the marketplace! Best quality guaranteed! 🛍️\",
            \"image_url\": None,
            \"tags\": [\"marketplace\", \"shopping\"],
            \"likes\": [],
            \"created_at\": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.posts.insert_many(sample_posts)
    print(f\"✅ Created {len(sample_posts)} sample posts\")
    
    # Create sample products
    sample_products = [
        {
            \"id\": str(uuid.uuid4()),
            \"seller_id\": sample_users[2]['id'],
            \"seller_name\": sample_users[2]['username'],
            \"name\": \"Premium Wireless Headphones\",
            \"description\": \"High-quality wireless headphones with noise cancellation and 30-hour battery life\",
            \"price\": 149.99,
            \"image_url\": None,
            \"category\": \"Electronics\",
            \"stock\": 50,
            \"rating\": 4.8,
            \"reviews_count\": 125,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"seller_id\": sample_users[2]['id'],
            \"seller_name\": sample_users[2]['username'],
            \"name\": \"Smart Fitness Tracker\",
            \"description\": \"Track your health and fitness goals with this advanced smartwatch\",
            \"price\": 89.99,
            \"image_url\": None,
            \"category\": \"Electronics\",
            \"stock\": 75,
            \"rating\": 4.6,
            \"reviews_count\": 89,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"seller_id\": sample_users[2]['id'],
            \"seller_name\": sample_users[2]['username'],
            \"name\": \"Eco-Friendly Water Bottle\",
            \"description\": \"Sustainable stainless steel water bottle keeps drinks cold for 24 hours\",
            \"price\": 24.99,
            \"image_url\": None,
            \"category\": \"Lifestyle\",
            \"stock\": 200,
            \"rating\": 4.9,
            \"reviews_count\": 340,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"seller_id\": sample_users[2]['id'],
            \"seller_name\": sample_users[2]['username'],
            \"name\": \"Ergonomic Office Chair\",
            \"description\": \"Comfortable and adjustable office chair with lumbar support\",
            \"price\": 299.99,
            \"image_url\": None,
            \"category\": \"Furniture\",
            \"stock\": 30,
            \"rating\": 4.7,
            \"reviews_count\": 67,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"seller_id\": sample_users[2]['id'],
            \"seller_name\": sample_users[2]['username'],
            \"name\": \"Portable Power Bank\",
            \"description\": \"20000mAh power bank with fast charging for all your devices\",
            \"price\": 39.99,
            \"image_url\": None,
            \"category\": \"Electronics\",
            \"stock\": 150,
            \"rating\": 4.5,
            \"reviews_count\": 210,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.products.insert_many(sample_products)
    print(f\"✅ Created {len(sample_products)} sample products\")
    
    print(\"\n🎉 Database seeding completed!\")
    print(\"\n📝 Sample Login Credentials:\")
    print(\"   Email: demo@superapp.com\")
    print(\"   Password: demo123\")
    print(\"\n   Email: alice@superapp.com\")
    print(\"   Password: alice123\")
    print(\"\n   Email: bob@superapp.com\")
    print(\"   Password: bob123\")

if __name__ == \"__main__\":
    asyncio.run(seed_database())
    client.close()
"
Observation: Create successful: /app/backend/seed_data.py
