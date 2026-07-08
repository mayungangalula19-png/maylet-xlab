import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchLiteratureTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchLiteratureTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Literature', style: TextStyle(color: Colors.white)),
    );
  }
}
