import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/supabase_client.dart';
import 'package:intl/intl.dart';

class TeamDetailScreen extends StatefulWidget {
  final String teamId;

  const TeamDetailScreen({super.key, required this.teamId});

  @override
  State<TeamDetailScreen> createState() => _TeamDetailScreenState();
}

class _TeamDetailScreenState extends State<TeamDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _team;
  List<Map<String, dynamic>> _members = [];
  List<Map<String, dynamic>> _projects = [];

  @override
  void initState() {
    super.initState();
    _fetchTeamData();
  }

  Future<void> _fetchTeamData() async {
    setState(() => _isLoading = true);
    try {
      final teamRes = await SupabaseConfig.client
          .from('teams')
          .select()
          .eq('id', widget.teamId)
          .single();
          
      final membersRes = await SupabaseConfig.client
          .from('team_members')
          .select('id, role, profiles(full_name, email)')
          .eq('team_id', widget.teamId);

      // Projects might use owner_id instead of team_id if it's tied to user, but let's assume team_id if available.
      // If team_id column doesn't exist, this might fail, so we catch it safely.
      List<dynamic> projectsRes = [];
      try {
         projectsRes = await SupabaseConfig.client
            .from('projects')
            .select()
            .eq('team_id', widget.teamId);
      } catch (_) {
         // fallback if projects doesn't have team_id
      }

      if (mounted) {
        setState(() {
          _team = teamRes;
          _members = List<Map<String, dynamic>>.from(membersRes);
          _projects = List<Map<String, dynamic>>.from(projectsRes);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading team: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    if (_team == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Team Details')),
        body: const Center(child: Text('Team not found.')),
      );
    }

    final name = _team!['name'] ?? 'Team';
    final desc = _team!['description'] ?? 'No description';
    final created = _team!['created_at'] != null ? DateFormat.yMMMd().format(DateTime.parse(_team!['created_at'])) : '';

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: Text(name),
        backgroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Description', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 8),
                  Text(desc, style: const TextStyle(color: Colors.white, fontSize: 16)),
                  const SizedBox(height: 16),
                  Text('Created $created', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Team Members', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            if (_members.isEmpty) const Text('No members found', style: TextStyle(color: Colors.grey)),
            ..._members.map((m) {
              final profile = m['profiles'] ?? {};
              return Card(
                color: const Color(0xFF1A1A2E),
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFF7c5fe6).withOpacity(0.2),
                    child: Text(profile['full_name']?.substring(0,1)?.toUpperCase() ?? '?', style: const TextStyle(color: Color(0xFF7c5fe6))),
                  ),
                  title: Text(profile['full_name'] ?? 'Unknown', style: const TextStyle(color: Colors.white)),
                  subtitle: Text(m['role'] ?? 'Member', style: const TextStyle(color: Colors.grey)),
                ),
              );
            }),
            const SizedBox(height: 24),
            const Text('Projects', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            if (_projects.isEmpty) const Text('No projects linked', style: TextStyle(color: Colors.grey)),
            ..._projects.map((p) {
              return Card(
                color: const Color(0xFF1A1A2E),
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: const Icon(Icons.folder, color: Color(0xFF2fd4ff)),
                  title: Text(p['name'] ?? 'Project', style: const TextStyle(color: Colors.white)),
                  subtitle: Text(p['sector'] ?? 'General', style: const TextStyle(color: Colors.grey)),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: () => context.push('/dashboard/projects/${p['id']}'),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
