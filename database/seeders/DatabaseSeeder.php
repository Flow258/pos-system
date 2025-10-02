<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Customer;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * 
     * This seeder creates sample data to test the POS system:
     * - 5 sample products (beverages and snacks)
     * - Multiple units per product (piece, box, case)
     * - 3 sample customers
     */
    public function run(): void
    {
        // Create Sample Products
        $this->createBeverageProducts();
        $this->createSnackProducts();
        
        // Create Sample Customers
        $this->createCustomers();
    }

    /**
     * Create beverage products with multiple units
     */
    private function createBeverageProducts(): void
    {
        // Product 1: Coca-Cola 1.5L
        $cocaCola = Product::create([
            'name' => 'Coca-Cola 1.5L',
            'description' => '1.5 Liter Coca-Cola Bottle',
            'category' => 'Beverages',
            'base_unit' => 'piece',
            'stock_quantity' => 480, // 20 cases × 24 pieces
            'low_stock_threshold' => 50,
        ]);

        // Coca-Cola sold as individual piece (retail)
        ProductUnit::create([
            'product_id' => $cocaCola->id,
            'unit_name' => 'Piece',
            'barcode' => '4800888100016',
            'price' => 65.00,
            'price_type' => 'retail',
            'conversion_factor' => 1, // 1 piece = 1 base unit
        ]);

        // Coca-Cola sold by the case (wholesale)
        ProductUnit::create([
            'product_id' => $cocaCola->id,
            'unit_name' => 'Case',
            'barcode' => '14800888100013',
            'price' => 1440.00, // 24 pieces × ₱60 each
            'price_type' => 'wholesale',
            'conversion_factor' => 24, // 1 case = 24 pieces
        ]);

        // Product 2: Royal True Orange 1L
        $royal = Product::create([
            'name' => 'Royal True Orange 1L',
            'description' => '1 Liter Royal Orange Soda',
            'category' => 'Beverages',
            'base_unit' => 'piece',
            'stock_quantity' => 360, // 15 cases × 24 pieces
            'low_stock_threshold' => 40,
        ]);

        ProductUnit::create([
            'product_id' => $royal->id,
            'unit_name' => 'Piece',
            'barcode' => '4800888110015',
            'price' => 55.00,
            'price_type' => 'retail',
            'conversion_factor' => 1,
        ]);

        ProductUnit::create([
            'product_id' => $royal->id,
            'unit_name' => 'Case',
            'barcode' => '14800888110012',
            'price' => 1200.00,
            'price_type' => 'wholesale',
            'conversion_factor' => 24,
        ]);

        // Product 3: Mineral Water 500ml
        $water = Product::create([
            'name' => 'Nature\'s Spring 500ml',
            'description' => '500ml Purified Drinking Water',
            'category' => 'Beverages',
            'base_unit' => 'piece',
            'stock_quantity' => 1200, // 50 cases × 24 pieces
            'low_stock_threshold' => 100,
        ]);

        ProductUnit::create([
            'product_id' => $water->id,
            'unit_name' => 'Piece',
            'barcode' => '4806517160013',
            'price' => 12.00,
            'price_type' => 'retail',
            'conversion_factor' => 1,
        ]);

        ProductUnit::create([
            'product_id' => $water->id,
            'unit_name' => 'Case',
            'barcode' => '14806517160010',
            'price' => 240.00,
            'price_type' => 'wholesale',
            'conversion_factor' => 24,
        ]);
    }

    /**
     * Create snack products with multiple units
     */
    private function createSnackProducts(): void
    {
        // Product 4: Chippy BBQ
        $chippy = Product::create([
            'name' => 'Chippy BBQ 110g',
            'description' => 'BBQ Flavored Corn Chips',
            'category' => 'Snacks',
            'base_unit' => 'piece',
            'stock_quantity' => 240, // 10 boxes × 24 pieces
            'low_stock_threshold' => 30,
        ]);

        ProductUnit::create([
            'product_id' => $chippy->id,
            'unit_name' => 'Piece',
            'barcode' => '4800016100017',
            'price' => 28.00,
            'price_type' => 'retail',
            'conversion_factor' => 1,
        ]);

        ProductUnit::create([
            'product_id' => $chippy->id,
            'unit_name' => 'Box',
            'barcode' => '14800016100014',
            'price' => 600.00, // 24 pieces × ₱25 each
            'price_type' => 'wholesale',
            'conversion_factor' => 24,
        ]);

        // Product 5: Lucky Me Instant Noodles
        $noodles = Product::create([
            'name' => 'Lucky Me! Pancit Canton Original',
            'description' => 'Instant Stir-Fry Noodles - Original Flavor',
            'category' => 'Snacks',
            'base_unit' => 'piece',
            'stock_quantity' => 600, // 20 boxes × 30 pieces
            'low_stock_threshold' => 60,
        ]);

        ProductUnit::create([
            'product_id' => $noodles->id,
            'unit_name' => 'Piece',
            'barcode' => '4800194100014',
            'price' => 15.00,
            'price_type' => 'retail',
            'conversion_factor' => 1,
        ]);

        ProductUnit::create([
            'product_id' => $noodles->id,
            'unit_name' => 'Box',
            'barcode' => '14800194100011',
            'price' => 390.00, // 30 pieces × ₱13 each
            'price_type' => 'wholesale',
            'conversion_factor' => 30,
        ]);
    }

    /**
     * Create sample customers
     */
    private function createCustomers(): void
    {
        // Customer 1: Regular reseller with credit
        Customer::create([
            'name' => 'Maria\'s Sari-Sari Store',
            'phone_number' => '09171234567',
            'address' => 'Brgy. Poblacion, Cebu City',
            'credit_balance' => 2500.00, // Has outstanding utang
        ]);

        // Customer 2: Walk-in reseller, no credit
        Customer::create([
            'name' => 'Juan\'s Mini Mart',
            'phone_number' => '09189876543',
            'address' => 'Brgy. Talamban, Cebu City',
            'credit_balance' => 0.00,
        ]);

        // Customer 3: Small reseller
        Customer::create([
            'name' => 'Rosa\'s Tindahan',
            'phone_number' => '09351112222',
            'address' => 'Brgy. Lahug, Cebu City',
            'credit_balance' => 850.00,
        ]);
    }
}