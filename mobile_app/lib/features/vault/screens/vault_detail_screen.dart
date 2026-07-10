import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/vault_entry.dart';
import '../services/vault_service.dart';
import 'package:intl/intl.dart';

class VaultDetailScreen extends StatefulWidget {
  final String entryId;

  const VaultDetailScreen({super.key, required this.entryId});

  @override
  State<VaultDetailScreen> createState() => _VaultDetailScreenState();
}

class _VaultDetailScreenState extends State<VaultDetailScreen> {
  VaultEntry? _entry;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchEntry();
  }

  Future<void> _fetchEntry() async {
    setState(() { _loading = true; _error = null; });
    final service = context.read<VaultService>();
    try {
      final entry = await service.getVaultEntry(widget.entryId);
      if (!mounted) return;
      setState(() { _entry = entry; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _deleteEntry() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Delete Vault Entry', style: TextStyle(color: Colors.white)),
        content: const Text('Permanently delete this entry?\nThis cannot be undone.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    try {
      await context.read<VaultService>().deleteVaultEntry(widget.entryId);
      if (mounted) { context.pop(); }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e'), backgroundColor: Colors.red));
      }
    }
  }

  void _showEditModal() {
    if (_entry == null) return;
    final titleCtrl = TextEditingController(text: _entry!.title);
    final descCtrl = TextEditingController(text: _entry!.description ?? '');
    final contentCtrl = TextEditingController(text: _entry!.content ?? '');
    final tagsCtrl = TextEditingController(text: _entry!.tags.join(', '));
    bool isPublic = _entry!.isPublic;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1A1A2E),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20, right: 20, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Edit Vault Entry', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _modalField('Title', titleCtrl),
                  const SizedBox(height: 12),
                  _modalField('Short Description', descCtrl, maxLines: 2),
                  const SizedBox(height: 12),
                  _modalField('Content / Details', contentCtrl, maxLines: 6),
                  const SizedBox(height: 12),
                  _modalField('Tags (comma separated)', tagsCtrl),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Switch(
                        value: isPublic,
                        onChanged: (v) => setModalState(() => isPublic = v),
                        activeThumbColor: const Color(0xFF2fd4ff),
                      ),
                      const SizedBox(width: 8),
                      const Text('Make publicly visible', style: TextStyle(color: Colors.white70)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final updates = {
                          'title': titleCtrl.text.trim(),
                          'description': descCtrl.text.trim(),
                          'content': contentCtrl.text.trim(),
                          'tags': tagsCtrl.text.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList(),
                          'is_public': isPublic,
                        };
                        try {
                          await context.read<VaultService>().updateVaultEntry(widget.entryId, updates);
                          if (ctx.mounted) { Navigator.pop(ctx); }
                          _fetchEntry();
                        } catch (e) {
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Update failed: $e'), backgroundColor: Colors.red));
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF7c5fe6),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Save Changes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _modalField(String label, TextEditingController ctrl, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(color: Color(0xFF7c5fe6), fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black.withOpacity(0.5),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => context.pop()),
        title: const Text('Vault Entry', style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(icon: const Icon(Icons.edit, color: Color(0xFF7c5fe6)), onPressed: _showEditModal),
          IconButton(icon: const Icon(Icons.delete, color: Colors.redAccent), onPressed: _deleteEntry),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)))
          : _error != null
              ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red)))
              : _entry == null
                  ? const Center(child: Text('Entry not found', style: TextStyle(color: Colors.grey)))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title
                          Text(_entry!.title, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),

                          // Badges Row
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _badge(_entry!.isPublic ? 'Public' : 'Private', _entry!.isPublic ? const Color(0xFF2fd4ff) : Colors.white60),
                              ..._entry!.tags.map((tag) => _badge(tag, const Color(0xFF9b7ff0))),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Meta
                          Text(
                            '📅 Created: ${DateFormat('MMM d, yyyy h:mm a').format(_entry!.createdAt.toLocal())}',
                            style: const TextStyle(color: Colors.white54, fontSize: 12),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '🕒 Updated: ${DateFormat('MMM d, yyyy h:mm a').format(_entry!.updatedAt.toLocal())}',
                            style: const TextStyle(color: Colors.white54, fontSize: 12),
                          ),
                          const SizedBox(height: 24),

                          // Description
                          if (_entry!.description != null && _entry!.description!.isNotEmpty) ...[
                            const Text('Description', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Text(_entry!.description!, style: const TextStyle(color: Colors.white70, height: 1.5)),
                            const SizedBox(height: 24),
                          ],

                          // Full Content
                          if (_entry!.content != null && _entry!.content!.isNotEmpty) ...[
                            const Text('Full Content', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.4),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withOpacity(0.1)),
                              ),
                              child: Text(_entry!.content!, style: const TextStyle(color: Colors.white, fontFamily: 'monospace', height: 1.6)),
                            ),
                          ],
                        ],
                      ),
                    ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
