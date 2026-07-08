import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchMayaTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchMayaTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('MAYA Insights', style: TextStyle(color: Colors.white)),
    );
  }
}
