import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/prototype.dart';
import '../services/prototype_service.dart';
import '../../auth/services/auth_service.dart';

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
      case 'concept': return Colors.grey;
      case 'designing': return Colors.blue;
      case 'building': return Colors.orange;
      case 'testing': return Colors.purple;
      case 'complete': return Colors.green;
      default: return Colors.grey;
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
              context.push('/prototypes/create').then((_) => _loadPrototypes());
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
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.build, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('No prototypes found', style: TextStyle(fontSize: 18, color: Colors.grey)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.push('/prototypes/create').then((_) => _loadPrototypes());
                    },
                    child: const Text('Create Prototype'),
                  )
                ],
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
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getStatusColor(prototype.status).withValues(alpha: 0.2),
                      child: Icon(Icons.build, color: _getStatusColor(prototype.status)),
                    ),
                    title: Text(prototype.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(prototype.status.toUpperCase()),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      context.push('/prototypes/${prototype.id}').then((_) => _loadPrototypes());
                    },
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
