import React, { useState, useRef, useDeferredValue, useMemo, useEffect } from 'react';
import { Package, Plus, AlertCircle, CheckCircle, XCircle, Edit, Download, Upload, Loader, Search, Pencil, Tag } from 'lucide-react';

// ── INP FIX 1: Memoize the Mobile Card so it doesn't redraw unnecessarily ──
const ProductCardMobile = React.memo(({ product, editProduct }) => {
  const getStockStatus = (prod) => {
    if (prod.stock_quantity <= 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle };
    if (prod.stock_quantity <= prod.low_stock_threshold) return { text: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertCircle };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
  };

  const status = getStockStatus(product);
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="pr-2">
          <h3 className="font-bold text-gray-800 text-base">{product.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{product.category || 'Uncategorized'}</p>
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
          <StatusIcon className="w-3 h-3" /> {status.text}
        </span>
      </div>

      {product.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>}

      <div className="flex justify-between items-center mb-3 pb-3 border-b">
        <span className="text-xs text-gray-500">Stock on hand:</span>
        <span className="text-lg font-bold text-gray-800">{product.stock_quantity}</span>
      </div>

      <div className="space-y-1.5 mb-3">
        {product.product_units.map(unit => (
          <div key={unit.id} className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-700 flex items-center gap-1">
              <Tag className="w-3 h-3 text-gray-400" /> {unit.unit_name}
            </span>
            <span className="text-gray-900 font-semibold">₱{parseFloat(unit.price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <button 
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editProduct(product)} 
        className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 active:scale-95"
      >
        <Pencil className="w-4 h-4" /> Edit Product
      </button>
    </div>
  );
});

// ── INP FIX 2: Memoize the Desktop Table Row so it doesn't redraw unnecessarily ──
const ProductRowDesktop = React.memo(({ product, editProduct }) => {
  const getStockStatus = (prod) => {
    if (prod.stock_quantity <= 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle };
    if (prod.stock_quantity <= prod.low_stock_threshold) return { text: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertCircle };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
  };

  const status = getStockStatus(product);
  const StatusIcon = status.icon;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 align-top">
        <div>
          <p className="font-medium text-gray-800 text-sm">{product.name}</p>
          <p className="text-sm text-gray-600 max-w-xs truncate">{product.description}</p>
        </div>
      </td>
      <td className="px-4 py-3 align-top"><span className="text-sm text-gray-700">{product.category || 'N/A'}</span></td>
      <td className="px-4 py-3 text-right font-mono text-base sm:text-lg align-top">{product.stock_quantity}</td>
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
        <span className={`flex items-center gap-1.5 text-sm font-medium ${status.color}`}>
          <StatusIcon className="w-4 h-4" /> {status.text}
        </span>
      </td>
      <td className="px-4 py-3 text-center align-top">
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editProduct(product)} 
          className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 active:scale-90"
        >
          <Edit className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
});

const InventoryInterface = ({ products, editProduct, resetProductForm, setEditingProduct, setShowProductModal, onImportProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50); // ── INP FIX 3: Limit DOM elements to 50
  const fileInputRef = useRef(null);

  // ── INP FIX: Defer search filtering so typing doesn't lag the screen ──
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(c => c))], [products]);

  // ── INP FIX: Memoize the heavy filtering math so it doesn't run on every render ──
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const term = deferredSearchTerm.toLowerCase();
      
      const matchesName = product.name.toLowerCase().includes(term);
      const matchesDesc = product.description && product.description.toLowerCase().includes(term);
      const matchesBarcode = product.product_units && product.product_units.some(unit => 
        unit.barcode && unit.barcode.toLowerCase().includes(term)
      );

      const matchesSearch = matchesName || matchesDesc || matchesBarcode;
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const isLowStock = product.stock_quantity <= product.low_stock_threshold;
      const matchesLowStock = !showLowStockOnly || isLowStock;
      
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, deferredSearchTerm, selectedCategory, showLowStockOnly]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [deferredSearchTerm, selectedCategory, showLowStockOnly]);

  // Only slice the first 50 (or visibleCount) items to render in the DOM
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const exportToCSV = () => {
    if (products.length === 0) { alert('No products to export!'); return; }
    const headers = ['Product Name', 'Description', 'Category', 'Stock Quantity', 'Low Stock Threshold', 'Unit Name', 'Barcode', 'Price', 'Price Type'];
    const rows = [];
    products.forEach(p => {
      if (p.product_units && p.product_units.length > 0) {
        p.product_units.forEach(u => {
          rows.push([`"${p.name || ''}"`, `"${p.description || ''}"`, `"${p.category || ''}"`, p.stock_quantity || 0, p.low_stock_threshold || 0, `"${u.unit_name || ''}"`, `"${u.barcode || ''}"`, u.price || 0, `"${u.price_type || ''}"`].join(','));
        });
      } else {
        rows.push([`"${p.name || ''}"`, `"${p.description || ''}"`, `"${p.category || ''}"`, p.stock_quantity || 0, p.low_stock_threshold || 0, '', '', '', ''].join(','));
      }
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_dataset_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) { alert('CSV is empty or invalid.'); setIsImporting(false); return; }
      const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim());
      const productsMap = {};
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });
        const productName = row['Product Name'];
        if (!productName) continue;
        if (!productsMap[productName]) {
          productsMap[productName] = { name: productName, description: row['Description'] || '', category: row['Category'] || '', stock_quantity: row['Stock Quantity'] || '0', low_stock_threshold: row['Low Stock Threshold'] || '10', units: [] };
        }
        if (row['Unit Name']) {
          productsMap[productName].units.push({ unit_name: row['Unit Name'], barcode: row['Barcode'] || '', price: row['Price'] || '0', price_type: row['Price Type'] || 'retail', conversion_factor: '1' });
        }
      }
      const parsedProducts = Object.values(productsMap);
      if (onImportProducts) { onImportProducts(parsedProducts); } else { alert("Import function is missing in App.jsx"); }
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-0 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Product Inventory ({filteredProducts.length})
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleImportClick} 
            disabled={isImporting} 
            className="flex-1 sm:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-50"
          >
            {isImporting ? <Loader className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isImporting ? 'Importing...' : 'Import'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={exportToCSV} 
            className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm active:scale-95"
          >
            <Download className="w-5 h-5" /> Export
          </button>
          
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); }} 
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search name or barcode..." 
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-sm" 
            />
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Category</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)} 
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-sm bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
        </div>
        <div className="flex items-center pt-6 md:pt-0">
          <input 
            type="checkbox" 
            checked={showLowStockOnly} 
            onChange={(e) => setShowLowStockOnly(e.target.checked)} 
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
          />
          <label className="ml-2 text-xs sm:text-sm font-medium">Show low stock only</label>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-4 text-sm">Adjust your filters or add a new product</p>
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); }} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Add Product
          </button>
        </div>
      ) : (
        <>
          {/* ───────────────────────────────────────────────────────────── */}
          {/* MOBILE VIEW: Cards (Shown only on phones)                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {visibleProducts.map((product) => (
              <ProductCardMobile key={product.id} product={product} editProduct={editProduct} />
            ))}
            {visibleCount < filteredProducts.length && (
              <div className="text-center py-4">
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setVisibleCount(prev => prev + 50)} 
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium active:scale-95"
                >
                  Load More ({filteredProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* DESKTOP VIEW: Table (Shown only on tablets and PCs)           */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Units & Prices</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visibleProducts.map((product) => (
                    <ProductRowDesktop key={product.id} product={product} editProduct={editProduct} />
                  ))}
                </tbody>
              </table>
            </div>
            {visibleCount < filteredProducts.length && (
              <div className="p-4 text-center border-t">
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setVisibleCount(prev => prev + 50)} 
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium active:scale-95"
                >
                  Load More ({filteredProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryInterface;