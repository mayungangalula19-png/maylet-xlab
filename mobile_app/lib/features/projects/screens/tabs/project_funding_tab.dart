import 'package:flutter/material.dart';
import '../../../../core/supabase_client.dart';
import 'package:intl/intl.dart';

class ProjectFundingTab extends StatefulWidget {
  final String projectId;

  const ProjectFundingTab({super.key, required this.projectId});

  @override
  State<ProjectFundingTab> createState() => _ProjectFundingTabState();
}

class _ProjectFundingTabState extends State<ProjectFundingTab> {
  List<Map<String, dynamic>> _pitches = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchFunding();
  }

  Future<void> _fetchFunding() async {
    setState(() => _loading = true);
    try {
      final res = await SupabaseConfig.client
          .from('funding_pitches')
          .select()
          .eq('project_id', widget.projectId)
          .order('created_at', ascending: false);
      
      if (mounted) {
        setState(() {
          _pitches = List<Map<String, dynamic>>.from(res);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading funding data: $e')));
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF9b7ff0)));
    
    return Column(
      children: [
        Expanded(
          child: _pitches.isEmpty
              ? const Center(child: Text('No funding pitches yet.', style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _pitches.length,
                  itemBuilder: (context, index) {
                    final pitch = _pitches[index];
                    final amount = pitch['amount'] ?? pitch['amount_sought'] ?? 0;
                    final equity = pitch['equity_offered'] ?? 0;
                    final status = pitch['status'] ?? 'draft';
                    final date = pitch['created_at'] != null ? DateFormat.yMMMd().format(DateTime.parse(pitch['created_at'])) : '';
                    
                    return Card(
                      color: const Color(0xFF1A1A2E),
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(pitch['title'] ?? 'Funding Pitch', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(status.toUpperCase(), style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (pitch['description'] != null && pitch['description'].toString().isNotEmpty)
                              Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(pitch['description'], style: TextStyle(color: Colors.grey.shade400))),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Amount Sought', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                    Text('\$${NumberFormat.compact().format(amount)}', style: const TextStyle(color: Color(0xFF9b7ff0), fontSize: 16, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Equity Offered', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                    Text('$equity%', style: const TextStyle(color: Color(0xFF9b7ff0), fontSize: 16, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text('Created $date', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
