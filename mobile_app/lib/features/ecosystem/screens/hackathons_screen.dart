import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';

class HackathonsScreen extends StatefulWidget {
  const HackathonsScreen({super.key});

  @override
  State<HackathonsScreen> createState() => _HackathonsScreenState();
}

class _HackathonsScreenState extends State<HackathonsScreen> {
  List<Map<String, dynamic>> _hackathons = [];
  bool _loading = true;
  String _statusFilter = 'all';
  String _modeFilter = 'all';
  final Set<String> _registered = {};

  List<Map<String, dynamic>> get _filtered => _hackathons.where((h) {
    if (_statusFilter != 'all' && h['status'] != _statusFilter) return false;
    if (_modeFilter != 'all' && h['mode'] != _modeFilter) return false;
    return true;
  }).toList();

  @override
  void initState() {
    super.initState();
    _fetchHackathons();
  }

  Future<void> _fetchHackathons() async {
    try {
      final res = await SupabaseConfig.client.from('hackathons').select('*').order('start_date', ascending: true);
      setState(() { _hackathons = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (_) {
      // Show demo data if table doesn't exist
      setState(() {
        _hackathons = [
          {
            'id': '1', 'title': 'InnovateTZ 2024 Hackathon', 'description': 'Build solutions for sustainable agriculture and food security in East Africa.',
            'status': 'upcoming', 'mode': 'hybrid', 'start_date': '2024-11-15', 'end_date': '2024-11-17',
            'prize_pool': 5000000, 'registered_count': 45, 'max_participants': 100, 'location': 'Dar es Salaam', 'organizer': 'Maylet XLab'
          },
          {
            'id': '2', 'title': 'HealthTech Africa Hackathon', 'description': 'Reimagine healthcare delivery for rural and underserved communities.',
            'status': 'ongoing', 'mode': 'online', 'start_date': '2024-10-25', 'end_date': '2024-10-27',
            'prize_pool': 2000000, 'registered_count': 78, 'max_participants': 80, 'location': null, 'organizer': 'AfriHealth'
          },
          {
            'id': '3', 'title': 'Climate Innovation Challenge', 'description': 'Create tech solutions to address climate change in Sub-Saharan Africa.',
            'status': 'completed', 'mode': 'offline', 'start_date': '2024-09-01', 'end_date': '2024-09-03',
            'prize_pool': 10000000, 'registered_count': 120, 'max_participants': 120, 'location': 'Nairobi', 'organizer': 'GreenTech Kenya'
          },
        ];
        _loading = false;
      });
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'upcoming': return const Color(0xFFF6C90E);
      case 'ongoing': return const Color(0xFF2FD4FF);
      case 'completed': return Colors.green;
      default: return Colors.grey;
    }
  }

  IconData _modeIcon(String? mode) {
    switch (mode) {
      case 'online': return Icons.computer;
      case 'offline': return Icons.location_on;
      case 'hybrid': return Icons.sync_alt;
      default: return Icons.event;
    }
  }

  void _showDetail(Map<String, dynamic> h) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        builder: (_, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.all(24),
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(h['title'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: _statusColor(h['status']).withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                child: Text(h['status']?.toUpperCase() ?? '', style: TextStyle(color: _statusColor(h['status']), fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ]),
            const SizedBox(height: 16),
            _detailRow('Organizer', h['organizer'] ?? ''),
            _detailRow('Dates', '${h['start_date'] ?? ''} → ${h['end_date'] ?? ''}'),
            _detailRow('Mode', '${h['mode'] ?? ''}${h['location'] != null ? " · ${h['location']}" : ""}'),
            _detailRow('Prize Pool', 'TZS ${((h['prize_pool'] ?? 0) as int).toString()}'),
            _detailRow('Participants', '${h['registered_count'] ?? 0} / ${h['max_participants'] ?? '∞'}'),
            const SizedBox(height: 12),
            const Text('Description', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(h['description'] ?? ''),
            const SizedBox(height: 24),
            if (h['status'] != 'completed')
              ElevatedButton(
                onPressed: _registered.contains(h['id']) ? null : () {
                  setState(() => _registered.add(h['id']));
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Registered successfully!')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _registered.contains(h['id']) ? Colors.green : const Color(0xFF6C3AED),
                  minimumSize: const Size.fromHeight(48),
                ),
                child: Text(_registered.contains(h['id']) ? '✓ Registered' : 'Register Now'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(width: 100, child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500))),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🏆 Hackathons')),
      body: Column(
        children: [
          // Filters
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _statusFilter,
                    decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                    items: ['all', 'upcoming', 'ongoing', 'completed'].map((s) => DropdownMenuItem(value: s, child: Text(s == 'all' ? 'All Status' : s.capitalize()))).toList(),
                    onChanged: (v) => setState(() => _statusFilter = v!),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _modeFilter,
                    decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                    items: ['all', 'online', 'offline', 'hybrid'].map((m) => DropdownMenuItem(value: m, child: Text(m == 'all' ? 'All Modes' : m.capitalize()))).toList(),
                    onChanged: (v) => setState(() => _modeFilter = v!),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text('🏆', style: TextStyle(fontSize: 48)),
                        SizedBox(height: 12),
                        Text('No hackathons found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text('Check back later for upcoming competitions.', style: TextStyle(color: Colors.grey)),
                      ]))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) {
                          final h = _filtered[i];
                          final statusColor = _statusColor(h['status']);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  height: 80,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(colors: [const Color(0xFF1a1a2e), const Color(0xFF16213e)]),
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                  ),
                                  child: const Center(child: Text('🏆', style: TextStyle(fontSize: 36))),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                        Expanded(child: Text(h['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                                          child: Text(h['status']?.toUpperCase() ?? '', style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                                        ),
                                      ]),
                                      const SizedBox(height: 6),
                                      Text(
                                        (h['description'] ?? '').toString().length > 80 ? '${(h['description'] ?? '').toString().substring(0, 80)}...' : h['description'] ?? '',
                                        style: const TextStyle(color: Colors.grey, fontSize: 13),
                                      ),
                                      const SizedBox(height: 8),
                                      Wrap(spacing: 12, children: [
                                        Row(mainAxisSize: MainAxisSize.min, children: [
                                          const Icon(Icons.calendar_today, size: 12, color: Colors.grey),
                                          const SizedBox(width: 4),
                                          Text('${h['start_date'] ?? ''}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                        ]),
                                        Row(mainAxisSize: MainAxisSize.min, children: [
                                          Icon(_modeIcon(h['mode']), size: 12, color: Colors.grey),
                                          const SizedBox(width: 4),
                                          Text(h['mode'] ?? '', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                        ]),
                                        Row(mainAxisSize: MainAxisSize.min, children: [
                                          const Icon(Icons.group, size: 12, color: Colors.grey),
                                          const SizedBox(width: 4),
                                          Text('${h['registered_count']}/${h['max_participants'] ?? '∞'}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                        ]),
                                      ]),
                                      const SizedBox(height: 10),
                                      Row(children: [
                                        Expanded(
                                          child: OutlinedButton(
                                            onPressed: () => _showDetail(h),
                                            child: const Text('View Details'),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        if (h['status'] != 'completed')
                                          Expanded(
                                            child: ElevatedButton(
                                              onPressed: _registered.contains(h['id']) ? null : () => setState(() => _registered.add(h['id'])),
                                              style: ElevatedButton.styleFrom(backgroundColor: _registered.contains(h['id']) ? Colors.green : const Color(0xFF6C3AED)),
                                              child: Text(_registered.contains(h['id']) ? '✓ Registered' : 'Register'),
                                            ),
                                          ),
                                      ]),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

extension StringCapitalize on String {
  String capitalize() => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}
