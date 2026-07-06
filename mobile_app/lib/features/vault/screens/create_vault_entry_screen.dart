import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/vault_entry.dart';
import '../services/vault_service.dart';
import '../../auth/services/auth_service.dart';

class CreateVaultEntryScreen extends StatefulWidget {
  const CreateVaultEntryScreen({super.key});

  @override
  State<CreateVaultEntryScreen> createState() => _CreateVaultEntryScreenState();
}

class _CreateVaultEntryScreenState extends State<CreateVaultEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _contentController = TextEditingController();
  
  bool _isConfidential = true;
  bool _isPublic = false;
  bool _isLoading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final user = context.read<AuthService>().currentUser;
      if (user == null) throw Exception('Not authenticated');

      final entry = VaultEntry(
        id: '', // Supabase generates this
        userId: user.id,
        title: _titleController.text,
        description: _descriptionController.text.isEmpty ? null : _descriptionController.text,
        content: _contentController.text.isEmpty ? null : _contentController.text,
        tags: [],
        isConfidential: _isConfidential,
        isPublic: _isPublic,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await context.read<VaultService>().createVaultEntry(entry);
      
      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Securely stored in Vault')),
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
    _descriptionController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Store in Vault')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Title'),
              validator: (value) => value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'Short Description'),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: 'Secret Content / Document',
                alignLabelWithHint: true,
              ),
              maxLines: 6,
            ),
            const SizedBox(height: 24),
            SwitchListTile(
              title: const Text('Confidential'),
              subtitle: const Text('Mark this as highly sensitive IP'),
              value: _isConfidential,
              onChanged: (val) => setState(() => _isConfidential = val),
            ),
            SwitchListTile(
              title: const Text('Public Access'),
              subtitle: const Text('Allow others in workspace to view'),
              value: _isPublic,
              onChanged: (val) => setState(() => _isPublic = val),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              child: _isLoading 
                ? const CircularProgressIndicator()
                : const Text('Lock in Vault'),
            ),
          ],
        ),
      ),
    );
  }
}
