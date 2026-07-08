import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/supabase_client.dart';

class EnterpriseVaultScreen extends StatefulWidget {
  const EnterpriseVaultScreen({super.key});

  @override
  State<EnterpriseVaultScreen> createState() => _EnterpriseVaultScreenState();
}

class _EnterpriseVaultScreenState extends State<EnterpriseVaultScreen> {
  List<Map<String, dynamic>> _entries = [];
  List<Map<String, dynamic>> _documents = [];
  bool _loading = true;
  String _searchTerm = '';
  String? _error;
  String? _message;

  List<Map<String, dynamic>> get _filtered => _entries.where((e) {
    if (_searchTerm.isEmpty) return true;
    final title = (e['title'] ?? '').toLowerCase();
    final desc = (e['description'] ?? '').toLowerCase();
    return title.contains(_searchTerm.toLowerCase()) || desc.contains(_searchTerm.toLowerCase());
  }).toList();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final user = context.read<AuthService>().currentUser;
    if (user == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final entriesFuture = SupabaseConfig.client
          .from('vault_entries')
          .select('*')
          .order('created_at', ascending: false);
      final docsFuture = SupabaseConfig.client
          .from('documents')
          .select('*')
          .order('created_at', ascending: false)
          .limit(20);
      final results = await Future.wait([entriesFuture, docsFuture]);
      if (mounted) {
        setState(() {
          _entries = List<Map<String, dynamic>>.from(results[0]);
          _documents = List<Map<String, dynamic>>.from(results[1]);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _loading = false; });
      }
    }
  }

  void _showCreateEditModal([Map<String, dynamic>? existing]) {
    final titleCtrl = TextEditingController(text: existing?['title'] ?? '');
    final descCtrl = TextEditingController(text: existing?['description'] ?? '');
    final tagsCtrl = TextEditingController(text: (existing?['tags'] as List?)?.join(', ') ?? '');
    bool isConfidential = existing?['is_confidential'] ?? true;
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFF1A1A2E),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40, height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      existing != null ? 'Edit IP Record' : 'New IP Record',
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white70),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _formField('Title *', titleCtrl),
                const SizedBox(height: 14),
                _formField('Description', descCtrl, maxLines: 4),
                const SizedBox(height: 14),
                _formField('Tags (comma-separated)', tagsCtrl, hint: 'patent, trade-secret, prototype'),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Switch(
                      value: isConfidential,
                      onChanged: (v) => setModalState(() => isConfidential = v),
                      activeThumbColor: const Color(0xFFfc8181),
                    ),
                    const SizedBox(width: 8),
                    const Text('Mark as confidential', style: TextStyle(color: Colors.white70)),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: saving ? null : () async {
                          if (titleCtrl.text.trim().isEmpty) return;
                          setModalState(() => saving = true);
                          final user = context.read<AuthService>().currentUser;
                          if (user == null) return;

                          final payload = {
                            'title': titleCtrl.text.trim(),
                            'description': descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                            'is_confidential': isConfidential,
                            'tags': tagsCtrl.text.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList(),
                            'user_id': user.id,
                          };

                          try {
                            if (existing != null) {
                              await SupabaseConfig.client
                                  .from('vault_entries')
                                  .update(payload)
                                  .eq('id', existing['id']);
                              if (mounted) setState(() => _message = 'IP record updated.');
                            } else {
                              await SupabaseConfig.client
                                  .from('vault_entries')
                                  .insert(payload);
                              if (mounted) setState(() => _message = 'IP record created.');
                            }
                            if (ctx.mounted) Navigator.pop(ctx);
                            _fetchData();
                          } catch (e) {
                            if (mounted) setState(() => _error = e.toString());
                            if (ctx.mounted) Navigator.pop(ctx);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7c5fe6),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                        child: Text(
                          saving ? 'Saving...' : (existing != null ? 'Update Record' : 'Create Record'),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _formField(String label, TextEditingController ctrl, {int maxLines = 1, String? hint}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(color: Color(0xFF7c5fe6), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white24),
            filled: true,
            fillColor: Colors.black.withValues(alpha: 0.4),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF7c5fe6))),
          ),
        ),
      ],
    );
  }

  Future<void> _deleteEntry(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Delete Vault Entry', style: TextStyle(color: Colors.white)),
        content: const Text('Delete this vault entry? This cannot be undone.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await SupabaseConfig.client.from('vault_entries').delete().eq('id', id);
      if (mounted) setState(() => _message = 'Vault entry deleted.');
      _fetchData();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      final diff = DateTime.now().difference(date);
      if (diff.inDays > 365) return '${(diff.inDays / 365).floor()}y ago';
      if (diff.inDays > 30) return '${(diff.inDays / 30).floor()}mo ago';
      if (diff.inDays > 0) return '${diff.inDays}d ago';
      if (diff.inHours > 0) return '${diff.inHours}h ago';
      return '${diff.inMinutes}m ago';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)))
          : CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Back + Header
                        GestureDetector(
                          onTap: () => context.pop(),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.arrow_back, color: Color(0xFF7c5fe6), size: 18),
                              SizedBox(width: 4),
                              Text('Enterprise Hub', style: TextStyle(color: Color(0xFF7c5fe6), fontSize: 14)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text('Enterprise Knowledge Vault', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        const Text('Protected IP records and project documents for your organization.', style: TextStyle(color: Colors.grey, fontSize: 14)),
                        const SizedBox(height: 16),

                        // Action buttons
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _showCreateEditModal(),
                                icon: const Icon(Icons.add, size: 18, color: Colors.white),
                                label: const Text('New IP Record', style: TextStyle(color: Colors.white)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF7c5fe6),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton(
                              onPressed: () => context.push('/vault'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white.withValues(alpha: 0.1),
                                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                                elevation: 0,
                              ),
                              child: const Text('Full Vault', style: TextStyle(color: Colors.white70)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Status banners
                        if (_error != null) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFfc8181).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(_error!, style: const TextStyle(color: Color(0xFFfeb2b2), fontSize: 13)),
                          ),
                          const SizedBox(height: 12),
                        ],
                        if (_message != null) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF48bb78).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(_message!, style: const TextStyle(color: Color(0xFF9ae6b4), fontSize: 13)),
                          ),
                          const SizedBox(height: 12),
                        ],

                        // Search
                        TextField(
                          onChanged: (v) => setState(() => _searchTerm = v),
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText: 'Search vault entries...',
                            hintStyle: const TextStyle(color: Colors.grey),
                            prefixIcon: const Icon(Icons.search, color: Colors.grey),
                            filled: true,
                            fillColor: Colors.white.withValues(alpha: 0.05),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Protected IP Section
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Protected IP (${_filtered.length})', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // IP entries list
                if (_filtered.isEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.shield, color: Colors.grey, size: 40),
                            const SizedBox(height: 12),
                            const Text('No protected IP records yet.', style: TextStyle(color: Colors.grey)),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => _showCreateEditModal(),
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6)),
                              child: const Text('Create first record', style: TextStyle(color: Colors.white)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _entryCard(_filtered[index]),
                        childCount: _filtered.length,
                      ),
                    ),
                  ),

                // Documents section
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Project Documents (${_documents.length})', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        TextButton(
                          onPressed: () => context.push('/documents'),
                          child: const Text('View All', style: TextStyle(color: Color(0xFF7c5fe6))),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_documents.isEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Text('No project documents uploaded yet.', style: TextStyle(color: Colors.grey), textAlign: TextAlign.center),
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _documentRow(_documents[index]),
                        childCount: _documents.length,
                      ),
                    ),
                  ),

                const SliverToBoxAdapter(child: SizedBox(height: 40)),
              ],
            ),
    );
  }

  Widget _entryCard(Map<String, dynamic> entry) {
    final isConfidential = entry['is_confidential'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(child: Text(entry['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15))),
                    if (isConfidential) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFfc8181).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('Confidential', style: TextStyle(color: Color(0xFFfeb2b2), fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(entry['description'] ?? 'No description', style: const TextStyle(color: Colors.white54, fontSize: 13)),
                const SizedBox(height: 4),
                Text(_timeAgo(entry['created_at']), style: const TextStyle(color: Colors.white30, fontSize: 11)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              InkWell(
                onTap: () => _showCreateEditModal(entry),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.edit, color: Colors.white54, size: 16),
                ),
              ),
              const SizedBox(height: 6),
              InkWell(
                onTap: () => _deleteEntry(entry['id']),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFfc8181).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.delete, color: Color(0xFFfeb2b2), size: 16),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _documentRow(Map<String, dynamic> doc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          const Icon(Icons.description, color: Color(0xFF7c5fe6), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(doc['name'] ?? 'Untitled', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                Text(doc['file_type'] ?? '--', style: const TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          ),
          Text(_timeAgo(doc['created_at']), style: const TextStyle(color: Colors.white30, fontSize: 11)),
        ],
      ),
    );
  }
}
