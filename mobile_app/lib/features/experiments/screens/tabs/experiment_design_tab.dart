import 'package:flutter/material.dart';
import '../../models/experiment.dart';

class ExperimentDesignTab extends StatelessWidget {
  final Experiment experiment;

  const ExperimentDesignTab({super.key, required this.experiment});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Test Design', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          const Text('Configure the parameters of your experiment.', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 24),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Methodology', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                Text('A/B Testing with 50/50 split on landing page conversion.', style: TextStyle(color: Colors.grey.shade400)),
                const Divider(color: Colors.white10, height: 24),
                
                const Text('Target Audience', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                Text('New users from organic search traffic (Mobile only).', style: TextStyle(color: Colors.grey.shade400)),
                const Divider(color: Colors.white10, height: 24),
                
                const Text('Success Metric', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                Text('Click-through rate (CTR) on primary CTA > 5%', style: TextStyle(color: Colors.grey.shade400)),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.edit, color: Color(0xFF2fd4ff)),
              label: const Text('Edit Design Parameters', style: TextStyle(color: Color(0xFF2fd4ff))),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF2fd4ff)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
