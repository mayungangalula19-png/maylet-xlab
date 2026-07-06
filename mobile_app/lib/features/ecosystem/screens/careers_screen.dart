import 'package:flutter/material.dart';

class CareersScreen extends StatelessWidget {
  const CareersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ecosystem Careers')),
      body: ListView(
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
                Text('Join a Startup', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('Find co-founders, technical leads, and strategic roles in the Maylet ecosystem.', style: TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text('Open Opportunities', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _jobCard('CTO / Co-Founder', 'AgriTech Startup', 'Equity + Salary', Icons.engineering, Colors.orange),
          _jobCard('Lead Product Designer', 'Fintech Innovations', 'Remote • Full-time', Icons.design_services, Colors.blue),
          _jobCard('AI Researcher', 'Maylet Labs', 'Dar es Salaam', Icons.science, Colors.purple),
        ],
      ),
    );
  }

  Widget _jobCard(String title, String company, String details, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(company),
        trailing: Text(details, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        onTap: () {},
      ),
    );
  }
}
