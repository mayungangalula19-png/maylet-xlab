import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../models/prototype.dart';
import '../services/prototype_service.dart';

class PrototypesListScreen extends StatefulWidget {
  const PrototypesListScreen({super.key});

  @override
  State<PrototypesListScreen> createState() => _PrototypesListScreenState();
}

class _PrototypesListScreenState extends State<PrototypesListScreen> {
  late Future<List<Prototype>> _prototypesFuture;

  @override
  void initState() {
    super.initState();
    _loadPrototypes();
  }

  void _loadPrototypes() {
    final user = context.read<AuthService>().currentUser;
    if (user != null) {
      setState(() {
        _prototypesFuture = context.read<PrototypeService>().listPrototypes(userId: user.id);
      });
    }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Prototypes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              context.push('/dashboard/prototypes/create').then((_) => _loadPrototypes());
            },
          ),
        ],
      ),
      body: FutureBuilder<List<Prototype>>(
        future: _prototypesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }

          final prototypes = snapshot.data ?? [];

          if (prototypes.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.build_circle_outlined, size: 64, color: Colors.grey),
                    const SizedBox(height: 12),
                    const Text('No prototypes found', style: TextStyle(fontSize: 18, color: Colors.grey)),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      icon: const Icon(Icons.add),
                      onPressed: () {
                        context.push('/dashboard/prototypes/create').then((_) => _loadPrototypes());
                      },
                      label: const Text('Create prototype'),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _loadPrototypes(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: prototypes.length,
              itemBuilder: (context, index) {
                final prototype = prototypes[index];
                final statusColor = _getStatusColor(prototype.status);
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () {
                      context.push('/dashboard/prototypes/${prototype.id}').then((_) => _loadPrototypes());
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: statusColor.withValues(alpha: 0.16),
                                child: Icon(Icons.build, color: statusColor),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      prototype.title,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'v${prototype.version} · ${prototype.status.toUpperCase()}',
                                      style: TextStyle(color: statusColor, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (prototype.description != null && prototype.description!.isNotEmpty)
                            Text(
                              prototype.description!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              if (prototype.projectName != null)
                                Chip(label: Text(prototype.projectName!)),
                              Chip(label: Text('Views ${prototype.views}')),
                              Chip(label: Text('Downloads ${prototype.downloads}')),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
