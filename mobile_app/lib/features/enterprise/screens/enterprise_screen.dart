import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/enterprise_service.dart';

class EnterpriseScreen extends StatefulWidget {
  const EnterpriseScreen({super.key});

  @override
  State<EnterpriseScreen> createState() => _EnterpriseScreenState();
}

class _EnterpriseScreenState extends State<EnterpriseScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _service = EnterpriseService();

  EnterpriseMetrics _metrics = EnterpriseMetrics.empty();
  List<DepartmentMetric> _departments = [];
  List<Map<String, dynamic>> _teams = [];
  bool _loading = true;

  static const _roles = [
    'Enterprise Admin', 'Director', 'Innovation Manager', 'Research Lead',
    'Engineer', 'Researcher', 'Reviewer', 'Mentor', 'Investor', 'Observer',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    final results = await Future.wait([
      _service.loadMetrics(),
      _service.loadDepartments(),
      _service.loadTeams(),
    ]);
    if (mounted) {
      setState(() {
        _metrics = results[0] as EnterpriseMetrics;
        _departments = results[1] as List<DepartmentMetric>;
        _teams = results[2] as List<Map<String, dynamic>>;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: NestedScrollView(
        headerSliverBuilder: (_, innerBoxIsScrolled) => [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero Banner
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E3A5F), Color(0xFF312E81)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.business, color: Colors.white, size: 28),
                            SizedBox(width: 10),
                            Text('Enterprise Hub', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Scalable innovation management for organizations, research institutions, and innovation labs.',
                          style: TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            _pill('SSO Ready'),
                            _pill('GDPR Compliant'),
                            _pill('99.9% SLA'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          // Tab bar
          SliverPersistentHeader(
            pinned: true,
            delegate: _StickyTabBarDelegate(
              TabBar(
                controller: _tabController,
                isScrollable: true,
                labelColor: const Color(0xFF7c5fe6),
                unselectedLabelColor: Colors.grey,
                indicatorColor: const Color(0xFF7c5fe6),
                indicatorSize: TabBarIndicatorSize.label,
                tabAlignment: TabAlignment.start,
                tabs: const [
                  Tab(text: 'Executive'),
                  Tab(text: 'Departments'),
                  Tab(text: 'Teams & Roles'),
                  Tab(text: 'Integrations'),
                ],
              ),
            ),
          ),
        ],
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)))
            : TabBarView(
                controller: _tabController,
                children: [
                  _executiveTab(),
                  _departmentsTab(),
                  _teamsTab(),
                  _integrationsTab(),
                ],
              ),
      ),
    );
  }

  Widget _pill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500)),
    );
  }

  // ─── EXECUTIVE DASHBOARD ─────────────────────────────────────────────
  Widget _executiveTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text('Executive Dashboard', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(
          '${_metrics.projectCount} initiatives across ${_metrics.departmentCount} departments',
          style: const TextStyle(color: Colors.grey, fontSize: 14),
        ),
        const SizedBox(height: 20),

        // KPI Grid
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.8,
          children: [
            _kpiCard('Total Innovations', _metrics.projectCount.toString(), const Color(0xFF7c5fe6), true),
            _kpiCard('Active Research', _metrics.activeResearch.toString(), const Color(0xFF2fd4ff)),
            _kpiCard('Prototypes', _metrics.activePrototypes.toString(), const Color(0xFFf6c90e)),
            _kpiCard('Experiments', _metrics.experimentsRunning.toString(), const Color(0xFF48bb78)),
            _kpiCard('Validations', _metrics.validationsPending.toString(), const Color(0xFFfc8181)),
            _kpiCard('Funding Secured', _metrics.fundingSecured.toString(), const Color(0xFFf6c90e)),
            _kpiCard('Commercialized', _metrics.commercializedProducts.toString(), const Color(0xFF2fd4ff)),
            _kpiCard('Departments', _metrics.departmentCount.toString(), const Color(0xFF7c5fe6)),
          ],
        ),
        const SizedBox(height: 24),

        // Quick Actions
        const Text('Quick Actions', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _actionTile('New Initiative', Icons.add_circle_outline, const Color(0xFF7c5fe6), () => context.push('/projects')),
        _actionTile('View Portfolio', Icons.pie_chart, const Color(0xFF2fd4ff), () => context.push('/projects')),
        _actionTile('Manage Teams', Icons.people, const Color(0xFF48bb78), () {
          _tabController.animateTo(2);
        }),
        _actionTile('Enterprise Vault', Icons.shield, const Color(0xFFf6c90e), () => context.push('/enterprise-vault')),
      ],
    );
  }

  Widget _kpiCard(String label, String value, Color color, [bool accent = false]) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: accent ? color.withOpacity(0.15) : Colors.black.withOpacity(0.4),
        border: Border.all(color: color.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _actionTile(String title, IconData icon, Color color, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.3),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }

  // ─── DEPARTMENTS ─────────────────────────────────────────────────────
  Widget _departmentsTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text('Departments', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text(
          'Mapped from portfolio sectors and team assignments.',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        const SizedBox(height: 20),
        if (_departments.isEmpty)
          _emptyState('No department data yet. Create projects with sector tags to auto-generate departments.')
        else
          ..._departments.map((d) => _departmentCard(d)),
      ],
    );
  }

  Widget _departmentCard(DepartmentMetric d) {
    final color = _deptColor(d.id);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(_deptIcon(d.id), color: color, size: 20),
                  const SizedBox(width: 8),
                  Text(d.id, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                child: Text('${d.avgProgress}% avg', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _miniMetric('Projects', d.projectCount.toString()),
              _miniMetric('Research', d.researchCount.toString()),
              _miniMetric('Members', d.memberCount.toString()),
              _miniMetric('Prototypes', d.activePrototypes.toString()),
            ],
          ),
          const SizedBox(height: 12),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: d.avgProgress / 100,
              backgroundColor: Colors.white.withOpacity(0.05),
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _miniMetric(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
      ],
    );
  }

  Color _deptColor(String dept) {
    switch (dept) {
      case 'Engineering': return const Color(0xFF2fd4ff);
      case 'Research': return const Color(0xFF7c5fe6);
      case 'ICT': return const Color(0xFF48bb78);
      case 'Agriculture': return const Color(0xFFf6c90e);
      case 'Health': return const Color(0xFFfc8181);
      case 'Energy': return const Color(0xFFf6ad55);
      case 'Manufacturing': return const Color(0xFF63b3ed);
      case 'Business': return const Color(0xFFb794f4);
      default: return const Color(0xFF7c5fe6);
    }
  }

  IconData _deptIcon(String dept) {
    switch (dept) {
      case 'Engineering': return Icons.engineering;
      case 'Research': return Icons.science;
      case 'ICT': return Icons.computer;
      case 'Agriculture': return Icons.eco;
      case 'Health': return Icons.local_hospital;
      case 'Energy': return Icons.bolt;
      case 'Manufacturing': return Icons.factory;
      case 'Business': return Icons.business_center;
      default: return Icons.category;
    }
  }

  // ─── TEAMS & ROLES ───────────────────────────────────────────────────
  Widget _teamsTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Teams & Roles', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            TextButton.icon(
              onPressed: () => context.push('/teams'),
              icon: const Icon(Icons.add, size: 16, color: Color(0xFF7c5fe6)),
              label: const Text('Create Team', style: TextStyle(color: Color(0xFF7c5fe6))),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Role pills
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: _roles.map((r) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Text(r, style: const TextStyle(color: Colors.white70, fontSize: 11)),
          )).toList(),
        ),
        const SizedBox(height: 20),

        if (_teams.isEmpty)
          _emptyState('No teams yet. Create teams and assign department-linked projects.')
        else
          ..._teams.map((t) => _teamCard(t)),
      ],
    );
  }

  Widget _teamCard(Map<String, dynamic> t) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF7c5fe6).withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.groups, color: Color(0xFF7c5fe6), size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t['name'] ?? 'Unnamed Team', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 4),
                Text(t['description'] ?? 'No description', style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            children: [
              Text('${t['member_count'] ?? 0}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              const Text('members', style: TextStyle(color: Colors.grey, fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }

  // ─── INTEGRATIONS ────────────────────────────────────────────────────
  Widget _integrationsTab() {
    final integrations = [
      {'label': 'Dashboard', 'to': '/dashboard', 'desc': 'Innovation OS home', 'icon': Icons.dashboard},
      {'label': 'Projects', 'to': '/projects', 'desc': 'Full project pipeline', 'icon': Icons.rocket_launch},
      {'label': 'Research', 'to': '/research', 'desc': 'Research programs', 'icon': Icons.science},
      {'label': 'Prototypes', 'to': '/prototypes', 'desc': 'Prototype operations', 'icon': Icons.build},
      {'label': 'Experiments', 'to': '/experiments', 'desc': 'Experiment lab', 'icon': Icons.biotech},
      {'label': 'Validation', 'to': '/validation', 'desc': 'Gate decisions', 'icon': Icons.verified},
      {'label': 'Funding', 'to': '/funding', 'desc': 'Grants & investors', 'icon': Icons.attach_money},
      {'label': 'Documents', 'to': '/documents', 'desc': 'Enterprise repository', 'icon': Icons.folder},
      {'label': 'Ecosystem', 'to': '/ecosystem', 'desc': 'Partners & mentors', 'icon': Icons.public},
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text('Integrations', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text('Navigate to any module in the innovation platform.', style: TextStyle(color: Colors.grey, fontSize: 14)),
        const SizedBox(height: 20),
        ...integrations.map((i) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: ListTile(
            leading: Icon(i['icon'] as IconData, color: const Color(0xFF7c5fe6), size: 22),
            title: Text(i['label'] as String, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
            subtitle: Text(i['desc'] as String, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
            onTap: () => context.push(i['to'] as String),
          ),
        )),
      ],
    );
  }

  Widget _emptyState(String message) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          const Icon(Icons.inbox, color: Colors.grey, size: 40),
          const SizedBox(height: 12),
          Text(message, style: const TextStyle(color: Colors.grey), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  _StickyTabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: const Color(0xFF0A0A0F),
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_StickyTabBarDelegate oldDelegate) => false;
}
