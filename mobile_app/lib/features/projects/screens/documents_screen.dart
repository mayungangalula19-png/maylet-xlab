import 'package:flutter/material.dart';

class DocumentsScreen extends StatelessWidget {
  final String projectId;
  const DocumentsScreen({super.key, required this.projectId});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Project Documents', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.upload_file),
              label: const Text('Upload'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _documentCard(context, 'Business Plan.pdf', 'PDF • 2.4 MB', Icons.picture_as_pdf, Colors.red),
        _documentCard(context, 'Market Research.docx', 'DOCX • 1.1 MB', Icons.description, Colors.blue),
        _documentCard(context, 'Financial Projections.xlsx', 'XLSX • 3.5 MB', Icons.table_chart, Colors.green),
      ],
    );
  }

  Widget _documentCard(BuildContext context, String title, String subtitle, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: IconButton(
          icon: const Icon(Icons.more_vert),
          onPressed: () {},
        ),
      ),
    );
  }
}
