import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../auth/services/auth_service.dart';
import '../../projects/models/project.dart';
import '../../projects/services/project_service.dart';
import '../../projects/screens/projects_list_screen.dart';
import '../../teams/screens/teams_list_screen.dart';
import '../../experiments/screens/experiments_list_screen.dart';
import '../../prototypes/screens/prototypes_list_screen.dart';
import '../../vault/screens/vault_list_screen.dart';
import '../../profile/screens/profile_screen.dart';
import '../../maya_ai/screens/maya_ai_screen.dart';
import '../../analytics/models/analytics_stats.dart';
import '../../analytics/services/analytics_service.dart';
import '../../../core/theme_provider.dart';
import '../../search/screens/search_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    // Hide system navigation buttons (back/home/recents) — immersive sticky
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    // Restore when leaving dashboard
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  Future<void> _handleLogout() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    await authService.signOut();
    if (mounted) context.go('/login');
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 1: return const ProjectsListScreen();
      case 2: return const TeamsListScreen();
      case 3: return const ExperimentsListScreen();
      case 4: return const PrototypesListScreen();
      case 5: return const VaultListScreen();
      case 6: return const ProfileScreen();
      case 7: return const MayaAiScreen();
      case 0:
      default: return _buildDashboardHome();
    }
  }

  Widget _buildDashboardHome() {
    final user = context.read<AuthService>().currentUser;
    final displayName = user?.userMetadata?['full_name'] ?? user?.email ?? 'Innovator';
    final firstName = displayName.toString().split(' ').first;
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),

          // Greeting
          Text(
            'Good Morning, $firstName! 👋',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: scheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Let's turn your ideas into reality.",
            style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.6), fontSize: 14),
          ),
          const SizedBox(height: 20),

          // Search bar + New button
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchScreen()));
                  },
                  child: Container(
                    height: 46,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1A1F35) : scheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 12),
                        Icon(Icons.search, color: scheme.onSurface.withValues(alpha: 0.4), size: 20),
                        const SizedBox(width: 8),
                        Text('Search anything...', style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.4), fontSize: 14)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () {
                  _showCreateOptions(context);
                },
                child: Container(
                  height: 46,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6C3AED), Color(0xFF2563EB)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.add, color: Colors.white, size: 18),
                      SizedBox(width: 4),
                      Text('New', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Stats Row
          FutureBuilder<AnalyticsStats>(
            future: context.read<AnalyticsService>().fetchStats(),
            builder: (context, snapshot) {
              final stats = snapshot.data;
              return Row(
                children: [
                  _statChip(label: 'Projects', count: stats?.totalProjects.toString() ?? '-', icon: Icons.folder, color: const Color(0xFF6C3AED)),
                  const SizedBox(width: 10),
                  _statChip(label: 'Experiments', count: stats?.totalExperiments.toString() ?? '-', icon: Icons.science, color: const Color(0xFF059669)),
                  const SizedBox(width: 10),
                  _statChip(label: 'Teams', count: stats?.activeTeams.toString() ?? '-', icon: Icons.group, color: const Color(0xFFD97706)),
                  const SizedBox(width: 10),
                  _statChip(label: 'Funding', count: stats?.totalPitches.toString() ?? '-', icon: Icons.attach_money, color: const Color(0xFFDB2777)),
                ],
              );
            },
          ),
          const SizedBox(height: 24),

          // Quick Actions
          Text(
            'Quick Actions',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _quickActionPill(icon: Icons.rocket_launch, label: 'New Project', color: const Color(0xFF6C3AED), onTap: () => context.push('/dashboard/projects/create')),
              _quickActionPill(icon: Icons.smart_toy, label: 'AI Assistant', color: const Color(0xFF2563EB), onTap: () => setState(() => _selectedIndex = 7)),
              _quickActionPill(icon: Icons.task_alt, label: 'My Tasks', color: const Color(0xFF059669), onTap: () => setState(() => _selectedIndex = 3)),
              _quickActionPill(icon: Icons.group_add, label: 'Invite Team', color: const Color(0xFFD97706), onTap: () => setState(() => _selectedIndex = 2)),
            ],
          ),
          const SizedBox(height: 24),

          // Ecosystem
          Text(
            'Ecosystem',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _quickActionPill(icon: Icons.store, label: 'Marketplace', color: const Color(0xFFD97706), onTap: () => context.push('/marketplace')),
              _quickActionPill(icon: Icons.work, label: 'Careers', color: const Color(0xFF059669), onTap: () => context.push('/careers')),
              _quickActionPill(icon: Icons.account_balance, label: 'Deal Room', color: const Color(0xFF2563EB), onTap: () => context.push('/deal-room')),
              _quickActionPill(icon: Icons.article, label: 'Newsletter', color: const Color(0xFFDB2777), onTap: () {}),
            ],
          ),
          const SizedBox(height: 24),

          // Recent Projects header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Recent Projects', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              TextButton(
                onPressed: () => setState(() => _selectedIndex = 1),
                child: const Text('View all', style: TextStyle(color: Color(0xFF6C3AED))),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Project cards
          FutureBuilder<List<Project>>(
            future: user == null ? Future.value([]) : context.read<ProjectService>().fetchUserProjects(user.id),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              final projects = snapshot.data ?? [];
              if (projects.isEmpty) {
                return const Text('No recent projects found.', style: TextStyle(color: Colors.grey));
              }
              return Column(
                children: projects.take(3).map((p) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _recentProjectCard(
                      name: p.name,
                      team: (p.sector?.isNotEmpty == true) ? 'Sector: ${p.sector}' : 'Sector: Not specified',
                      status: p.status ?? 'Idea',
                      statusColor: _getStatusColor(p.status ?? 'Idea'),
                      progress: 0.5, // Dummy progress since it's not tracked directly
                      progressColor: _getStatusColor(p.status ?? 'Idea'),
                      icon: Icons.eco, // Should ideally be based on project type
                      iconColor: _getStatusColor(p.status ?? 'Idea'),
                      scheme: scheme,
                      isDark: isDark,
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showCreateOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Create New', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              ListTile(
                leading: const Icon(Icons.folder, color: Color(0xFF6C3AED)),
                title: const Text('Project'),
                onTap: () { Navigator.pop(context); context.push('/dashboard/projects/create'); },
              ),
              ListTile(
                leading: const Icon(Icons.science, color: Color(0xFF059669)),
                title: const Text('Experiment'),
                onTap: () { Navigator.pop(context); context.push('/dashboard/experiments/create'); },
              ),
              ListTile(
                leading: const Icon(Icons.attach_money, color: Color(0xFFDB2777)),
                title: const Text('Funding Pitch'),
                onTap: () { Navigator.pop(context); context.push('/dashboard/funding/create'); },
              ),
            ],
          ),
        );
      }
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'idea': return const Color(0xFF6C3AED);
      case 'planning': return const Color(0xFFD97706);
      case 'in_progress': return const Color(0xFF2563EB);
      case 'completed': return const Color(0xFF059669);
      default: return const Color(0xFF6C3AED);
    }
  }

  Widget _statChip({required String label, required String count, required IconData icon, required Color color}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: isDark ? 0.15 : 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(count, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
            Text(label, style: TextStyle(color: color.withValues(alpha: 0.8), fontSize: 10), overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _quickActionPill({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withValues(alpha: isDark ? 0.2 : 0.12),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: 64,
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _recentProjectCard({
    required String name,
    required String team,
    required String status,
    required Color statusColor,
    required double progress,
    required Color progressColor,
    required IconData icon,
    required Color iconColor,
    required ColorScheme scheme,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131829) : scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(status, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(team, style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.5), fontSize: 11)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 6,
                          backgroundColor: scheme.outlineVariant.withValues(alpha: 0.3),
                          valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('${(progress * 100).toInt()}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: progressColor)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProvider = context.watch<ThemeProvider>();

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Row(
          children: [
            Image.asset('assets/images/logo.jpeg', height: 32, width: 32, fit: BoxFit.contain),
            const SizedBox(width: 8),
            const Text(
              'Maylet X Lab',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(themeProvider.isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: () => themeProvider.toggleTheme(),
            tooltip: 'Toggle Theme',
          ),
          IconButton(
            icon: const Icon(Icons.mail_outline),
            onPressed: () => context.push('/messages'),
            tooltip: 'Messages',
          ),
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.notifications_outlined),
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.red),
                  ),
                ),
              ],
            ),
            onPressed: () {},
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: scheme.primaryContainer,
              child: Icon(Icons.person, size: 18, color: scheme.onPrimaryContainer),
            ),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF1A1F35), const Color(0xFF2563EB)]
                      : [const Color(0xFF2563EB), const Color(0xFF6C3AED)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Image.asset('assets/images/logo.jpeg', height: 48, width: 48, fit: BoxFit.contain),
                  const SizedBox(height: 12),
                  const Text('Maylet XLab', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            _drawerItem(Icons.dashboard, 'Dashboard', 0),
            _drawerItem(Icons.folder, 'Projects', 1),
            _drawerItem(Icons.group, 'Teams', 2),
            const Divider(),
            _drawerItem(Icons.science, 'Experiments', 3),
            _drawerItem(Icons.build, 'Prototypes', 4),
            ListTile(
              leading: const Icon(Icons.attach_money),
              title: const Text('Funding'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/funding'); },
            ),
            _drawerItem(Icons.lock, 'Innovation Vault', 5),
            ListTile(
              leading: const Icon(Icons.analytics),
              title: const Text('Analytics'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/analytics'); },
            ),
            _drawerItem(Icons.smart_toy, 'MAYA AI', 7),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.store),
              title: const Text('Marketplace'),
              onTap: () { Navigator.pop(context); context.push('/marketplace'); },
            ),
            ListTile(
              leading: const Icon(Icons.work),
              title: const Text('Careers'),
              onTap: () { Navigator.pop(context); context.push('/careers'); },
            ),
            ListTile(
              leading: const Icon(Icons.account_balance),
              title: const Text('Deal Room'),
              onTap: () { Navigator.pop(context); context.push('/deal-room'); },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.article),
              title: const Text('Newsletter'),
              onTap: () { Navigator.pop(context); context.push('/newsletter'); },
            ),
            ListTile(
              leading: const Icon(Icons.mail_outline),
              title: const Text('Messages'),
              onTap: () { Navigator.pop(context); context.push('/messages'); },
            ),
            const Divider(),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text('INNOVATION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
            ),
            ListTile(
              leading: const Icon(Icons.fact_check_outlined),
              title: const Text('Validation'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/validation'); },
            ),
            ListTile(
              leading: const Icon(Icons.biotech),
              title: const Text('Research Center'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/research'); },
            ),
            ListTile(
              leading: const Icon(Icons.rocket_launch),
              title: const Text('Commercialization'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/commercialization'); },
            ),
            const Divider(),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text('ENTERPRISE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
            ),
            ListTile(
              leading: const Icon(Icons.business),
              title: const Text('Enterprise Hub'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/enterprise'); },
            ),
            ListTile(
              leading: const Icon(Icons.shield),
              title: const Text('Enterprise Vault'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/enterprise-vault'); },
            ),
            const Divider(),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text('COMMUNITY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
            ),
            ListTile(
              leading: const Icon(Icons.emoji_events),
              title: const Text('Hackathons'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/hackathons'); },
            ),
            ListTile(
              leading: const Icon(Icons.library_books),
              title: const Text('Learning Hub'),
              onTap: () { Navigator.pop(context); context.push('/dashboard/learning-hub'); },
            ),
            const Divider(),
            _drawerItem(Icons.person, 'Profile', 6),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Sign Out'),
              onTap: _handleLogout,
            ),
          ],
        ),
      ),
      body: _buildBody(),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Container(
        width: 60,
        height: 60,
        margin: const EdgeInsets.only(top: 10),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFF6C3AED), Color(0xFF2563EB)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6C3AED).withValues(alpha: 0.5),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => setState(() => _selectedIndex = 7),
            child: const Center(
              child: Text('AI', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ),
      ),
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 10.0,
        color: isDark ? const Color(0xFF0F1221) : Colors.white,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _bottomNavIcon(icon: Icons.home_rounded, label: 'Home', index: 0),
            _bottomNavIcon(icon: Icons.folder_rounded, label: 'Projects', index: 1),
            const SizedBox(width: 60), // FAB gap
            _bottomNavIcon(icon: Icons.group_rounded, label: 'Teams', index: 2),
            _bottomNavIcon(icon: Icons.person_rounded, label: 'Profile', index: 6),
          ],
        ),
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label, int index) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      selected: _selectedIndex == index,
      onTap: () {
        setState(() => _selectedIndex = index);
        Navigator.pop(context);
      },
    );
  }

  Widget _bottomNavIcon({required IconData icon, required String label, required int index}) {
    final isSelected = _selectedIndex == index;
    return InkWell(
      onTap: () => setState(() => _selectedIndex = index),
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: isSelected ? const Color(0xFF6C3AED) : Colors.grey, size: 26),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: isSelected ? const Color(0xFF6C3AED) : Colors.grey,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
