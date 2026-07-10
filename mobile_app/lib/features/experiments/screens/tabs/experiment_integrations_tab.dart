import 'package:flutter/material.dart';

class ExperimentIntegrationsTab extends StatelessWidget {
  final String experimentId;

  const ExperimentIntegrationsTab({super.key, required this.experimentId});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Integrations', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          const Text('Connect external tools to stream data directly into this experiment.', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 24),
          
          _buildIntegrationCard('Google Analytics', 'Connect GA4 to pull conversion data automatically.', Icons.analytics, true),
          _buildIntegrationCard('Mixpanel', 'Stream event data and user cohorts.', Icons.data_exploration, false),
          _buildIntegrationCard('PostHog', 'Import product analytics and session recordings.', Icons.insights, false),
          _buildIntegrationCard('Optimizely', 'Sync A/B test variations and results.', Icons.science, false),
        ],
      ),
    );
  }

  Widget _buildIntegrationCard(String name, String description, IconData icon, bool connected) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: connected ? const Color(0xFF2fd4ff).withOpacity(0.5) : Colors.white10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: connected ? const Color(0xFF2fd4ff).withOpacity(0.2) : Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: connected ? const Color(0xFF2fd4ff) : Colors.grey, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(description, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: connected ? Colors.transparent : Colors.white.withOpacity(0.1),
              foregroundColor: connected ? Colors.redAccent : Colors.white,
              elevation: 0,
              side: BorderSide(color: connected ? Colors.redAccent.withOpacity(0.5) : Colors.transparent),
            ),
            child: Text(connected ? 'Disconnect' : 'Connect'),
          ),
        ],
      ),
    );
  }
}
