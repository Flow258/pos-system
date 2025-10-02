import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Package, Users, TrendingUp, Barcode, Search, X, Plus, Minus, Trash2, DollarSign, CreditCard, Smartphone, Save, Edit, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const POSSystem = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notification, setNotification] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const barcodeInputRef = useRef(null);

  // API Base URL
  const API_BASE = 'http://127.0.0.1:8000/api';

  // Load initial data
  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  // Reload products when switching to inventory tab
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadProducts();
    }
  }, [activeTab]);

  // Auto-focus barcode input
  useEffect(() => {
    if (activeTab === 'sales' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeTab]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Load customers
  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/customers`);
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        console.log('Products loaded:', data.data); // Debug
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('Error loading products', 'error');
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    if (!barcode.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/units/lookup?barcode=${barcode}`);
      const data = await response.json();

      if (data.success) {
        // Check if sufficient stock
        if (!data.data.stock_info.has_stock) {
          showNotification('Insufficient stock!', 'error');
          return;
        }
        addToCart(data.data);
        showNotification(`Added ${data.data.product.name} to cart`);
      } else {
        showNotification('Product not found', 'error');
      }
    } catch (error) {
      showNotification('Error scanning product', 'error');
      console.error('Scan error:', error);
    }

    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Add item to cart
  const addToCart = (productUnit) => {
    const existingItem = cart.find(item => item.id === productUnit.id);
    
    if (existingItem) {
      updateQuantity(productUnit.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...productUnit, quantity: 1 }]);
    }
  };

  // Update item quantity
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculate totals
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  };

  const calculateChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    const total = calculateTotal();
    return paid - total;
  };

  // Complete sale
  const completeSale = async () => {
    const total = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;

    if (cart.length === 0) {
      showNotification('Cart is empty', 'error');
      return;
    }

    if (paid < total && paymentMethod !== 'credit') {
      showNotification('Insufficient payment', 'error');
      return;
    }

    try {
      const saleData = {
        customer_id: selectedCustomer,
        total_amount: total,
        amount_paid: paymentMethod === 'credit' ? 0 : paid,
        change_due: paymentMethod === 'credit' ? 0 : calculateChange(),
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_unit_id: item.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
          subtotal: parseFloat(item.price) * item.quantity
        }))
      };

      const response = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Sale completed successfully!');
        setCart([]);
        setAmountPaid('');
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        loadProducts(); // Reload to update stock
      } else {
        showNotification(data.message || 'Error completing sale', 'error');
      }
    } catch (error) {
      showNotification('Error completing sale', 'error');
      console.error('Sale error:', error);
    }
  };

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    units: [
      { unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }
    ]
  });

  // Add product unit
  const addProductUnit = () => {
    setProductForm({
      ...productForm,
      units: [...productForm.units, { unit_name: '', barcode: '', price: '', price_type: 'wholesale', conversion_factor: '' }]
    });
  };

  // Remove product unit
  const removeProductUnit = (index) => {
    const newUnits = productForm.units.filter((_, i) => i !== index);
    setProductForm({ ...productForm, units: newUnits });
  };

  // Update product unit
  const updateProductUnit = (index, field, value) => {
    const newUnits = [...productForm.units];
    newUnits[index][field] = value;
    setProductForm({ ...productForm, units: newUnits });
  };

  // Save product
  const saveProduct = async () => {
    try {
      // Validate required fields
      if (!productForm.name || !productForm.stock_quantity) {
        showNotification('Please fill in Product Name and Stock Quantity', 'error');
        return;
      }

      // Validate units
      for (let i = 0; i < productForm.units.length; i++) {
        const unit = productForm.units[i];
        if (!unit.unit_name || !unit.barcode || !unit.price || !unit.conversion_factor) {
          showNotification(`Please fill all fields for Unit ${i + 1}`, 'error');
          return;
        }
      }

      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct 
        ? `${API_BASE}/products/${editingProduct.id}` 
        : `${API_BASE}/products`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productForm)
      });

      const data = await response.json();

      if (data.success) {
        showNotification(editingProduct ? 'Product updated!' : 'Product created!');
        setShowProductModal(false);
        setEditingProduct(null);
        resetProductForm();
        loadProducts(); // Reload products
      } else {
        showNotification(data.message || 'Error saving product', 'error');
      }
    } catch (error) {
      showNotification('Error saving product', 'error');
      console.error('Save error:', error);
    }
  };

  // Reset product form
  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      category: '',
      stock_quantity: '',
      low_stock_threshold: '10',
      units: [
        { unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }
      ]
    });
  };

  // Edit product
  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      units: product.product_units && product.product_units.length > 0 
        ? product.product_units.map(unit => ({
            id: unit.id,
            unit_name: unit.unit_name,
            barcode: unit.barcode,
            price: unit.price.toString(),
            price_type: unit.price_type,
            conversion_factor: unit.conversion_factor.toString()
          }))
        : [{ unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }]
    });
    setShowProductModal(true);
  };

  // Sales Interface
  const SalesInterface = () => (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Barcode className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Scan Product</h3>
          </div>
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && barcodeInput.trim()) {
                handleBarcodeScan(barcodeInput.trim());
              }
            }}
            placeholder="Scan barcode or type and press Enter..."
            className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
          />
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-md p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Shopping Cart ({cart.length})</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-2 opacity-30" />
                <p>Cart is empty</p>
                <p className="text-sm">Scan products to begin</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">
                      {item.unit_name} • ₱{parseFloat(item.price).toFixed(2)}
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {item.price_type}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 bg-white rounded-lg shadow-md p-4 flex flex-col">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Checkout
        </h3>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Customer (Optional)</label>
          <select
            value={selectedCustomer || ''}
            onChange={(e) => setSelectedCustomer(e.target.value || null)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Walk-in Customer</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.credit_balance > 0 && `(₱${customer.credit_balance} utang)`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`py-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span className="text-xs">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('gcash')}
              className={`py-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-xs">GCash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('credit')}
              className={`py-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Credit</span>
            </button>
          </div>
        </div>

        {paymentMethod !== 'credit' && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Amount Paid</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₱{calculateTotal().toFixed(2)}</span>
            </div>
            {paymentMethod !== 'credit' && amountPaid && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium">₱{parseFloat(amountPaid).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Change:</span>
                  <span className={calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₱{calculateChange().toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {paymentMethod === 'credit' && (
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total (Credit):</span>
                <span className="text-orange-600">₱{calculateTotal().toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={completeSale}
          disabled={cart.length === 0}
          className={`w-full py-4 rounded-lg font-semibold text-white ${
            cart.length === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Complete Sale
        </button>
      </div>
    </div>
  );

  // Inventory Interface
  const InventoryInterface = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Product Inventory ({products.length})</h2>
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

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first product</p>
          <button
            onClick={() => {
              resetProductForm();
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Units</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{product.category || 'N/A'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold">{product.stock_quantity}</span>
                    <span className="text-sm text-gray-600 ml-1">{product.base_unit}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {product.product_units?.length || 0} unit(s)
                  </td>
                  <td className="px-4 py-3">
                    {parseFloat(product.stock_quantity) <= parseFloat(product.low_stock_threshold) ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => editProduct(product)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit Product"
                    >
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

  // Product Modal
  const ProductModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <button
              onClick={() => {
                setShowProductModal(false);
                setEditingProduct(null);
                resetProductForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g., Coca-Cola 1.5L"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                rows="2"
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Beverages"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
              <input
                type="number"
                value={productForm.low_stock_threshold}
                onChange={(e) => setProductForm({...productForm, low_stock_threshold: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="10"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Product Units</h3>
                <button
                  onClick={addProductUnit}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Unit
                </button>
              </div>

              <div className="space-y-3">
                {productForm.units.map((unit, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={unit.unit_name}
                        onChange={(e) => updateProductUnit(index, 'unit_name', e.target.value)}
                        placeholder="Unit name (e.g., Piece)"
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={unit.barcode}
                        onChange={(e) => updateProductUnit(index, 'barcode', e.target.value)}
                        placeholder="Barcode"
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={unit.price}
                        onChange={(e) => updateProductUnit(index, 'price', e.target.value)}
                        placeholder="Price"
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <select
                        value={unit.price_type}
                        onChange={(e) => updateProductUnit(index, 'price_type', e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="retail">Retail</option>
                        <option value="wholesale">Wholesale</option>
                      </select>
                      <input
                        type="number"
                        value={unit.conversion_factor}
                        onChange={(e) => updateProductUnit(index, 'conversion_factor', e.target.value)}
                        placeholder="Factor"
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {productForm.units.length > 1 && (
                      <button
                        onClick={() => removeProductUnit(index)}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={saveProduct}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CustomersInterface = () => (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-xl font-semibold mb-2">Customer Management</h3>
      <p className="text-gray-600">Manage customers and credit tracking</p>
      <p className="text-sm text-gray-500 mt-4">Coming soon...</p>
    </div>
  );

  // Reports state
  const [reportType, setReportType] = useState('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load sales report
  const loadSalesReport = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/sales?`;
      
      if (reportType === 'daily') {
        url += `start_date=${reportDate}&end_date=${reportDate}`;
      } else if (reportType === 'range' && reportStartDate && reportEndDate) {
        url += `start_date=${reportStartDate}&end_date=${reportEndDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSalesData(data.data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      showNotification('Error loading report', 'error');
    }
    setLoading(false);
  };

  // Calculate report summary
  const calculateSummary = () => {
    if (!salesData || !salesData.data) return null;

    const sales = salesData.data;
    const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const cashSales = sales.filter(s => s.payment_method === 'cash').reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const gcashSales = sales.filter(s => s.payment_method === 'gcash').reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const creditSales = sales.filter(s => s.payment_method === 'credit').reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);

    return {
      totalTransactions: sales.length,
      totalSales,
      cashSales,
      gcashSales,
      creditSales,
      averageTransaction: sales.length > 0 ? totalSales / sales.length : 0,
    };
  };

  const ReportsInterface = () => {
    const summary = calculateSummary();

    return (
      <div className="space-y-4">
        {/* Report Controls */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Sales Reports
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="daily">Daily Report</option>
                <option value="range">Date Range</option>
              </select>
            </div>

            {/* Date Selection */}
            {reportType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={loadSalesReport}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">₱{summary.totalSales.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalTransactions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Transaction</p>
                  <p className="text-2xl font-bold text-purple-600">₱{summary.averageTransaction.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Credit Sales</p>
                  <p className="text-2xl font-bold text-orange-600">₱{summary.creditSales.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Breakdown */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Cash Sales
              </h3>
              <p className="text-2xl font-bold text-green-600">₱{summary.cashSales.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {summary.totalSales > 0 ? ((summary.cashSales / summary.totalSales) * 100).toFixed(1) : 0}% of total
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                GCash Sales
              </h3>
              <p className="text-2xl font-bold text-blue-600">₱{summary.gcashSales.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {summary.totalSales > 0 ? ((summary.gcashSales / summary.totalSales) * 100).toFixed(1) : 0}% of total
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                Credit Sales (Utang)
              </h3>
              <p className="text-2xl font-bold text-orange-600">₱{summary.creditSales.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {summary.totalSales > 0 ? ((summary.creditSales / summary.totalSales) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          </div>
        )}

        {/* Sales Transactions Table */}
        {salesData && salesData.data && salesData.data.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Sales Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Payment</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {salesData.data.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(sale.sale_date).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {sale.customer ? sale.customer.name : 'Walk-in'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₱{parseFloat(sale.total_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sale.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                          sale.payment_method === 'gcash' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {sale.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {sale.sale_items ? sale.sale_items.length : 0} items
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {salesData && salesData.data && salesData.data.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Sales Found</h3>
            <p className="text-gray-600">No sales transactions for the selected period.</p>
          </div>
        )}

        {/* Initial State */}
        {!salesData && !loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Generate Sales Report</h3>
            <p className="text-gray-600">Select a date or date range and click "Generate Report"</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🏪 Sari-Sari POS System</h1>
              <p className="text-sm text-gray-600">Professional Point of Sale & Inventory</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Cashier: Admin</p>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-md p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Sales
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Customers
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Reports
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8" style={{ height: 'calc(100vh - 220px)' }}>
        {activeTab === 'sales' && <SalesInterface />}
        {activeTab === 'inventory' && <InventoryInterface />}
        {activeTab === 'customers' && <CustomersInterface />}
        {activeTab === 'reports' && <ReportsInterface />}
      </div>

      {showProductModal && <ProductModal />}

      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default POSSystem;