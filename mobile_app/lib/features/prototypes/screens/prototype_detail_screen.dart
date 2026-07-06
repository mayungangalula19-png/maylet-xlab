import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/prototype.dart';
import '../services/prototype_service.dart';

class PrototypeDetailScreen extends StatefulWidget {
  final String prototypeId;

  const PrototypeDetailScreen({super.key, required this.prototypeId});

  @override
  State<PrototypeDetailScreen> createState() => _PrototypeDetailScreenState();
}

class _PrototypeDetailScreenState extends State<PrototypeDetailScreen> {
  final List<String> _statuses = ['concept', 'designing', 'building', 'testing', 'complete'];
  bool _isUpdating = false;

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'concept': return Colors.grey;
      case 'designing': return Colors.blue;
      case 'building': return Colors.orange;
      case 'testing': return Colors.purple;
      case 'complete': return Colors.green;
      default: return Colors.grey;
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isUpdating = true);
    try {
      await context.read<PrototypeService>().updatePrototypeStatus(widget.prototypeId, newStatus);
      if (mounted) {
        setState(() {}); // Trigger rebuild to refetch
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status updated')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isUpdating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Prototype Detail')),
      body: FutureBuilder<Prototype>(
        future: context.read<PrototypeService>().getPrototype(widget.prototypeId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting || _isUpdating) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }

          final prototype = snapshot.data!;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(prototype.status),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        prototype.status.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  prototype.title,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Created: ${prototype.createdAt.toLocal().toString().split('.')[0]}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                
                if (prototype.description != null && prototype.description!.isNotEmpty) ...[
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(prototype.description!),
                  const SizedBox(height: 24),
                ],

                Text(
                  'Update Status',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _statuses.map((status) => ChoiceChip(
                    label: Text(status.toUpperCase()),
                    selected: prototype.status == status,
                    onSelected: (selected) {
                      if (selected && prototype.status != status) {
                        _updateStatus(status);
                      }
                    },
                  )).toList(),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
