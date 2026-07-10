import 'package:flutter/material.dart';

class ResearchValidationScreen extends StatelessWidget {
  final String projectId;
  const ResearchValidationScreen({super.key, required this.projectId});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Research Gate', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            TextButton(onPressed: () {}, child: const Text('Add Research')),
          ],
        ),
        const SizedBox(height: 16),
        _validationCard(
          context,
          'Market Size Analysis',
          'TAM/SAM/SOM breakdown with competitor analysis.',
          'Validated',
          Colors.green,
        ),
        _validationCard(
          context,
          'User Interviews',
          'Feedback from 20 potential customers on the core problem.',
          'Pending',
          Colors.orange,
        ),
        _validationCard(
          context,
          'Technical Feasibility',
          'Architecture review for scalability.',
          'In Review',
          Colors.blue,
        ),
      ],
    );
  }

  Widget _validationCard(BuildContext context, String title, String description, String status, Color statusColor) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(status.toUpperCase(), style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(description, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7))),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: status == 'Validated' ? 1.0 : status == 'In Review' ? 0.6 : 0.2,
              backgroundColor: Colors.grey.withOpacity(0.2),
              color: statusColor,
            ),
          ],
        ),
      ),
    );
  }
}
