import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../auth/services/auth_service.dart';
import '../models/enterprise_document.dart';
import '../services/document_service.dart';
import 'package:intl/intl.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  List<EnterpriseDocument> _docs = [];
  DashboardMetrics _metrics = DashboardMetrics();
  bool _loading = true;
  String? _error;

  String _search = '';
  String _typeFilter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchDocs();
  }

  Future<void> _fetchDocs() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final user = context.read<AuthService>().currentUser;
    if (user == null) { setState(() => _loading = false); return; }
    final service = context.read<DocumentService>();
    try {
      final docs = await service.listDocuments(user.id);
      final metrics = service.calculateMetrics(docs);
      if (!mounted) return;
      setState(() { 
        _docs = docs; 
        _metrics = metrics;
        _loading = false; 
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<EnterpriseDocument> get _filteredDocs {
    return _docs.where((d) {
      if (_typeFilter != 'all' && d.fileKind != _typeFilter) return false;
      if (_search.isNotEmpty) {
        final q = _search.toLowerCase();
        return d.name.toLowerCase().contains(q) || 
               d.projectName.toLowerCase().contains(q) || 
               d.authorName.toLowerCase().contains(q);
      }
      return true;
    }).toList();
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '\$bytes B';
    if (bytes < 1024 * 1024) return '\${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '\${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '\${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  IconData _iconForKind(String kind) {
    switch (kind) {
      case 'pdf': return Icons.picture_as_pdf;
      case 'docx': return Icons.description;
      case 'pptx': return Icons.slideshow;
      case 'xlsx': case 'csv': return Icons.table_chart;
      case 'png': case 'jpg': return Icons.image;
      case 'zip': return Icons.folder_zip;
      default: return Icons.insert_drive_file;
    }
  }

  Color _colorForKind(String kind) {
    switch (kind) {
      case 'pdf': return Colors.redAccent;
      case 'docx': return Colors.blueAccent;
      case 'pptx': return Colors.orangeAccent;
      case 'xlsx': case 'csv': return Colors.greenAccent;
      case 'png': case 'jpg': return Colors.purpleAccent;
      case 'zip': return Colors.yellowAccent;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: RefreshIndicator(
        onRefresh: _fetchDocs,
        child: CustomScrollView(
          slivers: [
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
                            Text(
                              'Document Vault',
                              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Centralized knowledge across all pipelines',
                              style: TextStyle(color: Colors.grey, fontSize: 14),
                            ),
                          ],
                        ),
                        ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2fd4ff),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('Upload', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Stats Row
                    Row(
                      children: [
                        _statBadge('Total Docs', _metrics.total.toString(), const Color(0xFF2fd4ff)),
                        const SizedBox(width: 8),
                        _statBadge('Storage', _formatBytes(_metrics.storageBytes), Colors.purpleAccent),
                        const SizedBox(width: 8),
                        _statBadge('Research', _metrics.research.toString(), Colors.blueAccent),
                        const SizedBox(width: 8),
                        _statBadge('Funding', _metrics.funding.toString(), Colors.greenAccent),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Search & Filters
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            onChanged: (v) => setState(() => _search = v),
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: 'Search documents...',
                              hintStyle: const TextStyle(color: Colors.grey),
                              prefixIcon: const Icon(Icons.search, color: Colors.grey),
                              filled: true,
                              fillColor: Colors.white.withValues(alpha: 0.05),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _typeFilter,
                              dropdownColor: const Color(0xFF1A1A2E),
                              style: const TextStyle(color: Colors.white),
                              icon: const Icon(Icons.filter_list, color: Colors.grey),
                              items: const [
                                DropdownMenuItem(value: 'all', child: Text('All Types')),
                                DropdownMenuItem(value: 'pdf', child: Text('PDF')),
                                DropdownMenuItem(value: 'docx', child: Text('DOCX')),
                                DropdownMenuItem(value: 'xlsx', child: Text('Excel')),
                                DropdownMenuItem(value: 'png', child: Text('Images')),
                              ],
                              onChanged: (val) => setState(() => _typeFilter = val!),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: Color(0xFF2fd4ff))))
            else if (_error != null)
              SliverFillRemaining(child: Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red))))
            else if (_filteredDocs.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.folder_open, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('No documents found', style: TextStyle(fontSize: 18, color: Colors.grey)),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _docCard(_filteredDocs[index]),
                    childCount: _filteredDocs.length,
                  ),
                ),
              ),
              
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }

  Widget _statBadge(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _docCard(EnterpriseDocument doc) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: const Color(0xFF1A1A2E),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: InkWell(
        onTap: () => context.go('/dashboard/documents/${doc.id}', extra: _docs),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _colorForKind(doc.fileKind).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_iconForKind(doc.fileKind), color: _colorForKind(doc.fileKind), size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doc.name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '\${doc.projectName} • \${doc.authorName}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white10,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            doc.module.toUpperCase(),
                            style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'v\${doc.version}',
                          style: const TextStyle(color: Colors.white54, fontSize: 10),
                        ),
                        const Spacer(),
                        Text(
                          DateFormat('MMM d').format(doc.createdAt),
                          style: const TextStyle(color: Colors.grey, fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
