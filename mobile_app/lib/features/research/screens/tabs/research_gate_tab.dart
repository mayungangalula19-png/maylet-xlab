import 'package:flutter/material.dart';
import '../../models/research_project.dart';

class ResearchGateTab extends StatelessWidget {
  final ResearchProject project;
  const ResearchGateTab({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Research Gate Approval', style: TextStyle(color: Colors.white)),
    );
  }
}
