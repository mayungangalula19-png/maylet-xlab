import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../projects/models/project.dart';
import '../../projects/services/project_service.dart';
import '../models/prototype.dart';
import '../services/prototype_service.dart';

class CreatePrototypeScreen extends StatefulWidget {
  const CreatePrototypeScreen({super.key});

  @override
  State<CreatePrototypeScreen> createState() => _CreatePrototypeScreenState();
}

class _CreatePrototypeScreenState extends State<CreatePrototypeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _versionController = TextEditingController(text: '0.1.0');

  String? _selectedProjectId;
  List<Project> _projects = [];
  bool _isLoading = false;

  final List<String> _statuses = ['draft', 'building', 'testing', 'success', 'archived'];
  String _selectedStatus = 'draft';

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

    setState(() => _isLoading = true);

    try {
      final user = context.read<AuthService>().currentUser;
      if (user == null) throw Exception('Not authenticated');

      final prototype = Prototype(
        id: '',
        projectId: _selectedProjectId,
        userId: user.id,
        title: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
        status: _selectedStatus,
        lifecycleStatus: _selectedStatus,
        version: _versionController.text.trim().isEmpty ? '0.1.0' : _versionController.text.trim(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await context.read<PrototypeService>().createPrototype(prototype);

      if (mounted) {
        context.pop();
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
    _nameController.dispose();
    _descriptionController.dispose();
    _versionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create prototype')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Capture the core prototype context and publish it to Supabase.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _selectedProjectId,
              decoration: const InputDecoration(labelText: 'Linked project (optional)'),
              items: [
                const DropdownMenuItem(value: null, child: Text('No linked project')),
                ..._projects.map((project) => DropdownMenuItem(value: project.id, child: Text(project.name))),
              ],
              onChanged: (value) => setState(() => _selectedProjectId = value),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Prototype name'),
              validator: (value) => value == null || value.trim().isEmpty ? 'Name is required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'Problem statement or notes'),
              maxLines: 4,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _versionController,
              decoration: const InputDecoration(labelText: 'Version'),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _selectedStatus,
              decoration: const InputDecoration(labelText: 'Lifecycle status'),
              items: _statuses
                  .map((status) => DropdownMenuItem(value: status, child: Text(status.toUpperCase())))
                  .toList(),
              onChanged: (value) => setState(() => _selectedStatus = value ?? 'draft'),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _isLoading ? null : _submit,
              icon: _isLoading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.save_alt),
              label: Text(_isLoading ? 'Saving…' : 'Save prototype'),
            ),
          ],
        ),
      ),
    );
  }
}
