"""
Roboflow Vision Service for Sari-Sari Store POS System
Filipino Products Detection - YOLOv11
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import requests
import logging
from datetime import datetime
from typing import List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Sari-Sari Store Vision API",
    description="AI-Powered Product Detection for Filipino Store POS",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== ROBOFLOW CONFIGURATION =====
ROBOFLOW_API_KEY = "jCWzAkm0Ci7GdDHN1hvz"
ROBOFLOW_MODEL_URL = "sari-sari-store-detection-ylu0e-yvreo/2"
ROBOFLOW_API_ENDPOINT = f"https://detect.roboflow.com/{ROBOFLOW_MODEL_URL}"
CONFIDENCE_THRESHOLD = 25  # 50% minimum (Roboflow uses 0-100 scale)
OVERLAP_THRESHOLD = 45  # IoU threshold for NMS
# ==================================

# Product Database - 30 Filipino Products
PRODUCT_DATABASE = {
    'Afritada': {
        'name': 'Afritada',
        'barcode': '4800016644443',
        'price': 45.00,
        'category': 'Canned Goods',
        'stock': 50
    },
    'Datu Puti Patis': {
        'name': 'Datu Puti Patis 385ml',
        'barcode': '4800024608289',
        'price': 15.00,
        'category': 'Condiments',
        'stock': 100
    },
    'Datu Puti soy sauce': {
        'name': 'Datu Puti Soy Sauce 385ml',
        'barcode': '4800024608296',
        'price': 18.00,
        'category': 'Condiments',
        'stock': 100
    },
    'Datu puti Suka': {
        'name': 'Datu Puti Vinegar 385ml',
        'barcode': '4800024608272',
        'price': 12.00,
        'category': 'Condiments',
        'stock': 100
    },
    'Moby Caramel': {
        'name': 'Moby Caramel',
        'barcode': '4800194118859',
        'price': 8.00,
        'category': 'Candy',
        'stock': 200
    },
    'Tomi': {
        'name': 'Tomi Hotdog 1kg',
        'barcode': '4800092450024',
        'price': 165.00,
        'category': 'Processed Meat',
        'stock': 30
    },
    'argentina corned beef': {
        'name': 'Argentina Corned Beef 175g',
        'barcode': '4800092450031',
        'price': 55.00,
        'category': 'Canned Goods',
        'stock': 80
    },
    'bear brand': {
        'name': 'Bear Brand Milk 300ml',
        'barcode': '4800361414869',
        'price': 35.00,
        'category': 'Beverages',
        'stock': 120
    },
    'beng beng': {
        'name': 'Beng Beng Chocolate',
        'barcode': '8992741721066',
        'price': 10.00,
        'category': 'Snacks',
        'stock': 150
    },
    'cheezy': {
        'name': 'Cheezy Cheese Curls',
        'barcode': '4800194113434',
        'price': 7.00,
        'category': 'Snacks',
        'stock': 200
    },
    'coke': {
        'name': 'Coca-Cola 330ml',
        'barcode': '4800888100014',
        'price': 20.00,
        'category': 'Beverages',
        'stock': 200
    },
    'egg': {
        'name': 'Egg (per piece)',
        'barcode': '2000000000001',
        'price': 7.00,
        'category': 'Fresh',
        'stock': 500
    },
    'ligo': {
        'name': 'Ligo Sardines 155g',
        'barcode': '4800092450048',
        'price': 28.00,
        'category': 'Canned Goods',
        'stock': 100
    },
    'loaded': {
        'name': 'Loaded Potato Chips',
        'barcode': '4800194113441',
        'price': 8.00,
        'category': 'Snacks',
        'stock': 150
    },
    'lucky me cicken': {
        'name': 'Lucky Me Chicken 55g',
        'barcode': '4800361414876',
        'price': 12.50,
        'category': 'Instant Noodles',
        'stock': 200
    },
    'mang tomas': {
        'name': 'Mang Tomas All Purpose Sauce',
        'barcode': '4800092450055',
        'price': 35.00,
        'category': 'Condiments',
        'stock': 60
    },
    'moby chocolate': {
        'name': 'Moby Chocolate',
        'barcode': '4800194118866',
        'price': 8.00,
        'category': 'Candy',
        'stock': 200
    },
    'mr chips': {
        'name': 'Mr. Chips',
        'barcode': '4800194113458',
        'price': 7.00,
        'category': 'Snacks',
        'stock': 180
    },
    'oishi crackers': {
        'name': 'Oishi Crackers',
        'barcode': '4800194113465',
        'price': 8.50,
        'category': 'Snacks',
        'stock': 150
    },
    'palmolive soap': {
        'name': 'Palmolive Soap 90g',
        'barcode': '8850006328118',
        'price': 25.00,
        'category': 'Personal Care',
        'stock': 100
    },
    'pancit canton calamansi': {
        'name': 'Lucky Me Pancit Canton Calamansi',
        'barcode': '4800361414883',
        'price': 13.00,
        'category': 'Instant Noodles',
        'stock': 200
    },
    'pancit canton sweet and spicy': {
        'name': 'Lucky Me Pancit Canton Sweet & Spicy',
        'barcode': '4800361414890',
        'price': 13.00,
        'category': 'Instant Noodles',
        'stock': 200
    },
    'san marino': {
        'name': 'San Marino Corned Beef 150g',
        'barcode': '4800092450062',
        'price': 52.00,
        'category': 'Canned Goods',
        'stock': 70
    },
    # Add remaining 7 products based on your actual inventory
    'pancit canton c': {
        'name': 'Lucky Me Pancit Canton Original',
        'barcode': '4800361414906',
        'price': 13.00,
        'category': 'Instant Noodles',
        'stock': 200
    },
}

# Request/Response Models
class DetectionRequest(BaseModel):
    image: str  # Base64 encoded image

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class Detection(BaseModel):
    class_name: str
    product_name: str
    barcode: str
    confidence: float
    price: float
    category: str
    stock: int
    bbox: BoundingBox

class DetectionResponse(BaseModel):
    success: bool
    detections: List[Detection]
    processing_time: float
    timestamp: str
    fallback: bool = False
    message: Optional[str] = None
    suggestions: Optional[List[dict]] = None

# Helper Functions
def call_roboflow_api(base64_image: str) -> dict:
    """Call Roboflow hosted inference API"""
    try:
        # Clean base64 string
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
        
        # Prepare request
        url = ROBOFLOW_API_ENDPOINT
        params = {
            "api_key": ROBOFLOW_API_KEY,
            "confidence": CONFIDENCE_THRESHOLD,
            "overlap": OVERLAP_THRESHOLD
        }
        
        logger.info(f"Calling Roboflow API: {url}")
        
        # Send request
        response = requests.post(
            url,
            params=params,
            data=base64_image,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30
        )
        
        if response.status_code != 200:
            logger.error(f"Roboflow API error: {response.status_code}")
            logger.error(f"Response: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Roboflow API error: {response.text}"
            )
        
        result = response.json()
        logger.info(f"Roboflow returned {len(result.get('predictions', []))} predictions")
        
        return result
        
    except requests.exceptions.Timeout:
        logger.error("Roboflow API timeout")
        raise HTTPException(status_code=504, detail="Detection service timeout")
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error: {e}")
        raise HTTPException(status_code=503, detail="Cannot reach detection service")

def map_detection_to_product(prediction: dict) -> Optional[Detection]:
    """Map Roboflow prediction to product information"""
    class_name = prediction['class']
    confidence = prediction['confidence']
    
    # Get product info from database
    product_info = PRODUCT_DATABASE.get(class_name)
    
    if not product_info:
        logger.warning(f"Unknown product class: {class_name}")
        return None
    
    return Detection(
        class_name=class_name,
        product_name=product_info['name'],
        barcode=product_info['barcode'],
        confidence=confidence,
        price=product_info['price'],
        category=product_info['category'],
        stock=product_info['stock'],
        bbox=BoundingBox(
            x=prediction['x'],
            y=prediction['y'],
            width=prediction['width'],
            height=prediction['height']
        )
    )

def get_all_products_as_suggestions(limit: int = 10):
    """Return products as suggestions"""
    return [
        {
            "name": info['name'],
            "barcode": info['barcode'],
            "price": info['price'],
            "category": info['category'],
            "class": class_name
        }
        for class_name, info in list(PRODUCT_DATABASE.items())[:limit]
    ]

def get_similar_products(detected_class: str, limit: int = 5):
    """Get similar products from same category"""
    suggestions = []
    
    # Add detected product first
    if detected_class in PRODUCT_DATABASE:
        info = PRODUCT_DATABASE[detected_class]
        suggestions.append({
            "name": info['name'],
            "barcode": info['barcode'],
            "price": info['price'],
            "category": info['category'],
            "class": detected_class,
            "highlighted": True
        })
    
    # Add products from same category
    detected_category = PRODUCT_DATABASE.get(detected_class, {}).get('category')
    
    for class_name, info in PRODUCT_DATABASE.items():
        if len(suggestions) >= limit:
            break
        if class_name != detected_class and info['category'] == detected_category:
            suggestions.append({
                "name": info['name'],
                "barcode": info['barcode'],
                "price": info['price'],
                "category": info['category'],
                "class": class_name,
                "highlighted": False
            })
    
    return suggestions

# API Endpoints

@app.on_event("startup")
async def startup_event():
    """Startup message"""
    logger.info("=" * 70)
    logger.info("Sari-Sari Store Vision API Starting...")
    logger.info("=" * 70)
    logger.info(f"✓ Model: {ROBOFLOW_MODEL_URL}")
    logger.info(f"✓ Products: {len(PRODUCT_DATABASE)}")
    logger.info(f"✓ Confidence: {CONFIDENCE_THRESHOLD}%")
    logger.info(f"✓ API Key: {ROBOFLOW_API_KEY[:10]}...")
    logger.info("=" * 70)
    logger.info("✓ Service ready to detect products!")
    logger.info("=" * 70)

@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "Sari-Sari Store Vision API",
        "version": "1.0.0",
        "model": ROBOFLOW_MODEL_URL,
        "status": "online",
        "products_count": len(PRODUCT_DATABASE),
        "confidence_threshold": f"{CONFIDENCE_THRESHOLD}%",
        "endpoints": {
            "detect": "/detect",
            "health": "/health",
            "products": "/products",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model": ROBOFLOW_MODEL_URL,
        "api_configured": True
    }

@app.post("/detect", response_model=DetectionResponse)
async def detect_products(request: DetectionRequest):
    """
    Main detection endpoint
    Receives base64 image and returns detected products
    """
    start_time = datetime.now()
    
    try:
        logger.info("=" * 50)
        logger.info("New detection request received")
        
        # Call Roboflow API
        result = call_roboflow_api(request.image)
        
        # Process predictions
        detections = []
        predictions = result.get('predictions', [])
        
        for prediction in predictions:
            detection = map_detection_to_product(prediction)
            if detection:
                detections.append(detection)
                logger.info(
                    f"✓ {detection.product_name} | "
                    f"₱{detection.price:.2f} | "
                    f"{detection.confidence:.1%}"
                )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"⏱ Processing time: {processing_time:.3f}s")
        logger.info("=" * 50)
        
        # Build response based on results
        if len(detections) == 0:
            return DetectionResponse(
                success=False,
                detections=[],
                processing_time=processing_time,
                timestamp=datetime.now().isoformat(),
                fallback=True,
                message="No products detected. Please adjust position or lighting.",
                suggestions=get_all_products_as_suggestions()
            )
        
        elif len(detections) == 1:
            confidence = detections[0].confidence
            if confidence >= 0.75:
                # High confidence - auto-add
                return DetectionResponse(
                    success=True,
                    detections=detections,
                    processing_time=processing_time,
                    timestamp=datetime.now().isoformat(),
                    message=f"✓ {detections[0].product_name} - ₱{detections[0].price:.2f}"
                )
            else:
                # Low confidence - ask user
                return DetectionResponse(
                    success=False,
                    detections=detections,
                    processing_time=processing_time,
                    timestamp=datetime.now().isoformat(),
                    fallback=True,
                    message=f"Is this {detections[0].product_name}?",
                    suggestions=get_similar_products(detections[0].class_name)
                )
        
        else:
            # Multiple detections
            return DetectionResponse(
                success=True,
                detections=detections,
                processing_time=processing_time,
                timestamp=datetime.now().isoformat(),
                message=f"Found {len(detections)} products. Select the correct one."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Detection error: {e}", exc_info=True)
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return DetectionResponse(
            success=False,
            detections=[],
            processing_time=processing_time,
            timestamp=datetime.now().isoformat(),
            fallback=True,
            message=f"Error: {str(e)}",
            suggestions=get_all_products_as_suggestions()
        )

@app.get("/products")
async def get_products():
    """Get all supported products"""
    products = [
        {
            "class": class_name,
            "name": info['name'],
            "barcode": info['barcode'],
            "price": info['price'],
            "category": info['category'],
            "stock": info['stock']
        }
        for class_name, info in PRODUCT_DATABASE.items()
    ]
    
    # Group by category
    categories = {}
    for product in products:
        cat = product['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(product)
    
    return {
        "total": len(products),
        "categories": categories,
        "products": products
    }

@app.get("/model/info")
async def get_model_info():
    """Get model and configuration info"""
    return {
        "model": {
            "url": ROBOFLOW_MODEL_URL,
            "type": "YOLOv11 Object Detection",
            "version": "2",
            "hosted_by": "Roboflow"
        },
        "configuration": {
            "confidence_threshold": CONFIDENCE_THRESHOLD,
            "overlap_threshold": OVERLAP_THRESHOLD,
            "num_classes": len(PRODUCT_DATABASE)
        },
        "api": {
            "endpoint": ROBOFLOW_API_ENDPOINT,
            "key_configured": True
        }
    }

@app.get("/stats")
async def get_stats():
    """Get product statistics"""
    total_value = sum(info['price'] * info['stock'] for info in PRODUCT_DATABASE.values())
    total_items = sum(info['stock'] for info in PRODUCT_DATABASE.values())
    
    categories = {}
    for info in PRODUCT_DATABASE.values():
        cat = info['category']
        if cat not in categories:
            categories[cat] = {'count': 0, 'value': 0}
        categories[cat]['count'] += info['stock']
        categories[cat]['value'] += info['price'] * info['stock']
    
    return {
        "total_products": len(PRODUCT_DATABASE),
        "total_items": total_items,
        "total_value": round(total_value, 2),
        "categories": categories
    }

# Run server
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "=" * 70)
    print("SARI-SARI STORE AI VISION SERVICE")
    print("=" * 70)
    print(f"Model: {ROBOFLOW_MODEL_URL}")
    print(f"Products: {len(PRODUCT_DATABASE)} Filipino products")
    print(f"Confidence: {CONFIDENCE_THRESHOLD}%")
    print(f"\nServer: http://localhost:5000")
    print(f"API Docs: http://localhost:5000/docs")
    print(f"Health: http://localhost:5000/health")
    print(f"Products: http://localhost:5000/products")
    print("=" * 70)
    print("\n✓ Ready to scan products!\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info"
    )