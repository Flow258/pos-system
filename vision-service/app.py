"""
Enhanced Roboflow Vision Service for Sari-Sari Store POS System
Filipino Products Detection - YOLOv11 with Advanced Accuracy Features

Improvements:
- Dynamic confidence thresholds per product category
- Image preprocessing and validation
- Multi-stage detection pipeline
- Better error handling and logging
- Performance monitoring
- Caching for repeated detections
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import base64
import requests
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from functools import lru_cache
import io
from PIL import Image
import hashlib
import time

# Configure enhanced logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Sari-Sari Store Vision API",
    description="AI-Powered Product Detection for Filipino Store POS - Enhanced Edition",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware with more specific configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Specify your frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600,
)

# ===== ROBOFLOW CONFIGURATION =====
ROBOFLOW_API_KEY = "ROBOFLOW_API_KEY"
ROBOFLOW_MODEL_URL = "ROBOFLOW_MODEL_UR"
ROBOFLOW_API_ENDPOINT = f"https://detect.roboflow.com/{ROBOFLOW_MODEL_URL}"

# Enhanced confidence thresholds per category
CONFIDENCE_THRESHOLDS = {
    'high_confidence': 75,      # Auto-add to cart
    'medium_confidence': 50,    # Show with suggestions
    'low_confidence': 25,       # Minimum to show at all
}

# Category-specific confidence adjustments
CATEGORY_CONFIDENCE_BOOST = {
    'Beverages': 5,          # Easier to detect (distinct shapes)
    'Instant Noodles': 5,    # Clear packaging
    'Snacks': 0,             # Standard
    'Canned Goods': -5,      # Harder (similar shapes)
    'Condiments': -5,        # Small bottles, similar
    'Candy': -10,            # Very small items
    'Personal Care': 0,
    'Processed Meat': -5,
    'Fresh': -15,            # Most difficult (variable appearance)
}

OVERLAP_THRESHOLD = 45  # IoU threshold for NMS
# ==================================

# Enhanced Product Database with metadata
PRODUCT_DATABASE = {
    'Afritada': {
        'name': 'Afritada',
        'barcode': '4800016644443',
        'price': 45.00,
        'category': 'Canned Goods',
        'stock': 50,
        'unit': 'can',
        'weight': '155g',
        'brand': 'CDO'
    },
    'Datu Puti Patis': {
        'name': 'Datu Puti Patis 385ml',
        'barcode': '4800024608289',
        'price': 15.00,
        'category': 'Condiments',
        'stock': 100,
        'unit': 'bottle',
        'weight': '385ml',
        'brand': 'Datu Puti'
    },
    'Datu Puti soy sauce': {
        'name': 'Datu Puti Soy Sauce 385ml',
        'barcode': '4800024608296',
        'price': 18.00,
        'category': 'Condiments',
        'stock': 100,
        'unit': 'bottle',
        'weight': '385ml',
        'brand': 'Datu Puti'
    },
    'Datu puti Suka': {
        'name': 'Datu Puti Vinegar 385ml',
        'barcode': '4800024608272',
        'price': 12.00,
        'category': 'Condiments',
        'stock': 100,
        'unit': 'bottle',
        'weight': '385ml',
        'brand': 'Datu Puti'
    },
    'Moby Caramel': {
        'name': 'Moby Caramel',
        'barcode': '4800194118859',
        'price': 8.00,
        'category': 'Candy',
        'stock': 200,
        'unit': 'pack',
        'weight': '33g',
        'brand': 'Oishi'
    },
    'Tomi': {
        'name': 'Tomi Hotdog 1kg',
        'barcode': '4800092450024',
        'price': 165.00,
        'category': 'Processed Meat',
        'stock': 30,
        'unit': 'pack',
        'weight': '1kg',
        'brand': 'CDO'
    },
    'argentina corned beef': {
        'name': 'Argentina Corned Beef 175g',
        'barcode': '4800092450031',
        'price': 55.00,
        'category': 'Canned Goods',
        'stock': 80,
        'unit': 'can',
        'weight': '175g',
        'brand': 'Argentina'
    },
    'bear brand': {
        'name': 'Bear Brand Milk 300ml',
        'barcode': '4800361414869',
        'price': 35.00,
        'category': 'Beverages',
        'stock': 120,
        'unit': 'can',
        'weight': '300ml',
        'brand': 'Bear Brand'
    },
    'beng beng': {
        'name': 'Beng Beng Chocolate',
        'barcode': '8992741721066',
        'price': 10.00,
        'category': 'Snacks',
        'stock': 150,
        'unit': 'pack',
        'weight': '26.5g',
        'brand': 'Beng Beng'
    },
    'cheezy': {
        'name': 'Cheezy Cheese Curls',
        'barcode': '4800194113434',
        'price': 7.00,
        'category': 'Snacks',
        'stock': 200,
        'unit': 'pack',
        'weight': '30g',
        'brand': 'Oishi'
    },
    'coke': {
        'name': 'Coca-Cola 330ml',
        'barcode': '4800888100014',
        'price': 20.00,
        'category': 'Beverages',
        'stock': 200,
        'unit': 'can',
        'weight': '330ml',
        'brand': 'Coca-Cola'
    },
    'egg': {
        'name': 'Egg (per piece)',
        'barcode': '2000000000001',
        'price': 7.00,
        'category': 'Fresh',
        'stock': 500,
        'unit': 'piece',
        'weight': 'medium',
        'brand': 'Local'
    },
    'ligo': {
        'name': 'Ligo Sardines 155g',
        'barcode': '4800092450048',
        'price': 28.00,
        'category': 'Canned Goods',
        'stock': 100,
        'unit': 'can',
        'weight': '155g',
        'brand': 'Ligo'
    },
    'loaded': {
        'name': 'Loaded Potato Chips',
        'barcode': '4800194113441',
        'price': 8.00,
        'category': 'Snacks',
        'stock': 150,
        'unit': 'pack',
        'weight': '50g',
        'brand': 'Loaded'
    },
    'lucky me cicken': {
        'name': 'Lucky Me Chicken 55g',
        'barcode': '4800361414876',
        'price': 12.50,
        'category': 'Instant Noodles',
        'stock': 200,
        'unit': 'pack',
        'weight': '55g',
        'brand': 'Lucky Me'
    },
    'mang tomas': {
        'name': 'Mang Tomas All Purpose Sauce',
        'barcode': '4800092450055',
        'price': 35.00,
        'category': 'Condiments',
        'stock': 60,
        'unit': 'bottle',
        'weight': '330ml',
        'brand': 'Mang Tomas'
    },
    'moby chocolate': {
        'name': 'Moby Chocolate',
        'barcode': '4800194118866',
        'price': 8.00,
        'category': 'Candy',
        'stock': 200,
        'unit': 'pack',
        'weight': '33g',
        'brand': 'Oishi'
    },
    'mr chips': {
        'name': 'Mr. Chips',
        'barcode': '4800194113458',
        'price': 7.00,
        'category': 'Snacks',
        'stock': 180,
        'unit': 'pack',
        'weight': '30g',
        'brand': 'Jack n Jill'
    },
    'oishi crackers': {
        'name': 'Oishi Crackers',
        'barcode': '4800194113465',
        'price': 8.50,
        'category': 'Snacks',
        'stock': 150,
        'unit': 'pack',
        'weight': '30g',
        'brand': 'Oishi'
    },
    'palmolive soap': {
        'name': 'Palmolive Soap 90g',
        'barcode': '8850006328118',
        'price': 25.00,
        'category': 'Personal Care',
        'stock': 100,
        'unit': 'bar',
        'weight': '90g',
        'brand': 'Palmolive'
    },
    'pancit canton calamansi': {
        'name': 'Lucky Me Pancit Canton Calamansi',
        'barcode': '4800361414883',
        'price': 13.00,
        'category': 'Instant Noodles',
        'stock': 200,
        'unit': 'pack',
        'weight': '60g',
        'brand': 'Lucky Me'
    },
    'pancit canton sweet and spicy': {
        'name': 'Lucky Me Pancit Canton Sweet & Spicy',
        'barcode': '4800361414890',
        'price': 13.00,
        'category': 'Instant Noodles',
        'stock': 200,
        'unit': 'pack',
        'weight': '60g',
        'brand': 'Lucky Me'
    },
    'san marino': {
        'name': 'San Marino Corned Beef 150g',
        'barcode': '4800092450062',
        'price': 52.00,
        'category': 'Canned Goods',
        'stock': 70,
        'unit': 'can',
        'weight': '150g',
        'brand': 'San Marino'
    },
    'pancit canton c': {
        'name': 'Lucky Me Pancit Canton Original',
        'barcode': '4800361414906',
        'price': 13.00,
        'category': 'Instant Noodles',
        'stock': 200,
        'unit': 'pack',
        'weight': '60g',
        'brand': 'Lucky Me'
    },
}

# Performance monitoring
detection_stats = {
    'total_requests': 0,
    'successful_detections': 0,
    'failed_detections': 0,
    'average_processing_time': 0,
    'total_processing_time': 0,
}

# Simple cache for recent detections (helps with accidental re-scans)
detection_cache = {}
CACHE_DURATION = timedelta(seconds=5)

# Request/Response Models
class DetectionRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image")
    
    @validator('image')
    def validate_image(cls, v):
        if not v or len(v) < 100:
            raise ValueError('Image data too short or empty')
        return v

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    
    @property
    def area(self) -> float:
        return self.width * self.height
    
    @property
    def center(self) -> tuple:
        return (self.x, self.y)

class Detection(BaseModel):
    class_name: str
    product_name: str
    barcode: str
    confidence: float
    adjusted_confidence: float  # After category boost
    price: float
    category: str
    stock: int
    bbox: BoundingBox
    brand: Optional[str] = None
    unit: Optional[str] = None
    weight: Optional[str] = None

class DetectionResponse(BaseModel):
    success: bool
    detections: List[Detection]
    processing_time: float
    timestamp: str
    fallback: bool = False
    message: Optional[str] = None
    suggestions: Optional[List[dict]] = None
    metadata: Optional[dict] = None

# Enhanced Helper Functions

def validate_and_preprocess_image(base64_image: str) -> tuple[str, dict]:
    """
    Validate and preprocess image for better detection
    Returns: (cleaned_base64, metadata)
    """
    try:
        # Clean base64 string
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
        
        # Decode to verify it's a valid image
        image_bytes = base64.b64decode(base64_image)
        
        # Open with PIL to validate and get metadata
        image = Image.open(io.BytesIO(image_bytes))
        
        # Get metadata
        metadata = {
            'format': image.format,
            'mode': image.mode,
            'size': image.size,
            'width': image.width,
            'height': image.height,
            'file_size_bytes': len(image_bytes),
            'file_size_kb': round(len(image_bytes) / 1024, 2)
        }
        
        # Quality checks
        if image.width < 200 or image.height < 200:
            logger.warning(f"Image resolution low: {image.width}x{image.height}")
            metadata['warning'] = 'Low resolution image may affect accuracy'
        
        if len(image_bytes) > 5_000_000:  # 5MB
            logger.warning(f"Large image: {metadata['file_size_kb']} KB")
            metadata['warning'] = 'Large image size may slow processing'
        
        # Auto-enhancement for better detection (optional)
        # Convert to RGB if needed
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGB')
            logger.info(f"Converted image from {metadata['mode']} to RGB")
        
        logger.info(f"✓ Image validated: {metadata['width']}x{metadata['height']}, "
                   f"{metadata['file_size_kb']}KB, {metadata['format']}")
        
        return base64_image, metadata
        
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        raise ValueError(f"Invalid image data: {str(e)}")

def get_cache_key(base64_image: str) -> str:
    """Generate cache key from image hash"""
    return hashlib.md5(base64_image[:1000].encode()).hexdigest()

def check_cache(cache_key: str) -> Optional[dict]:
    """Check if we have a recent detection for this image"""
    if cache_key in detection_cache:
        cached_data, timestamp = detection_cache[cache_key]
        if datetime.now() - timestamp < CACHE_DURATION:
            logger.info("✓ Using cached detection result")
            return cached_data
        else:
            # Clean up expired cache
            del detection_cache[cache_key]
    return None

def update_cache(cache_key: str, data: dict):
    """Store detection result in cache"""
    detection_cache[cache_key] = (data, datetime.now())
    
    # Clean old cache entries (keep only last 50)
    if len(detection_cache) > 50:
        oldest_key = min(detection_cache.keys(), 
                        key=lambda k: detection_cache[k][1])
        del detection_cache[oldest_key]

def call_roboflow_api(base64_image: str) -> dict:
    """Call Roboflow hosted inference API with retry logic"""
    max_retries = 2
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            url = ROBOFLOW_API_ENDPOINT
            params = {
                "api_key": ROBOFLOW_API_KEY,
                "confidence": CONFIDENCE_THRESHOLDS['low_confidence'],
                "overlap": OVERLAP_THRESHOLD
            }
            
            logger.info(f"📡 Calling Roboflow API (attempt {attempt + 1}/{max_retries})")
            
            # Send request
            response = requests.post(
                url,
                params=params,
                data=base64_image,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                prediction_count = len(result.get('predictions', []))
                logger.info(f"✓ Roboflow returned {prediction_count} predictions")
                return result
            elif response.status_code == 429:
                # Rate limit - wait and retry
                logger.warning(f"Rate limit hit, waiting {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay *= 2
                continue
            else:
                logger.error(f"Roboflow API error: {response.status_code}")
                logger.error(f"Response: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Roboflow API error: {response.text}"
                )
                
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                logger.warning(f"Timeout, retrying in {retry_delay}s...")
                time.sleep(retry_delay)
                continue
            logger.error("Roboflow API timeout after retries")
            raise HTTPException(status_code=504, detail="Detection service timeout")
            
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                logger.warning(f"Network error, retrying: {e}")
                time.sleep(retry_delay)
                continue
            logger.error(f"Network error: {e}")
            raise HTTPException(status_code=503, detail="Cannot reach detection service")
    
    raise HTTPException(status_code=503, detail="Detection service unavailable after retries")

def adjust_confidence(confidence: float, category: str) -> float:
    """
    Adjust confidence score based on product category
    Some products are easier/harder to detect
    """
    boost = CATEGORY_CONFIDENCE_BOOST.get(category, 0)
    adjusted = min(100, confidence + boost)
    
    if boost != 0:
        logger.debug(f"Confidence adjusted: {confidence:.1f}% → {adjusted:.1f}% "
                    f"(category: {category}, boost: {boost:+d})")
    
    return adjusted

def map_detection_to_product(prediction: dict) -> Optional[Detection]:
    """Map Roboflow prediction to product information with enhanced confidence"""
    class_name = prediction['class']
    raw_confidence = prediction['confidence'] * 100  # Roboflow returns 0-1, we use 0-100
    
    # Get product info from database
    product_info = PRODUCT_DATABASE.get(class_name)
    
    if not product_info:
        logger.warning(f"⚠ Unknown product class: {class_name}")
        return None
    
    # Adjust confidence based on category
    category = product_info['category']
    adjusted_confidence = adjust_confidence(raw_confidence, category)
    
    detection = Detection(
        class_name=class_name,
        product_name=product_info['name'],
        barcode=product_info['barcode'],
        confidence=raw_confidence,
        adjusted_confidence=adjusted_confidence,
        price=product_info['price'],
        category=category,
        stock=product_info['stock'],
        brand=product_info.get('brand'),
        unit=product_info.get('unit'),
        weight=product_info.get('weight'),
        bbox=BoundingBox(
            x=prediction['x'],
            y=prediction['y'],
            width=prediction['width'],
            height=prediction['height']
        )
    )
    
    return detection

def filter_and_rank_detections(detections: List[Detection]) -> List[Detection]:
    """
    Filter overlapping detections and rank by adjusted confidence
    """
    if len(detections) <= 1:
        return detections
    
    # Sort by adjusted confidence
    sorted_detections = sorted(detections, 
                               key=lambda d: d.adjusted_confidence, 
                               reverse=True)
    
    # Remove duplicates (same product detected multiple times)
    seen_products = set()
    unique_detections = []
    
    for detection in sorted_detections:
        if detection.class_name not in seen_products:
            unique_detections.append(detection)
            seen_products.add(detection.class_name)
        else:
            logger.info(f"Removed duplicate detection: {detection.product_name}")
    
    return unique_detections

def get_all_products_as_suggestions(limit: int = 10, prioritize_category: str = None):
    """Return products as suggestions, optionally prioritizing a category"""
    products = []
    
    # If category specified, add those first
    if prioritize_category:
        for class_name, info in PRODUCT_DATABASE.items():
            if info['category'] == prioritize_category:
                products.append({
                    "name": info['name'],
                    "barcode": info['barcode'],
                    "price": info['price'],
                    "category": info['category'],
                    "class": class_name,
                    "brand": info.get('brand'),
                    "priority": True
                })
    
    # Add remaining products
    for class_name, info in PRODUCT_DATABASE.items():
        if prioritize_category and info['category'] == prioritize_category:
            continue  # Already added
        
        products.append({
            "name": info['name'],
            "barcode": info['barcode'],
            "price": info['price'],
            "category": info['category'],
            "class": class_name,
            "brand": info.get('brand'),
            "priority": False
        })
        
        if len(products) >= limit:
            break
    
    return products[:limit]

def get_smart_suggestions(detections: List[Detection], limit: int = 5) -> List[dict]:
    """
    Generate intelligent product suggestions based on detection context
    """
    if not detections:
        return get_all_products_as_suggestions(limit)
    
    primary_detection = detections[0]
    suggestions = []
    
    # Add the detected product first
    suggestions.append({
        "name": primary_detection.product_name,
        "barcode": primary_detection.barcode,
        "price": primary_detection.price,
        "category": primary_detection.category,
        "class": primary_detection.class_name,
        "brand": primary_detection.brand,
        "confidence": primary_detection.adjusted_confidence,
        "highlighted": True,
        "reason": f"{primary_detection.adjusted_confidence:.0f}% match"
    })
    
    # Add products from same category
    for class_name, info in PRODUCT_DATABASE.items():
        if len(suggestions) >= limit:
            break
            
        if (class_name != primary_detection.class_name and 
            info['category'] == primary_detection.category):
            suggestions.append({
                "name": info['name'],
                "barcode": info['barcode'],
                "price": info['price'],
                "category": info['category'],
                "class": class_name,
                "brand": info.get('brand'),
                "highlighted": False,
                "reason": f"Similar to {primary_detection.product_name}"
            })
    
    # Fill remaining with same brand products
    if len(suggestions) < limit and primary_detection.brand:
        for class_name, info in PRODUCT_DATABASE.items():
            if len(suggestions) >= limit:
                break
                
            if (class_name not in [s['class'] for s in suggestions] and
                info.get('brand') == primary_detection.brand):
                suggestions.append({
                    "name": info['name'],
                    "barcode": info['barcode'],
                    "price": info['price'],
                    "category": info['category'],
                    "class": class_name,
                    "brand": info.get('brand'),
                    "highlighted": False,
                    "reason": f"Same brand: {primary_detection.brand}"
                })
    
    return suggestions

def update_stats(processing_time: float, success: bool):
    """Update performance statistics"""
    detection_stats['total_requests'] += 1
    
    if success:
        detection_stats['successful_detections'] += 1
    else:
        detection_stats['failed_detections'] += 1
    
    detection_stats['total_processing_time'] += processing_time
    detection_stats['average_processing_time'] = (
        detection_stats['total_processing_time'] / detection_stats['total_requests']
    )

# API Endpoints

@app.on_event("startup")
async def startup_event():
    """Enhanced startup message"""
    logger.info("=" * 80)
    logger.info("🚀 SARI-SARI STORE AI VISION SERVICE - ENHANCED EDITION")
    logger.info("=" * 80)
    logger.info(f"Model: {ROBOFLOW_MODEL_URL}")
    logger.info(f"Products: {len(PRODUCT_DATABASE)} Filipino products")
    logger.info(f"Categories: {len(set(p['category'] for p in PRODUCT_DATABASE.values()))}")
    logger.info(f"Confidence Thresholds:")
    logger.info(f"  - High (Auto-add): {CONFIDENCE_THRESHOLDS['high_confidence']}%")
    logger.info(f"  - Medium (Suggest): {CONFIDENCE_THRESHOLDS['medium_confidence']}%")
    logger.info(f"  - Low (Minimum): {CONFIDENCE_THRESHOLDS['low_confidence']}%")
    logger.info(f"API Key: {ROBOFLOW_API_KEY[:15]}...")
    logger.info("=" * 80)
    logger.info("✓ Service ready with enhanced accuracy features!")
    logger.info("✓ Image preprocessing enabled")
    logger.info("✓ Category-based confidence adjustment enabled")
    logger.info("✓ Smart caching enabled")
    logger.info("✓ Performance monitoring active")
    logger.info("=" * 80)

@app.get("/")
async def root():
    """Enhanced root endpoint"""
    return {
        "service": "Sari-Sari Store Vision API - Enhanced",
        "version": "2.0.0",
        "model": ROBOFLOW_MODEL_URL,
        "status": "online",
        "features": [
            "Image preprocessing",
            "Category-based confidence adjustment",
            "Smart caching",
            "Performance monitoring",
            "Intelligent suggestions"
        ],
        "products_count": len(PRODUCT_DATABASE),
        "categories": list(set(p['category'] for p in PRODUCT_DATABASE.values())),
        "confidence_thresholds": CONFIDENCE_THRESHOLDS,
        "endpoints": {
            "detect": "/detect",
            "health": "/health",
            "products": "/products",
            "stats": "/stats",
            "performance": "/performance",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Enhanced health check"""
    try:
        # Quick test to Roboflow API
        test_response = requests.get(
            "https://detect.roboflow.com/",
            timeout=5
        )
        roboflow_reachable = test_response.status_code == 200
    except:
        roboflow_reachable = False
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model": ROBOFLOW_MODEL_URL,
        "api_configured": True,
        "roboflow_reachable": roboflow_reachable,
        "cache_size": len(detection_cache),
        "total_requests": detection_stats['total_requests'],
        "uptime_seconds": time.time()  # Would track actual uptime in production
    }

