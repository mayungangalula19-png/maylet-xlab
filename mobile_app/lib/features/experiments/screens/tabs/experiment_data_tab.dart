import 'package:flutter/material.dart';
import '../../models/experiment.dart';

class ExperimentDataTab extends StatelessWidget {
  final Experiment experiment;

  const ExperimentDataTab({super.key, required this.experiment});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Data Collection', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          const Text('Live metrics and tracking data from your experiment.', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 24),
          
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.blue.withOpacity(0.3))),
                  child: const Column(
                    children: [
                      Text('4,521', style: TextStyle(color: Colors.blue, fontSize: 24, fontWeight: FontWeight.bold)),
                      SizedBox(height: 4),
                      Text('Total Visitors', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green.withOpacity(0.3))),
                  child: const Column(
                    children: [
                      Text('6.2%', style: TextStyle(color: Colors.green, fontSize: 24, fontWeight: FontWeight.bold)),
                      SizedBox(height: 4),
                      Text('Conversion Rate', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          const Text('Recent Events', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 12),
          
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 3,
            itemBuilder: (context, index) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.analytics, size: 16, color: Colors.grey),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        index == 0 ? 'Conversion spike detected (Control Group)' : 
                        index == 1 ? 'Traffic source changed to organic' : '100 users reached',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                    ),
                    const Text('2h ago', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  ],
                ),
              );
            },
          ),
          
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add, color: Colors.black),
              label: const Text('Add Manual Data Point', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2fd4ff),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
