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
  String? _error;

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
      if (mounted) {
        setState(() { _hackathons = List<Map<String, dynamic>>.from(res); _loading = false; });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _loading = false; });
      }
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'upcoming': return const Color(0xFFf6c90e); // yellow
      case 'ongoing': return const Color(0xFF2fd4ff); // cyan
      case 'completed': return const Color(0xFF48bb78); // green
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
    final statusColor = _statusColor(h['status']);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.75,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFF1A1A2E),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: controller,
            padding: const EdgeInsets.all(24),
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: Text(h['title'] ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white))),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: statusColor.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                    child: Text(h['status']?.toUpperCase() ?? '', style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              _detailSection('Organizer', h['organizer'] ?? ''),
              _detailSection('Dates', '${h['start_date'] ?? ''}  →  ${h['end_date'] ?? ''}'),
              _detailSection('Mode', '${(h['mode'] ?? '').toString().capitalize()} ${h['location'] != null ? " · ${h['location']}" : ""}'),
              _detailSection('Prize Pool', '\$${((h['prize_pool'] ?? 0) as num).toStringAsFixed(0)}'),
              _detailSection('Participants', '${h['registered_count'] ?? 0} / ${h['max_participants'] ?? 'Unlimited'}'),
              
              const SizedBox(height: 12),
              const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white70, fontSize: 14)),
              const SizedBox(height: 8),
              Text(h['description'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.5)),
              const SizedBox(height: 32),
              
              if (h['status'] != 'completed')
                StatefulBuilder(
                  builder: (context, setStateModal) {
                    final isReg = _registered.contains(h['id']);
                    return ElevatedButton(
                      onPressed: isReg ? null : () {
                        setState(() => _registered.add(h['id']));
                        setStateModal(() {});
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registered successfully!')));
                        Future.delayed(const Duration(seconds: 1), () {
                          if (context.mounted) Navigator.pop(context);
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isReg ? const Color(0xFF48bb78) : const Color(0xFF7c5fe6),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                      ),
                      child: Text(isReg ? '✓ Already Registered' : 'Register Now', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    );
                  }
                ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close', style: TextStyle(color: Colors.grey)),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailSection(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 110, child: Text(label, style: const TextStyle(color: Colors.white54, fontSize: 14))),
          Expanded(child: Text(value, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Text('🏆', style: TextStyle(fontSize: 28)),
                      SizedBox(width: 8),
                      Text('Hackathons', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('Discover and join innovation competitions to build, pitch, and win', style: TextStyle(color: Colors.grey, fontSize: 14)),
                  const SizedBox(height: 24),

                  // Filters
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _statusFilter,
                              dropdownColor: const Color(0xFF1A1A2E),
                              icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                              isExpanded: true,
                              style: const TextStyle(color: Colors.white),
                              items: ['all', 'upcoming', 'ongoing', 'completed']
                                  .map((s) => DropdownMenuItem(value: s, child: Text(s == 'all' ? 'All Status' : s.capitalize())))
                                  .toList(),
                              onChanged: (v) => setState(() => _statusFilter = v!),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _modeFilter,
                              dropdownColor: const Color(0xFF1A1A2E),
                              icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                              isExpanded: true,
                              style: const TextStyle(color: Colors.white),
                              items: ['all', 'online', 'offline', 'hybrid']
                                  .map((m) => DropdownMenuItem(value: m, child: Text(m == 'all' ? 'All Modes' : m.capitalize())))
                                  .toList(),
                              onChanged: (v) => setState(() => _modeFilter = v!),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Content
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6))))
          else if (_error != null)
            SliverFillRemaining(child: Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red))))
          else if (_filtered.isEmpty)
            const SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('🏆', style: TextStyle(fontSize: 48)),
                    SizedBox(height: 16),
                    Text('No hackathons found', style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    Text('Check back later for upcoming competitions.', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _hackathonCard(_filtered[index]),
                  childCount: _filtered.length,
                ),
              ),
            ),
            
          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _hackathonCard(Map<String, dynamic> h) {
    final statusColor = _statusColor(h['status']);
    final isReg = _registered.contains(h['id']);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header / Banner
          Container(
            height: 90,
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A2E),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              image: h['image_url'] != null && h['image_url'].toString().isNotEmpty
                  ? DecorationImage(image: NetworkImage(h['image_url']), fit: BoxFit.cover, opacity: 0.4)
                  : null,
            ),
            child: const Center(child: Text('🏆', style: TextStyle(fontSize: 40))),
          ),
          
          // Body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: Text(h['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white))),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: statusColor.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                      child: Text(h['status']?.toUpperCase() ?? '', style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  (h['description'] ?? '').toString().length > 100 ? '${(h['description'] ?? '').toString().substring(0, 100)}...' : h['description'] ?? '',
                  style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 16),
                
                // Meta Grid
                Wrap(
                  spacing: 16,
                  runSpacing: 8,
                  children: [
                    _metaIconText(Icons.calendar_today, '${h['start_date'] ?? ''} - ${h['end_date'] ?? ''}'),
                    _metaIconText(_modeIcon(h['mode']), (h['mode'] ?? '').toString().capitalize()),
                    if (h['location'] != null) _metaIconText(Icons.location_on, h['location']),
                    _metaIconText(Icons.emoji_events, '\$${((h['prize_pool'] ?? 0) as num).toStringAsFixed(0)}'),
                    _metaIconText(Icons.group, '${h['registered_count'] ?? 0}/${h['max_participants'] ?? '∞'}'),
                  ],
                ),
                
                const SizedBox(height: 20),
                
                // Actions
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _showDetail(h),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                          elevation: 0,
                        ),
                        child: const Text('View Details', style: TextStyle(color: Colors.white)),
                      ),
                    ),
                    if (h['status'] != 'completed') ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: isReg ? null : () => setState(() => _registered.add(h['id'])),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isReg ? const Color(0xFF48bb78) : const Color(0xFF7c5fe6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                            elevation: 0,
                          ),
                          child: Text(isReg ? '✓ Registered' : 'Register', style: const TextStyle(color: Colors.white)),
                        ),
                      ),
                    ]
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaIconText(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.grey),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }
}

extension StringCapitalize on String {
  String capitalize() => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}
