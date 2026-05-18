// components/ProductModal.jsx
import React from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

const ProductModal = ({ editingProduct, setEditingProduct, setShowProductModal, productForm, setProductForm, saveProduct, resetProductForm, addProductUnit, removeProductUnit, updateProductUnit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={() => { setShowProductModal(false); setEditingProduct(null); resetProductForm(); }} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input type="text" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" rows="2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Initial Stock Quantity *</label>
            <input type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
            <input type="number" value={productForm.low_stock_threshold} onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="pt-4 mt-4 border-t">
          <h3 className="font-semibold mb-2">Units & Pricing</h3>
          <div className="space-y-4">
            {productForm.units.map((unit, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Unit {index + 1}</h4>
                  {productForm.units.length > 1 && (
                    <button onClick={() => removeProductUnit(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <input type="text" placeholder="Unit Name (e.g., Piece)" value={unit.unit_name} onChange={e => updateProductUnit(index, 'unit_name', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
                  <input type="text" placeholder="Barcode *" value={unit.barcode} onChange={e => updateProductUnit(index, 'barcode', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
                  <input type="number" placeholder="Price *" value={unit.price} onChange={e => updateProductUnit(index, 'price', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
                  <select value={unit.price_type} onChange={e => updateProductUnit(index, 'price_type', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 bg-white">
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                  <input type="number" placeholder="Conversion Factor" value={unit.conversion_factor} onChange={e => updateProductUnit(index, 'conversion_factor', e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" disabled={index === 0} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addProductUnit} className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Another Unit
          </button>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
        <button onClick={() => { setShowProductModal(false); setEditingProduct(null); resetProductForm(); }} className="px-6 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
        <button onClick={saveProduct} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> {editingProduct ? 'Update Product' : 'Save Product'}
        </button>
      </div>
    </div>
  </div>
);

export default ProductModal;