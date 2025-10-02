<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductLookupController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\CustomerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

/**
 * Product Lookup Routes (Barcode Scanner)
 */
Route::prefix('units')->group(function () {
    Route::get('/lookup', [ProductLookupController::class, 'lookupByBarcode'])
        ->name('api.units.lookup');
    Route::get('/search', [ProductLookupController::class, 'search'])
        ->name('api.units.search');
});

/**
 * Products Management
 */
Route::prefix('products')->group(function () {
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

/**
 * Sales Management
 */
Route::prefix('sales')->group(function () {
    Route::get('/', [SalesController::class, 'index'])
        ->name('api.sales.index');
    Route::get('/daily-summary', [SalesController::class, 'dailySummary'])
        ->name('api.sales.daily-summary');
    Route::get('/{id}', [SalesController::class, 'show'])
        ->name('api.sales.show');
    Route::post('/', [SalesController::class, 'store'])
        ->name('api.sales.store');
});

/**
 * Customers Management
 */
Route::prefix('customers')->group(function () {
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