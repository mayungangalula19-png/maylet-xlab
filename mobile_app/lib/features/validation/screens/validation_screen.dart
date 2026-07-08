import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../auth/services/auth_service.dart';
import '../models/validation_record.dart';
import '../services/validation_service.dart';
import 'package:intl/intl.dart';

class ValidationScreen extends StatefulWidget {
  const ValidationScreen({super.key});

  @override
  State<ValidationScreen> createState() => _ValidationScreenState();
}

class _ValidationScreenState extends State<ValidationScreen> {
  List<ValidationRecord> _records = [];
  bool _loading = true;
  String? _error;

  int get _total => _records.length;
  int get _pass => _records.where((r) => r.decision == 'pass').length;
  int get _hold => _records.where((r) => r.decision == 'hold').length;
  int get _fail => _records.where((r) => r.decision == 'fail').length;

  @override
  void initState() {
    super.initState();
    _fetchValidations();
  }

  Future<void> _fetchValidations() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final user = context.read<AuthService>().currentUser;
    if (user == null) { setState(() => _loading = false); return; }
    try {
      final records = await context.read<ValidationService>().listValidations(userId: user.id);
      setState(() { _records = records; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _verdictColor(String? verdict) {
    switch (verdict) {
      case 'pass': return Colors.green;
      case 'hold': return Colors.orange;
      case 'fail': return Colors.red;
      case 'pending': return Colors.blue;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: RefreshIndicator(
        onRefresh: _fetchValidations,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Validation Center',
                              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Decision gate between Experiment and Funding',
                              style: TextStyle(color: Colors.grey, fontSize: 14),
                            ),
                          ],
                        ),
                        ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2fd4ff),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('New Validation', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Stats Row
                    Row(
                      children: [
                        _statBadge('Total', _total.toString(), const Color(0xFF2fd4ff)),
                        const SizedBox(width: 8),
                        _statBadge('Pass', _pass.toString(), Colors.green),
                        const SizedBox(width: 8),
                        _statBadge('Hold', _hold.toString(), Colors.orange),
                        const SizedBox(width: 8),
                        _statBadge('Fail', _fail.toString(), Colors.red),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
            
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
            else if (_error != null)
              SliverFillRemaining(child: Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red))))
            else if (_records.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.fact_check_outlined, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('No validations yet', style: TextStyle(fontSize: 18, color: Colors.grey)),
                      const SizedBox(height: 16),
                      const Text('Run experiments, then create a validation review to score funding readiness.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _validationCard(_records[index]),
                    childCount: _records.length,
                  ),
                ),
              ),
              
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }

  Widget _statBadge(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _validationCard(ValidationRecord record) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: const Color(0xFF1A1A2E),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 4,
      child: InkWell(
        onTap: () => context.go('/dashboard/validation/${record.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      record.projectName ?? 'Validation ${record.id.substring(0,6)}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _verdictColor(record.decision).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _verdictColor(record.decision).withValues(alpha: 0.5)),
                    ),
                    child: Text(
                      record.decision.toUpperCase(),
                      style: TextStyle(color: _verdictColor(record.decision), fontWeight: FontWeight.bold, fontSize: 10),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _scoreItem('Overall', record.scores.overall),
                  _scoreItem('Market', record.scores.market),
                  _scoreItem('Tech', record.scores.technical),
                  _scoreItem('Team', record.scores.team),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: Colors.white10),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Updated: ${DateFormat('MMM d, y').format(record.updatedAt)}',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  if (record.promotedAt != null)
                    const Row(
                      children: [
                        Icon(Icons.monetization_on, color: Colors.green, size: 14),
                        SizedBox(width: 4),
                        Text('Promoted', style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _scoreItem(String label, int score) {
    Color color = Colors.green;
    if (score < 50) { color = Colors.red; }
    else if (score < 80) { color = Colors.orange; }
    
    return Column(
      children: [
        Text(score.toString(), style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
      ],
    );
  }
}
