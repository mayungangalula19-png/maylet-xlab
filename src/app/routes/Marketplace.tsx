// C:\Users\user\maylet-xlab\src\app\routes\Marketplace.tsx
// PROFESSIONAL MARKETPLACE – Buy and sell innovation products, services, and resources

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
type ProductStatus = 'active' | 'sold' | 'draft';
type ProductCategory = 'prototype' | 'template' | 'service' | 'code' | 'design' | 'other';

interface Product {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  images: string[];
  status: ProductStatus;
  views: number;
  created_at: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: string;
  buyer_id: string;
  items: { product_id: string; title: string; price: number; quantity: number }[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

// ============================================================
// SIDEBAR (consistent with other pages)
// ============================================================
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects' },
    { icon: '🧪', label: 'Experiments', route: '/experiments' },
    { icon: '🤖', label: 'AI Assistant', route: '/ai-assistant' },
    { icon: '📦', label: 'Prototypes', route: '/prototypes' },
    { icon: '👥', label: 'Teams', route: '/teams' },
    { icon: '📄', label: 'Documents', route: '/documents' },
    { icon: '🔐', label: 'Innovation Vault', route: '/vault' },
    { icon: '💰', label: 'Funding Hub', route: '/funding' },
    { icon: '🎓', label: 'Mentorship', route: '/mentorship' },
    { icon: '🏢', label: 'Enterprise', route: '/enterprise' },
    { icon: '🏆', label: 'Hackathons', route: '/hackathons' },
    { icon: '📚', label: 'Learning Hub', route: '/learning' },
    { icon: '📈', label: 'Analytics', route: '/analytics' },
    { icon: '🛒', label: 'Marketplace', route: '/marketplace', active: true },
    { icon: '💬', label: 'Feedback', route: '/feedback' },
    { icon: '🛠️', label: 'Help & Support', route: '/help' },
  ];

