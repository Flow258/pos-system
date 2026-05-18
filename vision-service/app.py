"""
Simple Local Vision Service for Family Store POS
Uses your trained my_model.pt locally - No Roboflow API needed!

Your 7 Products:
- ariel
- birch_tree
- downy
- great_taste
- soy_sauce
- sukang_puti
- wings
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import cv2
import numpy as np
from ultralytics import YOLO
import logging
from datetime import datetime
from typing import List, Optional
import io
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Family Store Vision API",
    description="Local YOLO11 Product Detection",
    version="1.0.0"
)

# CORS - Allow your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== YOUR MODEL AND PRODUCTS =====
MODEL_PATH = "my_model.pt"  # Your trained model
CONFIDENCE_THRESHOLD = 0.5   # 50% confidence minimum

# YOUR 7 PRODUCTS - Update barcodes with your real ones!
PRODUCT_DATABASE = {
    'ariel': {
        'name': 'Ariel Detergent',
        'barcode': '4800888100001',  # UPDATE THIS
        'price': 12.50,
        'category': 'Household',
    },
    'birch_tree': {
        'name': 'Birch Tree Milk',
        'barcode': '4800888100002',  # UPDATE THIS
        'price': 35.00,
        'category': 'Beverages',
    },
    'downy': {
        'name': 'Downy Fabric Softener',
        'barcode': '4800888100003',  # UPDATE THIS
        'price': 8.50,
        'category': 'Household',
    },
    'great_taste': {
        'name': 'Great Taste Coffee',
        'barcode': '4800888100004',  # UPDATE THIS
        'price': 7.00,
        'category': 'Beverages',
    },
    'soy_sauce': {
        'name': 'Soy Sauce',
        'barcode': '4800888100005',  # UPDATE THIS
        'price': 15.00,
        'category': 'Condiments',
    },
    'sukang_puti': {
        'name': 'Sukang Puti (White Vinegar)',
        'barcode': '4800888100006',  # UPDATE THIS
        'price': 12.00,
        'category': 'Condiments',
    },
    'wings': {
        'name': 'Wings Detergent',
        'barcode': '4800888100007',  # UPDATE THIS
        'price': 6.50,
        'category': 'Household',
    },
}
# ===================================

# Load model
model = None

# Request/Response Models
class DetectionRequest(BaseModel):
    image: str

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
def load_model():
    """Load your YOLO model"""
    global model
    try:
        logger.info(f"Loading model from: {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
        logger.info("✓ Model loaded successfully!")
        
        # Warm up
        dummy = np.zeros((640, 640, 3), dtype=np.uint8)
        model(dummy, verbose=False)
        logger.info("✓ Model warmed up")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to load model: {e}")
        return False

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Convert base64 to OpenCV image"""
    try:
        # Remove header if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode
        img_data = base64.b64decode(base64_string)
        img = Image.open(io.BytesIO(img_data))
        img = img.convert('RGB')
        img_array = np.array(img)
        
        # Convert RGB to BGR for OpenCV
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        return img_bgr
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

def map_detection_to_product(class_name: str, confidence: float, bbox_coords) -> Optional[Detection]:
    """Map detection to product info"""
    product_info = PRODUCT_DATABASE.get(class_name)
    
    if not product_info:
        logger.warning(f"Unknown class: {class_name}")
        return None
    
    x1, y1, x2, y2 = bbox_coords
    width = x2 - x1
    height = y2 - y1
    center_x = x1 + width / 2
    center_y = y1 + height / 2
    
    return Detection(
        class_name=class_name,
        product_name=product_info['name'],
        barcode=product_info['barcode'],
        confidence=confidence,
        price=product_info['price'],
        category=product_info['category'],
        bbox=BoundingBox(
            x=center_x,
            y=center_y,
            width=width,
            height=height
        )
    )

def get_all_products_suggestions():
    """Return all products for fallback"""
    return [
        {
            'name': info['name'],
            'barcode': info['barcode'],
            'price': info['price'],
            'category': info['category'],
            'class': class_name
        }
        for class_name, info in PRODUCT_DATABASE.items()
    ]

