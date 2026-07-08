import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchDocumentsTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchDocumentsTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Documents', style: TextStyle(color: Colors.white)),
    );
  }
}
