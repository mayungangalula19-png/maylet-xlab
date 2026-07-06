import 'package:flutter/material.dart';

class WorkflowEngineScreen extends StatelessWidget {
  final String projectId;
  const WorkflowEngineScreen({super.key, required this.projectId});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Innovation Lifecycle', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        _workflowStage(context, '1. Idea Validation', 'Completed', Colors.green),
        _workflowStage(context, '2. Experimentation', 'In Progress', Colors.blue),
        _workflowStage(context, '3. Prototyping', 'Pending', Colors.grey),
        _workflowStage(context, '4. Funding & Pitch', 'Locked', Colors.grey),
        _workflowStage(context, '5. Business Launch', 'Locked', Colors.grey),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: () {},
          child: const Text('Complete Current Stage'),
        ),
      ],
    );
  }

  Widget _workflowStage(BuildContext context, String title, String status, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(Icons.radio_button_checked, color: color),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(status.toUpperCase(), style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }
}
