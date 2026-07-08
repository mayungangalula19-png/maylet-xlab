import 'package:flutter/material.dart';
import '../../models/experiment.dart';
import 'package:intl/intl.dart';

class ExperimentOverviewTab extends StatelessWidget {
  final Experiment experiment;

  const ExperimentOverviewTab({super.key, required this.experiment});

  static const List<String> pipelineStages = [
    'Draft',
    'Planned',
    'Approved',
    'Running',
    'Data Collection',
    'Analysis',
    'Review',
    'Validation Ready'
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Stats
          Row(
            children: [
              Expanded(child: _buildStatCard('Confidence', '${(experiment.confidenceScore * 100).toStringAsFixed(0)}%', const Color(0xFF2fd4ff))),
              const SizedBox(width: 12),
              Expanded(child: _buildStatCard('Type', experiment.type.toUpperCase(), Colors.purpleAccent)),
              const SizedBox(width: 12),
              Expanded(child: _buildStatCard('Status', experiment.status.toUpperCase(), Colors.greenAccent)),
            ],
          ),
          const SizedBox(height: 24),
          
          const Text('Pipeline Progress', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 16),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: pipelineStages.map((stage) {
                final currentIndex = pipelineStages.indexOf(experiment.pipelineStage);
                final stageIndex = pipelineStages.indexOf(stage);
                final isDone = stageIndex < currentIndex;
                final isActive = stageIndex == currentIndex;
                
                return Row(
                  children: [
                    Column(
                      children: [
                        Container(
                          width: 2,
                          height: 16,
                          color: stageIndex == 0 ? Colors.transparent : (isDone || isActive ? const Color(0xFF2fd4ff) : Colors.white24),
                        ),
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: isDone ? const Color(0xFF2fd4ff) : (isActive ? const Color(0xFF2fd4ff).withValues(alpha: 0.2) : Colors.transparent),
                            shape: BoxShape.circle,
                            border: Border.all(color: isDone || isActive ? const Color(0xFF2fd4ff) : Colors.white24, width: 2),
                          ),
                          child: isDone ? const Icon(Icons.check, size: 14, color: Colors.black) : 
                                 (isActive ? Center(child: Text('${stageIndex + 1}', style: const TextStyle(color: Color(0xFF2fd4ff), fontSize: 10, fontWeight: FontWeight.bold))) : null),
                        ),
                        Container(
                          width: 2,
                          height: 16,
                          color: stageIndex == pipelineStages.length - 1 ? Colors.transparent : (isDone ? const Color(0xFF2fd4ff) : Colors.white24),
                        ),
                      ],
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        stage, 
                        style: TextStyle(
                          color: isActive ? Colors.white : (isDone ? Colors.white70 : Colors.white38),
                          fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                          fontSize: isActive ? 16 : 14,
                        ),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
          
          const SizedBox(height: 24),
          const Text('Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 12),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Created At', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 4),
                Text(DateFormat.yMMMMd().format(experiment.createdAt), style: const TextStyle(color: Colors.white)),
                const Divider(color: Colors.white10, height: 24),
                const Text('Last Updated', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 4),
                Text(DateFormat.yMMMMd().format(experiment.updatedAt), style: const TextStyle(color: Colors.white)),
                if (experiment.projectName != null) ...[
                  const Divider(color: Colors.white10, height: 24),
                  const Text('Linked Project', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text(experiment.projectName!, style: const TextStyle(color: Color(0xFF2fd4ff), fontWeight: FontWeight.bold)),
                ]
              ],
            ),
          ),
          
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
