import 'package:flutter/material.dart';
import '../../models/project.dart';
import 'package:intl/intl.dart';

class ProjectOverviewTab extends StatelessWidget {
  final Project project;
  final VoidCallback onRefresh;

  const ProjectOverviewTab({super.key, required this.project, required this.onRefresh});

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'launched': return Colors.green;
      case 'prototype': return const Color(0xFF7c5fe6);
      case 'experiment': return const Color(0xFF2fd4ff);
      case 'idea': return const Color(0xFFf6c90e);
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Stats Grid
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.5,
              children: [
                _buildStatCard('Team Members', '${project.teamSize}', Icons.people, Colors.blue),
                _buildStatCard('Tasks Done', '${project.tasksCompleted}/${project.tasksTotal}', Icons.check_circle, Colors.green),
                _buildStatCard('Budget Used', '\$${(project.budgetUsed ?? 0).toStringAsFixed(0)}', Icons.monetization_on, Colors.orange),
                _buildStatCard('Status', project.status ?? 'Idea', Icons.flag, _getStatusColor(project.status ?? 'Idea')),
              ],
            ),
            const SizedBox(height: 24),

            // Description
            const Text('📝 Description', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                project.description?.isNotEmpty == true ? project.description! : 'No description provided.',
                style: const TextStyle(fontSize: 15, color: Colors.white70, height: 1.5),
              ),
            ),
            const SizedBox(height: 24),

            // Progress Section
            const Text('📈 Overall Progress', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Completion', style: TextStyle(color: Colors.white70)),
                      Text('${project.progress}%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: project.progress / 100,
                      minHeight: 12,
                      backgroundColor: Colors.white10,
                      valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor(project.status ?? '')),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Tech Stack
            if (project.techStack.isNotEmpty) ...[
              const Text('🛠️ Tech Stack', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: project.techStack.map((tech) => Chip(
                  label: Text(tech, style: const TextStyle(color: Colors.white, fontSize: 12)),
                  backgroundColor: const Color(0xFF7c5fe6).withOpacity(0.2),
                  side: const BorderSide(color: Color(0xFF7c5fe6), width: 1),
                )).toList(),
              ),
              const SizedBox(height: 24),
            ],

            // Timeline
            const Text('⏱️ Timeline', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _buildTimelineItem('Project Created', DateFormat.yMMMd().format(project.createdAt), isFirst: true),
                  _buildTimelineItem('Last Updated', DateFormat.yMMMd().format(project.updatedAt), isLast: true),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(String title, String date, {bool isFirst = false, bool isLast = false}) {
    return Row(
      children: [
        Column(
          children: [
            Container(
              width: 2,
              height: 20,
              color: isFirst ? Colors.transparent : Colors.white24,
            ),
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: const Color(0xFF7c5fe6),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF0A0A0F), width: 2),
              ),
            ),
            Container(
              width: 2,
              height: 20,
              color: isLast ? Colors.transparent : Colors.white24,
            ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              Text(date, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}