  const userMenu = [
    { icon: '🔔', label: 'Notifications', route: '/notifications' },
    { icon: '⚙️', label: 'Settings', route: '/settings' },  // ✅ fixed missing quote
    { icon: '👤', label: 'Profile', route: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <button className="mobile-sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          {!collapsed && (
            <div className="logo-text">
              <div className="logo-title">MAYLET X LAB</div>
              <div className="logo-tagline">Innovate. Build. Scale.</div>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {mainMenu.map((item) => (
            <Link key={item.label} to={item.route} className={`sidebar-link ${item.active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          {userMenu.map((item) => (
            <Link key={item.label} to={item.route} className="sidebar-link" title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
          <button onClick={handleLogout} className="sidebar-link logout-link">
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Sign Out</span>}
          </button>
        </nav>
      </aside>
      <style>{`
        .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 98; display: none; }
        .mobile-sidebar-toggle { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 100; background: #7c5fe6; border: none; color: white; font-size: 1.5rem; width: 48px; height: 48px; border-radius: 12px; cursor: pointer; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; background: #0a0d1a; color: rgba(255,255,255,0.7); display: flex; flex-direction: column; z-index: 99; transition: width 0.3s ease; overflow-y: auto; overflow-x: hidden; width: 280px; box-shadow: 2px 0 10px rgba(0,0,0,0.3); }
        .sidebar.collapsed { width: 80px; }
        .sidebar-logo { padding: 1.5rem 1rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .logo-icon { font-size: 2rem; font-weight: bold; background: linear-gradient(135deg, #7c5fe6, #2fd4ff); -webkit-background-clip: text; background-clip: text; color: transparent; min-width: 40px; text-align: center; }
        .logo-title { font-weight: 700; font-size: 1rem; color: white; }
        .logo-tagline { font-size: 0.65rem; color: rgba(255,255,255,0.5); }
        .sidebar-toggle { position: absolute; right: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .sidebar-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; margin: 0.25rem 0.5rem; border-radius: 12px; background: none; border: none; width: calc(100% - 1rem); cursor: pointer; font-size: 0.9rem; }
        .sidebar-link:hover { background: rgba(124,95,230,0.2); color: white; }
        .sidebar-link.active { background: #7c5fe6; color: white; }
        .sidebar-icon { font-size: 1.25rem; min-width: 24px; text-align: center; }
        .sidebar-label { font-size: 0.85rem; white-space: nowrap; }
        .sidebar.collapsed .sidebar-label { display: none; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 0.75rem; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.5rem 1rem; }
        .user-nav { margin-bottom: 1rem; }
        .logout-link { color: #fc8181; }
        .logout-link:hover { background: rgba(252,129,129,0.2); color: #fc8181; }
        @media (max-width: 768px) { .mobile-sidebar-toggle { display: block; } .sidebar { transform: translateX(-100%); width: 280px; } .sidebar.mobile-open { transform: translateX(0); } .sidebar-overlay { display: block; } }
      `}</style>
    </>
  );
};

// ============================================================
// PRODUCT CARD COMPONENT
// ============================================================
const ProductCard = ({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) => {
  const getCategoryIcon = (cat: ProductCategory) => {
    switch(cat) {
      case 'prototype': return '📦';
      case 'template': return '📄';
      case 'service': return '⚙️';
      case 'code': return '</>';
      case 'design': return '🎨';
      default: return '🏷️';
    }
  };

  return (
    <div className="product-card">
      <div className="product-image">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.title} />
        ) : (
          <div className="image-placeholder">{getCategoryIcon(product.category)}</div>
        )}
      </div>
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="product-description">{product.description.substring(0, 80)}...</p>
        <div className="product-meta">
          <span className="product-category">{product.category}</span>
          <span className="product-price">${product.price.toLocaleString()}</span>
        </div>
        <div className="product-seller">
          <span>👤 {product.seller_name || 'Anonymous'}</span>
        </div>
        <button onClick={() => onAddToCart(product)} className="add-to-cart-btn">Add to Cart</button>
      </div>
    </div>
  );
};

// ============================================================
// SELLER DASHBOARD (list and manage seller's products)
// ============================================================
const SellerDashboard = ({ userId, onProductChange }: { userId: string; onProductChange: () => void }) => {
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'prototype' as ProductCategory,
    price: 0,
    images: [] as string[],
  });

  const fetchMyProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMyProducts(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const handleDelete = async (productId: string) => {
    if (window.confirm('Delete this product permanently?')) {
      const { error } = await supabase.from('marketplace_products').delete().eq('id', productId);
      if (!error) {
        fetchMyProducts();
        onProductChange();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || formData.price <= 0) return;
    const payload = {
      seller_id: userId,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price: formData.price,
      images: formData.images,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    if (editingProduct) {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingProduct.id);
      if (!error) {
        fetchMyProducts();
        onProductChange();
        setEditingProduct(null);
        setShowCreateForm(false);
      }
    } else {
      const { error } = await supabase.from('marketplace_products').insert(payload);
      if (!error) {
        fetchMyProducts();
        onProductChange();
        setShowCreateForm(false);
      }
    }
    setFormData({ title: '', description: '', category: 'prototype', price: 0, images: [] });
  };

  if (loading) return <div className="seller-loading">Loading...</div>;

  return (
    <div className="seller-dashboard">
      <div className="seller-header">
        <h3>📦 My Products</h3>
        <button onClick={() => { setShowCreateForm(true); setEditingProduct(null); setFormData({ title: '', description: '', category: 'prototype', price: 0, images: [] }); }} className="btn-add-product">
          + New Product
        </button>
      </div>
      {(showCreateForm || editingProduct) && (
        <div className="product-form">
          <h4>{editingProduct ? 'Edit Product' : 'Create New Product'}</h4>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required />
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}>
              <option value="prototype">Prototype</option>
              <option value="template">Template</option>
              <option value="service">Service</option>
              <option value="code">Code / Library</option>
              <option value="design">Design Assets</option>
              <option value="other">Other</option>
            </select>
            <input type="number" placeholder="Price (USD)" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} required />
            <input type="text" placeholder="Image URLs (comma separated)" value={formData.images.join(',')} onChange={(e) => setFormData({ ...formData, images: e.target.value.split(',').filter(s => s.trim()) })} />
            <div className="form-actions">
              <button type="button" onClick={() => { setShowCreateForm(false); setEditingProduct(null); }}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}
      <div className="my-products-list">
        {myProducts.length === 0 ? (
          <p>You haven't listed any products yet.</p>
        ) : (
          myProducts.map(prod => (
            <div key={prod.id} className="my-product-item">
              <div className="my-product-info">
                <strong>{prod.title}</strong> – ${prod.price} ({prod.category})
              </div>
              <div className="my-product-actions">
                <button onClick={() => { setEditingProduct(prod); setFormData({ title: prod.title, description: prod.description, category: prod.category, price: prod.price, images: prod.images || [] }); setShowCreateForm(true); }}>Edit</button>
                <button onClick={() => handleDelete(prod.id)} className="delete-btn">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================
// CART MODAL
// ============================================================
const CartModal = ({ cart, onClose, onCheckout }: { cart: CartItem[]; onClose: () => void; onCheckout: () => void }) => {
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return (
    <div className="modal-overlay">
      <div className="modal-content cart-modal">
        <div className="modal-header">
          <h3>🛒 Your Cart</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          {cart.length === 0 ? (
            <p>Cart is empty.</p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.product.id} className="cart-item">
                  <span>{item.product.title}</span>
                  <span>${item.product.price} x {item.quantity}</span>
                </div>
              ))}
              <div className="cart-total">Total: ${total.toLocaleString()}</div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
          <button onClick={onCheckout} disabled={cart.length === 0} className="checkout-btn">Checkout</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN MARKETPLACE PAGE
// ============================================================
const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'myListings'>('browse');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*, seller:profiles(full_name, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (!error && data) {
      const enriched = data.map(p => ({
        ...p,
        seller_name: p.seller?.full_name || 'Unknown',
        seller_avatar: p.seller?.avatar_url,
      }));
      setProducts(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let filtered = [...products];
    if (searchTerm) {
      filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (!userId) return;
    const orderItems = cart.map(item => ({
      product_id: item.product.id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
    }));
    const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const { error } = await supabase.from('marketplace_orders').insert({
      buyer_id: userId,
      items: orderItems,
      total,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    if (!error) {
      alert('Order placed! The seller will contact you.');
      setCart([]);
      setShowCart(false);
    } else {
      alert('Checkout failed');
    }
  };

  if (loading) {
    return (
      <div className="marketplace-container">
        <Sidebar />
        <main className="marketplace-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <Sidebar />
      <main className="marketplace-main">
        <div className="marketplace-header">
          <h1>🛒 Innovation Marketplace</h1>
          <p>Buy and sell prototypes, templates, services, and more</p>
          <div className="header-actions">
            <button onClick={() => setShowCart(true)} className="cart-icon">🛒 Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</button>
            <div className="tab-buttons">
              <button className={activeTab === 'browse' ? 'active' : ''} onClick={() => setActiveTab('browse')}>Browse</button>
              <button className={activeTab === 'myListings' ? 'active' : ''} onClick={() => setActiveTab('myListings')}>My Listings</button>
            </div>
          </div>
        </div>

        {activeTab === 'browse' && (
          <>
            <div className="filters-bar">
              <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="prototype">Prototypes</option>
                <option value="template">Templates</option>
                <option value="service">Services</option>
                <option value="code">Code</option>
                <option value="design">Design</option>
              </select>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛒</div>
                <h3>No products found</h3>
                <p>Try adjusting your filters or be the first to list an item!</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'myListings' && userId && (
          <SellerDashboard userId={userId} onProductChange={fetchProducts} />
        )}

        {showCart && <CartModal cart={cart} onClose={() => setShowCart(false)} onCheckout={handleCheckout} />}
      </main>

      <style>{`
        .marketplace-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .marketplace-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .marketplace-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .marketplace-header {
          margin-bottom: 2rem;
        }
        .marketplace-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .cart-icon {
          background: rgba(0,0,0,0.5);
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 30px;
          cursor: pointer;
        }
        .tab-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .tab-buttons button {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          cursor: pointer;
        }
        .tab-buttons button.active {
          background: #7c5fe6;
        }
        .filters-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .filters-bar input, .filters-bar select {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          padding: 0.6rem 1rem;
          color: white;
          flex: 1;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .product-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .product-card:hover {
          transform: translateY(-4px);
        }
        .product-image {
          height: 160px;
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-placeholder {
          font-size: 3rem;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-info {
          padding: 1rem;
        }
        .product-info h3 {
          margin: 0 0 0.25rem;
        }
        .product-description {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
        .product-meta {
          display: flex;
          justify-content: space-between;
          margin: 0.5rem 0;
        }
        .product-category {
          font-size: 0.7rem;
          background: rgba(124,95,230,0.3);
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
        }
        .product-price {
          font-weight: bold;
          color: #2fd4ff;
        }
        .add-to-cart-btn {
          width: 100%;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.4rem;
          border-radius: 30px;
          margin-top: 0.5rem;
          cursor: pointer;
          font-weight: 600;
        }
        .seller-dashboard {
          background: rgba(0,0,0,0.4);
          border-radius: 20px;
          padding: 1.5rem;
        }
        .seller-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-add-product {
          background: #2fd4ff;
          border: none;
          padding: 0.3rem 0.8rem;
          border-radius: 30px;
          cursor: pointer;
        }
        .product-form {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .product-form input, .product-form textarea, .product-form select {
          width: 100%;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        .my-products-list {
          margin-top: 1rem;
        }
        .my-product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .my-product-actions button {
          margin-left: 0.5rem;
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          cursor: pointer;
        }
        .cart-modal .cart-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .cart-total {
          font-weight: bold;
          text-align: right;
          margin-top: 1rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
        }
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Marketplace;