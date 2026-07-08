import 'package:flutter/material.dart';
import '../../../../core/supabase_client.dart';
import '../../models/experiment.dart';

class ExperimentHypothesisTab extends StatefulWidget {
  final Experiment experiment;

  const ExperimentHypothesisTab({super.key, required this.experiment});

  @override
  State<ExperimentHypothesisTab> createState() => _ExperimentHypothesisTabState();
}

class _ExperimentHypothesisTabState extends State<ExperimentHypothesisTab> {
  late TextEditingController _titleController;
  late TextEditingController _hypothesisController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.experiment.title);
    _hypothesisController = TextEditingController(text: widget.experiment.hypothesis);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await SupabaseConfig.client.from('experiments').update({
        'title': _titleController.text,
        'hypothesis': _hypothesisController.text,
      }).eq('id', widget.experiment.id);
      
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Hypothesis saved', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green));
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
          const Text('Scientific Hypothesis', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          const Text('Define what you are testing and your expected outcomes.', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 24),
          
          TextField(
            controller: _titleController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Experiment Title',
              labelStyle: const TextStyle(color: Colors.grey),
              filled: true,
              fillColor: const Color(0xFF1A1A2E),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),
          
          TextField(
            controller: _hypothesisController,
            style: const TextStyle(color: Colors.white),
            maxLines: 8,
            decoration: InputDecoration(
              labelText: 'Hypothesis',
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
                : const Text('Save Hypothesis', style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
