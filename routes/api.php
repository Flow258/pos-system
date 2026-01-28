<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductLookupController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VisionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::prefix('units')->group(function () {
    // Product Lookup / Barcode Scanner Routes
    Route::get('/lookup', [ProductLookupController::class, 'lookupByBarcode'])
        ->name('api.units.lookup');
    
    Route::get('/search', [ProductLookupController::class, 'search'])
        ->name('api.units.search');
});

Route::prefix('products')->group(function () {
    // Products Management (CRUD)
    Route::get('/', [ProductController::class, 'index'])
        ->name('api.products.index');
    
    Route::get('/{id}', [ProductController::class, 'show'])
        ->name('api.products.show');
    
    Route::post('/', [ProductController::class, 'store'])
        ->name('api.products.store');
    
    Route::put('/{id}', [ProductController::class, 'update'])
        ->name('api.products.update');
    
    Route::delete('/{id}', [ProductController::class, 'destroy'])
        ->name('api.products.destroy');
});

Route::prefix('sales')->group(function () {
    // Sales Management
    Route::get('/', [SalesController::class, 'index'])
        ->name('api.sales.index');
    
    Route::get('/daily-summary', [SalesController::class, 'dailySummary'])
        ->name('api.sales.daily-summary');
    
    Route::get('/{id}', [SalesController::class, 'show'])
        ->name('api.sales.show');
    
    Route::post('/', [SalesController::class, 'store'])
        ->name('api.sales.store');
});

Route::prefix('customers')->group(function () {
    // Customers Management (CRUD + Payment)
    Route::get('/', [CustomerController::class, 'index'])
        ->name('api.customers.index');
    
    Route::get('/{id}', [CustomerController::class, 'show'])
        ->name('api.customers.show');
    
    Route::post('/', [CustomerController::class, 'store'])
        ->name('api.customers.store');
    
    Route::put('/{id}', [CustomerController::class, 'update'])
        ->name('api.customers.update');
    
    Route::delete('/{id}', [CustomerController::class, 'destroy'])
        ->name('api.customers.destroy');
    
    Route::post('/{id}/payment', [CustomerController::class, 'addPayment'])
        ->name('api.customers.payment');
});

// ────────────────────────────────────────────────
//              AI VISION SERVICE (YOLO11)
// ────────────────────────────────────────────────
Route::prefix('vision')->group(function () {
    // Main detection endpoint - called from webcam scanner
    Route::post('/detect', [VisionController::class, 'detectProduct'])
        ->name('api.vision.detect');
    
    // Health check - used by frontend to show "Vision AI Ready ✓" or offline warning
    Route::get('/health', [VisionController::class, 'healthCheck'])
        ->name('api.vision.health');
    
    // List of products the vision model is trained to detect
    Route::get('/products', [VisionController::class, 'getSupportedProducts'])
        ->name('api.vision.products');
    
    // Model metadata (version, confidence threshold, etc.)
    Route::get('/model/info', [VisionController::class, 'getModelInfo'])
        ->name('api.vision.model.info');
});

/*
|--------------------------------------------------------------------------
| Optional: Authentication Routes (if needed later)
|--------------------------------------------------------------------------
*/
// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });