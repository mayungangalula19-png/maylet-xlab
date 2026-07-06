import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/experiment.dart';
import '../services/experiment_service.dart';
import '../../auth/services/auth_service.dart';

class ExperimentsListScreen extends StatefulWidget {
  const ExperimentsListScreen({super.key});

  @override
  State<ExperimentsListScreen> createState() => _ExperimentsListScreenState();
}

class _ExperimentsListScreenState extends State<ExperimentsListScreen> {
  late Future<List<Experiment>> _experimentsFuture;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final userId = context.read<AuthService>().currentUser?.id;
    _experimentsFuture = context.read<ExperimentService>().listExperiments(userId: userId);
  }

  Color _stageColor(String stage) {
    switch (stage) {
      case 'Draft': return Colors.grey;
      case 'Planned': return Colors.blue;
      case 'Approved': return Colors.teal;
      case 'Running': return Colors.orange;
      case 'Data Collection': return Colors.purple;
      case 'Analysis': return Colors.indigo;
      case 'Review': return Colors.amber;
      case 'Validation Ready': return Colors.green;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async { setState(() { _load(); }); },
        child: FutureBuilder<List<Experiment>>(
          future: _experimentsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 16),
                    Text('Error: ${snapshot.error}'),
                    TextButton(onPressed: () => setState(() { _load(); }), child: const Text('Retry')),
                  ],
                ),
              );
            } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.science_outlined, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    const Text('No experiments yet', style: TextStyle(fontSize: 18, color: Colors.grey)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.go('/dashboard/experiments/create'),
                      child: const Text('Create Experiment'),
                    ),
                  ],
                ),
              );
            }

            final experiments = snapshot.data!;
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: experiments.length,
              itemBuilder: (context, index) {
                final exp = experiments[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => context.go('/dashboard/experiments/${exp.id}'),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(exp.title,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _stageColor(exp.pipelineStage).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(exp.pipelineStage,
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: _stageColor(exp.pipelineStage))),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(exp.hypothesis,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: Colors.grey[700])),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.speed, size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text('Confidence: ${(exp.confidenceScore * 100).toStringAsFixed(0)}%',
                                  style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              const Spacer(),
                              Text(DateFormat.yMMMd().format(exp.updatedAt),
                                  style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go('/dashboard/experiments/create'),
        tooltip: 'Create Experiment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
