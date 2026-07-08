import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/enterprise_document.dart';
import '../services/document_service.dart';

class DocumentDetailScreen extends StatefulWidget {
  final String documentId;
  final List<EnterpriseDocument> allDocs;

  const DocumentDetailScreen({
    super.key,
    required this.documentId,
    required this.allDocs,
  });

  @override
  State<DocumentDetailScreen> createState() => _DocumentDetailScreenState();
}

class _DocumentDetailScreenState extends State<DocumentDetailScreen> {
  late EnterpriseDocument _doc;
  late MayaDocInsight _insight;
  bool _found = true;

  @override
  void initState() {
    super.initState();
    try {
      _doc = widget.allDocs.firstWhere((d) => d.id == widget.documentId);
      _insight = context.read<DocumentService>().generateMayaInsight(_doc, widget.allDocs);
    } catch (_) {
      _found = false;
    }
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
    if (!_found) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0A0F),
        appBar: AppBar(backgroundColor: const Color(0xFF0A0A0F)),
        body: const Center(child: Text('Document not found', style: TextStyle(color: Colors.red))),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text('Document Intelligence', style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.download, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _colorForKind(_doc.fileKind).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(_iconForKind(_doc.fileKind), color: _colorForKind(_doc.fileKind), size: 40),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _doc.name,
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '\${_doc.projectName} • \${_doc.authorName}',
                        style: const TextStyle(color: Colors.grey, fontSize: 14),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(8)),
                            child: Text(_doc.module.toUpperCase(), style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 8),
                          Text('v\${_doc.version}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            
            // MAYA Container
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E1A3A), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF6C3AED).withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.auto_awesome, color: Color(0xFF2fd4ff)),
                      const SizedBox(width: 8),
                      const Text('MAYA Analysis', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text('Summary', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(_insight.summary, style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.4)),
                  
                  const SizedBox(height: 24),
                  const Text('Key Findings', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ..._insight.keyFindings.map((kf) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('• ', style: TextStyle(color: Color(0xFF2fd4ff), fontWeight: FontWeight.bold)),
                        Expanded(child: Text(kf, style: const TextStyle(color: Colors.white70, height: 1.4))),
                      ],
                    ),
                  )),
                  
                  const SizedBox(height: 16),
                  const Text('Important Flags', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ..._insight.importantFlags.map((flag) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.warning_amber_rounded, color: Colors.orangeAccent, size: 16),
                        const SizedBox(width: 8),
                        Expanded(child: Text(flag, style: const TextStyle(color: Colors.orangeAccent, height: 1.4))),
                      ],
                    ),
                  )),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            const Text('Next Actions', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ..._insight.nextActions.map((na) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: const Color(0xFF1A1A2E),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: const Icon(Icons.arrow_forward, color: Color(0xFF2fd4ff)),
                title: Text(na, style: const TextStyle(color: Colors.white, fontSize: 14)),
              ),
            )),
          ],
        ),
      ),
    );
  }
}
