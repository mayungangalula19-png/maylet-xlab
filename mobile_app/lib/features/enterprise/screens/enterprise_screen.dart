import 'package:flutter/material.dart';

class EnterpriseScreen extends StatefulWidget {
  const EnterpriseScreen({super.key});

  @override
  State<EnterpriseScreen> createState() => _EnterpriseScreenState();
}

class _EnterpriseScreenState extends State<EnterpriseScreen> with SingleTickerProviderStateMixin {
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
        title: const Text('Enterprise Hub'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Solutions'),
            Tab(text: 'Integrations'),
            Tab(text: 'Billing'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _overviewTab(),
          _solutionsTab(),
          _integrationsTab(),
          _billingTab(),
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
            gradient: const LinearGradient(colors: [Color(0xFF1E3A5F), Color(0xFF2563EB)]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(Icons.business, color: Colors.white, size: 28),
                SizedBox(width: 8),
                Text('Enterprise Suite', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              ]),
              SizedBox(height: 8),
              Text('Scalable innovation management for large organizations, research institutions, and innovation labs.', style: TextStyle(color: Colors.white70)),
              SizedBox(height: 16),
              Row(children: [
                Chip(label: Text('SSO Ready', style: TextStyle(fontSize: 11)), backgroundColor: Colors.white24, labelStyle: TextStyle(color: Colors.white)),
                SizedBox(width: 8),
                Chip(label: Text('GDPR Compliant', style: TextStyle(fontSize: 11)), backgroundColor: Colors.white24, labelStyle: TextStyle(color: Colors.white)),
                SizedBox(width: 8),
                Chip(label: Text('99.9% SLA', style: TextStyle(fontSize: 11)), backgroundColor: Colors.white24, labelStyle: TextStyle(color: Colors.white)),
              ]),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text('Enterprise Metrics', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Row(children: [
          _metricTile('Active Users', '0', Colors.blue),
          const SizedBox(width: 12),
          _metricTile('Departments', '0', Colors.purple),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _metricTile('Projects', '0', Colors.green),
          const SizedBox(width: 12),
          _metricTile('IP Assets', '0', Colors.orange),
        ]),
        const SizedBox(height: 24),
        const Text('Quick Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _actionCard('Invite Team Members', Icons.person_add, Colors.blue, () {}),
        _actionCard('Configure SSO', Icons.security, Colors.purple, () {}),
        _actionCard('Manage Departments', Icons.business, Colors.green, () {}),
        _actionCard('View Audit Logs', Icons.history, Colors.orange, () {}),
      ],
    );
  }

  Widget _solutionsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _solutionCard('Innovation Pipeline', 'Manage your organization\'s full innovation lifecycle from idea to commercialization', Icons.timeline, Colors.blue),
        _solutionCard('IP Management', 'Patent tracking, licensing deals, and IP portfolio management', Icons.gavel, Colors.purple),
        _solutionCard('R&D Analytics', 'Track research ROI, publication metrics, and experiment outcomes', Icons.analytics, Colors.green),
        _solutionCard('Collaboration Tools', 'Cross-departmental project rooms and knowledge sharing', Icons.people, Colors.orange),
        _solutionCard('Compliance & Reporting', 'Automated compliance reports for governance and board meetings', Icons.assignment, Colors.red),
      ],
    );
  }

  Widget _integrationsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _integrationCard('Slack', 'Real-time notifications and project updates', Icons.message, true),
        _integrationCard('Microsoft Teams', 'Collaboration integration for enterprise users', Icons.video_call, false),
        _integrationCard('Jira', 'Sync tasks and issues with your project management', Icons.task, false),
        _integrationCard('GitHub', 'Link repositories to prototypes and experiments', Icons.code, true),
        _integrationCard('Salesforce', 'Connect innovation pipeline to CRM', Icons.cloud, false),
        _integrationCard('SAP', 'Enterprise resource planning integration', Icons.business_center, false),
      ],
    );
  }

  Widget _billingTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Current Plan', style: TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(height: 4),
              const Text('Starter', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Free tier · 5 users · 3 active projects'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
                child: const Text('Upgrade to Pro'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text('Available Plans', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _planCard('Pro', 'TZS 150,000/mo', '25 users, unlimited projects, advanced analytics', Colors.blue),
        _planCard('Team', 'TZS 400,000/mo', '100 users, SSO, custom domain, priority support', Colors.purple),
        _planCard('Enterprise', 'Custom', 'Unlimited users, dedicated account manager, SLA', Colors.orange),
      ],
    );
  }

  Widget _metricTile(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _actionCard(String title, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: color)),
        title: Text(title),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14),
        onTap: onTap,
      ),
    );
  }

  Widget _solutionCard(String title, String description, IconData icon, Color color) {
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

  Widget _integrationCard(String name, String description, IconData icon, bool connected) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, size: 28),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(description),
        trailing: Switch(
          value: connected,
          onChanged: (_) {},
          activeThumbColor: Colors.green,
        ),
      ),
    );
  }

  Widget _planCard(String name, String price, String features, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text(price, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
            ]),
            const SizedBox(height: 8),
            Text(features, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(backgroundColor: color),
              child: Text('Choose $name'),
            ),
          ],
        ),
      ),
    );
  }
}
