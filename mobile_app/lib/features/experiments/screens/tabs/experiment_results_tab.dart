import 'package:flutter/material.dart';
import '../../../../core/supabase_client.dart';
import '../../models/experiment.dart';

class ExperimentResultsTab extends StatefulWidget {
  final Experiment experiment;

  const ExperimentResultsTab({super.key, required this.experiment});

  @override
  State<ExperimentResultsTab> createState() => _ExperimentResultsTabState();
}

class _ExperimentResultsTabState extends State<ExperimentResultsTab> {
  late TextEditingController _resultsController;
  late TextEditingController _findingsController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _resultsController = TextEditingController(text: widget.experiment.results ?? '');
    _findingsController = TextEditingController(text: widget.experiment.findings ?? '');
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await SupabaseConfig.client.from('experiments').update({
        'results': _resultsController.text,
        'findings': _findingsController.text,
      }).eq('id', widget.experiment.id);
      
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Results saved', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red));
    }
    setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Results Analysis', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              ElevatedButton.icon(
                onPressed: () {}, // Mock run AI
                icon: const Icon(Icons.auto_awesome, size: 16),
                label: const Text('AI Analysis'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7c5fe6),
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Document your findings or let AI analyze the raw data.', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 24),
          
          TextField(
            controller: _resultsController,
            style: const TextStyle(color: Colors.white),
            maxLines: 6,
            decoration: InputDecoration(
              labelText: 'Raw Results Summary',
              labelStyle: const TextStyle(color: Colors.grey),
              alignLabelWithHint: true,
              filled: true,
              fillColor: const Color(0xFF1A1A2E),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),
          
          TextField(
            controller: _findingsController,
            style: const TextStyle(color: Colors.white),
            maxLines: 6,
            decoration: InputDecoration(
              labelText: 'Key Findings & Conclusions',
              labelStyle: const TextStyle(color: Colors.grey),
              alignLabelWithHint: true,
              filled: true,
              fillColor: const Color(0xFF1A1A2E),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 32),
          
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2fd4ff),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _saving 
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                : const Text('Save Analysis', style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
