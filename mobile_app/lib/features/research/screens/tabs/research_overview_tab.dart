import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchOverviewTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchOverviewTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Overview', style: TextStyle(color: Colors.white)),
    );
  }
}
