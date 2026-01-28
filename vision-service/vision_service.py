"""
YOLO11 Vision Service for POS System
Ultralytics YOLO11 - Latest Model (2026)
FastAPI-based service for real-time product detection
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
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
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="YOLO11 Vision Service - Family Store POS",
    description="Computer Vision API for Automated Product Detection",
    version="1.0.0"
)

# CORS middleware - Allow your Laravel backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
MODEL_PATH = "yolo11n.pt"  # YOLO11 Nano - fastest for real-time
CUSTOM_MODEL_PATH = "family_store_yolo11.pt"  # Your trained model
CONFIDENCE_THRESHOLD = 0.60  # 60% confidence minimum
IOU_THRESHOLD = 0.45  # Non-maximum suppression threshold

# Product class mapping (update this after training)
PRODUCT_CLASSES = {
    'coke_can': {'name': 'Coca Cola Can 330ml', 'barcode': '4800888100014'},
    'sprite_can': {'name': 'Sprite Can 330ml', 'barcode': '4800888100021'},
    'water_bottle': {'name': 'Nature Spring Water 500ml', 'barcode': '4800888100038'},
    'lucky_me': {'name': 'Lucky Me Pancit Canton', 'barcode': '4800888100045'},
    'skyflakes': {'name': 'Skyflakes Crackers', 'barcode': '4800888100052'},
    'chippy': {'name': 'Chippy Chips BBQ', 'barcode': '4800888100060'},
    'bear_brand': {'name': 'Bear Brand Milk', 'barcode': '4800888100075'},
    'gardenia_bread': {'name': 'Gardenia White Bread', 'barcode': '4800888100082'},
    # Add more products as you train them
}

# Request/Response Models
class DetectionRequest(BaseModel):
    image: str  # Base64 encoded image

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class Detection(BaseModel):
    class_name: str
    product_name: str
    barcode: str
    confidence: float
    bbox: BoundingBox

class DetectionResponse(BaseModel):
    success: bool
    detections: List[Detection]
    processing_time: float
    timestamp: str
    fallback: bool = False
    message: Optional[str] = None
    suggestions: Optional[List[dict]] = None

# Load YOLO Model
def load_model():
    """Load YOLO11 model (custom or pretrained)"""
    global model
    try:
        # Try to load custom trained model first
        try:
            model = YOLO(CUSTOM_MODEL_PATH)
            logger.info(f"✓ Loaded custom YOLO11 model: {CUSTOM_MODEL_PATH}")
        except:
            # Fall back to pretrained YOLO11n
            model = YOLO(MODEL_PATH)
            logger.info(f"✓ Loaded pretrained YOLO11 nano model: {MODEL_PATH}")
            logger.warning("⚠ Custom model not found. Using pretrained model.")
            logger.warning("⚠ Train a custom model for better accuracy!")
        
        # Warm up the model
        dummy = np.zeros((640, 640, 3), dtype=np.uint8)
        model(dummy, verbose=False)
        logger.info("✓ Model warmed up successfully")
        
        return True
    except Exception as e:
        logger.error(f"✗ Failed to load model: {e}")
        return False

# Helper Functions
def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode base64 string to numpy array (OpenCV format)"""
    try:
        # Remove header if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        img_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image then to numpy array
        img = Image.open(io.BytesIO(img_data))
        img = img.convert('RGB')
        img_array = np.array(img)
        
        # Convert RGB to BGR for OpenCV
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        return img_bgr
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

def preprocess_image(img: np.ndarray, target_size: int = 640) -> np.ndarray:
    """Preprocess image for YOLO11"""
    if img is None:
        raise ValueError("Invalid image")
    
    # Resize while maintaining aspect ratio
    h, w = img.shape[:2]
    scale = target_size / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    
    img_resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    
    # Create padded image
    img_padded = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
    
    # Center the resized image
    x_offset = (target_size - new_w) // 2
    y_offset = (target_size - new_h) // 2
    img_padded[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = img_resized
    
    return img_padded

def map_detection_to_product(class_name: str, confidence: float) -> Optional[Detection]:
    """Map YOLO detection to product information"""
    product_info = PRODUCT_CLASSES.get(class_name)
    
    if not product_info:
        logger.warning(f"Unknown class detected: {class_name}")
        return None
    
    return {
        'class_name': class_name,
        'product_name': product_info['name'],
        'barcode': product_info['barcode'],
        'confidence': confidence
    }

# API Endpoints

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    logger.info("=" * 60)
    logger.info("🚀 Starting YOLO11 Vision Service for Family Store POS")
    logger.info("=" * 60)
    
    if not load_model():
        logger.error("Failed to initialize model!")
    else:
        logger.info("✓ Service ready to detect products!")
    
    logger.info("=" * 60)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "YOLO11 Vision Service - Family Store POS",
        "version": "1.0.0",
        "model": "YOLO11 Nano (Ultralytics 2026)",
        "status": "online" if model is not None else "model not loaded",
        "supported_products": len(PRODUCT_CLASSES),
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "model_path": CUSTOM_MODEL_PATH if model is not None else MODEL_PATH,
        "timestamp": datetime.now().isoformat(),
        "yolo_version": "YOLO11"
    }

