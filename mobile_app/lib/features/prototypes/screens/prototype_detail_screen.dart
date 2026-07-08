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
  final List<String> _statuses = ['draft', 'building', 'testing', 'success', 'archived'];
  late Future<_PrototypeDetailBundle> _bundleFuture;

  @override
  void initState() {
    super.initState();
    _loadBundle();
  }

  void _loadBundle() {
    final service = context.read<PrototypeService>();
    _bundleFuture = Future.wait([
      service.getPrototype(widget.prototypeId),
      service.listBuilds(widget.prototypeId),
      service.listTestRuns(widget.prototypeId),
    ]).then((value) => _PrototypeDetailBundle(
          prototype: value[0] as Prototype,
          builds: value[1] as List<PrototypeBuild>,
          testRuns: value[2] as List<PrototypeTestRun>,
        ));
    setState(() {});
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'success':
      case 'complete':
        return Colors.green;
      case 'testing':
        return Colors.purple;
      case 'building':
        return Colors.orange;
      case 'draft':
        return Colors.blueGrey;
      case 'archived':
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    try {
      await context.read<PrototypeService>().updatePrototypeStatus(widget.prototypeId, newStatus);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status updated')));
        _loadBundle();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _showTestRunDialog() async {
    final nameController = TextEditingController();
    final notesController = TextEditingController();
    final scoreController = TextEditingController();
    final prototypeService = context.read<PrototypeService>();
    String verdict = 'pass';

    final created = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add test run'),
        content: SizedBox(
          width: 320,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Test name'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: verdict,
                decoration: const InputDecoration(labelText: 'Verdict'),
                items: const [
                  DropdownMenuItem(value: 'pass', child: Text('Pass')),
                  DropdownMenuItem(value: 'fail', child: Text('Fail')),
                  DropdownMenuItem(value: 'pending', child: Text('Pending')),
                ],
                onChanged: (value) => verdict = value ?? 'pass',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: scoreController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Score (optional)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesController,
                minLines: 2,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Notes'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (created == true) {
      try {
        await prototypeService.createTestRun(
          prototypeId: widget.prototypeId,
          name: nameController.text.trim().isEmpty ? 'Prototype review' : nameController.text.trim(),
          verdict: verdict,
          score: int.tryParse(scoreController.text.trim()),
          notes: notesController.text.trim().isEmpty ? null : notesController.text.trim(),
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Test run saved')));
        _loadBundle();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Prototype workspace'),
        actions: [
          IconButton(icon: const Icon(Icons.fact_check), onPressed: _showTestRunDialog),
        ],
      ),
      body: FutureBuilder<_PrototypeDetailBundle>(
        future: _bundleFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }

          final bundle = snapshot.data!;
          final prototype = bundle.prototype;
          final statusColor = _getStatusColor(prototype.status);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Chip(
                            label: Text(prototype.status.toUpperCase()),
                            backgroundColor: statusColor,
                            labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 10),
                          Text('v${prototype.version}', style: Theme.of(context).textTheme.titleMedium),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        prototype.title,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      if (prototype.description != null && prototype.description!.isNotEmpty)
                        Text(prototype.description!, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _MetricCard(label: 'Views', value: prototype.views.toString()),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MetricCard(label: 'Downloads', value: prototype.downloads.toString()),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Prototype details', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        if (prototype.projectName != null) _InfoRow(label: 'Project', value: prototype.projectName!),
                        if (prototype.researchId != null) _InfoRow(label: 'Research link', value: prototype.researchId!),
                        if (prototype.fileUrl != null && prototype.fileUrl!.isNotEmpty) _InfoRow(label: 'File URL', value: prototype.fileUrl!),
                        _InfoRow(label: 'Created', value: prototype.createdAt.toLocal().toString().split('.').first),
                        _InfoRow(label: 'Updated', value: prototype.updatedAt.toLocal().toString().split('.').first),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Update lifecycle', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _statuses
                      .map(
                        (status) => ChoiceChip(
                          label: Text(status.toUpperCase()),
                          selected: prototype.status == status,
                          onSelected: (selected) {
                            if (selected && prototype.status != status) {
                              _updateStatus(status);
                            }
                          },
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 16),
                Text('Recent builds', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (bundle.builds.isEmpty)
                  const Text('No build activity in Supabase yet.')
                else
                  ...bundle.builds.map((build) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Icon(Icons.build_circle, color: _getStatusColor(build.status)),
                          title: Text(build.status.toUpperCase()),
                          subtitle: Text(build.startedAt.toLocal().toString().split('.').first),
                        ),
                      )),
                const SizedBox(height: 16),
                Text('Test runs', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (bundle.testRuns.isEmpty)
                  const Text('No test runs recorded yet.')
                else
                  ...bundle.testRuns.map((run) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(run.name),
                          subtitle: Text(run.notes ?? 'No notes'),
                          trailing: Chip(label: Text(run.verdict.toUpperCase())),
                        ),
                      )),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _PrototypeDetailBundle {
  final Prototype prototype;
  final List<PrototypeBuild> builds;
  final List<PrototypeTestRun> testRuns;

  _PrototypeDetailBundle({required this.prototype, required this.builds, required this.testRuns});
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;

  const _MetricCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 6),
            Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 96, child: Text('$label:', style: const TextStyle(fontWeight: FontWeight.w600))),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
