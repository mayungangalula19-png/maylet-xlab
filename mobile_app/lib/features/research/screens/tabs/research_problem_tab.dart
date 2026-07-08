import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchProblemTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchProblemTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Problem Definition', style: TextStyle(color: Colors.white)),
    );
  }
}
