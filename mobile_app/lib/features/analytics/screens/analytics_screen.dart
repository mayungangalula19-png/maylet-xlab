import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/analytics_stats.dart';
import '../services/analytics_service.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  late Future<AnalyticsStats> _statsFuture;

  @override
  void initState() {
    super.initState();
    _statsFuture = context.read<AnalyticsService>().fetchStats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('📊 Analytics Dashboard', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => setState(() {
              _statsFuture = context.read<AnalyticsService>().fetchStats();
            }),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0A0A0F), Color(0xFF0F0F1A), Color(0xFF1A1A2E)],
          ),
        ),
        child: SafeArea(
          child: FutureBuilder<AnalyticsStats>(
            future: _statsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)));
              }
              if (snapshot.hasError) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                      const SizedBox(height: 16),
                      const Text('Error loading analytics', style: TextStyle(color: Colors.redAccent)),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6)),
                        onPressed: () => setState(() {
                          _statsFuture = context.read<AnalyticsService>().fetchStats();
                        }),
                        child: const Text('Retry', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                );
              }

              final stats = snapshot.data!;

              return SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Track your innovation journey with real‑time metrics',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    const SizedBox(height: 24),

                    // Core Metrics Grid matching web
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.5,
                      children: [
                        _buildStatCard(
                          icon: '📁',
                          label: 'Projects',
                          value: stats.totalProjects,
                          color: const Color(0xFF7c5fe6),
                        ),
                        _buildStatCard(
                          icon: '🧪',
                          label: 'Experiments',
                          value: stats.totalExperiments,
                          color: const Color(0xFF2fd4ff),
                        ),
                        _buildStatCard(
                          icon: '📦',
                          label: 'Prototypes',
                          value: stats.totalPrototypes,
                          color: const Color(0xFF48bb78),
                        ),
                        _buildStatCard(
                          icon: '👥',
                          label: 'Team Members',
                          value: stats.activeTeams,
                          color: const Color(0xFFf6c90e),
                        ),
                        _buildStatCard(
                          icon: '💰',
                          label: 'Funding Pitches',
                          value: stats.totalPitches,
                          color: const Color(0xFFfc8181),
                        ),
                        _buildStatCard(
                          icon: '🔒',
                          label: 'Vault Entries',
                          value: stats.vaultEntries,
                          color: const Color(0xFF0891B2),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Hero Funding Card
                    _buildHeroFundingCard(stats),
                    const SizedBox(height: 24),

                  // Activity breakdown / Timeline simulated
                    _buildTimelineCard(stats),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String icon,
    required String label,
    required int value,
    required Color color,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 32)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value.toString(),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroFundingCard(AnalyticsStats stats) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.trending_up, color: Color(0xFF7c5fe6), size: 24),
              SizedBox(width: 8),
              Text(
                'Total Funding Raised',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '\$${stats.totalFundingRaised.toStringAsFixed(0)}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 40,
              fontWeight: FontWeight.bold,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'of \$${stats.totalFundingTarget.toStringAsFixed(0)} target',
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: stats.fundingProgress > 0 ? stats.fundingProgress : 0.01,
              minHeight: 8,
              backgroundColor: Colors.white.withOpacity(0.1),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF7c5fe6)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${(stats.fundingProgress * 100).toStringAsFixed(1)}% funded',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineCard(AnalyticsStats stats) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recent Activity',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          if (stats.recentActivities.isEmpty)
            const Text('No recent activity.', style: TextStyle(color: Colors.grey))
          else
            ...stats.recentActivities.map((act) {
              final date = act['created_at'] != null ? DateTime.parse(act['created_at']) : DateTime.now();
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildTimelineItem(act['action'] ?? 'Activity', '${date.month}/${date.day} ${date.hour}:${date.minute.toString().padLeft(2, '0')}'),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(String title, String date) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: const BoxDecoration(
            color: Color(0xFF2fd4ff),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              Text(date, style: const TextStyle(color: Colors.white54, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}

