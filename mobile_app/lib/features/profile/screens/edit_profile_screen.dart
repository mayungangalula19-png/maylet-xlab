import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/supabase_client.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> initialProfile;
  const EditProfileScreen({super.key, required this.initialProfile});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late TextEditingController _nameCtrl;
  late TextEditingController _bioCtrl;
  late TextEditingController _orgCtrl;
  late TextEditingController _locCtrl;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initialProfile['full_name'] ?? '');
    _bioCtrl = TextEditingController(text: widget.initialProfile['bio'] ?? '');
    _orgCtrl = TextEditingController(text: widget.initialProfile['organization_name'] ?? '');
    _locCtrl = TextEditingController(text: widget.initialProfile['location'] ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _bioCtrl.dispose();
    _orgCtrl.dispose();
    _locCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    final user = context.read<AuthService>().currentUser;
    if (user == null) return;
    
    setState(() => _isLoading = true);
    try {
      await SupabaseConfig.client.from('profiles').update({
        'full_name': _nameCtrl.text,
        'bio': _bioCtrl.text,
        'organization_name': _orgCtrl.text,
        'location': _locCtrl.text,
      }).eq('id', user.id);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully')));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 50,
              backgroundImage: AssetImage('assets/images/logo.jpeg'),
            ),
            const SizedBox(height: 16),
            TextButton.icon(onPressed: () {}, icon: const Icon(Icons.camera_alt), label: const Text('Change Photo')),
            const SizedBox(height: 24),
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name')),
            const SizedBox(height: 16),
            TextField(controller: _bioCtrl, decoration: const InputDecoration(labelText: 'Bio'), maxLines: 3),
            const SizedBox(height: 16),
            TextField(controller: _orgCtrl, decoration: const InputDecoration(labelText: 'Organization')),
            const SizedBox(height: 16),
            TextField(controller: _locCtrl, decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveProfile,
                child: _isLoading ? const CircularProgressIndicator() : const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
