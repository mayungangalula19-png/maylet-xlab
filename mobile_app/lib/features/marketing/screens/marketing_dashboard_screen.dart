import 'package:flutter/material.dart';

class MarketingDashboardScreen extends StatelessWidget {
  const MarketingDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Marketing & Newsletter')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFFDB2777), Color(0xFFE11D48)]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Campaign Overview', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('Manage your subscribers, track engagement, and launch newsletters.', style: TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _metricBlock('Subscribers', '1,245'),
              _metricBlock('Open Rate', '42.8%'),
              _metricBlock('Click Rate', '12.4%'),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Recent Campaigns', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _campaignCard('Product Launch Q3', 'Sent on Oct 12', 'Delivered', Colors.green),
          _campaignCard('Monthly Newsletter', 'Draft', 'Pending', Colors.orange),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.edit),
        label: const Text('New Campaign'),
        backgroundColor: const Color(0xFFDB2777),
      ),
    );
  }

  Widget _metricBlock(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      ],
    );
  }

  Widget _campaignCard(String title, String subtitle, String status, Color statusColor) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(Icons.mark_email_read, color: statusColor),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: Text(status, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
