import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/funding_pitch.dart';
import '../services/funding_service.dart';

class FundingListScreen extends StatefulWidget {
  const FundingListScreen({super.key});

  @override
  State<FundingListScreen> createState() => _FundingListScreenState();
}

class _FundingListScreenState extends State<FundingListScreen> {
  late Future<List<FundingPitch>> _pitchesFuture;

  @override
  void initState() {
    super.initState();
    _loadPitches();
  }

  void _loadPitches() {
    setState(() {
      _pitchesFuture = context.read<FundingService>().listPitches();
    });
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'draft': return Colors.grey;
      case 'published': return Colors.blue;
      case 'funded': return Colors.green;
      case 'closed': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Funding Hub', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('Connect. Pitch. Get Funded.', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadPitches(),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Green Hero Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF059669), Color(0xFF10B981)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF059669).withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Funding Opportunities', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          const SizedBox(height: 8),
                          const Text('TZS 2.8B+', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('Available now', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.account_balance_wallet, size: 60, color: Colors.white54),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Action Buttons
              Row(
                children: [
                  _actionButton(
                    icon: Icons.note_add,
                    label: 'Create Pitch',
                    color: const Color(0xFF2563EB),
                    isDark: isDark, scheme: scheme,
                    onTap: () => context.push('/funding/create').then((_) => _loadPitches()),
                  ),
                  const SizedBox(width: 12),
                  _actionButton(
                    icon: Icons.groups,
                    label: 'Find Investors',
                    color: const Color(0xFF6C3AED),
                    isDark: isDark, scheme: scheme,
                    onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Investor matching coming soon'))),
                  ),
                  const SizedBox(width: 12),
                  _actionButton(
                    icon: Icons.folder,
                    label: 'My Requests',
                    color: const Color(0xFFD97706),
                    isDark: isDark, scheme: scheme,
                    onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('My Requests tracking coming soon'))),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Active Opportunities Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Active Opportunities', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('View all', style: TextStyle(color: const Color(0xFF059669), fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 16),

              // Opportunity Cards
              _opportunityCard(
                icon: Icons.account_balance, iconColor: const Color(0xFF2563EB),
                title: 'Tech Innovation Fund', subtitle: 'Technology',
                deadline: '15 May 2025', amount: 'Up to TZS 500M',
                isDark: isDark, scheme: scheme,
              ),
              _opportunityCard(
                icon: Icons.emoji_events, iconColor: const Color(0xFFD97706),
                title: 'Startup Growth Grant', subtitle: 'Startups',
                deadline: '30 May 2025', amount: 'Up to TZS 300M',
                isDark: isDark, scheme: scheme,
              ),
              _opportunityCard(
                icon: Icons.memory, iconColor: const Color(0xFF6C3AED),
                title: 'AI & Deep Tech Fund', subtitle: 'AI / Deep Tech',
                deadline: '12 June 2025', amount: 'Up to TZS 1B',
                isDark: isDark, scheme: scheme,
              ),

              const SizedBox(height: 24),
              const Text('Your Pitches', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              
              // Pitches List Builder
              FutureBuilder<List<FundingPitch>>(
                future: _pitchesFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final pitches = snapshot.data ?? [];
                  if (pitches.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(child: Text('You have not created any pitches yet.', style: TextStyle(color: Colors.grey))),
                    );
                  }
                  return Column(
                    children: pitches.map((pitch) {
                      final progress = pitch.targetAmount > 0 
                        ? (pitch.raisedAmount / pitch.targetAmount).clamp(0.0, 1.0) 
                        : 0.0;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => context.push('/funding/${pitch.id}').then((_) => _loadPitches()),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        pitch.title, 
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(pitch.status).withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        pitch.status.toUpperCase(),
                                        style: TextStyle(
                                          color: _getStatusColor(pitch.status), 
                                          fontSize: 10, 
                                          fontWeight: FontWeight.bold
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  pitch.stage.toUpperCase(),
                                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('TZS ${pitch.raisedAmount.toStringAsFixed(0)} raised', style: const TextStyle(fontWeight: FontWeight.bold)),
                                    Text('TZS ${pitch.targetAmount.toStringAsFixed(0)} target', style: const TextStyle(color: Colors.grey)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                LinearProgressIndicator(
                                  value: progress,
                                  backgroundColor: Colors.grey.withValues(alpha: 0.2),
                                  color: Colors.green,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _actionButton({required IconData icon, required String label, required Color color, required bool isDark, required ColorScheme scheme, required VoidCallback onTap}) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF131829) : scheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.3)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(height: 8),
              Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }

  Widget _opportunityCard({required IconData icon, required Color iconColor, required String title, required String subtitle, required String deadline, required String amount, required bool isDark, required ColorScheme scheme}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131829) : scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.6), fontSize: 12)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.event, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text('Deadline: $deadline', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),
          Text(amount, style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}
