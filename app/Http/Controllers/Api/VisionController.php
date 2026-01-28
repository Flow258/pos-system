<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VisionController extends Controller
{
    private $visionServiceUrl;
    private $confidenceThreshold;
    private $timeout;

    public function __construct()
    {
        $this->visionServiceUrl = env('VISION_SERVICE_URL', 'http://localhost:5000');
        $this->confidenceThreshold = env('VISION_CONFIDENCE_THRESHOLD', 0.60);
        $this->timeout = 10; // 10 seconds timeout
    }

    /**
     * Detect product from webcam image using YOLO11 service
     */
    public function detectProduct(Request $request)
    {
        $request->validate([
            'image' => 'required|string'
        ]);

        try {
            $imageData = $request->input('image');
            
            Log::info('Vision detection requested', [
                'image_size' => strlen($imageData),
                'timestamp' => now()
            ]);

            // Call YOLO11 vision service
            $response = Http::timeout($this->timeout)
                ->post("{$this->visionServiceUrl}/detect", [
                    'image' => $imageData
                ]);

            if (!$response->successful()) {
                Log::error('Vision service error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                return response()->json([
                    'success' => false,
                    'fallback' => true,
                    'message' => 'Vision service unavailable. Please use manual entry.',
                    'suggestions' => $this->getAllProducts()
                ], 503);
            }

            $detectionResult = $response->json();

            Log::info('Vision detection result', [
                'success' => $detectionResult['success'] ?? false,
                'detections' => count($detectionResult['detections'] ?? []),
                'processing_time' => $detectionResult['processing_time'] ?? 0
            ]);

            // Handle different detection scenarios
            if ($detectionResult['fallback']) {
                // Low confidence or no detection - return suggestions
                return response()->json([
                    'success' => false,
                    'fallback' => true,
                    'message' => $detectionResult['message'],
                    'detections' => $detectionResult['detections'] ?? [],
                    'suggestions' => $this->getProductSuggestions($detectionResult),
                    'processing_time' => $detectionResult['processing_time']
                ]);
            }

            if (empty($detectionResult['detections'])) {
                return response()->json([
                    'success' => false,
                    'fallback' => true,
                    'message' => 'No products detected. Please try again or use manual entry.',
                    'suggestions' => $this->getAllProducts()
                ]);
            }

            // Get product details from database
            $products = $this->getProductsFromDetections($detectionResult['detections']);

            if (empty($products)) {
                return response()->json([
                    'success' => false,
                    'fallback' => true,
                    'message' => 'Detected products not found in inventory.',
                    'detections' => $detectionResult['detections'],
                    'suggestions' => $this->getAllProducts()
                ]);
            }

            // Success - return product(s) ready to add to cart
            return response()->json([
                'success' => true,
                'products' => $products,
                'detections' => $detectionResult['detections'],
                'message' => count($products) === 1 
                    ? "Product detected: {$products[0]['product']['name']}"
                    : "Multiple products detected. Select the correct one.",
                'processing_time' => $detectionResult['processing_time'],
                'timestamp' => $detectionResult['timestamp']
            ]);

        } catch (\Exception $e) {
            Log::error('Vision detection error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'fallback' => true,
                'message' => 'Error processing image. Please use manual entry.',
                'error' => config('app.debug') ? $e->getMessage() : null,
                'suggestions' => $this->getAllProducts()
            ], 500);
        }
    }

    /**
     * Check vision service health
     */
    public function healthCheck()
    {
        try {
            $response = Http::timeout(5)->get("{$this->visionServiceUrl}/health");
            
            $data = $response->json();
            
            return response()->json([
                'vision_service' => $response->successful() ? 'online' : 'offline',
                'status_code' => $response->status(),
                'url' => $this->visionServiceUrl,
                'model_loaded' => $data['model_loaded'] ?? false,
                'yolo_version' => $data['yolo_version'] ?? 'unknown',
                'timestamp' => $data['timestamp'] ?? now()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'vision_service' => 'offline',
                'error' => $e->getMessage(),
                'url' => $this->visionServiceUrl,
                'message' => 'Vision service not reachable. Manual entry still available.'
            ], 503);
        }
    }

    /**
     * Get supported products from vision service
     */
    public function getSupportedProducts()
    {
        try {
            $response = Http::timeout(5)->get("{$this->visionServiceUrl}/products");
            
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'data' => $response->json()
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch supported products'
            ], 503);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vision service unavailable',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get model information
     */
    public function getModelInfo()
    {
        try {
            $response = Http::timeout(5)->get("{$this->visionServiceUrl}/model/info");
            
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'data' => $response->json()
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch model info'
            ], 503);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vision service unavailable',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get products from database based on detections
     */
    private function getProductsFromDetections($detections)
    {
        $products = [];
        
        foreach ($detections as $detection) {
            $barcode = $detection['barcode'] ?? null;
            
            if (!$barcode) {
                continue;
            }
            
            $productUnit = ProductUnit::with('product')
                ->where('barcode', $barcode)
                ->first();
            
            if ($productUnit && $productUnit->product) {
                // Check stock
                $stockInfo = $productUnit->stock_info;
                
                if (!$stockInfo['has_stock']) {
                    Log::warning('Detected product out of stock', [
                        'barcode' => $barcode,
                        'product' => $productUnit->product->name
                    ]);
                    continue;
                }
                
                $products[] = [
                    'id' => $productUnit->id,
                    'product' => [
                        'id' => $productUnit->product->id,
                        'name' => $productUnit->product->name,
                        'category' => $productUnit->product->category
                    ],
                    'unit_name' => $productUnit->unit_name,
                    'barcode' => $productUnit->barcode,
                    'price' => $productUnit->price,
                    'price_type' => $productUnit->price_type,
                    'stock_info' => $stockInfo,
                    'detection' => [
                        'class' => $detection['class_name'],
                        'confidence' => $detection['confidence'],
                        'bbox' => $detection['bbox'] ?? null
                    ]
                ];
            }
        }
        
        return $products;
    }

    /**
     * Get product suggestions from detection result
     */
    private function getProductSuggestions($detectionResult)
    {
        $suggestions = [];
        
        // If vision service provided suggestions, use them
        if (!empty($detectionResult['suggestions'])) {
            foreach ($detectionResult['suggestions'] as $suggestion) {
                $barcode = $suggestion['barcode'] ?? null;
                
                if ($barcode) {
                    $productUnit = ProductUnit::with('product')
                        ->where('barcode', $barcode)
                        ->first();
                    
                    if ($productUnit && $productUnit->product) {
                        $suggestions[] = [
                            'id' => $productUnit->id,
                            'name' => $productUnit->product->name,
                            'unit_name' => $productUnit->unit_name,
                            'price' => $productUnit->price,
                            'barcode' => $productUnit->barcode,
                            'suggested' => $suggestion['suggested'] ?? false
                        ];
                    }
                }
            }
        }
        
        // If no suggestions, return some popular products
        if (empty($suggestions)) {
            $suggestions = $this->getAllProducts(5);
        }
        
        return $suggestions;
    }

    /**
     * Get all products for fallback
     */
    private function getAllProducts($limit = 10)
    {
        try {
            $productUnits = ProductUnit::with('product')
                ->whereHas('product', function($query) {
                    $query->where('stock_quantity', '>', 0);
                })
                ->limit($limit)
                ->get();
            
            return $productUnits->map(function($unit) {
                return [
                    'id' => $unit->id,
                    'name' => $unit->product->name,
                    'unit_name' => $unit->unit_name,
                    'price' => $unit->price,
                    'barcode' => $unit->barcode,
                    'stock' => $unit->product->stock_quantity
                ];
            })->toArray();
            
        } catch (\Exception $e) {
            Log::error('Error getting product suggestions', ['error' => $e->getMessage()]);
            return [];
        }
    }
}