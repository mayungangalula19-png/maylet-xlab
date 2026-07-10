import 'package:flutter/material.dart';
import '../models/project.dart';
import 'package:intl/intl.dart';

class ProjectCard extends StatelessWidget {
  final Project project;
  final VoidCallback onTap;
  final VoidCallback? onDelete;

  const ProjectCard({super.key, required this.project, required this.onTap, this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 4,
      color: const Color(0xFF1A1A2E), // Dark theme match
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          project.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        if (project.sector != null)
                          Text(
                            project.sector!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (project.status != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor(project.status!).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _getStatusColor(project.status!).withOpacity(0.5),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        project.status!.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: _getStatusColor(project.status!),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                ],
              ),
              if (project.description != null && project.description!.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  project.description!,
                  style: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 13,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 20),
              
              // Progress Bar Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Progress', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  Text('${project.progress}%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: project.progress / 100,
                  backgroundColor: Colors.white10,
                  valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor(project.status ?? 'Idea')),
                  minHeight: 6,
                ),
              ),
              
              const SizedBox(height: 20),
              const Divider(color: Colors.white10),
              const SizedBox(height: 12),
              
              // Bottom Stats Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.people_outline, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text('${project.teamSize}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(width: 16),
                      const Icon(Icons.check_circle_outline, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text('${project.tasksCompleted}/${project.tasksTotal}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                  Row(
                    children: [
                      const Icon(Icons.update, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat('MMM d, y').format(project.updatedAt),
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'launched':
        return Colors.green; // #48bb78
      case 'prototype':
        return const Color(0xFF7c5fe6); // Purple
      case 'experiment':
        return const Color(0xFF2fd4ff); // Cyan
      case 'idea':
        return const Color(0xFFf6c90e); // Yellow
      default:
        return Colors.grey;
    }
  }
}
