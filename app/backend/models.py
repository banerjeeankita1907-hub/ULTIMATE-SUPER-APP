from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import uuid

# ==================== USER MODELS ====================
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "user"  # user, seller, admin

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    followers: List[str] = Field(default_factory=list)
    following: List[str] = Field(default_factory=list)
    points: int = 0
    badges: List[str] = Field(default_factory=list)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

# ==================== SOCIAL MODELS ====================
class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    user_avatar: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    likes: List[str] = Field(default_factory=list)  # user IDs who liked
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    post_id: str
    content: str

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str
    username: str
    user_avatar: Optional[str] = None
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== E-COMMERCE MODELS ====================
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: Optional[str] = None
    category: str
    stock: int = 0

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    seller_name: str
    name: str
    description: str
    price: float
    image_url: Optional[str] = None
    category: str
    stock: int
    rating: float = 0.0
    reviews_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = Field(default_factory=list)
    total: float = 0.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[CartItem]
    total: float
    shipping_address: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    total: float
    shipping_address: str
    status: str = "pending"  # pending, processing, shipped, delivered
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== PRODUCTIVITY MODELS ====================
class NoteCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = Field(default_factory=list)

class Note(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high
    due_date: Optional[datetime] = None

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"  # pending, in_progress, completed
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

# ==================== MESSAGING MODELS ====================
class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AI MODELS ====================
class AITextRequest(BaseModel):
    prompt: str
    model: str = "gpt-5.2"

class AIImageRequest(BaseModel):
    prompt: str
    model: str = "nano-banana"

class AIGeneration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # text, image
    prompt: str
    result: str
    model: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
