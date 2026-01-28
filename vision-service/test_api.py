import requests
import base64
import json
import sys
import time
from datetime import datetime

# ================= CONFIGURATION =================
# FastAPI usually runs on port 8000, not 5000
API_URL = "http://localhost:8000" 
# =================================================

def print_header(title):
    print("\n" + "=" * 60)
    print(f"🧪 {title}")
    print("=" * 60)

def test_server_connection():
    """Check if the server is actually reachable first"""
    print_header("Checking Server Connection")
    try:
        requests.get(API_URL, timeout=2)
        print(f"✓ Connection established to {API_URL}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to {API_URL}")
        print("⚠️  MAKE SURE SERVER IS RUNNING!")
        print("   Run: uvicorn app:app --reload")
        return False

def test_health():
    """Test health endpoint"""
    print_header("Testing Health Check")
    
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Status: {result.get('status')}")
            print(f"✓ Roboflow Reachable: {result.get('roboflow_reachable')}")
            print(f"✓ Model: {result.get('model')}")
            return True
        else:
            print(f"❌ Failed with Status Code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_root_info():
    """Test root endpoint for configuration info"""
    print_header("Testing API Configuration")
    
    try:
        response = requests.get(f"{API_URL}/")
        result = response.json()
        
        print(f"✓ Service: {result.get('service')}")
        print(f"✓ Product Database Size: {result.get('products_count')} items")
        print(f"✓ Confidence Thresholds: {result.get('confidence_thresholds')}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_dummy_image():
    """Creates a basic red image in memory to simulate a product"""
    from PIL import Image
    import io
    
    # Create a 300x300 red image (simulating a generic object)
    img = Image.new('RGB', (300, 300), color='red')
    
    # Save to buffer
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_bytes = buffer.getvalue()
    
    # Encode to base64
    return base64.b64encode(img_bytes).decode('utf-8')

def test_detection_flow():
    """Test the full detection flow with a generated image"""
    print_header("Testing Detection Logic")
    
    try:
        # 1. Generate Image
        print("generating dummy image...")
        base64_image = create_dummy_image()
        
        # 2. Send Request
        print(f"🔍 Sending detection request to {API_URL}/detect...")
        start_time = time.time()
        
        response = requests.post(
            f"{API_URL}/detect",
            json={"image": base64_image},
            timeout=30
        )
        duration = time.time() - start_time
        
        # 3. Analyze Response
        if response.status_code == 200:
            result = response.json()
            
            print(f"✓ Response received in {duration:.2f}s")
            print(f"✓ Success Status: {result['success']}")
            print(f"✓ Message: {result['message']}")
            
            # Check if we got detections or fallback suggestions
            if result['detections']:
                print(f"\n[ Detected {len(result['detections'])} Items ]")
                for det in result['detections']:
                    print(f"  • {det['product_name']} ({det['confidence']:.1f}%) - ₱{det['price']}")
            else:
                print("\n[ No Objects Detected - Testing Fallback ]")
                print("✓ Correctly identified empty/unknown image")
                if result.get('suggestions'):
                    print(f"✓ Received {len(result['suggestions'])} smart suggestions")
            
            # 4. Test Caching (Send same request again)
            print("\n🔄 Testing Cache Mechanism (Sending same image)...")
            response_cached = requests.post(
                f"{API_URL}/detect",
                json={"image": base64_image}
            )
            cached_result = response_cached.json()
            
            if cached_result['metadata'].get('cached'):
                print("✓ Cache HIT: Server returned cached result")
            else:
                print("⚠️ Cache MISS: Server re-processed image")
                
            return True
        else:
            print(f"❌ API Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during detection test: {e}")
        return False

def main():
    print("\n🚀 SARI-SARI STORE API INTEGRATION TEST")
    print("=======================================")
    
    # 1. Check Connection
    if not test_server_connection():
        sys.exit(1)
        
    results = []
    
    # 2. Run Tests
    results.append(test_health())
    results.append(test_root_info())
    results.append(test_detection_flow())
    
    # 3. Summary
    print_header("TEST SUMMARY")
    passed = sum(1 for r in results if r)
    total = len(results)
    
    if passed == total:
        print(f"✅ PASSED ({passed}/{total}) - System is ready for POS integration")
    else:
        print(f"⚠️  WARNING ({passed}/{total}) - Some tests failed")

if __name__ == "__main__":
    main()