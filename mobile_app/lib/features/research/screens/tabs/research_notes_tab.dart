import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchNotesTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchNotesTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Notes', style: TextStyle(color: Colors.white)),
    );
  }
}
