import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';

class LearningHubScreen extends StatefulWidget {
  const LearningHubScreen({super.key});

  @override
  State<LearningHubScreen> createState() => _LearningHubScreenState();
}

class _LearningHubScreenState extends State<LearningHubScreen> {
  List<Map<String, dynamic>> _resources = [];
  bool _loading = true;
  String _search = '';
  String _typeFilter = 'all';
  String _levelFilter = 'all';
  final Set<String> _completed = {};

  List<Map<String, dynamic>> get _filtered => _resources.where((r) {
    if (_search.isNotEmpty && !(r['title'] ?? '').toLowerCase().contains(_search.toLowerCase())) return false;
    if (_typeFilter != 'all' && r['type'] != _typeFilter) return false;
    if (_levelFilter != 'all' && r['skill_level'] != _levelFilter) return false;
    return true;
  }).toList();

  int get _completedCount => _resources.where((r) => _completed.contains(r['id'])).length;

  @override
  void initState() {
    super.initState();
    _fetchResources();
  }

  Future<void> _fetchResources() async {
    try {
      final res = await SupabaseConfig.client.from('learning_resources').select('*').order('created_at', ascending: false);
      setState(() { _resources = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (_) {
      // Demo data fallback
      setState(() {
        _resources = [
          {'id': '1', 'title': 'Innovation Fundamentals', 'description': 'Learn the core principles of design thinking and innovation management for modern enterprises.', 'type': 'course', 'skill_level': 'beginner', 'duration': '4h 30m', 'author': 'Prof. A. Masinde', 'tags': ['innovation', 'design thinking'], 'url': 'https://example.com'},
          {'id': '2', 'title': 'Building Scalable Startups', 'description': 'A comprehensive video series on startup scaling, team building, and fundraising in Africa.', 'type': 'video', 'skill_level': 'intermediate', 'duration': '2h 15m', 'author': 'Jane Mwangi', 'tags': ['startups', 'scaling'], 'url': 'https://example.com'},
          {'id': '3', 'title': 'Lean Canvas for African Markets', 'description': 'Adapt the Lean Canvas methodology for emerging market conditions and resource constraints.', 'type': 'article', 'skill_level': 'beginner', 'duration': '25 min', 'author': 'TechHub TZ', 'tags': ['lean', 'canvas'], 'url': 'https://example.com'},
          {'id': '4', 'title': 'Patent Filing Workshop', 'description': 'Live workshop on intellectual property rights, patent filing, and IP strategy for innovators.', 'type': 'workshop', 'skill_level': 'advanced', 'duration': '3h', 'author': 'IP Africa', 'tags': ['patents', 'IP'], 'url': 'https://example.com'},
          {'id': '5', 'title': 'Data Science for Social Impact', 'description': 'Apply data science techniques to solve social and economic challenges in developing markets.', 'type': 'course', 'skill_level': 'intermediate', 'duration': '8h', 'author': 'DataX Africa', 'tags': ['data science', 'AI'], 'url': 'https://example.com'},
          {'id': '6', 'title': 'Fundraising for East African Startups', 'description': 'Navigate the funding landscape in East Africa — angels, VCs, grants, and impact investors.', 'type': 'video', 'skill_level': 'advanced', 'duration': '1h 45m', 'author': 'Savannah Fund', 'tags': ['funding', 'VC'], 'url': 'https://example.com'},
        ];
        _loading = false;
      });
    }
  }

  IconData _typeIcon(String? type) {
    switch (type) {
      case 'course': return Icons.menu_book;
      case 'video': return Icons.play_circle_filled;
      case 'article': return Icons.article;
      case 'workshop': return Icons.mic;
      default: return Icons.library_books;
    }
  }

  Color _levelColor(String? level) {
    switch (level) {
      case 'beginner': return Colors.green;
      case 'intermediate': return Colors.orange;
      case 'advanced': return Colors.red;
      default: return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _resources.length;
    final completed = _completedCount;
    final inProgress = total - completed;

    return Scaffold(
      appBar: AppBar(title: const Text('📚 Learning Hub')),
      body: Column(
        children: [
          // Stats
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Row(
              children: [
                _statCard('📖 Total', total.toString(), Colors.blue),
                const SizedBox(width: 8),
                _statCard('✅ Done', completed.toString(), Colors.green),
                const SizedBox(width: 8),
                _statCard('🔄 Left', inProgress.toString(), Colors.orange),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Search
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search resources...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          const SizedBox(height: 6),
          // Filters
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _typeFilter,
                    isDense: true,
                    decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)), contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                    items: [
                      const DropdownMenuItem(value: 'all', child: Text('All Types')),
                      const DropdownMenuItem(value: 'course', child: Text('📘 Courses')),
                      const DropdownMenuItem(value: 'video', child: Text('🎥 Videos')),
                      const DropdownMenuItem(value: 'article', child: Text('📄 Articles')),
                      const DropdownMenuItem(value: 'workshop', child: Text('🎤 Workshops')),
                    ],
                    onChanged: (v) => setState(() => _typeFilter = v!),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _levelFilter,
                    isDense: true,
                    decoration: InputDecoration(border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)), contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                    items: const [
                      DropdownMenuItem(value: 'all', child: Text('All Levels')),
                      DropdownMenuItem(value: 'beginner', child: Text('Beginner')),
                      DropdownMenuItem(value: 'intermediate', child: Text('Intermediate')),
                      DropdownMenuItem(value: 'advanced', child: Text('Advanced')),
                    ],
                    onChanged: (v) => setState(() => _levelFilter = v!),
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
                        Text('📚', style: TextStyle(fontSize: 48)),
                        SizedBox(height: 12),
                        Text('No resources found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text('Try adjusting your search or filters', style: TextStyle(color: Colors.grey)),
                      ]))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) {
                          final r = _filtered[i];
                          final id = r['id'] ?? '';
                          final done = _completed.contains(id);
                          final levelColor = _levelColor(r['skill_level']);
                          final icon = _typeIcon(r['type']);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: done
                                ? RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Colors.green, width: 2))
                                : RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: Column(
                              children: [
                                Container(
                                  height: 80,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1a1a2e),
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                  ),
                                  child: Center(child: Icon(icon, size: 40, color: Colors.white70)),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                        Text(r['type']?.toString().toUpperCase() ?? '', style: const TextStyle(fontSize: 11, color: Color(0xFF2FD4FF))),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(color: levelColor.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                                          child: Text(r['skill_level'] ?? '', style: TextStyle(color: levelColor, fontSize: 10, fontWeight: FontWeight.bold)),
                                        ),
                                      ]),
                                      const SizedBox(height: 6),
                                      Text(r['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                      const SizedBox(height: 4),
                                      Text(
                                        (r['description'] ?? '').toString().length > 100 ? '${(r['description'] ?? '').toString().substring(0, 100)}...' : r['description'] ?? '',
                                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                                      ),
                                      const SizedBox(height: 8),
                                      Row(children: [
                                        const Icon(Icons.schedule, size: 12, color: Colors.grey),
                                        const SizedBox(width: 4),
                                        Text(r['duration'] ?? '', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                        const SizedBox(width: 12),
                                        const Icon(Icons.person, size: 12, color: Colors.grey),
                                        const SizedBox(width: 4),
                                        Expanded(child: Text(r['author'] ?? '', style: const TextStyle(fontSize: 11, color: Colors.grey), overflow: TextOverflow.ellipsis)),
                                      ]),
                                      const SizedBox(height: 10),
                                      Row(children: [
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: () {},
                                            icon: const Icon(Icons.open_in_new, size: 14),
                                            label: const Text('Open Resource'),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: ElevatedButton.icon(
                                            onPressed: () => setState(() {
                                              if (done) { _completed.remove(id); } else { _completed.add(id); }
                                            }),
                                            icon: Icon(done ? Icons.check_circle : Icons.radio_button_unchecked, size: 14),
                                            label: Text(done ? 'Completed' : 'Mark Done'),
                                            style: ElevatedButton.styleFrom(backgroundColor: done ? Colors.green : Colors.grey.shade700),
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

  Widget _statCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