@app.post("/detect", response_model=DetectionResponse)
async def detect_products(request: DetectionRequest):
    """
    Detect products in image using YOLO11
    
    Main endpoint for POS system to scan products via webcam
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = datetime.now()
    
    try:
        # Decode and preprocess image
        img = decode_base64_image(request.image)
        img_processed = preprocess_image(img)
        
        logger.info(f"Processing image: {img.shape} -> {img_processed.shape}")
        
        # Run YOLO11 detection
        results = model.predict(
            img_processed,
            conf=CONFIDENCE_THRESHOLD,  # Confidence threshold
            iou=IOU_THRESHOLD,          # IoU threshold for NMS
            verbose=False,
            device='cpu'                # Use 'cuda' if you have GPU
        )
        
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
                    
                    # Map to product
                    product_info = map_detection_to_product(class_name, confidence)
                    
                    if product_info:
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        
                        detection = Detection(
                            class_name=product_info['class_name'],
                            product_name=product_info['product_name'],
                            barcode=product_info['barcode'],
                            confidence=confidence,
                            bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)
                        )
                        
                        detections.append(detection)
                        
                        logger.info(f"✓ Detected: {product_info['product_name']} "
                                  f"(confidence: {confidence:.2%})")
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Determine response type
        if len(detections) == 0:
            # No detection - suggest fallback
            return DetectionResponse(
                success=False,
                detections=[],
                processing_time=processing_time,
                timestamp=datetime.now().isoformat(),
                fallback=True,
                message="No products detected. Please use manual entry or adjust product position.",
                suggestions=get_all_products_as_suggestions()
            )
        
        elif len(detections) == 1 and detections[0].confidence >= 0.75:
            # High confidence single detection - success!
            return DetectionResponse(
                success=True,
                detections=detections,
                processing_time=processing_time,
                timestamp=datetime.now().isoformat(),
                fallback=False,
                message=f"Product detected: {detections[0].product_name}"
            )
        
        elif len(detections) == 1 and detections[0].confidence < 0.75:
            # Low confidence - offer suggestions
            return DetectionResponse(
                success=False,
                detections=detections,
                processing_time=processing_time,
                timestamp=datetime.now().isoformat(),
                fallback=True,
                message=f"Low confidence detection. Is this {detections[0].product_name}?",
                suggestions=get_similar_products(detections[0].class_name)
            )
        
        else:
            # Multiple detections - let user choose
            return DetectionResponse(
                success=True,
                detections=detections,
                processing_time=processing_time,
                timestamp=datetime.now().isoformat(),
                fallback=False,
                message=f"Multiple products detected ({len(detections)}). Select the correct one."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection error: {e}", exc_info=True)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return DetectionResponse(
            success=False,
            detections=[],
            processing_time=processing_time,
            timestamp=datetime.now().isoformat(),
            fallback=True,
            message=f"Detection failed: {str(e)}",
            suggestions=get_all_products_as_suggestions()
        )

@app.get("/products")
async def get_supported_products():
    """Get list of supported product classes"""
    products = [
        {
            "class": class_name,
            "name": info['name'],
            "barcode": info['barcode']
        }
        for class_name, info in PRODUCT_CLASSES.items()
    ]
    
    return {
        "total": len(products),
        "products": products
    }

@app.get("/model/info")
async def get_model_info():
    """Get information about the loaded model"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_type": "YOLO11 Nano",
        "framework": "Ultralytics",
        "version": "2026 Release",
        "classes": list(PRODUCT_CLASSES.keys()),
        "num_classes": len(PRODUCT_CLASSES),
        "input_size": 640,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "iou_threshold": IOU_THRESHOLD
    }

# Helper function for suggestions
def get_all_products_as_suggestions():
    """Return all products as suggestions"""
    return [
        {
            "name": info['name'],
            "barcode": info['barcode'],
            "class": class_name
        }
        for class_name, info in PRODUCT_CLASSES.items()
    ]

def get_similar_products(detected_class: str, limit: int = 3):
    """Get similar products for suggestions"""
    # Simple implementation - return a few random products
    # You can enhance this with similarity logic
    suggestions = []
    
    # Add the detected product first
    if detected_class in PRODUCT_CLASSES:
        info = PRODUCT_CLASSES[detected_class]
        suggestions.append({
            "name": info['name'],
            "barcode": info['barcode'],
            "class": detected_class,
            "suggested": True
        })
    
    # Add a few other products
    count = 0
    for class_name, info in PRODUCT_CLASSES.items():
        if class_name != detected_class and count < limit - 1:
            suggestions.append({
                "name": info['name'],
                "barcode": info['barcode'],
                "class": class_name,
                "suggested": False
            })
            count += 1
    
    return suggestions

# Run server
if __name__ == "__main__":
    import uvicorn
    
    print("=" * 70)
    print("🚀 YOLO11 Vision Service - Family Store POS Enhancement")
    print("=" * 70)
    print(f"Model: YOLO11 Nano (Ultralytics 2026)")
    print(f"Supported Products: {len(PRODUCT_CLASSES)}")
    print(f"Confidence Threshold: {CONFIDENCE_THRESHOLD:.0%}")
    print(f"Server: http://0.0.0.0:5000")
    print(f"API Docs: http://localhost:5000/docs")
    print(f"Health Check: http://localhost:5000/health")
    print("=" * 70)
    print("\n⚠️  IMPORTANT: Train custom model for best accuracy!")
    print("📝 Update PRODUCT_CLASSES with your store products")
    print("\n✓ Ready to enhance your family store POS!\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info"
    )