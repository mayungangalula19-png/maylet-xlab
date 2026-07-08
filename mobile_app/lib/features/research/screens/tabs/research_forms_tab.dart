import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchFormsTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchFormsTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Forms', style: TextStyle(color: Colors.white)),
    );
  }
}
