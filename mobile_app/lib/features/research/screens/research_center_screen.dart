import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';

class ResearchCenterScreen extends StatefulWidget {
  const ResearchCenterScreen({super.key});

  @override
  State<ResearchCenterScreen> createState() => _ResearchCenterScreenState();
}

class _ResearchCenterScreenState extends State<ResearchCenterScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _papers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchPapers();
  }

  @override
  void dispose() { _tabController.dispose(); super.dispose(); }

  Future<void> _fetchPapers() async {
    try {
      final res = await SupabaseConfig.client.from('research_papers').select('*').order('created_at', ascending: false).limit(20);
      setState(() { _papers = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Research Center'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Papers'),
            Tab(text: 'Market Intel'),
            Tab(text: 'Insights'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _papersTab(),
          _marketIntelTab(),
          _insightsTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add),
        label: const Text('Add Paper'),
        backgroundColor: const Color(0xFF6C3AED),
      ),
    );
  }

  Widget _papersTab() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_papers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.article_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('No research papers yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Upload papers, link external resources, or import from academic databases.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _papers.length,
      itemBuilder: (_, i) {
        final p = _papers[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.article)),
            title: Text(p['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(p['abstract'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
          ),
        );
      },
    );
  }

  Widget _marketIntelTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _intelCard('Global Innovation Index 2024', 'Tanzania climbs 3 positions to rank 92 worldwide.', Icons.public, Colors.blue),
        _intelCard('Fintech Market Africa', 'Expected CAGR of 14.7% through 2028. Mobile payment leads.', Icons.trending_up, Colors.green),
        _intelCard('AgriTech Investment Surge', 'USD 2.3B invested in African AgriTech in Q3 2024.', Icons.agriculture, Colors.orange),
        _intelCard('Health Tech Opportunity', 'Digital health solutions needed in 18 underserved regions.', Icons.health_and_safety, Colors.purple),
      ],
    );
  }

  Widget _insightsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF6C3AED), Color(0xFF2563EB)]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('AI-Generated Insight', style: TextStyle(color: Colors.white70, fontSize: 12)),
              SizedBox(height: 8),
              Text('Your project aligns with 3 high-growth market trends. Consider pivoting to include health data analytics.', style: TextStyle(color: Colors.white, fontSize: 15)),
            ],
          ),
        ),
        _intelCard('Patent Landscape', '42 similar patents filed in the last 12 months. Differentiation opportunity exists.', Icons.lightbulb, Colors.amber),
        _intelCard('Competitor Analysis', '5 competing startups identified. Your unique angle: community-first approach.', Icons.compare, Colors.teal),
      ],
    );
  }

  Widget _intelCard(String title, String description, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(description),
      ),
    );
  }
}
