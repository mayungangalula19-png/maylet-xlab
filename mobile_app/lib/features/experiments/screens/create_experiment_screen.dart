import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../services/experiment_service.dart';
import '../../auth/services/auth_service.dart';

class CreateExperimentScreen extends StatefulWidget {
  const CreateExperimentScreen({super.key});

  @override
  State<CreateExperimentScreen> createState() => _CreateExperimentScreenState();
}

class _CreateExperimentScreenState extends State<CreateExperimentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _hypothesisController = TextEditingController();
  String _selectedType = 'scientific';
  bool _isLoading = false;

  static const _experimentTypes = [
    'engineering',
    'scientific',
    'market',
    'product',
    'business',
    'structured',
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _hypothesisController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    final userId = context.read<AuthService>().currentUser?.id;
    if (userId == null) return;

    setState(() { _isLoading = true; });

    try {
      await context.read<ExperimentService>().createExperiment(
        userId: userId,
        title: _titleController.text.trim(),
        hypothesis: _hypothesisController.text.trim(),
        type: _selectedType,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Experiment created successfully')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() { _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Experiment')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Experiment Title *',
                  hintText: 'e.g. Effect of UV on plant growth',
                ),
                validator: (v) => v == null || v.isEmpty ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _hypothesisController,
                decoration: const InputDecoration(
                  labelText: 'Hypothesis *',
                  hintText: 'If X then Y because Z...',
                ),
                maxLines: 3,
                validator: (v) => v == null || v.isEmpty ? 'Hypothesis is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _selectedType,
                decoration: const InputDecoration(labelText: 'Experiment Type'),
                items: _experimentTypes.map((t) => DropdownMenuItem(
                  value: t,
                  child: Text(t[0].toUpperCase() + t.substring(1)),
                )).toList(),
                onChanged: (v) => setState(() { _selectedType = v ?? 'scientific'; }),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitForm,
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Create Experiment'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
