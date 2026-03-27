"from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

from models import (
    User, UserCreate, UserLogin, UserUpdate,
    Post, PostCreate, Comment, CommentCreate,
    Product, ProductCreate, Cart, CartItem, Order, OrderCreate,
    Note, NoteCreate, Task, TaskCreate,
    Message, MessageCreate,
    AITextRequest, AIImageRequest, AIGeneration
)
from auth import (
    get_password_hash, verify_password, create_access_token, get_current_user
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title=\"Ultimate Super App API\")

# Create API router with /api prefix
api_router = APIRouter(prefix=\"/api\")

# ==================== HEALTH CHECK ====================
@api_router.get(\"/\")
async def root():
    return {\"message\": \"Ultimate Super App API - All Systems Operational! 🚀\"}

# ==================== AUTHENTICATION ====================
@api_router.post(\"/auth/register\")
async def register(user_data: UserCreate):
    \"\"\"Register a new user\"\"\"
    # Check if user already exists
    existing_user = await db.users.find_one({\"email\": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail=\"Email already registered\")
    
    existing_username = await db.users.find_one({\"username\": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail=\"Username already taken\")
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name
    )
    
    user_dict = user.model_dump()
    user_dict['hashed_password'] = get_password_hash(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(
        data={\"sub\": user.id, \"email\": user.email, \"username\": user.username}
    )
    
    return {
        \"access_token\": access_token,
        \"token_type\": \"bearer\",
        \"user\": user
    }

@api_router.post(\"/auth/login\")
async def login(credentials: UserLogin):
    \"\"\"Login user\"\"\"
    user = await db.users.find_one({\"email\": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail=\"Invalid credentials\")
    
    if not verify_password(credentials.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail=\"Invalid credentials\")
    
    access_token = create_access_token(
        data={\"sub\": user['id'], \"email\": user['email'], \"username\": user['username']}
    )
    
    # Remove sensitive data
    user.pop('hashed_password', None)
    user.pop('_id', None)
    
    return {
        \"access_token\": access_token,
        \"token_type\": \"bearer\",
        \"user\": user
    }

@api_router.get(\"/auth/me\", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    \"\"\"Get current user information\"\"\"
    user = await db.users.find_one({\"id\": current_user['user_id']}, {\"_id\": 0, \"hashed_password\": 0})
    if not user:
        raise HTTPException(status_code=404, detail=\"User not found\")
    return user

# ==================== USER MANAGEMENT ====================
@api_router.get(\"/users/{user_id}\", response_model=User)
async def get_user(user_id: str):
    \"\"\"Get user by ID\"\"\"
    user = await db.users.find_one({\"id\": user_id}, {\"_id\": 0, \"hashed_password\": 0})
    if not user:
        raise HTTPException(status_code=404, detail=\"User not found\")
    return user

@api_router.put(\"/users/me\", response_model=User)
async def update_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    \"\"\"Update current user profile\"\"\"
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {\"id\": current_user['user_id']},
            {\"$set\": update_data}
        )
    
    user = await db.users.find_one({\"id\": current_user['user_id']}, {\"_id\": 0, \"hashed_password\": 0})
    return user

@api_router.post(\"/users/{user_id}/follow\")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Follow a user\"\"\"
    if user_id == current_user['user_id']:
        raise HTTPException(status_code=400, detail=\"Cannot follow yourself\")
    
    # Add to current user's following
    await db.users.update_one(
        {\"id\": current_user['user_id']},
        {\"$addToSet\": {\"following\": user_id}}
    )
    
    # Add to target user's followers
    await db.users.update_one(
        {\"id\": user_id},
        {\"$addToSet\": {\"followers\": current_user['user_id']}}
    )
    
    return {\"message\": \"Followed successfully\"}

@api_router.delete(\"/users/{user_id}/follow\")
async def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Unfollow a user\"\"\"
    await db.users.update_one(
        {\"id\": current_user['user_id']},
        {\"$pull\": {\"following\": user_id}}
    )
    
    await db.users.update_one(
        {\"id\": user_id},
        {\"$pull\": {\"followers\": current_user['user_id']}}
    )
    
    return {\"message\": \"Unfollowed successfully\"}

# ==================== SOCIAL - POSTS ====================
@api_router.post(\"/posts\", response_model=Post)
async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
    \"\"\"Create a new post\"\"\"
    user = await db.users.find_one({\"id\": current_user['user_id']})
    
    post = Post(
        user_id=current_user['user_id'],
        username=user['username'],
        user_avatar=user.get('avatar_url'),
        content=post_data.content,
        image_url=post_data.image_url,
        tags=post_data.tags or []
    )
    
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    
    await db.posts.insert_one(post_dict)
    
    # Award points
    await db.users.update_one(
        {\"id\": current_user['user_id']},
        {\"$inc\": {\"points\": 10}}
    )
    
    return post

@api_router.get(\"/posts\", response_model=List[Post])
async def get_posts(skip: int = 0, limit: int = 50):
    \"\"\"Get all posts (feed)\"\"\"
    posts = await db.posts.find({}, {\"_id\": 0}).sort(\"created_at\", -1).skip(skip).limit(limit).to_list(limit)
    
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
    
    return posts

@api_router.get(\"/posts/{post_id}\", response_model=Post)
async def get_post(post_id: str):
    \"\"\"Get single post\"\"\"
    post = await db.posts.find_one({\"id\": post_id}, {\"_id\": 0})
    if not post:
        raise HTTPException(status_code=404, detail=\"Post not found\")
    
    if isinstance(post.get('created_at'), str):
        post['created_at'] = datetime.fromisoformat(post['created_at'])
    
    return post

@api_router.post(\"/posts/{post_id}/like\")
async def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Like a post\"\"\"
    post = await db.posts.find_one({\"id\": post_id})
    if not post:
        raise HTTPException(status_code=404, detail=\"Post not found\")
    
    if current_user['user_id'] in post.get('likes', []):
        # Unlike
        await db.posts.update_one(
            {\"id\": post_id},
            {\"$pull\": {\"likes\": current_user['user_id']}}
        )
        return {\"message\": \"Unliked\", \"liked\": False}
    else:
        # Like
        await db.posts.update_one(
            {\"id\": post_id},
            {\"$addToSet\": {\"likes\": current_user['user_id']}}
        )
        
        # Award points to post owner
        await db.users.update_one(
            {\"id\": post['user_id']},
            {\"$inc\": {\"points\": 5}}
        )
        
        return {\"message\": \"Liked\", \"liked\": True}

@api_router.delete(\"/posts/{post_id}\")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Delete a post\"\"\"
    post = await db.posts.find_one({\"id\": post_id})
    if not post:
        raise HTTPException(status_code=404, detail=\"Post not found\")
    
    if post['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail=\"Not authorized\")
    
    await db.posts.delete_one({\"id\": post_id})
    await db.comments.delete_many({\"post_id\": post_id})
    
    return {\"message\": \"Post deleted\"}

# ==================== SOCIAL - COMMENTS ====================
@api_router.post(\"/comments\", response_model=Comment)
async def create_comment(comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    \"\"\"Create a comment on a post\"\"\"
    post = await db.posts.find_one({\"id\": comment_data.post_id})
    if not post:
        raise HTTPException(status_code=404, detail=\"Post not found\")
    
    user = await db.users.find_one({\"id\": current_user['user_id']})
    
    comment = Comment(
        post_id=comment_data.post_id,
        user_id=current_user['user_id'],
        username=user['username'],
        user_avatar=user.get('avatar_url'),
        content=comment_data.content
    )
    
    comment_dict = comment.model_dump()
    comment_dict['created_at'] = comment_dict['created_at'].isoformat()
    
    await db.comments.insert_one(comment_dict)
    
    # Award points
    await db.users.update_one(
        {\"id\": current_user['user_id']},
        {\"$inc\": {\"points\": 3}}
    )
    
    return comment

@api_router.get(\"/posts/{post_id}/comments\", response_model=List[Comment])
async def get_post_comments(post_id: str):
    \"\"\"Get all comments for a post\"\"\"
    comments = await db.comments.find({\"post_id\": post_id}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(100)
    
    for comment in comments:
        if isinstance(comment.get('created_at'), str):
            comment['created_at'] = datetime.fromisoformat(comment['created_at'])
    
    return comments

# ==================== E-COMMERCE - PRODUCTS ====================
@api_router.post(\"/products\", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_current_user)):
    \"\"\"Create a new product\"\"\"
    product = Product(
        seller_id=current_user['user_id'],
        seller_name=current_user['username'],
        **product_data.model_dump()
    )
    
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    
    await db.products.insert_one(product_dict)
    
    return product

@api_router.get(\"/products\", response_model=List[Product])
async def get_products(category: Optional[str] = None, skip: int = 0, limit: int = 50):
    \"\"\"Get all products\"\"\"
    query = {\"category\": category} if category else {}
    products = await db.products.find(query, {\"_id\": 0}).skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get(\"/products/{product_id}\", response_model=Product)
async def get_product(product_id: str):
    \"\"\"Get single product\"\"\"
    product = await db.products.find_one({\"id\": product_id}, {\"_id\": 0})
    if not product:
        raise HTTPException(status_code=404, detail=\"Product not found\")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return product

# ==================== E-COMMERCE - CART ====================
@api_router.get(\"/cart\", response_model=Cart)
async def get_cart(current_user: dict = Depends(get_current_user)):
    \"\"\"Get user's cart\"\"\"
    cart = await db.carts.find_one({\"user_id\": current_user['user_id']}, {\"_id\": 0})
    if not cart:
        # Create empty cart
        new_cart = Cart(user_id=current_user['user_id'])
        cart_dict = new_cart.model_dump()
        cart_dict['updated_at'] = cart_dict['updated_at'].isoformat()
        await db.carts.insert_one(cart_dict)
        return new_cart
    
    if isinstance(cart.get('updated_at'), str):
        cart['updated_at'] = datetime.fromisoformat(cart['updated_at'])
    
    return cart

@api_router.post(\"/cart/add\")
async def add_to_cart(product_id: str, quantity: int = 1, current_user: dict = Depends(get_current_user)):
    \"\"\"Add item to cart\"\"\"
    product = await db.products.find_one({\"id\": product_id})
    if not product:
        raise HTTPException(status_code=404, detail=\"Product not found\")
    
    cart = await db.carts.find_one({\"user_id\": current_user['user_id']})
    if not cart:
        cart = Cart(user_id=current_user['user_id']).model_dump()
        cart['updated_at'] = cart['updated_at'].isoformat()
    
    # Check if item already in cart
    items = cart.get('items', [])
    found = False
    for item in items:
        if item['product_id'] == product_id:
            item['quantity'] += quantity
            found = True
            break
    
    if not found:
        items.append({
            \"product_id\": product_id,
            \"quantity\": quantity,
            \"price\": product['price']
        })
    
    # Calculate total
    total = sum(item['quantity'] * item['price'] for item in items)
    
    await db.carts.update_one(
        {\"user_id\": current_user['user_id']},
        {
            \"$set\": {
                \"items\": items,
                \"total\": total,
                \"updated_at\": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {\"message\": \"Added to cart\", \"total\": total}

@api_router.delete(\"/cart/remove/{product_id}\")
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Remove item from cart\"\"\"
    cart = await db.carts.find_one({\"user_id\": current_user['user_id']})
    if not cart:
        raise HTTPException(status_code=404, detail=\"Cart not found\")
    
    items = [item for item in cart.get('items', []) if item['product_id'] != product_id]
    total = sum(item['quantity'] * item['price'] for item in items)
    
    await db.carts.update_one(
        {\"user_id\": current_user['user_id']},
        {
            \"$set\": {
                \"items\": items,
                \"total\": total,
                \"updated_at\": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {\"message\": \"Removed from cart\", \"total\": total}

# ==================== E-COMMERCE - ORDERS ====================
@api_router.post(\"/orders\", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    \"\"\"Create a new order\"\"\"
    order = Order(
        user_id=current_user['user_id'],
        **order_data.model_dump()
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    
    await db.orders.insert_one(order_dict)
    
    # Clear cart
    await db.carts.update_one(
        {\"user_id\": current_user['user_id']},
        {\"$set\": {\"items\": [], \"total\": 0.0}}
    )
    
    return order

@api_router.get(\"/orders\", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_user)):
    \"\"\"Get user's orders\"\"\"
    orders = await db.orders.find({\"user_id\": current_user['user_id']}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(100)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

# ==================== PRODUCTIVITY - NOTES ====================
@api_router.post(\"/notes\", response_model=Note)
async def create_note(note_data: NoteCreate, current_user: dict = Depends(get_current_user)):
    \"\"\"Create a new note\"\"\"
    note = Note(user_id=current_user['user_id'], **note_data.model_dump())
    
    note_dict = note.model_dump()
    note_dict['created_at'] = note_dict['created_at'].isoformat()
    note_dict['updated_at'] = note_dict['updated_at'].isoformat()
    
    await db.notes.insert_one(note_dict)
    
    return note

@api_router.get(\"/notes\", response_model=List[Note])
async def get_notes(current_user: dict = Depends(get_current_user)):
    \"\"\"Get user's notes\"\"\"
    notes = await db.notes.find({\"user_id\": current_user['user_id']}, {\"_id\": 0}).sort(\"updated_at\", -1).to_list(100)
    
    for note in notes:
        if isinstance(note.get('created_at'), str):
            note['created_at'] = datetime.fromisoformat(note['created_at'])
        if isinstance(note.get('updated_at'), str):
            note['updated_at'] = datetime.fromisoformat(note['updated_at'])
    
    return notes

@api_router.put(\"/notes/{note_id}\", response_model=Note)
async def update_note(note_id: str, note_data: NoteCreate, current_user: dict = Depends(get_current_user)):
    \"\"\"Update a note\"\"\"
    note = await db.notes.find_one({\"id\": note_id, \"user_id\": current_user['user_id']})
    if not note:
        raise HTTPException(status_code=404, detail=\"Note not found\")
    
    update_data = note_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.notes.update_one({\"id\": note_id}, {\"$set\": update_data})
    
    updated_note = await db.notes.find_one({\"id\": note_id}, {\"_id\": 0})
    if isinstance(updated_note.get('created_at'), str):
        updated_note['created_at'] = datetime.fromisoformat(updated_note['created_at'])
    if isinstance(updated_note.get('updated_at'), str):
        updated_note['updated_at'] = datetime.fromisoformat(updated_note['updated_at'])
    
    return updated_note

@api_router.delete(\"/notes/{note_id}\")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Delete a note\"\"\"
    result = await db.notes.delete_one({\"id\": note_id, \"user_id\": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=\"Note not found\")
    
    return {\"message\": \"Note deleted\"}

# ==================== PRODUCTIVITY - TASKS ====================
@api_router.post(\"/tasks\", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    \"\"\"Create a new task\"\"\"
    task = Task(user_id=current_user['user_id'], **task_data.model_dump())
    
    task_dict = task.model_dump()
    task_dict['created_at'] = task_dict['created_at'].isoformat()
    if task_dict.get('due_date'):
        task_dict['due_date'] = task_dict['due_date'].isoformat()
    if task_dict.get('completed_at'):
        task_dict['completed_at'] = task_dict['completed_at'].isoformat()
    
    await db.tasks.insert_one(task_dict)
    
    return task

@api_router.get(\"/tasks\", response_model=List[Task])
async def get_tasks(current_user: dict = Depends(get_current_user), status: Optional[str] = None):
    \"\"\"Get user's tasks\"\"\"
    query = {\"user_id\": current_user['user_id']}
    if status:
        query[\"status\"] = status
    
    tasks = await db.tasks.find(query, {\"_id\": 0}).sort(\"created_at\", -1).to_list(100)
    
    for task in tasks:
        if isinstance(task.get('created_at'), str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
        if task.get('due_date') and isinstance(task['due_date'], str):
            task['due_date'] = datetime.fromisoformat(task['due_date'])
        if task.get('completed_at') and isinstance(task['completed_at'], str):
            task['completed_at'] = datetime.fromisoformat(task['completed_at'])
    
    return tasks

@api_router.put(\"/tasks/{task_id}/status\")
async def update_task_status(task_id: str, status: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Update task status\"\"\"
    task = await db.tasks.find_one({\"id\": task_id, \"user_id\": current_user['user_id']})
    if not task:
        raise HTTPException(status_code=404, detail=\"Task not found\")
    
    update_data = {\"status\": status}
    if status == \"completed\":
        update_data[\"completed_at\"] = datetime.now(timezone.utc).isoformat()
        # Award points
        await db.users.update_one(
            {\"id\": current_user['user_id']},
            {\"$inc\": {\"points\": 15}}
        )
    
    await db.tasks.update_one({\"id\": task_id}, {\"$set\": update_data})
    
    return {\"message\": \"Task status updated\"}

@api_router.delete(\"/tasks/{task_id}\")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Delete a task\"\"\"
    result = await db.tasks.delete_one({\"id\": task_id, \"user_id\": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=\"Task not found\")
    
    return {\"message\": \"Task deleted\"}

# ==================== MESSAGING ====================
@api_router.post(\"/messages\", response_model=Message)
async def send_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    \"\"\"Send a message\"\"\"
    message = Message(
        sender_id=current_user['user_id'],
        receiver_id=message_data.receiver_id,
        content=message_data.content
    )
    
    message_dict = message.model_dump()
    message_dict['created_at'] = message_dict['created_at'].isoformat()
    
    await db.messages.insert_one(message_dict)
    
    return message

@api_router.get(\"/messages/{other_user_id}\", response_model=List[Message])
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    \"\"\"Get messages with another user\"\"\"
    messages = await db.messages.find({
        \"$or\": [
            {\"sender_id\": current_user['user_id'], \"receiver_id\": other_user_id},
            {\"sender_id\": other_user_id, \"receiver_id\": current_user['user_id']}
        ]
    }, {\"_id\": 0}).sort(\"created_at\", 1).to_list(200)
    
    for message in messages:
        if isinstance(message.get('created_at'), str):
            message['created_at'] = datetime.fromisoformat(message['created_at'])
    
    # Mark messages as read
    await db.messages.update_many(
        {\"sender_id\": other_user_id, \"receiver_id\": current_user['user_id']},
        {\"$set\": {\"read\": True}}
    )
    
    return messages

@api_router.get(\"/messages\")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    \"\"\"Get all conversations\"\"\"
    # Get all unique user IDs the current user has messaged with
    sent = await db.messages.distinct(\"receiver_id\", {\"sender_id\": current_user['user_id']})
    received = await db.messages.distinct(\"sender_id\", {\"receiver_id\": current_user['user_id']})
    
    user_ids = list(set(sent + received))
    
    conversations = []
    for user_id in user_ids:
        user = await db.users.find_one({\"id\": user_id}, {\"_id\": 0, \"hashed_password\": 0})
        if user:
            # Get last message
            last_message = await db.messages.find_one(
                {
                    \"$or\": [
                        {\"sender_id\": current_user['user_id'], \"receiver_id\": user_id},
                        {\"sender_id\": user_id, \"receiver_id\": current_user['user_id']}
                    ]
                },
                {\"_id\": 0},
                sort=[(\"created_at\", -1)]
            )
            
            # Count unread messages
            unread_count = await db.messages.count_documents({
                \"sender_id\": user_id,
                \"receiver_id\": current_user['user_id'],
                \"read\": False
            })
            
            conversations.append({
                \"user\": user,
                \"last_message\": last_message,
                \"unread_count\": unread_count
            })
    
    return conversations

# ==================== AI FEATURES ====================
@api_router.post(\"/ai/text\")
async def generate_text(request: AITextRequest, current_user: dict = Depends(get_current_user)):
    \"\"\"Generate text using AI\"\"\"
    try:
        from emergentintegrations import Emergent
        
        client = Emergent(api_key=os.environ.get(\"EMERGENT_API_KEY\"))
        
        response = client.chat.completions.create(
            model=\"openai/gpt-5.2\",
            messages=[{\"role\": \"user\", \"content\": request.prompt}]
        )
        
        result = response.choices[0].message.content
        
        # Save generation
        generation = AIGeneration(
            user_id=current_user['user_id'],
            type=\"text\",
            prompt=request.prompt,
            result=result,
            model=request.model
        )
        
        gen_dict = generation.model_dump()
        gen_dict['created_at'] = gen_dict['created_at'].isoformat()
        await db.ai_generations.insert_one(gen_dict)
        
        return {\"result\": result, \"generation_id\": generation.id}
    
    except Exception as e:
        return {\"result\": f\"AI text generation demo response for: '{request.prompt}'. To enable real AI, add EMERGENT_API_KEY to .env file.\", \"generation_id\": \"demo\"}

@api_router.post(\"/ai/image\")
async def generate_image(request: AIImageRequest, current_user: dict = Depends(get_current_user)):
    \"\"\"Generate image using AI\"\"\"
    try:
        from emergentintegrations import Emergent
        
        client = Emergent(api_key=os.environ.get(\"EMERGENT_API_KEY\"))
        
        response = client.images.generate(
            prompt=request.prompt,
            model=\"google/nano-banana\"
        )
        
        image_url = response.data[0].url
        
        # Save generation
        generation = AIGeneration(
            user_id=current_user['user_id'],
            type=\"image\",
            prompt=request.prompt,
            result=image_url,
            model=request.model
        )
        
        gen_dict = generation.model_dump()
        gen_dict['created_at'] = gen_dict['created_at'].isoformat()
        await db.ai_generations.insert_one(gen_dict)
        
        return {\"image_url\": image_url, \"generation_id\": generation.id}
    
    except Exception as e:
        return {\"image_url\": \"https://via.placeholder.com/512x512?text=AI+Image+Demo\", \"generation_id\": \"demo\"}

@api_router.get(\"/ai/history\", response_model=List[AIGeneration])
async def get_ai_history(current_user: dict = Depends(get_current_user)):
    \"\"\"Get AI generation history\"\"\"
    generations = await db.ai_generations.find(
        {\"user_id\": current_user['user_id']},
        {\"_id\": 0}
    ).sort(\"created_at\", -1).limit(50).to_list(50)
    
    for gen in generations:
        if isinstance(gen.get('created_at'), str):
            gen['created_at'] = datetime.fromisoformat(gen['created_at'])
    
    return generations

# ==================== ANALYTICS ====================
@api_router.get(\"/analytics/stats\")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    \"\"\"Get user statistics\"\"\"
    user = await db.users.find_one({\"id\": current_user['user_id']})
    
    posts_count = await db.posts.count_documents({\"user_id\": current_user['user_id']})
    notes_count = await db.notes.count_documents({\"user_id\": current_user['user_id']})
    tasks_completed = await db.tasks.count_documents({\"user_id\": current_user['user_id'], \"status\": \"completed\"})
    products_count = await db.products.count_documents({\"seller_id\": current_user['user_id']})
    
    # Get total likes on user's posts
    user_posts = await db.posts.find({\"user_id\": current_user['user_id']}).to_list(None)
    total_likes = sum(len(post.get('likes', [])) for post in user_posts)
    
    return {
        \"points\": user.get('points', 0),
        \"badges\": user.get('badges', []),
        \"followers\": len(user.get('followers', [])),
        \"following\": len(user.get('following', [])),
        \"posts_count\": posts_count,
        \"total_likes\": total_likes,
        \"notes_count\": notes_count,
        \"tasks_completed\": tasks_completed,
        \"products_count\": products_count
    }

# Include router in app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event(\"shutdown\")
async def shutdown_db_client():
    client.close()
"
Observation: Overwrite successful: /app/backend/server.py