# API Endpoints
@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    logger.info("=" * 60)
    logger.info("🚀 Family Store Vision Service - Local Mode")
    logger.info("=" * 60)
    
    if not load_model():
        logger.error("Failed to load model! Check if my_model.pt exists")
    else:
        logger.info(f"Products: {len(PRODUCT_DATABASE)}")
        logger.info(f"Classes: {list(PRODUCT_DATABASE.keys())}")
        logger.info(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")
        logger.info("=" * 60)
        logger.info("✓ Service ready!")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Family Store Vision API - Local",
        "version": "1.0.0",
        "model": MODEL_PATH,
        "status": "online" if model is not None else "model not loaded",
        "products": len(PRODUCT_DATABASE),
        "classes": list(PRODUCT_DATABASE.keys())
    }

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/detect", response_model=DetectionResponse)
async def detect_products(request: DetectionRequest):
    """
    Main detection endpoint - works with your React frontend
    """
    import time
    start_time = time.time()
    
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        logger.info("📸 Processing detection request...")
        
        # Decode image
        img = decode_base64_image(request.image)
        logger.info(f"Image size: {img.shape}")
        
        # Run detection
        results = model(img, conf=CONFIDENCE_THRESHOLD, verbose=False)
        
        # Process results
        detections = []
        
        for result in results:
            boxes = result.boxes
            
            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    
                    # Get class name from model
                    class_name = result.names[class_id]
                    
                    # Get bbox coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    # Map to product
                    detection = map_detection_to_product(
                        class_name, 
                        confidence,
                        [x1, y1, x2, y2]
                    )
                    
                    if detection:
                        detections.append(detection)
                        logger.info(
                            f"✓ Detected: {detection.product_name} "
                            f"({confidence*100:.1f}%)"
                        )
        
        processing_time = time.time() - start_time
        logger.info(f"⏱ Processing time: {processing_time:.3f}s")
        
        # Build response
        if len(detections) == 0:
            # No detection
            return DetectionResponse(
                success=False,
                detections=[],
                processing_time=processing_time,
                timestamp=datetime.now().isoformat(),
                fallback=True,
                message="No products detected. Please try again or use manual entry.",
                suggestions=get_all_products_suggestions()
            )
        
        elif len(detections) == 1:
            # Single detection
            detection = detections[0]
            
            if detection.confidence >= 0.75:
                # High confidence - auto add
                return DetectionResponse(
                    success=True,
                    detections=[detection],
                    processing_time=processing_time,
                    timestamp=datetime.now().isoformat(),
                    fallback=False,
                    message=f"✓ {detection.product_name} detected!"
                )
            else:
                # Lower confidence - show suggestions
                return DetectionResponse(
                    success=False,
                    detections=[detection],
                    processing_time=processing_time,
                    timestamp=datetime.now().isoformat(),
                    fallback=True,
                    message=f"Is this {detection.product_name}? ({detection.confidence*100:.0f}% confidence)",
                    suggestions=get_all_products_suggestions()
                )
        
        else:
            # Multiple detections
            return DetectionResponse(
                success=True,
                detections=detections,
                processing_time=processing_time,
                timestamp=datetime.now().isoformat(),
                fallback=False,
                message=f"Found {len(detections)} products. Select the correct one."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        processing_time = time.time() - start_time
        
        return DetectionResponse(
            success=False,
            detections=[],
            processing_time=processing_time,
            timestamp=datetime.now().isoformat(),
            fallback=True,
            message=f"Error: {str(e)}",
            suggestions=get_all_products_suggestions()
        )

@app.get("/products")
async def get_products():
    """Get all products"""
    products = [
        {
            "class": class_name,
            "name": info['name'],
            "barcode": info['barcode'],
            "price": info['price'],
            "category": info['category']
        }
        for class_name, info in PRODUCT_DATABASE.items()
    ]
    
    return {
        "total": len(products),
        "products": products
    }

@app.get("/model/info")
async def get_model_info():
    """Get model info"""
    return {
        "model_path": MODEL_PATH,
        "model_type": "YOLO11",
        "classes": list(PRODUCT_DATABASE.keys()),
        "num_classes": len(PRODUCT_DATABASE),
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }

# Run server
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "=" * 70)
    print("🚀 Family Store Vision Service - Local Mode")
    print("=" * 70)
    print(f"Model: {MODEL_PATH}")
    print(f"Products: {len(PRODUCT_DATABASE)}")
    print(f"Classes: {', '.join(PRODUCT_DATABASE.keys())}")
    print(f"\nServer: http://localhost:5000")
    print(f"API Docs: http://localhost:5000/docs")
    print(f"Health: http://localhost:5000/health")
    print("=" * 70)
    print("\n⚠️  Make sure 'my_model.pt' is in the same folder as this script!")
    print("⚠️  Update barcodes in PRODUCT_DATABASE with your real barcodes!\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info"
    )