import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/admin_service.dart';
import 'package:intl/intl.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final AdminService _adminService = AdminService();
  bool _isLoading = true;
  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _activities = [];
  List<Map<String, dynamic>> _recentProjects = [];
  List<Map<String, dynamic>> _recentUsers = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _adminService.getSystemStats(),
        _adminService.getRecentActivity(),
        _adminService.getProjects(),
        _adminService.getUsers(),
      ]);

      if (mounted) {
        setState(() {
          _stats = results[0] as Map<String, dynamic>;
          _activities = results[1] as List<Map<String, dynamic>>;
          _recentProjects = (results[2] as List<Map<String, dynamic>>).take(5).toList();
          _recentUsers = (results[3] as List<Map<String, dynamic>>).take(5).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading admin data: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('Admin Dashboard', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _loadData),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)))
          : RefreshIndicator(
              onRefresh: _loadData,
              color: const Color(0xFF7c5fe6),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 24),
                  
                  // Row 1
                  _buildStatsRow([
                    _statCard('Total Users', _stats['totalUsers']?.toString() ?? '0', Icons.people, const Color(0xFF7c5fe6)),
                    _statCard('Total Projects', _stats['totalProjects']?.toString() ?? '0', Icons.folder, const Color(0xFF2fd4ff)),
                  ]),
                  const SizedBox(height: 12),
                  _buildStatsRow([
                    _statCard('Experiments', _stats['totalExperiments']?.toString() ?? '0', Icons.science, const Color(0xFF48bb78)),
                    _statCard('Prototypes', _stats['totalPrototypes']?.toString() ?? '0', Icons.build, const Color(0xFFf6c90e)),
                  ]),
                  const SizedBox(height: 12),

                  // Row 2
                  _buildStatsRow([
                    _statCard('Vault Items', _stats['totalVaultItems']?.toString() ?? '0', Icons.lock, const Color(0xFFfc8181)),
                    _statCard('Funding Pitches', _stats['totalFundingPitches']?.toString() ?? '0', Icons.attach_money, const Color(0xFF9b7ff0)),
                  ]),
                  const SizedBox(height: 12),
                  _buildStatsRow([
                    _statCard('Total Revenue', '\$${NumberFormat.compact().format(_stats['totalRevenue'] ?? 0)}', Icons.monetization_on, const Color(0xFF48bb78)),
                    _statCard('30-Day Rev', '\$${NumberFormat.compact().format(_stats['monthlyRevenue'] ?? 0)}', Icons.trending_up, const Color(0xFF2fd4ff)),
                  ]),
                  const SizedBox(height: 12),

                  // Row 3
                  _buildStatsRow([
                    _statCard('Mentors', _stats['totalMentors']?.toString() ?? '0', Icons.school, const Color(0xFFf6c90e)),
                    _statCard('Investors', _stats['totalInvestors']?.toString() ?? '0', Icons.business_center, const Color(0xFF48bb78)),
                  ]),
                  const SizedBox(height: 12),
                  _buildStatsRow([
                    _statCard('Innovators', _stats['totalInnovators']?.toString() ?? '0', Icons.lightbulb, const Color(0xFF7c5fe6)),
                    _statCard('Avg Progress', '${_stats['avgProjectProgress'] ?? 0}%', Icons.bar_chart, const Color(0xFF2fd4ff)),
                  ]),

                  const SizedBox(height: 32),
                  _buildUserStatusSection(),
                  const SizedBox(height: 32),
                  _buildRecentProjects(),
                  const SizedBox(height: 32),
                  _buildRecentUsers(),
                  const SizedBox(height: 32),
                  _buildActivityLog(),
                  const SizedBox(height: 32),
                  _buildQuickNav(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Welcome back, Admin', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 4),
        Text('Here\'s what\'s happening in Maylet XLab today.', style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
      ],
    );
  }

  Widget _buildStatsRow(List<Widget> children) {
    return Row(
      children: [
        Expanded(child: children[0]),
        const SizedBox(width: 12),
        Expanded(child: children[1]),
      ],
    );
  }

  Widget _statCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          Text(title, style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
        ],
      ),
    );
  }

  Widget _buildUserStatusSection() {
    final total = (_stats['totalUsers'] ?? 0) as int;
    final active = (_stats['activeUsers'] ?? 0) as int;
    final inactive = total - active;
    final activePct = total > 0 ? (active / total) * 100 : 0.0;
    final inactivePct = total > 0 ? (inactive / total) * 100 : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('👥 User Status', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              TextButton(onPressed: () => context.push('/admin/users'), child: const Text('Manage →', style: TextStyle(color: Color(0xFF7c5fe6)))),
            ],
          ),
          const SizedBox(height: 16),
          _statusLine('🟢 Active (7d)', active, activePct, Colors.green),
          const SizedBox(height: 12),
          _statusLine('⚪ Inactive', inactive, inactivePct, Colors.grey),
        ],
      ),
    );
  }

  Widget _statusLine(String label, int count, double pct, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: Colors.white)),
            Text('$count (${pct.toStringAsFixed(1)}%)', style: const TextStyle(color: Colors.white)),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: pct / 100,
          backgroundColor: Colors.white.withOpacity(0.1),
          valueColor: AlwaysStoppedAnimation<Color>(color),
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }

  Widget _buildRecentProjects() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('📁 Recent Projects', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              TextButton(onPressed: () => context.push('/admin/projects'), child: const Text('View All →', style: TextStyle(color: Color(0xFF7c5fe6)))),
            ],
          ),
          const SizedBox(height: 16),
          if (_recentProjects.isEmpty)
            const Text('No recent projects', style: TextStyle(color: Colors.grey))
          else
            ..._recentProjects.map((p) {
              final pct = (p['progress'] as num?)?.toDouble() ?? 0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: const Color(0xFF2fd4ff).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.rocket_launch, color: Color(0xFF2fd4ff), size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p['name'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                          const SizedBox(height: 4),
                          Text('${p['profiles']?['full_name'] ?? 'Unknown'} • ${p['sector'] ?? 'General'}', style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
                          const SizedBox(height: 6),
                          LinearProgressIndicator(
                            value: pct / 100,
                            backgroundColor: Colors.white.withOpacity(0.1),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2fd4ff)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text('${pct.toStringAsFixed(0)}%', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildRecentUsers() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('📋 Recent Users', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              TextButton(onPressed: () => context.push('/admin/users'), child: const Text('Manage All →', style: TextStyle(color: Color(0xFF7c5fe6)))),
            ],
          ),
          const SizedBox(height: 12),
          if (_recentUsers.isEmpty)
            const Text('No recent users', style: TextStyle(color: Colors.grey))
          else
            ..._recentUsers.map((u) {
              final role = u['role'] ?? 'user';
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: const Color(0xFF7c5fe6).withOpacity(0.2),
                  child: Text(u['full_name']?.toString().substring(0, 1).toUpperCase() ?? '?', style: const TextStyle(color: Color(0xFF7c5fe6))),
                ),
                title: Text(u['full_name'] ?? 'Unknown', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                subtitle: Text(u['email'] ?? '', style: TextStyle(color: Colors.grey.shade400)),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(role.toString().toUpperCase(), style: const TextStyle(fontSize: 10, color: Colors.white)),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildActivityLog() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('📝 System Activity Log', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 16),
          if (_activities.isEmpty)
            const Text('No recent activity', style: TextStyle(color: Colors.grey))
          else
            ..._activities.map((a) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    const Icon(Icons.history, color: Colors.grey, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(a['action'] ?? 'Action performed', style: const TextStyle(color: Colors.white)),
                          Text(a['created_at'] != null ? DateFormat.yMMMd().add_jm().format(DateTime.parse(a['created_at'])) : 'Unknown time', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildQuickNav() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('🔗 Quick Navigation', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 2.5,
          children: [
            _quickNavCard('Users', Icons.people, () => context.push('/admin/users')),
            _quickNavCard('Projects', Icons.folder, () => context.push('/admin/projects')),
            _quickNavCard('Payments', Icons.attach_money, () => context.push('/dashboard/funding')),
            _quickNavCard('Analytics', Icons.analytics, () => context.push('/dashboard/analytics')),
            _quickNavCard('Settings', Icons.settings, () => context.push('/dashboard/profile')),
            _quickNavCard('AI Monitor', Icons.smart_toy, () => context.push('/dashboard/maya-ai')),
          ],
        ),
      ],
    );
  }

  Widget _quickNavCard(String title, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
