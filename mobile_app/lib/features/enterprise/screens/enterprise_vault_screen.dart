import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/supabase_client.dart';

class EnterpriseVaultScreen extends StatefulWidget {
  const EnterpriseVaultScreen({super.key});

  @override
  State<EnterpriseVaultScreen> createState() => _EnterpriseVaultScreenState();
}

class _EnterpriseVaultScreenState extends State<EnterpriseVaultScreen> {
  List<Map<String, dynamic>> _entries = [];
  bool _loading = true;
  String _searchTerm = '';

  List<Map<String, dynamic>> get _filtered => _entries.where((e) {
    if (_searchTerm.isEmpty) return true;
    final title = (e['title'] ?? '').toLowerCase();
    return title.contains(_searchTerm.toLowerCase());
  }).toList();

  @override
  void initState() {
    super.initState();
    _fetchEntries();
  }

  Future<void> _fetchEntries() async {
    final user = context.read<AuthService>().currentUser;
    if (user == null) { setState(() => _loading = false); return; }
    try {
      final res = await SupabaseConfig.client
          .from('vault_entries')
          .select('*')
          .order('created_at', ascending: false);
      setState(() { _entries = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Color _classificationColor(String? c) {
    switch (c?.toLowerCase()) {
      case 'top secret': return Colors.red;
      case 'confidential': return Colors.orange;
      case 'internal': return Colors.blue;
      default: return Colors.grey;
    }
  }

  IconData _typeIcon(String? type) {
    switch (type?.toLowerCase()) {
      case 'patent': return Icons.gavel;
      case 'trade_secret': return Icons.lock;
      case 'algorithm': return Icons.code;
      case 'process': return Icons.settings;
      default: return Icons.folder_special;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enterprise Vault'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search vault entries...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: (v) => setState(() => _searchTerm = v),
            ),
          ),
          // Header banner
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF1E3A5F), Color(0xFF312E81)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.shield, color: Colors.white, size: 32),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Enterprise Vault', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Secure storage for your most valuable IP, trade secrets, and confidential assets.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.shield_outlined, size: 64, color: Colors.grey),
                            const SizedBox(height: 16),
                            const Text('No vault entries', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            const Text('Store your trade secrets, patents, and confidential assets here.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.add),
                              label: const Text('Add Entry'),
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF312E81)),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) {
                          final e = _filtered[i];
                          final color = _classificationColor(e['classification']);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: const Color(0xFF312E81).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                child: Icon(_typeIcon(e['type']), color: const Color(0xFF312E81)),
                              ),
                              title: Text(e['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(e['description'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                              trailing: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                child: Text(
                                  e['classification'] ?? 'Internal',
                                  style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
