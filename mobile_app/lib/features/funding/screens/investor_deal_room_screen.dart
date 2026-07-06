import 'package:flutter/material.dart';

class InvestorDealRoomScreen extends StatelessWidget {
  const InvestorDealRoomScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Investor Deal Room')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF3B82F6)]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Deal Flow Pipeline', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('Review vetted startups, analyze cap tables, and securely manage your investments.', style: TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text('Active Deals', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _dealCard('GreenEnergy Solutions', 'Seeking \\\$500K • Seed', '90% Match', Icons.eco, Colors.green),
          _dealCard('FinFlow Africa', 'Seeking \\\$2M • Series A', '75% Match', Icons.account_balance, Colors.blue),
          _dealCard('AgriTech AI', 'Seeking \\\$100K • Pre-Seed', '85% Match', Icons.precision_manufacturing, Colors.purple),
        ],
      ),
    );
  }

  Widget _dealCard(String title, String details, String match, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(details),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.grey.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(match, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        ),
        onTap: () {},
      ),
    );
  }
}
