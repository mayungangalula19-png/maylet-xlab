import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/funding_pitch.dart';
import '../services/funding_service.dart';
import '../../auth/services/auth_service.dart';
import '../../projects/models/project.dart';
import '../../projects/services/project_service.dart';

class CreatePitchScreen extends StatefulWidget {
  const CreatePitchScreen({super.key});

  @override
  State<CreatePitchScreen> createState() => _CreatePitchScreenState();
}

class _CreatePitchScreenState extends State<CreatePitchScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _summaryController = TextEditingController();
  final _targetAmountController = TextEditingController();
  
  String? _selectedProjectId;
  List<Project> _projects = [];
  bool _isLoading = false;

  final List<String> _stages = ['pre-seed', 'seed', 'series-a', 'series-b', 'grant'];
  String _selectedStage = 'pre-seed';

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    final user = context.read<AuthService>().currentUser;
    if (user != null) {
      final projects = await context.read<ProjectService>().fetchUserProjects(user.id);
      if (mounted) {
        setState(() {
          _projects = projects;
          if (_projects.isNotEmpty) {
            _selectedProjectId = _projects.first.id;
          }
        });
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProjectId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a project first.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final pitch = FundingPitch(
        id: '', 
        projectId: _selectedProjectId!,
        title: _titleController.text,
        summary: _summaryController.text.isEmpty ? null : _summaryController.text,
        stage: _selectedStage,
        targetAmount: double.tryParse(_targetAmountController.text) ?? 0.0,
        raisedAmount: 0.0,
        status: 'draft',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await context.read<FundingService>().createPitch(pitch);
      
      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pitch drafted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    _targetAmountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Pitch')),
      body: _projects.isEmpty 
          ? const Center(child: Text('You need to create a project first.'))
          : Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
              initialValue: _selectedProjectId,
              decoration: const InputDecoration(labelText: 'Project to Fund'),
              items: _projects.map((p) => DropdownMenuItem(
                value: p.id,
                child: Text(p.name),
              )).toList(),
              onChanged: (val) => setState(() => _selectedProjectId = val),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Pitch Title'),
              validator: (value) => value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _summaryController,
              decoration: const InputDecoration(labelText: 'Executive Summary'),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _targetAmountController,
              decoration: const InputDecoration(labelText: 'Target Amount (\$)'),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) return 'Required';
                if (double.tryParse(value) == null) return 'Must be a valid number';
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _selectedStage,
              decoration: const InputDecoration(labelText: 'Funding Stage'),
              items: _stages.map((s) => DropdownMenuItem(
                value: s,
                child: Text(s.toUpperCase()),
              )).toList(),
              onChanged: (val) => setState(() => _selectedStage = val!),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              child: _isLoading 
                ? const CircularProgressIndicator()
                : const Text('Save Draft Pitch'),
            ),
          ],
        ),
      ),
    );
  }
}
