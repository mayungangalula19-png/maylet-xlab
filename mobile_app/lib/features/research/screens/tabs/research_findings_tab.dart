import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchFindingsTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchFindingsTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Findings', style: TextStyle(color: Colors.white)),
    );
  }
}