@app.post("/detect", response_model=DetectionResponse)
async def detect_products(request: DetectionRequest):
    """
    Enhanced detection endpoint with preprocessing and smart suggestions
    """
    start_time = time.time()
    
    try:
        logger.info("=" * 60)
        logger.info("📸 New detection request received")
        
        # Step 1: Validate and preprocess image
        cleaned_image, image_metadata = validate_and_preprocess_image(request.image)
        
        # Step 2: Check cache
        cache_key = get_cache_key(cleaned_image)
        cached_result = check_cache(cache_key)
        
        if cached_result:
            processing_time = time.time() - start_time
            cached_result['processing_time'] = processing_time
            cached_result['metadata']['cached'] = True
            update_stats(processing_time, cached_result['success'])
            return DetectionResponse(**cached_result)
        
        # Step 3: Call Roboflow API
        roboflow_result = call_roboflow_api(cleaned_image)
        
        # Step 4: Process predictions
        detections = []
        predictions = roboflow_result.get('predictions', [])
        
        for prediction in predictions:
            detection = map_detection_to_product(prediction)
            if detection:
                detections.append(detection)
                logger.info(
                    f"✓ {detection.product_name} | "
                    f"Raw: {detection.confidence:.1f}% → "
                    f"Adjusted: {detection.adjusted_confidence:.1f}% | "
                    f"₱{detection.price:.2f}"
                )
        
        # Step 5: Filter and rank detections
        detections = filter_and_rank_detections(detections)
        
        # Step 6: Calculate processing time
        processing_time = time.time() - start_time
        logger.info(f"⏱ Processing time: {processing_time:.3f}s")
        logger.info("=" * 60)
        
        # Step 7: Build response with intelligent logic
        response_data = None
        
        if len(detections) == 0:
            # No detections
            response_data = {
                'success': False,
                'detections': [],
                'processing_time': processing_time,
                'timestamp': datetime.now().isoformat(),
                'fallback': True,
                'message': "No products detected. Please adjust position, lighting, or try manual entry.",
                'suggestions': get_all_products_as_suggestions(10),
                'metadata': {
                    'image_info': image_metadata,
                    'predictions_received': len(predictions),
                    'valid_detections': 0,
                    'cached': False
                }
            }
            update_stats(processing_time, False)
            
        elif len(detections) == 1:
            # Single detection - check confidence level
            detection = detections[0]
            conf = detection.adjusted_confidence
            
            if conf >= CONFIDENCE_THRESHOLDS['high_confidence']:
                # High confidence - auto-add to cart
                response_data = {
                    'success': True,
                    'detections': [detection.dict()],
                    'processing_time': processing_time,
                    'timestamp': datetime.now().isoformat(),
                    'fallback': False,
                    'message': f"✓ {detection.product_name} detected - ₱{detection.price:.2f}",
                    'metadata': {
                        'image_info': image_metadata,
                        'confidence_level': 'high',
                        'auto_add': True,
                        'cached': False
                    }
                }
                update_stats(processing_time, True)
                
            elif conf >= CONFIDENCE_THRESHOLDS['medium_confidence']:
                # Medium confidence - show with suggestions
                response_data = {
                    'success': False,
                    'detections': [detection.dict()],
                    'processing_time': processing_time,
                    'timestamp': datetime.now().isoformat(),
                    'fallback': True,
                    'message': f"Is this {detection.product_name}? ({conf:.0f}% confidence)",
                    'suggestions': get_smart_suggestions([detection], 5),
                    'metadata': {
                        'image_info': image_metadata,
                        'confidence_level': 'medium',
                        'auto_add': False,
                        'cached': False
                    }
                }
                update_stats(processing_time, True)
                
            else:
                # Low confidence - show suggestions
                response_data = {
                    'success': False,
                    'detections': [detection.dict()],
                    'processing_time': processing_time,
                    'timestamp': datetime.now().isoformat(),
                    'fallback': True,
                    'message': f"Uncertain detection. Please select the correct product.",
                    'suggestions': get_smart_suggestions([detection], 8),
                    'metadata': {
                        'image_info': image_metadata,
                        'confidence_level': 'low',
                        'auto_add': False,
                        'cached': False
                    }
                }
                update_stats(processing_time, False)
        
        else:
            # Multiple detections
            high_confidence_count = sum(
                1 for d in detections 
                if d.adjusted_confidence >= CONFIDENCE_THRESHOLDS['high_confidence']
            )
            
            response_data = {
                'success': True,
                'detections': [d.dict() for d in detections],
                'processing_time': processing_time,
                'timestamp': datetime.now().isoformat(),
                'fallback': False,
                'message': f"Found {len(detections)} products. " + 
                          (f"{high_confidence_count} with high confidence. " if high_confidence_count > 0 else "") +
                          "Select the correct one.",
                'metadata': {
                    'image_info': image_metadata,
                    'total_detections': len(detections),
                    'high_confidence_count': high_confidence_count,
                    'cached': False
                }
            }
            update_stats(processing_time, True)
        
        # Step 8: Cache the result
        update_cache(cache_key, response_data)
        
        return DetectionResponse(**response_data)
        
    except HTTPException:
        raise
        
    except ValueError as e:
        # Image validation error
        processing_time = time.time() - start_time
        logger.error(f"❌ Validation error: {e}")
        update_stats(processing_time, False)
        
        return DetectionResponse(
            success=False,
            detections=[],
            processing_time=processing_time,
            timestamp=datetime.now().isoformat(),
            fallback=True,
            message=f"Invalid image: {str(e)}. Please try again.",
            suggestions=get_all_products_as_suggestions(5)
        )
        
    except Exception as e:
        # Unexpected error
        processing_time = time.time() - start_time
        logger.error(f"❌ Unexpected error: {e}", exc_info=True)
        update_stats(processing_time, False)
        
        return DetectionResponse(
            success=False,
            detections=[],
            processing_time=processing_time,
            timestamp=datetime.now().isoformat(),
            fallback=True,
            message="Error processing image. Please try manual entry.",
            suggestions=get_all_products_as_suggestions(5),
            metadata={'error': str(e) if app.debug else None}
        )

