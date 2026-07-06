import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/vault_entry.dart';
import '../services/vault_service.dart';
import '../../auth/services/auth_service.dart';

class VaultListScreen extends StatefulWidget {
  const VaultListScreen({super.key});

  @override
  State<VaultListScreen> createState() => _VaultListScreenState();
}

class _VaultListScreenState extends State<VaultListScreen> {
  late Future<List<VaultEntry>> _entriesFuture;

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  void _loadEntries() {
    final user = context.read<AuthService>().currentUser;
    if (user != null) {
      setState(() {
        _entriesFuture = context.read<VaultService>().listVaultEntries(userId: user.id);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Innovation Vault'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              context.push('/vault/create').then((_) => _loadEntries());
            },
          ),
        ],
      ),
      body: FutureBuilder<List<VaultEntry>>(
        future: _entriesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }

          final entries = snapshot.data ?? [];

          if (entries.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock_outline, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('Your Vault is Empty', style: TextStyle(fontSize: 18, color: Colors.grey)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.push('/vault/create').then((_) => _loadEntries());
                    },
                    child: const Text('Store an Idea'),
                  )
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _loadEntries(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: entries.length,
              itemBuilder: (context, index) {
                final entry = entries[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: entry.isConfidential ? Colors.red.withValues(alpha: 0.2) : Colors.blue.withValues(alpha: 0.2),
                      child: Icon(
                        entry.isConfidential ? Icons.warning : Icons.lock,
                        color: entry.isConfidential ? Colors.red : Colors.blue,
                      ),
                    ),
                    title: Text(entry.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(
                      entry.description ?? 'No description provided.',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: entry.isPublic
                        ? const Icon(Icons.public, size: 16, color: Colors.green)
                        : null,
                    onTap: () {
                      context.push('/vault/${entry.id}').then((_) => _loadEntries());
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
