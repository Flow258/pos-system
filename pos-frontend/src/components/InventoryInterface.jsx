// components/InventoryInterface.jsx
import React, { useState } from 'react';
import { Package, Plus, AlertCircle, CheckCircle, XCircle, Edit } from 'lucide-react';

const InventoryInterface = ({ products, editProduct, resetProductForm, setEditingProduct, setShowProductModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(c => c))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const isLowStock = product.stock_quantity <= product.low_stock_threshold;
    const matchesLowStock = !showLowStockOnly || isLowStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Product Inventory ({filteredProducts.length})</h2>
        <button
          onClick={() => {
            resetProductForm();
            setEditingProduct(null);
            setShowProductModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or description..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center pt-6 md:pt-0">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm font-medium">Show low stock only</label>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-4">Adjust your filters or add a new product</p>
          <button
            onClick={() => {
              resetProductForm();
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Units & Prices</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600 max-w-xs truncate">{product.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="text-sm text-gray-700">{product.category || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-lg align-top">{product.stock_quantity}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      {product.product_units.map(unit => (
                        <div key={unit.id} className="text-sm">
                          <span className="font-medium">{unit.unit_name}:</span>
                          <span className="text-gray-700"> ₱{parseFloat(unit.price).toFixed(2)} </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${unit.price_type === 'retail' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{unit.price_type}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {product.stock_quantity <= 0 ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-red-600"><XCircle className="w-4 h-4" /> Out of Stock</span>
                    ) : product.stock_quantity <= product.low_stock_threshold ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-orange-600"><AlertCircle className="w-4 h-4" /> Low Stock</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4" /> In Stock</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center align-top">
                    <button onClick={() => editProduct(product)} className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50">
                      <Edit className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryInterface;