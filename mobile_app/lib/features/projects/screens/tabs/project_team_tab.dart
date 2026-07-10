import 'package:flutter/material.dart';
import '../../../../core/supabase_client.dart';
import 'package:intl/intl.dart';

class ProjectTeamTab extends StatefulWidget {
  final String projectId;
  final String projectName;

  const ProjectTeamTab({super.key, required this.projectId, required this.projectName});

  @override
  State<ProjectTeamTab> createState() => _ProjectTeamTabState();
}

class _ProjectTeamTabState extends State<ProjectTeamTab> {
  List<Map<String, dynamic>> _members = [];
  bool _loading = true;
  String? _teamId;

  @override
  void initState() {
    super.initState();
    _fetchTeam();
  }

  Future<void> _fetchTeam() async {
    setState(() => _loading = true);
    try {
      // Find the team associated with this project
      final teamRes = await SupabaseConfig.client
          .from('teams')
          .select('id')
          .eq('project_id', widget.projectId)
          .maybeSingle();

      if (teamRes == null) {
        if (mounted) setState(() { _loading = false; _members = []; });
        return;
      }

      _teamId = teamRes['id'];

      // Fetch team members
      final membersRes = await SupabaseConfig.client
          .from('team_members')
          .select('id, role, user_id, joined_at, profiles(id, full_name, email)')
          .eq('team_id', _teamId!);
      
      if (mounted) {
        setState(() {
          _members = List<Map<String, dynamic>>.from(membersRes).map((m) {
            final profile = m['profiles'] ?? {};
            return {
              'id': m['id'],
              'role': m['role'],
              'full_name': profile['full_name'],
              'email': profile['email'] ?? 'Unknown User',
            };
          }).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading team: $e')));
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF2fd4ff)));
    
    return Column(
      children: [
        if (_teamId == null)
          const Padding(
            padding: EdgeInsets.all(24.0),
            child: Text('No team is currently linked to this project.', style: TextStyle(color: Colors.grey)),
          )
        else ...[
          Expanded(
            child: _members.isEmpty
                ? const Center(child: Text('No members found.', style: TextStyle(color: Colors.grey)))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _members.length,
                    itemBuilder: (context, index) {
                      final member = _members[index];
                      return Card(
                        color: const Color(0xFF1A1A2E),
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(color: Colors.white.withOpacity(0.05)),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFF2fd4ff).withOpacity(0.2),
                            child: Text(
                              member['full_name']?.toString().substring(0, 1).toUpperCase() ?? '?',
                              style: const TextStyle(color: Color(0xFF2fd4ff)),
                            ),
                          ),
                          title: Text(member['full_name'] ?? 'User', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(member['email'] ?? '', style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                              const SizedBox(height: 4),
                              Text(member['role']?.toString().toUpperCase() ?? 'MEMBER', style: const TextStyle(color: Color(0xFF7c5fe6), fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ],
    );
  }
}
