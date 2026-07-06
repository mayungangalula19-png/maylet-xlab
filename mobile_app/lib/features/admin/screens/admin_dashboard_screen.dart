import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/admin_service.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final AdminService _adminService = AdminService();
  bool _isLoading = true;
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    try {
      final stats = await _adminService.getSystemStats();
      if (mounted) {
        setState(() {
          _stats = stats;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading stats: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Console', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadStats,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text('System Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _statCard(context, 'Total Users', _stats['totalUsers']?.toString() ?? '0', Icons.people, Colors.blue),
                      const SizedBox(width: 12),
                      _statCard(context, 'Total Projects', _stats['totalProjects']?.toString() ?? '0', Icons.folder, Colors.purple),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _statCard(context, 'Funding Pitches', _stats['totalPitches']?.toString() ?? '0', Icons.attach_money, Colors.green),
                      const SizedBox(width: 12),
                      _statCard(context, 'System Health', '100%', Icons.favorite, Colors.red),
                    ],
                  ),
                  const SizedBox(height: 32),
                  const Text('Management', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ListTile(
                    leading: const Icon(Icons.people_outline, color: Colors.blue),
                    title: const Text('Users Management'),
                    subtitle: const Text('View and manage user roles'),
                    trailing: const Icon(Icons.chevron_right),
                    tileColor: Theme.of(context).colorScheme.surfaceContainerLow,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onTap: () => context.push('/admin/users'),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    leading: const Icon(Icons.folder_outlined, color: Colors.purple),
                    title: const Text('Projects Moderation'),
                    subtitle: const Text('Review platform projects'),
                    trailing: const Icon(Icons.chevron_right),
                    tileColor: Theme.of(context).colorScheme.surfaceContainerLow,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onTap: () => context.push('/admin/projects'),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    leading: const Icon(Icons.settings_outlined, color: Colors.grey),
                    title: const Text('System Settings'),
                    subtitle: const Text('Configure global platform rules'),
                    trailing: const Icon(Icons.chevron_right),
                    tileColor: Theme.of(context).colorScheme.surfaceContainerLow,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onTap: () {},
                  ),
                ],
              ),
            ),
    );
  }

  Widget _statCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
          ],
        ),
      ),
    );
  }
}
