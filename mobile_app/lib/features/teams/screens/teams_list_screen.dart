import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/team.dart';
import '../services/team_service.dart';
import '../../auth/services/auth_service.dart';

class TeamsListScreen extends StatefulWidget {
  const TeamsListScreen({super.key});

  @override
  State<TeamsListScreen> createState() => _TeamsListScreenState();
}

class _TeamsListScreenState extends State<TeamsListScreen> {
  late Future<List<Team>> _teamsFuture;

  @override
  void initState() {
    super.initState();
    _loadTeams();
  }

  void _loadTeams() {
    final userId = context.read<AuthService>().currentUser?.id;
    if (userId != null) {
      _teamsFuture = context.read<TeamService>().fetchUserTeams(userId);
    } else {
      _teamsFuture = Future.value([]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() { _loadTeams(); });
        },
        child: FutureBuilder<List<Team>>(
          future: _teamsFuture,
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
                    Text('Error loading teams: ${snapshot.error}'),
                    TextButton(
                      onPressed: () => setState(() { _loadTeams(); }),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.group_off, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    const Text('No teams yet', style: TextStyle(fontSize: 18, color: Colors.grey)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.go('/dashboard/teams/create'),
                      child: const Text('Create a Team'),
                    ),
                  ],
                ),
              );
            }

            final teams = snapshot.data!;
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: teams.length,
              itemBuilder: (context, index) {
                final team = teams[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    leading: CircleAvatar(
                      backgroundColor: Colors.green.withOpacity(0.15),
                      child: const Icon(Icons.group, color: Colors.green),
                    ),
                    title: Text(team.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (team.description != null && team.description!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(team.description!, maxLines: 2, overflow: TextOverflow.ellipsis),
                          ),
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            'Created ${DateFormat.yMMMd().format(team.createdAt)}',
                            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                          ),
                        ),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/dashboard/teams/${team.id}'),
                  ),
                );
              },
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go('/dashboard/teams/create'),
        tooltip: 'Create Team',
        child: const Icon(Icons.add),
      ),
    );
  }
}
