import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/funding_pitch.dart';
import '../services/funding_service.dart';

class PitchDetailScreen extends StatefulWidget {
  final String pitchId;

  const PitchDetailScreen({super.key, required this.pitchId});

  @override
  State<PitchDetailScreen> createState() => _PitchDetailScreenState();
}

class _PitchDetailScreenState extends State<PitchDetailScreen> {
  final List<String> _statuses = ['draft', 'published', 'funded', 'closed'];
  bool _isUpdating = false;

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'draft': return Colors.grey;
      case 'published': return Colors.blue;
      case 'funded': return Colors.green;
      case 'closed': return Colors.red;
      default: return Colors.grey;
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isUpdating = true);
    try {
      await context.read<FundingService>().updatePitchStatus(widget.pitchId, newStatus);
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
      appBar: AppBar(title: const Text('Pitch Details')),
      body: FutureBuilder<FundingPitch>(
        future: context.read<FundingService>().getPitch(widget.pitchId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting || _isUpdating) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }

          final pitch = snapshot.data!;
          final progress = pitch.targetAmount > 0 
              ? (pitch.raisedAmount / pitch.targetAmount).clamp(0.0, 1.0) 
              : 0.0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(pitch.status),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        pitch.status.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Text(
                      pitch.stage.toUpperCase(),
                      style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  pitch.title,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                
                // Funding Progress
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Text(
                          '\$${pitch.raisedAmount.toStringAsFixed(0)}',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.green, fontWeight: FontWeight.bold),
                        ),
                        const Text('raised of', style: TextStyle(color: Colors.grey)),
                        Text(
                          '\$${pitch.targetAmount.toStringAsFixed(0)} target',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        LinearProgressIndicator(
                          value: progress,
                          minHeight: 12,
                          backgroundColor: Colors.grey.withOpacity(0.2),
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                if (pitch.summary != null && pitch.summary!.isNotEmpty) ...[
                  Text(
                    'Executive Summary',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(pitch.summary!),
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
                    selected: pitch.status == status,
                    onSelected: (selected) {
                      if (selected && pitch.status != status) {
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
