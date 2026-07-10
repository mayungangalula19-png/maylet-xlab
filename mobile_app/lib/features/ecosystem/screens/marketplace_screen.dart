import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../auth/services/auth_service.dart';
import 'package:go_router/go_router.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  bool _isLoading = true;
  List<dynamic> _products = [];
  List<dynamic> _myProducts = [];
  String _activeTab = 'browse'; // browse, myListings
  String _searchQuery = '';
  String _categoryFilter = 'all';
  List<Map<String, dynamic>> _cart = [];
  bool _showCart = false;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    try {
      final user = context.read<AuthService>().currentUser;
      final res = await Supabase.instance.client
          .from('marketplace_products')
          .select('*, seller:profiles(full_name, avatar_url)')
          .eq('status', 'active')
          .order('created_at', ascending: false);
      
      if (mounted) {
        setState(() {
          _products = res;
          if (user != null) {
            _myProducts = res.where((p) => p['seller_id'] == user.id).toList();
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading products: $e')));
      }
    }
  }

  void _addToCart(dynamic product) {
    setState(() {
      final existingIndex = _cart.indexWhere((item) => item['product']['id'] == product['id']);
      if (existingIndex >= 0) {
        _cart[existingIndex]['quantity'] += 1;
      } else {
        _cart.add({'product': product, 'quantity': 1});
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to cart'), duration: Duration(seconds: 1)));
  }

  Future<void> _handleCheckout() async {
    final user = context.read<AuthService>().currentUser;
    if (user == null) return;
    
    final orderItems = _cart.map((item) => {
      'product_id': item['product']['id'],
      'title': item['product']['title'],
      'price': item['product']['price'],
      'quantity': item['quantity'],
    }).toList();
    
    double total = 0;
    for (var item in _cart) {
      total += (item['product']['price'] as num) * (item['quantity'] as num);
    }
    
    try {
      await Supabase.instance.client.from('marketplace_orders').insert({
        'buyer_id': user.id,
        'items': orderItems,
        'total': total,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order placed! Seller will contact you.')));
        setState(() {
          _cart.clear();
          _showCart = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Checkout failed: $e')));
      }
    }
  }

  List<dynamic> get _filteredProducts {
    return _products.where((p) {
      if (p['seller_id'] == context.read<AuthService>().currentUser?.id && _activeTab == 'browse') {
        // optionally hide own products from browse
      }
      if (_categoryFilter != 'all' && p['category'] != _categoryFilter) return false;
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final title = (p['title'] ?? '').toString().toLowerCase();
        final desc = (p['description'] ?? '').toString().toLowerCase();
        return title.contains(q) || desc.contains(q);
      }
      return true;
    }).toList();
  }

  IconData _getCategoryIcon(String cat) {
    switch (cat) {
      case 'prototype': return Icons.inventory_2;
      case 'template': return Icons.description;
      case 'service': return Icons.settings;
      case 'code': return Icons.code;
      case 'design': return Icons.brush;
      default: return Icons.local_offer;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('Innovation Marketplace'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Badge(
              label: Text(_cart.fold<int>(0, (sum, item) => sum + (item['quantity'] as int)).toString()),
              isLabelVisible: _cart.isNotEmpty,
              child: const Icon(Icons.shopping_cart),
            ),
            onPressed: () => _showCartModal(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header Tabs
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                Expanded(
                  child: SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'browse', label: Text('Browse')),
                      ButtonSegment(value: 'myListings', label: Text('My Listings')),
                    ],
                    selected: {_activeTab},
                    onSelectionChanged: (set) {
                      setState(() => _activeTab = set.first);
                    },
                    style: SegmentedButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.05),
                      selectedBackgroundColor: const Color(0xFF7c5fe6),
                      selectedForegroundColor: Colors.white,
                      foregroundColor: Colors.grey,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          if (_activeTab == 'browse') ...[
            // Filters
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Search products...',
                        hintStyle: const TextStyle(color: Colors.grey),
                        prefixIcon: const Icon(Icons.search, color: Colors.grey),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      ),
                      onChanged: (val) => setState(() => _searchQuery = val),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _categoryFilter,
                        dropdownColor: const Color(0xFF1A1A2E),
                        style: const TextStyle(color: Colors.white),
                        icon: const Icon(Icons.filter_list, color: Colors.grey),
                        items: const [
                          DropdownMenuItem(value: 'all', child: Text('All')),
                          DropdownMenuItem(value: 'prototype', child: Text('Prototype')),
                          DropdownMenuItem(value: 'template', child: Text('Template')),
                          DropdownMenuItem(value: 'service', child: Text('Service')),
                          DropdownMenuItem(value: 'code', child: Text('Code')),
                          DropdownMenuItem(value: 'design', child: Text('Design')),
                        ],
                        onChanged: (val) => setState(() => _categoryFilter = val!),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          // Content
          Expanded(
            child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)))
                : RefreshIndicator(
                    onRefresh: _loadProducts,
                    child: _activeTab == 'browse' ? _buildBrowseList() : _buildMyListings(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildBrowseList() {
    final filtered = _filteredProducts;
    if (filtered.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 100),
          Center(
            child: Column(
              children: [
                Icon(Icons.shopping_bag_outlined, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text('No products found', style: TextStyle(color: Colors.grey, fontSize: 18)),
              ],
            ),
          ),
        ],
      );
    }
    
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final p = filtered[index];
        return _productCard(p);
      },
    );
  }

  Widget _productCard(dynamic p) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Color(0xFF0F0F1A),
                borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Center(
                child: Icon(_getCategoryIcon(p['category'] ?? 'other'), size: 48, color: const Color(0xFF7c5fe6)),
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white), maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Text(p['description'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: const Color(0xFF7c5fe6).withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                        child: Text(p['category'] ?? '', style: const TextStyle(color: Color(0xFF9b7ff0), fontSize: 10)),
                      ),
                      Text('\$${p['price']}', style: const TextStyle(color: Color(0xFF2fd4ff), fontWeight: FontWeight.bold)),
                    ],
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _addToCart(p),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2fd4ff),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: const Text('Add to Cart', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyListings() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('My Products', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            ElevatedButton(
              onPressed: () => _showCreateProductModal(),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6)),
              child: const Text('Add Product', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_myProducts.isEmpty)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: Text('You have not listed any products.', style: TextStyle(color: Colors.grey))),
          )
        else
          ..._myProducts.map((p) => Card(
            color: const Color(0xFF1A1A2E),
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: Icon(_getCategoryIcon(p['category']), color: const Color(0xFF2fd4ff)),
              title: Text(p['title'], style: const TextStyle(color: Colors.white)),
              subtitle: Text('\$${p['price']} - ${p['category']}', style: const TextStyle(color: Colors.grey)),
              trailing: IconButton(
                icon: const Icon(Icons.delete, color: Colors.red),
                onPressed: () async {
                  await Supabase.instance.client.from('marketplace_products').delete().eq('id', p['id']);
                  _loadProducts();
                },
              ),
            ),
          )),
      ],
    );
  }

  void _showCartModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A2E),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (BuildContext context, StateSetter setModalState) {
          double total = 0;
          for (var item in _cart) {
            total += (item['product']['price'] as num) * (item['quantity'] as num);
          }
          return Container(
            height: MediaQuery.of(context).size.height * 0.7,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your Cart', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 16),
                if (_cart.isEmpty)
                  const Expanded(child: Center(child: Text('Cart is empty', style: TextStyle(color: Colors.grey))))
                else
                  Expanded(
                    child: ListView.builder(
                      itemCount: _cart.length,
                      itemBuilder: (context, index) {
                        final item = _cart[index];
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(item['product']['title'], style: const TextStyle(color: Colors.white)),
                          subtitle: Text('\$${item['product']['price']} x ${item['quantity']}', style: const TextStyle(color: Colors.grey)),
                          trailing: IconButton(
                            icon: const Icon(Icons.remove_circle, color: Colors.redAccent),
                            onPressed: () {
                              setState(() {
                                _cart.removeAt(index);
                              });
                              setModalState(() {});
                            },
                          ),
                        );
                      },
                    ),
                  ),
                const Divider(color: Colors.white24),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text('\$$total', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF2fd4ff))),
                    ],
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _cart.isEmpty ? null : () {
                      Navigator.pop(context);
                      _handleCheckout();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7c5fe6),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Checkout', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ),
                ),
              ],
            ),
          );
        }
      ),
    );
  }

  void _showCreateProductModal() {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    String cat = 'prototype';

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A2E),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 20, right: 20, top: 20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Add New Product', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 16),
              TextField(
                controller: titleCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Title', labelStyle: TextStyle(color: Colors.grey)),
              ),
              TextField(
                controller: descCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Description', labelStyle: TextStyle(color: Colors.grey)),
                maxLines: 3,
              ),
              TextField(
                controller: priceCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Price (USD)', labelStyle: TextStyle(color: Colors.grey)),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: cat,
                dropdownColor: const Color(0xFF1A1A2E),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Category', labelStyle: TextStyle(color: Colors.grey)),
                items: const [
                  DropdownMenuItem(value: 'prototype', child: Text('Prototype')),
                  DropdownMenuItem(value: 'template', child: Text('Template')),
                  DropdownMenuItem(value: 'service', child: Text('Service')),
                  DropdownMenuItem(value: 'code', child: Text('Code')),
                  DropdownMenuItem(value: 'design', child: Text('Design')),
                ],
                onChanged: (v) => cat = v!,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (titleCtrl.text.isEmpty || priceCtrl.text.isEmpty) return;
                    Navigator.pop(ctx);
                    setState(() => _isLoading = true);
                    final user = context.read<AuthService>().currentUser;
                    await Supabase.instance.client.from('marketplace_products').insert({
                      'seller_id': user?.id,
                      'title': titleCtrl.text,
                      'description': descCtrl.text,
                      'category': cat,
                      'price': double.tryParse(priceCtrl.text) ?? 0,
                      'status': 'active',
                    });
                    _loadProducts();
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6), padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: const Text('Save Product', style: TextStyle(color: Colors.white)),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
