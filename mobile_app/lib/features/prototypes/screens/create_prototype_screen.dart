import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/prototype.dart';
import '../services/prototype_service.dart';
import '../../auth/services/auth_service.dart';
import '../../projects/models/project.dart';
import '../../projects/services/project_service.dart';

class CreatePrototypeScreen extends StatefulWidget {
  const CreatePrototypeScreen({super.key});

  @override
  State<CreatePrototypeScreen> createState() => _CreatePrototypeScreenState();
}

class _CreatePrototypeScreenState extends State<CreatePrototypeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  String? _selectedProjectId;
  List<Project> _projects = [];
  bool _isLoading = false;

  final List<String> _statuses = ['concept', 'designing', 'building', 'testing', 'complete'];
  String _selectedStatus = 'concept';

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
      final user = context.read<AuthService>().currentUser;
      if (user == null) throw Exception('Not authenticated');

      final prototype = Prototype(
        id: '', 
        projectId: _selectedProjectId!,
        userId: user.id,
        title: _titleController.text,
        description: _descriptionController.text.isEmpty ? null : _descriptionController.text,
        status: _selectedStatus,
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
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Prototype')),
      body: _projects.isEmpty 
          ? const Center(child: Text('You need to create a project first.'))
          : Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
                initialValue: _selectedProjectId,
                decoration: const InputDecoration(labelText: 'Project'),
              items: _projects.map((p) => DropdownMenuItem(
                value: p.id,
                child: Text(p.name),
              )).toList(),
              onChanged: (val) => setState(() => _selectedProjectId = val),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Prototype Title'),
              validator: (value) => value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'Description'),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
                initialValue: _selectedStatus,
                decoration: const InputDecoration(labelText: 'Status'),
              items: _statuses.map((s) => DropdownMenuItem(
                value: s,
                child: Text(s.toUpperCase()),
              )).toList(),
              onChanged: (val) => setState(() => _selectedStatus = val!),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              child: _isLoading 
                ? const CircularProgressIndicator()
                : const Text('Create Prototype'),
            ),
          ],
        ),
      ),
    );
  }
}
