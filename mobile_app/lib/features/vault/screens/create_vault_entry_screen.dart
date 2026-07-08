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
  final _tagsController = TextEditingController();

  bool _isPublic = false;
  bool _isLoading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final user = context.read<AuthService>().currentUser;
    if (user == null) {
      setState(() => _isLoading = false);
      return;
    }

    final service = context.read<VaultService>();
    try {
      final entry = VaultEntry(
        id: '',
        userId: user.id,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
        content: _contentController.text.trim().isEmpty ? null : _contentController.text.trim(),
        tags: _tagsController.text.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList(),
        isConfidential: true,
        isPublic: _isPublic,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await service.createVaultEntry(entry);

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
    _tagsController.dispose();
    super.dispose();
  }

  Widget _field(String label, TextEditingController ctrl, {int maxLines = 1, String? hint, bool required = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(color: Color(0xFF7c5fe6), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white),
          validator: required ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null : null,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white24),
            filled: true,
            fillColor: Colors.black.withValues(alpha: 0.5),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF7c5fe6))),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => context.pop()),
        title: const Text('Add New Vault Entry', style: TextStyle(color: Colors.white)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _field('Title *', _titleController, required: true),
            const SizedBox(height: 16),
            _field('Short Description', _descriptionController, maxLines: 2),
            const SizedBox(height: 16),
            _field('Content / Details *', _contentController, maxLines: 6, hint: 'Describe your idea, invention, or innovation in detail...', required: true),
            const SizedBox(height: 16),
            _field('Tags (comma separated)', _tagsController, hint: 'e.g., AI, blockchain, agritech'),
            const SizedBox(height: 20),

            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Switch(
                    value: _isPublic,
                    onChanged: (v) => setState(() => _isPublic = v),
                    activeThumbColor: const Color(0xFF2fd4ff),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Public visibility', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        Text(
                          _isPublic ? 'Others can see this entry' : 'Only you can see this entry',
                          style: const TextStyle(color: Colors.white54, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7c5fe6),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                ),
                child: _isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save to Vault', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
