import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/supabase_client.dart';
import 'edit_profile_screen.dart';
import 'security_screen.dart';
import 'billing_screen.dart';
import 'notifications_settings_screen.dart';
import 'settings_screen.dart';
import 'help_support_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final user = context.read<AuthService>().currentUser;
    if (user == null) return;

    try {
      final data = await SupabaseConfig.client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

      if (mounted) {
        setState(() {
          _profile = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _isLoading = false; });
      }
    }
  }

  Future<void> _handleLogout() async {
    await context.read<AuthService>().signOut();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthService>().currentUser;
    final displayName = _profile?['full_name'] ?? user?.userMetadata?['full_name'] ?? 'User';
    final email = user?.email ?? '';
    final role = _profile?['role'] ?? 'innovator';

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 50,
                    backgroundImage: AssetImage('assets/images/logo.jpeg'),
                  ),
                  const SizedBox(height: 16),
                  Text(displayName.toString(),
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(email, style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                  const SizedBox(height: 8),
                  Chip(
                    label: Text(role.toString().toUpperCase()),
                    backgroundColor: Colors.blue.withOpacity(0.1),
                    labelStyle: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 32),
                  _menuItem(Icons.person, 'Edit Profile', () async {
                    final updated = await Navigator.push(context, MaterialPageRoute(builder: (_) => EditProfileScreen(initialProfile: _profile ?? {})));
                    if (updated == true) _loadProfile();
                  }),
                  _menuItem(Icons.security, 'Security', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecurityScreen()))),
                  _menuItem(Icons.payment, 'Billing', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BillingScreen()))),
                  _menuItem(Icons.notifications, 'Notifications', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsSettingsScreen()))),
                  _menuItem(Icons.settings, 'Settings', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()))),
                  _menuItem(Icons.help_outline, 'Help & Support', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpSupportScreen()))),
                  
                  if (context.read<AuthService>().isAdmin) ...[
                    const Divider(height: 32),
                    _menuItem(Icons.admin_panel_settings, 'Admin Console', () => context.push('/admin'), color: Colors.deepPurple),
                  ],

                  const Divider(height: 32),
                  _menuItem(Icons.logout, 'Log Out', _handleLogout, color: Colors.red),
                ],
              ),
            ),
    );
  }

  Widget _menuItem(IconData icon, String label, VoidCallback onTap, {Color? color}) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(label, style: TextStyle(color: color)),
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
    );
  }
}
