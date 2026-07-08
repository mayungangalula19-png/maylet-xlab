import 'package:flutter/material.dart';
import '../../../../core/supabase_client.dart';
import 'package:intl/intl.dart';

class ProjectFundingTab extends StatefulWidget {
  final String projectId;
  final String projectName;

  const ProjectFundingTab({super.key, required this.projectId, required this.projectName});

  @override
  State<ProjectFundingTab> createState() => _ProjectFundingTabState();
}

class _ProjectFundingTabState extends State<ProjectFundingTab> {
  List<Map<String, dynamic>> _pitches = [];
  bool _loading = true;
  bool _showPitchForm = false;
  
  final _amountController = TextEditingController();
  final _equityController = TextEditingController();
  final _descController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchPitches();
  }

  Future<void> _fetchPitches() async {
    setState(() => _loading = true);
    try {
      final res = await SupabaseConfig.client
          .from('funding_pitches')
          .select('*')
          .eq('project_id', widget.projectId)
          .order('created_at', ascending: false);
      setState(() {
        _pitches = List<Map<String, dynamic>>.from(res);
        _loading = false;
      });
    } catch (_) {
      // Demo Data
      setState(() {
        _pitches = [
          {
            'id': '1', 
            'amount': 250000, 
            'equity': 10, 
            'description': 'Seed round for expansion into Kenya', 
            'status': 'submitted', 
            'created_at': DateTime.now().subtract(const Duration(days: 10)).toIso8601String()
          }
        ];
        _loading = false;
      });
    }
  }

  Future<void> _submitPitch() async {
    if (_amountController.text.isEmpty || _equityController.text.isEmpty) return;
    
    try {
      await SupabaseConfig.client.from('funding_pitches').insert({
        'project_id': widget.projectId,
        'amount': num.tryParse(_amountController.text) ?? 0,
        'equity': num.tryParse(_equityController.text) ?? 0,
        'description': _descController.text,
        'status': 'submitted'
      });
    } catch (_) {}
    
    _amountController.clear();
    _equityController.clear();
    _descController.clear();
    setState(() => _showPitchForm = false);
    _fetchPitches();
  }

  Color _getStatusColor(String status) {
    switch(status.toLowerCase()) {
      case 'funded': return Colors.green;
      case 'submitted': return Colors.blue;
      case 'draft': return Colors.orange;
      case 'rejected': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return RefreshIndicator(
      onRefresh: _fetchPitches,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Funding History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ElevatedButton.icon(
                  onPressed: () => setState(() => _showPitchForm = !_showPitchForm),
                  icon: Icon(_showPitchForm ? Icons.close : Icons.add, size: 18),
                  label: Text(_showPitchForm ? 'Cancel' : 'New Pitch'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7c5fe6),
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            if (_showPitchForm) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _amountController,
                            style: const TextStyle(color: Colors.white),
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Amount (\$)', labelStyle: TextStyle(color: Colors.grey)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextField(
                            controller: _equityController,
                            style: const TextStyle(color: Colors.white),
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Equity (%)', labelStyle: TextStyle(color: Colors.grey)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _descController,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Pitch Description', labelStyle: TextStyle(color: Colors.grey)),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submitPitch,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6)),
                        child: const Text('Submit Pitch to Investors', style: TextStyle(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            if (_pitches.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.02), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
                child: const Column(
                  children: [
                    Icon(Icons.monetization_on_outlined, size: 48, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('No funding pitches yet. Create one to seek investment.', style: TextStyle(color: Colors.white54), textAlign: TextAlign.center),
                  ],
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _pitches.length,
                itemBuilder: (context, index) {
                  final pitch = _pitches[index];
                  final status = pitch['status'] ?? 'draft';
                  
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A1A2E),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('\$${pitch['amount']?.toString() ?? '0'}', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: _getStatusColor(status).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: _getStatusColor(status).withValues(alpha: 0.5)),
                              ),
                              child: Text(status.toUpperCase(), style: TextStyle(color: _getStatusColor(status), fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('Offering ${pitch['equity'] ?? 0}% equity', style: const TextStyle(color: Colors.grey)),
                        if (pitch['description'] != null) ...[
                          const SizedBox(height: 12),
                          Text(pitch['description'], style: const TextStyle(color: Colors.white70)),
                        ],
                        const SizedBox(height: 12),
                        const Divider(color: Colors.white10),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(DateFormat.yMMMd().format(DateTime.parse(pitch['created_at'])), style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            if (pitch['investor_name'] != null)
                              Text('Investor: ${pitch['investor_name']}', style: const TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
