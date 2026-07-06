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
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => setState(() {
              _statsFuture = context.read<AnalyticsService>().fetchStats();
            }),
          ),
        ],
      ),
      body: FutureBuilder<AnalyticsStats>(
        future: _statsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error loading analytics', style: TextStyle(color: scheme.error)),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () => setState(() {
                      _statsFuture = context.read<AnalyticsService>().fetchStats();
                    }),
                    child: const Text('Retry'),
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
                // Hero Funding Card
                _buildHeroFundingCard(stats, scheme, isDark),
                const SizedBox(height: 20),

                // Core Metrics Grid
                Text(
                  'Innovation Metrics',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.3,
                  children: [
                    _buildStatCard(
                      icon: Icons.folder,
                      label: 'Projects',
                      value: stats.totalProjects,
                      color: const Color(0xFF2563EB),
                      scheme: scheme,
                    ),
                    _buildStatCard(
                      icon: Icons.group,
                      label: 'Teams',
                      value: stats.activeTeams,
                      color: const Color(0xFF059669),
                      scheme: scheme,
                    ),
                    _buildStatCard(
                      icon: Icons.science,
                      label: 'Experiments',
                      value: stats.totalExperiments,
                      color: const Color(0xFFD97706),
                      scheme: scheme,
                    ),
                    _buildStatCard(
                      icon: Icons.build,
                      label: 'Prototypes',
                      value: stats.totalPrototypes,
                      color: const Color(0xFF7C3AED),
                      scheme: scheme,
                    ),
                    _buildStatCard(
                      icon: Icons.lock,
                      label: 'Vault Entries',
                      value: stats.vaultEntries,
                      color: const Color(0xFF0891B2),
                      scheme: scheme,
                    ),
                    _buildStatCard(
                      icon: Icons.attach_money,
                      label: 'Pitches',
                      value: stats.totalPitches,
                      color: const Color(0xFFDB2777),
                      scheme: scheme,
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Activity breakdown
                Text(
                  'Activity Breakdown',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                _buildActivityBar('Projects', stats.totalProjects, 10, const Color(0xFF2563EB), scheme),
                _buildActivityBar('Teams', stats.activeTeams, 10, const Color(0xFF059669), scheme),
                _buildActivityBar('Experiments', stats.totalExperiments, 10, const Color(0xFFD97706), scheme),
                _buildActivityBar('Prototypes', stats.totalPrototypes, 10, const Color(0xFF7C3AED), scheme),
                _buildActivityBar('Vault Entries', stats.vaultEntries, 10, const Color(0xFF0891B2), scheme),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeroFundingCard(AnalyticsStats stats, ColorScheme scheme, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF1E3A5F), const Color(0xFF2563EB)]
              : [const Color(0xFF2563EB), const Color(0xFF3B82F6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.trending_up, color: Colors.white70, size: 20),
              SizedBox(width: 8),
              Text(
                'Total Funding Raised',
                style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 8),
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
              value: stats.fundingProgress,
              minHeight: 10,
              backgroundColor: Colors.white.withValues(alpha: 0.2),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
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

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required int value,
    required Color color,
    required ColorScheme scheme,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: scheme.shadow.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 10),
          Text(
            value.toString(),
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: scheme.onSurface,
            ),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: scheme.onSurface.withValues(alpha: 0.6)),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityBar(String label, int value, int maxValue, Color color, ColorScheme scheme) {
    final progress = maxValue > 0 ? (value / maxValue).clamp(0.0, 1.0) : 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
              Text(
                value.toString(),
                style: TextStyle(fontWeight: FontWeight.bold, color: color),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress.toDouble(),
              minHeight: 8,
              backgroundColor: scheme.outlineVariant.withValues(alpha: 0.3),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}
