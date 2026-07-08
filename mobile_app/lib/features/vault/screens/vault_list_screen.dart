import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/vault_entry.dart';
import '../services/vault_service.dart';
import '../../auth/services/auth_service.dart';
import 'package:intl/intl.dart';

class VaultListScreen extends StatefulWidget {
  const VaultListScreen({super.key});

  @override
  State<VaultListScreen> createState() => _VaultListScreenState();
}

class _VaultListScreenState extends State<VaultListScreen> {
  List<VaultEntry> _entries = [];
  bool _loading = true;
  String? _error;
  String _search = '';
  bool _publicOnly = false;

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  Future<void> _loadEntries() async {
    setState(() { _loading = true; _error = null; });
    final user = context.read<AuthService>().currentUser;
    if (user == null) { setState(() => _loading = false); return; }
    final service = context.read<VaultService>();
    try {
      final entries = await service.listVaultEntries(userId: user.id);
      if (!mounted) return;
      setState(() { _entries = entries; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<VaultEntry> get _filtered {
    return _entries.where((e) {
      if (_publicOnly && !e.isPublic) return false;
      if (_search.isNotEmpty) {
        final q = _search.toLowerCase();
        return e.title.toLowerCase().contains(q) ||
            (e.description ?? '').toLowerCase().contains(q) ||
            (e.content ?? '').toLowerCase().contains(q);
      }
      return true;
    }).toList();
  }

  Future<void> _deleteEntry(VaultEntry entry) async {
    final service = context.read<VaultService>();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Delete Vault Entry', style: TextStyle(color: Colors.white)),
        content: Text('Permanently delete "${entry.title}"?\nThis cannot be undone.', style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await service.deleteVaultEntry(entry.id);
      if (!mounted) return;
      _loadEntries();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Entry deleted')));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: RefreshIndicator(
        onRefresh: _loadEntries,
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.lock, color: Color(0xFF7c5fe6), size: 28),
                                SizedBox(width: 8),
                                Text('Innovation Vault', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                              ],
                            ),
                            SizedBox(height: 4),
                            Text('Securely store, protect & timestamp your ideas', style: TextStyle(color: Colors.grey, fontSize: 14)),
                          ],
                        ),
                        ElevatedButton(
                          onPressed: () => context.push('/vault/create').then((_) => _loadEntries()),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF7c5fe6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('+ New Entry', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Search + Filter
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            onChanged: (v) => setState(() => _search = v),
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: 'Search vault...',
                              hintStyle: const TextStyle(color: Colors.grey),
                              prefixIcon: const Icon(Icons.search, color: Colors.grey),
                              filled: true,
                              fillColor: Colors.white.withValues(alpha: 0.05),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        FilterChip(
                          label: const Text('Public only'),
                          selected: _publicOnly,
                          onSelected: (v) => setState(() => _publicOnly = v),
                          backgroundColor: Colors.white.withValues(alpha: 0.05),
                          selectedColor: const Color(0xFF2fd4ff).withValues(alpha: 0.2),
                          labelStyle: TextStyle(color: _publicOnly ? const Color(0xFF2fd4ff) : Colors.grey),
                          checkmarkColor: const Color(0xFF2fd4ff),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          side: BorderSide.none,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),

            // Content
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6))))
            else if (_error != null)
              SliverFillRemaining(child: Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red))))
            else if (filtered.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.lock_outline, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('No vault entries found', style: TextStyle(fontSize: 18, color: Colors.grey)),
                      const SizedBox(height: 8),
                      const Text('Add your first idea to protect it with\ntimestamped, legally defensible proof.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => context.push('/vault/create').then((_) => _loadEntries()),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6)),
                        child: const Text('+ Add Entry', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _vaultCard(filtered[index]),
                    childCount: filtered.length,
                  ),
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }

  Widget _vaultCard(VaultEntry entry) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: Colors.black.withValues(alpha: 0.4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 0,
      child: InkWell(
        onTap: () => context.push('/vault/${entry.id}').then((_) => _loadEntries()),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title + Badges
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(entry.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: entry.isPublic ? const Color(0xFF2fd4ff).withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      entry.isPublic ? 'Public' : 'Private',
                      style: TextStyle(color: entry.isPublic ? const Color(0xFF2fd4ff) : Colors.white60, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Description
              if (entry.description != null && entry.description!.isNotEmpty)
                Text(
                  entry.description!.length > 100 ? '${entry.description!.substring(0, 100)}...' : entry.description!,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              const SizedBox(height: 10),

              // Tags
              if (entry.tags.isNotEmpty)
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: entry.tags.take(3).map((tag) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7c5fe6).withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(tag, style: const TextStyle(color: Color(0xFF9b7ff0), fontSize: 10)),
                  )).toList(),
                ),

              const SizedBox(height: 12),

              // Date + Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '📅 ${DateFormat('MMM d, yyyy').format(entry.createdAt)}',
                    style: const TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                  Row(
                    children: [
                      InkWell(
                        onTap: () => context.push('/vault/${entry.id}').then((_) => _loadEntries()),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                          child: const Text('Edit', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () => _deleteEntry(entry),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                          child: const Text('Delete', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
