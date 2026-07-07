import 'package:flutter/material.dart';

class CommercializationScreen extends StatefulWidget {
  const CommercializationScreen({super.key});

  @override
  State<CommercializationScreen> createState() => _CommercializationScreenState();
}

class _CommercializationScreenState extends State<CommercializationScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() { _tabController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Commercialization'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Go-to-Market'),
            Tab(text: 'Revenue'),
            Tab(text: 'Partnership'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _overviewTab(),
          _goToMarketTab(),
          _revenueTab(),
          _partnershipTab(),
        ],
      ),
    );
  }

  Widget _overviewTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF059669), Color(0xFF10B981)]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Commercialization Hub', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('Transform your validated innovation into a scalable, revenue-generating business.', style: TextStyle(color: Colors.white70)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text('Commercialization Stages', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _stageCard('1. Market Validation', 'Confirm product-market fit with real customers', Icons.people, Colors.blue, isComplete: true),
        _stageCard('2. Business Model', 'Define your revenue streams and unit economics', Icons.account_balance_wallet, Colors.purple, isComplete: true),
        _stageCard('3. Go-to-Market', 'Build your customer acquisition strategy', Icons.launch, Colors.orange),
        _stageCard('4. Scale & Growth', 'Expand to new markets and optimize operations', Icons.trending_up, Colors.teal),
        _stageCard('5. Exit/IPO Strategy', 'Prepare for acquisition or public listing', Icons.flag, Colors.red),
      ],
    );
  }

  Widget _stageCard(String title, String description, IconData icon, Color color, {bool isComplete = false}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isComplete ? Colors.green.withValues(alpha: 0.1) : color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(isComplete ? Icons.check_circle : icon, color: isComplete ? Colors.green : color),
        ),
        title: Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: isComplete ? Colors.green : null)),
        subtitle: Text(description),
        trailing: isComplete ? const Icon(Icons.check, color: Colors.green) : null,
      ),
    );
  }

  Widget _goToMarketTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _infoCard('Customer Segments', 'Identify your early adopters and primary target audience', Icons.people_outline, Colors.blue),
        _infoCard('Value Proposition', 'Craft a compelling value proposition for each segment', Icons.lightbulb_outline, Colors.amber),
        _infoCard('Distribution Channels', 'Map out direct and indirect sales channels', Icons.share, Colors.green),
        _infoCard('Marketing Strategy', 'Content, SEO, paid, and community-led growth', Icons.campaign, Colors.pink),
        _infoCard('Sales Playbook', 'Build repeatable sales processes and scripts', Icons.play_circle_outline, Colors.purple),
      ],
    );
  }

  Widget _revenueTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _metricCard('Monthly Revenue', 'TZS 0', 'Not yet generating revenue', Colors.blue),
        _metricCard('Projected ARR', 'TZS 12M', 'Based on 12-month projections', Colors.green),
        _metricCard('Runway', '8 months', 'At current burn rate', Colors.orange),
        _metricCard('Unit Economics', 'LTV/CAC: 3.2x', 'Healthy ratio > 3x', Colors.purple),
      ],
    );
  }

  Widget _partnershipTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _partnerCard('COSTECH', 'Government', 'Technology development funding', Icons.account_balance, Colors.blue),
        _partnerCard('UDSM Innovation Hub', 'Academic', 'Research collaboration and talent', Icons.school, Colors.green),
        _partnerCard('Equity Bank Tanzania', 'Financial', 'Startup banking and loans', Icons.account_balance_wallet, Colors.orange),
        _partnerCard('Strathmore University', 'Academic', 'Pan-African startup network', Icons.public, Colors.purple),
      ],
    );
  }

  Widget _infoCard(String title, String description, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: color)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(description),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14),
      ),
    );
  }

  Widget _metricCard(String label, String value, String subtitle, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(height: 4),
              Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
              Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ])),
            Icon(Icons.show_chart, color: color, size: 40),
          ],
        ),
      ),
    );
  }

  Widget _partnerCard(String name, String type, String detail, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: color)),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('$type · $detail'),
        trailing: ElevatedButton(onPressed: () {}, style: ElevatedButton.styleFrom(backgroundColor: color), child: const Text('Connect', style: TextStyle(fontSize: 12))),
      ),
    );
  }
}