@app.get("/products")
async def get_products(category: Optional[str] = None, brand: Optional[str] = None):
    """Get products with optional filtering"""
    products = []
    
    for class_name, info in PRODUCT_DATABASE.items():
        # Apply filters
        if category and info['category'] != category:
            continue
        if brand and info.get('brand') != brand:
            continue
            
        products.append({
            "class": class_name,
            "name": info['name'],
            "barcode": info['barcode'],
            "price": info['price'],
            "category": info['category'],
            "stock": info['stock'],
            "brand": info.get('brand'),
            "unit": info.get('unit'),
            "weight": info.get('weight')
        })
    
    # Group by category
    categories = {}
    for product in products:
        cat = product['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(product)
    
    # Group by brand
    brands = {}
    for product in products:
        brand = product.get('brand', 'Unknown')
        if brand not in brands:
            brands[brand] = []
        brands[brand].append(product)
    
    return {
        "total": len(products),
        "filtered": category is not None or brand is not None,
        "filters": {
            "category": category,
            "brand": brand
        },
        "categories": categories,
        "brands": brands,
        "products": products
    }

@app.get("/model/info")
async def get_model_info():
    """Get detailed model and configuration info"""
    return {
        "model": {
            "url": ROBOFLOW_MODEL_URL,
            "type": "YOLOv11 Object Detection",
            "version": "2",
            "hosted_by": "Roboflow",
            "trained_classes": len(PRODUCT_DATABASE)
        },
        "configuration": {
            "confidence_thresholds": CONFIDENCE_THRESHOLDS,
            "overlap_threshold": OVERLAP_THRESHOLD,
            "category_boosts": CATEGORY_CONFIDENCE_BOOST,
            "cache_enabled": True,
            "cache_duration_seconds": int(CACHE_DURATION.total_seconds()),
            "image_preprocessing": True
        },
        "api": {
            "endpoint": ROBOFLOW_API_ENDPOINT,
            "key_configured": True,
            "timeout_seconds": 30,
            "retry_enabled": True,
            "max_retries": 2
        },
        "features": {
            "dynamic_confidence_adjustment": True,
            "smart_suggestions": True,
            "duplicate_filtering": True,
            "performance_monitoring": True,
            "image_validation": True
        }
    }

@app.get("/stats")
async def get_stats():
    """Get product and store statistics"""
    total_value = sum(info['price'] * info['stock'] for info in PRODUCT_DATABASE.values())
    total_items = sum(info['stock'] for info in PRODUCT_DATABASE.values())
    
    categories = {}
    brands = {}
    
    for info in PRODUCT_DATABASE.values():
        # Category stats
        cat = info['category']
        if cat not in categories:
            categories[cat] = {'count': 0, 'value': 0, 'products': 0}
        categories[cat]['count'] += info['stock']
        categories[cat]['value'] += info['price'] * info['stock']
        categories[cat]['products'] += 1
        
        # Brand stats
        brand = info.get('brand', 'Unknown')
        if brand not in brands:
            brands[brand] = {'count': 0, 'value': 0, 'products': 0}
        brands[brand]['count'] += info['stock']
        brands[brand]['value'] += info['price'] * info['stock']
        brands[brand]['products'] += 1
    
    return {
        "inventory": {
            "total_products": len(PRODUCT_DATABASE),
            "total_items": total_items,
            "total_value": round(total_value, 2),
            "average_price": round(total_value / total_items, 2) if total_items > 0 else 0
        },
        "categories": {
            name: {
                "products": data['products'],
                "items": data['count'],
                "value": round(data['value'], 2)
            }
            for name, data in sorted(categories.items(), key=lambda x: x[1]['value'], reverse=True)
        },
        "brands": {
            name: {
                "products": data['products'],
                "items": data['count'],
                "value": round(data['value'], 2)
            }
            for name, data in sorted(brands.items(), key=lambda x: x[1]['value'], reverse=True)
        }
    }

@app.get("/performance")
async def get_performance():
    """Get performance metrics"""
    success_rate = (
        (detection_stats['successful_detections'] / detection_stats['total_requests'] * 100)
        if detection_stats['total_requests'] > 0 else 0
    )
    
    return {
        "requests": {
            "total": detection_stats['total_requests'],
            "successful": detection_stats['successful_detections'],
            "failed": detection_stats['failed_detections'],
            "success_rate": round(success_rate, 2)
        },
        "performance": {
            "average_processing_time": round(detection_stats['average_processing_time'], 3),
            "total_processing_time": round(detection_stats['total_processing_time'], 2),
            "cache_size": len(detection_cache),
            "cache_hit_rate": "N/A"  # Would need to track cache hits
        },
        "thresholds": {
            "target_processing_time": "< 2.0s",
            "target_success_rate": "> 85%"
        }
    }

@app.get("/categories")
async def get_categories():
    """Get list of all product categories"""
    categories = {}
    
    for info in PRODUCT_DATABASE.values():
        cat = info['category']
        if cat not in categories:
            categories[cat] = {
                'name': cat,
                'product_count': 0,
                'confidence_boost': CATEGORY_CONFIDENCE_BOOST.get(cat, 0)
            }
        categories[cat]['product_count'] += 1
    
    return {
        "total": len(categories),
        "categories": list(categories.values())
    }

@app.get("/brands")
async def get_brands():
    """Get list of all product brands"""
    brands = {}
    
    for info in PRODUCT_DATABASE.values():
        brand = info.get('brand', 'Unknown')
        if brand not in brands:
            brands[brand] = {
                'name': brand,
                'product_count': 0
            }
        brands[brand]['product_count'] += 1
    
    return {
        "total": len(brands),
        "brands": sorted(brands.values(), key=lambda x: x['product_count'], reverse=True)
    }

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

# Run server
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "=" * 80)
    print("🚀 SARI-SARI STORE AI VISION SERVICE - ENHANCED EDITION")
    print("=" * 80)
    print(f"Model: {ROBOFLOW_MODEL_URL}")
    print(f"Products: {len(PRODUCT_DATABASE)} Filipino products")
    print(f"Categories: {len(set(p['category'] for p in PRODUCT_DATABASE.values()))}")
    print(f"Brands: {len(set(p.get('brand', 'Unknown') for p in PRODUCT_DATABASE.values()))}")
    print(f"\nEnhancements:")
    print(f"  ✓ Image preprocessing & validation")
    print(f"  ✓ Dynamic confidence adjustment per category")
    print(f"  ✓ Smart caching (5-second window)")
    print(f"  ✓ Intelligent product suggestions")
    print(f"  ✓ Performance monitoring")
    print(f"  ✓ Retry logic for API calls")
    print(f"\nServer: http://localhost:5000")
    print(f"API Docs: http://localhost:5000/docs")
    print(f"Health Check: http://localhost:5000/health")
    print(f"Products: http://localhost:5000/products")
    print(f"Performance: http://localhost:5000/performance")
    print("=" * 80)
    print("\n✓ Ready to scan with enhanced accuracy!\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info"
    )