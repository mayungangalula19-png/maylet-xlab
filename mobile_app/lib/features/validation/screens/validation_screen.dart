import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/supabase_client.dart';

class ValidationScreen extends StatefulWidget {
  const ValidationScreen({super.key});

  @override
  State<ValidationScreen> createState() => _ValidationScreenState();
}

class _ValidationScreenState extends State<ValidationScreen> {
  List<Map<String, dynamic>> _records = [];
  bool _loading = true;
  String? _error;

  int get _total => _records.length;
  int get _pass => _records.where((r) => r['verdict'] == 'pass').length;
  int get _hold => _records.where((r) => r['verdict'] == 'hold').length;
  int get _fail => _records.where((r) => r['verdict'] == 'fail').length;

  @override
  void initState() {
    super.initState();
    _fetchValidations();
  }

  Future<void> _fetchValidations() async {
    final user = context.read<AuthService>().currentUser;
    if (user == null) { setState(() => _loading = false); return; }
    try {
      final res = await SupabaseConfig.client
          .from('validation_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);
      setState(() { _records = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _verdictColor(String? verdict) {
    switch (verdict) {
      case 'pass': return Colors.green;
      case 'hold': return Colors.orange;
      case 'fail': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Validation Center'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {},
            tooltip: 'New Validation',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red)))
              : RefreshIndicator(
                  onRefresh: _fetchValidations,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Header card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6C3AED), Color(0xFF2563EB)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Validation Center', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                            SizedBox(height: 4),
                            Text('Decision gate between Experiment and Funding — evidence-based readiness scoring.', style: TextStyle(color: Colors.white70, fontSize: 13)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Stats row
                      Row(
                        children: [
                          _statBadge('Total', _total.toString(), Colors.blue),
                          const SizedBox(width: 8),
                          _statBadge('Pass', _pass.toString(), Colors.green),
                          const SizedBox(width: 8),
                          _statBadge('Hold', _hold.toString(), Colors.orange),
                          const SizedBox(width: 8),
                          _statBadge('Fail', _fail.toString(), Colors.red),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (_records.isEmpty)
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              children: [
                                const Icon(Icons.fact_check_outlined, size: 48, color: Colors.grey),
                                const SizedBox(height: 12),
                                const Text('No validations yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                const Text('Run experiments, then create a validation review to score funding readiness.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: () {},
                                  icon: const Icon(Icons.add),
                                  label: const Text('Create Validation'),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        ...(_records.map((r) => _validationCard(r))),
                    ],
                  ),
                ),
    );
  }

  Widget _statBadge(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color)),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _validationCard(Map<String, dynamic> r) {
    final verdict = r['verdict'] as String?;
    final color = _verdictColor(verdict);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(Icons.fact_check, color: color),
        ),
        title: Text(r['title'] ?? 'Untitled Validation', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(r['description'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Text(verdict?.toUpperCase() ?? 'PENDING', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }
}
