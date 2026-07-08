import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchImpactTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchImpactTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Impact', style: TextStyle(color: Colors.white)),
    );
  }
}
