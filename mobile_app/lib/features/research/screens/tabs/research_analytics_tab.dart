import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchAnalyticsTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchAnalyticsTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Analytics', style: TextStyle(color: Colors.white)),
    );
  }
}
