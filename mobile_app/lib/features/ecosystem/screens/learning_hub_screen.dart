import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
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
  String? _error;

  List<Map<String, dynamic>> get _filtered => _resources.where((r) {
    if (_search.isNotEmpty && !(r['title'] ?? '').toLowerCase().contains(_search.toLowerCase()) && !(r['description'] ?? '').toLowerCase().contains(_search.toLowerCase())) return false;
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
      if (mounted) {
        setState(() { _resources = List<Map<String, dynamic>>.from(res); _loading = false; });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _loading = false; });
      }
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
      case 'beginner': return const Color(0xFF48bb78); // green
      case 'intermediate': return const Color(0xFFf6c90e); // yellow
      case 'advanced': return const Color(0xFFfc8181); // red
      default: return const Color(0xFF7c5fe6); // purple
    }
  }

  Future<void> _launchUrl(String? urlString) async {
    if (urlString == null || urlString.isEmpty) return;
    final uri = Uri.tryParse(urlString);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _resources.length;
    final completed = _completedCount;
    final inProgress = total - completed;

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
                      Icon(Icons.library_books, color: Color(0xFF7c5fe6), size: 28),
                      SizedBox(width: 8),
                      Text('Learning Hub', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('Master innovation, design, and entrepreneurship with curated resources', style: TextStyle(color: Colors.grey, fontSize: 14)),
                  const SizedBox(height: 24),

                  // Stats Grid
                  Row(
                    children: [
                      _statCard('Total', total.toString(), const Color(0xFF2fd4ff), Icons.menu_book),
                      const SizedBox(width: 8),
                      _statCard('Completed', completed.toString(), const Color(0xFF48bb78), Icons.check_circle),
                      const SizedBox(width: 8),
                      _statCard('In Progress', inProgress.toString(), const Color(0xFFf6c90e), Icons.sync),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Search + Filters
                  TextField(
                    onChanged: (v) => setState(() => _search = v),
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search by title, description...',
                      hintStyle: const TextStyle(color: Colors.grey),
                      prefixIcon: const Icon(Icons.search, color: Colors.grey),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.05),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 12),
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
                              value: _typeFilter,
                              dropdownColor: const Color(0xFF1A1A2E),
                              icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                              isExpanded: true,
                              style: const TextStyle(color: Colors.white),
                              items: const [
                                DropdownMenuItem(value: 'all', child: Text('All Types')),
                                DropdownMenuItem(value: 'course', child: Text('📘 Courses')),
                                DropdownMenuItem(value: 'video', child: Text('🎥 Videos')),
                                DropdownMenuItem(value: 'article', child: Text('📄 Articles')),
                                DropdownMenuItem(value: 'workshop', child: Text('🎤 Workshops')),
                              ],
                              onChanged: (v) => setState(() => _typeFilter = v!),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _levelFilter,
                              dropdownColor: const Color(0xFF1A1A2E),
                              icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                              isExpanded: true,
                              style: const TextStyle(color: Colors.white),
                              items: const [
                                DropdownMenuItem(value: 'all', child: Text('All Levels')),
                                DropdownMenuItem(value: 'beginner', child: Text('Beginner')),
                                DropdownMenuItem(value: 'intermediate', child: Text('Intermediate')),
                                DropdownMenuItem(value: 'advanced', child: Text('Advanced')),
                              ],
                              onChanged: (v) => setState(() => _levelFilter = v!),
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
                    Text('📚', style: TextStyle(fontSize: 48)),
                    SizedBox(height: 16),
                    Text('No resources found', style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    Text('Try adjusting your search or filters.', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _resourceCard(_filtered[index]),
                  childCount: _filtered.length,
                ),
              ),
            ),
            
          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.4),
          border: Border.all(color: color.withOpacity(0.2)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _resourceCard(Map<String, dynamic> r) {
    final id = r['id'] ?? '';
    final done = _completed.contains(id);
    final levelColor = _levelColor(r['skill_level']);
    final icon = _typeIcon(r['type']);
    final tags = (r['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
        border: done ? Border.all(color: const Color(0xFF48bb78).withOpacity(0.5), width: 1.5) : Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail Header
          Container(
            height: 100,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A2E),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              image: r['thumbnail_url'] != null && r['thumbnail_url'].toString().isNotEmpty
                  ? DecorationImage(image: NetworkImage(r['thumbnail_url']), fit: BoxFit.cover, opacity: 0.4)
                  : null,
            ),
            child: Center(
              child: Icon(icon, size: 48, color: Colors.white.withOpacity(0.3)),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(icon, size: 14, color: const Color(0xFF7c5fe6)),
                        const SizedBox(width: 4),
                        Text(r['type']?.toString().toUpperCase() ?? 'RESOURCE', style: const TextStyle(fontSize: 11, color: Color(0xFF7c5fe6), fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: levelColor.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                      child: Text(r['skill_level'] ?? 'All Levels', style: TextStyle(color: levelColor, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(r['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
                const SizedBox(height: 6),
                Text(
                  r['description'] ?? '',
                  style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                
                // Meta info
                Row(
                  children: [
                    const Icon(Icons.schedule, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(r['duration'] ?? '--', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(width: 16),
                    const Icon(Icons.person, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Expanded(child: Text(r['author'] ?? 'Unknown', style: const TextStyle(fontSize: 12, color: Colors.grey), overflow: TextOverflow.ellipsis)),
                  ],
                ),
                
                if (tags.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: tags.take(3).map((tag) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(20)),
                      child: Text(tag, style: const TextStyle(color: Colors.white54, fontSize: 10)),
                    )).toList(),
                  ),
                ],
                
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _launchUrl(r['url']),
                        icon: const Icon(Icons.open_in_new, size: 16, color: Colors.white),
                        label: const Text('Open', style: TextStyle(color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                          elevation: 0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            if (done) { _completed.remove(id); } else { _completed.add(id); }
                          });
                        },
                        icon: Icon(done ? Icons.check_circle : Icons.radio_button_unchecked, size: 16, color: Colors.white),
                        label: Text(done ? 'Completed' : 'Mark Done', style: const TextStyle(color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: done ? const Color(0xFF48bb78) : const Color(0xFF7c5fe6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
