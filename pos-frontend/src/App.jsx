// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Package, Users, TrendingUp } from 'lucide-react';
import VisionScannerModal from './components/VisionScannerModal';
import SalesInterface from './components/SalesInterface';
import InventoryInterface from './components/InventoryInterface';
import CustomersInterface from './components/CustomersInterface';
import ReportsInterface from './components/ReportsInterface';
import ProductModal from './components/ProductModal';
import CustomerModal from './components/CustomerModal';
import CustomerHistoryModal from './components/CustomerHistoryModal';
import PaymentModal from './components/PaymentModal';
import Notification from './components/Notification';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';

const API_BASE = 'http://127.0.0.1:8000/api';

const POSSystem = () => {
  const [showVisionScanner, setShowVisionScanner] = useState(false);
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
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone_number: '', address: '', credit_balance: '0' });
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [customerSales, setCustomerSales] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    units: [{ unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }]
  });

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory' || activeTab === 'customers') {
      loadProducts();
      loadCustomers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'sales' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeTab]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleVisionDetection = (productUnit) => {
    if (!productUnit) return;
    if (!productUnit.stock_info?.has_stock) {
      showNotification('Insufficient stock!', 'error');
      return;
    }
    const existingItem = cart.find(item => item.id === productUnit.id);
    if (existingItem) {
      updateQuantity(productUnit.id, existingItem.quantity + 1);
    } else {
      setCart(prev => [...prev, { ...productUnit, quantity: 1 }]);
    }
    showNotification(`✓ ${productUnit.product?.name || productUnit.name} added via AI Vision!`, 'success');
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUrDk');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/customers`);
      const data = await response.json();
      if (data.success) setCustomers(data.data);
    } catch (error) {
      showNotification('Error loading customers', 'error');
    }
  };

  const saveCustomer = async () => {
    try {
      if (!customerForm.name) {
        showNotification('Please enter customer name', 'error');
        return;
      }
      const method = editingCustomer ? 'PUT' : 'POST';
      const url = editingCustomer ? `${API_BASE}/customers/${editingCustomer.id}` : `${API_BASE}/customers`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });
      const data = await response.json();
      if (data.success) {
        showNotification(editingCustomer ? 'Customer updated!' : 'Customer added!');
        setShowCustomerModal(false);
        setEditingCustomer(null);
        resetCustomerForm();
        loadCustomers();
      } else {
        showNotification(data.message || 'Error saving customer', 'error');
      }
    } catch (error) {
      showNotification('Error saving customer', 'error');
    }
  };

  const resetCustomerForm = () => setCustomerForm({ name: '', phone_number: '', address: '', credit_balance: '0' });

  const editCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone_number: customer.phone_number || '',
      address: customer.address || '',
      credit_balance: customer.credit_balance.toString()
    });
    setShowCustomerModal(true);
  };

  const viewCustomerHistory = async (customer) => {
    setSelectedCustomerDetails(customer);
    setShowCustomerHistory(true);
    try {
      const response = await fetch(`${API_BASE}/sales?customer_id=${customer.id}&payment_method=credit`);
      const data = await response.json();
      if (data.success) {
        setCustomerSales(data.data.data || []);
      } else {
        showNotification(data.message || 'Error loading customer history', 'error');
      }
    } catch (error) {
      showNotification('Error loading customer history', 'error');
    }
  };

  const processPayment = async (customerId, amount, method) => {
    try {
      const response = await fetch(`${API_BASE}/customers/${customerId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), payment_method: method })
      });
      const data = await response.json();
      if (data.success) {
        showNotification(`Payment of ₱${amount.toFixed(2)} recorded successfully!`);
        loadCustomers();
        if (showCustomerHistory && selectedCustomerDetails) {
          const updated = { ...selectedCustomerDetails, credit_balance: data.data.credit_balance };
          setSelectedCustomerDetails(updated);
          viewCustomerHistory(updated);
        }
      } else {
        showNotification(data.message || 'Error recording payment', 'error');
      }
    } catch (error) {
      showNotification('Error recording payment', 'error');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      if (data.success) setProducts(data.data);
    } catch (error) {
      showNotification('Error loading products', 'error');
    }
  };

  const handleBarcodeScan = async (barcode) => {
    if (!barcode.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/units/lookup?barcode=${barcode}`);
      const data = await response.json();
      if (data.success) {
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
    }
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  const addToCart = (productUnit) => {
    const existingItem = cart.find(item => item.id === productUnit.id);
    if (existingItem) {
      updateQuantity(productUnit.id, existingItem.quantity + 1);
    } else {
      setCart(prev => [...prev, { ...productUnit, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) { removeFromCart(id); return; }
    setCart(cart.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const calculateTotal = () => cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const calculateChange = () => (parseFloat(amountPaid) || 0) - calculateTotal();

  // ─── completeSale now returns a receipt object so SalesInterface can show it ───
  const completeSale = async () => {
    const total = calculateTotal();
    const paid  = parseFloat(amountPaid) || 0;

    if (cart.length === 0) { showNotification('Cart is empty', 'error'); return null; }
    if (paid < total && paymentMethod !== 'credit') { showNotification('Insufficient payment', 'error'); return null; }

    try {
      const saleData = {
        customer_id:    selectedCustomer,
        total_amount:   total,
        amount_paid:    paymentMethod === 'credit' ? 0 : paid,
        change_due:     paymentMethod === 'credit' ? 0 : calculateChange(),
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_unit_id: item.id,
          quantity:        item.quantity,
          unit_price:      parseFloat(item.price),
          subtotal:        parseFloat(item.price) * item.quantity,
        })),
      };

      const response = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      const data = await response.json();

      if (data.success) {
        showNotification('Sale completed successfully!');

        // ── Build the receipt object for the Receipt modal ──
        const customerName = selectedCustomer
          ? customers.find(c => String(c.id) === String(selectedCustomer))?.name || null
          : null;

        const receipt = {
          receipt_number: data.data?.id
            ? `RCP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(data.data.id).padStart(4,'0')}`
            : `RCP-${Date.now()}`,
          created_at:     new Date().toISOString(),
          payment_method: paymentMethod,
          customer_name:  customerName,
          items: cart.map(item => ({
            name:      item.product?.name || item.name || 'Item',
            unit_name: item.unit_name || '',
            qty:       item.quantity,
            price:     parseFloat(item.price),
          })),
          subtotal:      total,
          discount:      0,
          total:         total,
          cash_tendered: paymentMethod === 'credit' ? 0 : paid,
          change:        paymentMethod === 'credit' ? 0 : calculateChange(),
        };

        // Reset POS state
        setCart([]);
        setAmountPaid('');
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        loadProducts();
        loadCustomers();

        // Return receipt → SalesInterface will show the modal
        return receipt;

      } else {
        showNotification(data.message || 'Error completing sale', 'error');
        return null;
      }
    } catch (error) {
      showNotification('Error completing sale', 'error');
      return null;
    }
  };

  const addProductUnit = () => setProductForm({ ...productForm, units: [...productForm.units, { unit_name: '', barcode: '', price: '', price_type: 'wholesale', conversion_factor: '' }] });

  const removeProductUnit = (index) => setProductForm({ ...productForm, units: productForm.units.filter((_, i) => i !== index) });

  const updateProductUnit = (index, field, value) => {
    const newUnits = [...productForm.units];
    newUnits[index][field] = value;
    setProductForm({ ...productForm, units: newUnits });
  };

  const saveProduct = async () => {
    try {
      if (!productForm.name || !productForm.stock_quantity) return showNotification('Please fill in Product Name and Stock Quantity', 'error');
      for (let i = 0; i < productForm.units.length; i++) {
        const unit = productForm.units[i];
        if (!unit.unit_name || !unit.barcode || !unit.price || !unit.conversion_factor) {
          return showNotification(`Please fill all fields for Unit ${i + 1}`, 'error');
        }
      }
      const method = editingProduct ? 'PUT' : 'POST';
      const url    = editingProduct ? `${API_BASE}/products/${editingProduct.id}` : `${API_BASE}/products`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });
      const data = await response.json();
      if (data.success) {
        showNotification(editingProduct ? 'Product updated!' : 'Product created!');
        setShowProductModal(false);
        setEditingProduct(null);
        resetProductForm();
        loadProducts();
      } else {
        showNotification(data.message || 'Error saving product', 'error');
      }
    } catch (error) {
      showNotification('Error saving product', 'error');
    }
  };

  const resetProductForm = () => setProductForm({
    name: '',
    description: '',
    category: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    units: [{ unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }]
  });

  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name:                product.name,
      description:         product.description || '',
      category:            product.category || '',
      stock_quantity:      product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      units: product.product_units?.length > 0
        ? product.product_units.map(u => ({
            id:                u.id,
            unit_name:         u.unit_name,
            barcode:           u.barcode,
            price:             u.price.toString(),
            price_type:        u.price_type,
            conversion_factor: u.conversion_factor.toString(),
          }))
        : [{ unit_name: 'Piece', barcode: '', price: '', price_type: 'retail', conversion_factor: '1' }]
    });
    setShowProductModal(true);
  };

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
      } else {
        showNotification(data.message || 'Error loading report', 'error');
      }
    } catch (error) {
      showNotification('Error loading report', 'error');
    }
    setLoading(false);
  };

  const calculateSummary = () => {
    if (!salesData || !salesData.data) return null;
    const sales = salesData.data;
    const totalSales          = sales.filter(s => s.payment_method !== 'payment').reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const cashSales           = sales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const gcashSales          = sales.filter(s => s.payment_method === 'gcash').reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const creditSales         = sales.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const paymentTotal        = sales.filter(s => s.payment_method === 'payment').reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const paymentTransactions = sales.filter(s => s.payment_method === 'payment').length;
    const totalTransactions   = sales.length - paymentTransactions;
    return {
      totalTransactions,
      totalSales,
      cashSales,
      gcashSales,
      creditSales,
      paymentTotal,
      paymentTransactions,
      averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-8" style={{ height: 'calc(100vh - 220px)' }}>
        {activeTab === 'sales' && (
          <SalesInterface
            barcodeInputRef={barcodeInputRef}
            barcodeInput={barcodeInput}
            setBarcodeInput={setBarcodeInput}
            handleBarcodeScan={handleBarcodeScan}
            cart={cart}
            setCart={setCart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
            calculateTotal={calculateTotal}
            calculateChange={calculateChange}
            completeSale={completeSale}
            setShowVisionScanner={setShowVisionScanner}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryInterface
            products={products}
            editProduct={editProduct}
            resetProductForm={resetProductForm}
            setEditingProduct={setEditingProduct}
            setShowProductModal={setShowProductModal}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersInterface
            customers={customers}
            editCustomer={editCustomer}
            setShowCustomerModal={setShowCustomerModal}
            viewCustomerHistory={viewCustomerHistory}
            setShowPaymentModal={setShowPaymentModal}
            setSelectedCustomerDetails={setSelectedCustomerDetails}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsInterface
            reportType={reportType}
            setReportType={setReportType}
            reportDate={reportDate}
            setReportDate={setReportDate}
            reportStartDate={reportStartDate}
            setReportStartDate={setReportStartDate}
            reportEndDate={reportEndDate}
            setReportEndDate={setReportEndDate}
            loadSalesReport={loadSalesReport}
            salesData={salesData}
            loading={loading}
            calculateSummary={calculateSummary}
            showNotification={showNotification}
          />
        )}
      </main>

      {showVisionScanner && (
        <VisionScannerModal
          isOpen={showVisionScanner}
          onClose={() => setShowVisionScanner(false)}
          onProductDetected={handleVisionDetection}
          API_BASE={API_BASE}
        />
      )}
      {showProductModal && (
        <ProductModal
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          setShowProductModal={setShowProductModal}
          productForm={productForm}
          setProductForm={setProductForm}
          saveProduct={saveProduct}
          resetProductForm={resetProductForm}
          addProductUnit={addProductUnit}
          removeProductUnit={removeProductUnit}
          updateProductUnit={updateProductUnit}
        />
      )}
      {showCustomerModal && (
        <CustomerModal
          editingCustomer={editingCustomer}
          setEditingCustomer={setEditingCustomer}
          setShowCustomerModal={setShowCustomerModal}
          customerForm={customerForm}
          setCustomerForm={setCustomerForm}
          saveCustomer={saveCustomer}
          resetCustomerForm={resetCustomerForm}
        />
      )}
      {showCustomerHistory && (
        <CustomerHistoryModal
          selectedCustomerDetails={selectedCustomerDetails}
          setShowCustomerHistory={setShowCustomerHistory}
          setSelectedCustomerDetails={setSelectedCustomerDetails}
          customerSales={customerSales}
          setCustomerSales={setCustomerSales}
        />
      )}
      {showPaymentModal && (
        <PaymentModal
          selectedCustomerDetails={selectedCustomerDetails}
          setShowPaymentModal={setShowPaymentModal}
          processPayment={processPayment}
          showNotification={showNotification}
        />
      )}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default POSSystem;