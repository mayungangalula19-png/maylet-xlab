import 'package:flutter/material.dart';
import '../services/admin_service.dart';
import 'package:intl/intl.dart';

class ProjectsManagementScreen extends StatefulWidget {
  const ProjectsManagementScreen({super.key});

  @override
  State<ProjectsManagementScreen> createState() => _ProjectsManagementScreenState();
}

class _ProjectsManagementScreenState extends State<ProjectsManagementScreen> {
  final AdminService _adminService = AdminService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _projects = [];
  List<Map<String, dynamic>> _filteredProjects = [];

  String _searchQuery = '';
  String _filterStatus = 'All';

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    setState(() => _isLoading = true);
    try {
      final projects = await _adminService.getProjects();
      if (mounted) {
        setState(() {
          _projects = projects;
          _applyFilters();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading projects: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredProjects = _projects.where((p) {
        final name = (p['name'] ?? '').toString().toLowerCase();
        final status = (p['status'] ?? '').toString().toLowerCase();

        final matchesSearch = name.contains(_searchQuery);
        final matchesStatus = _filterStatus == 'All' || status == _filterStatus.toLowerCase();

        return matchesSearch && matchesStatus;
      }).toList();
    });
  }

  Future<void> _updateStatus(Map<String, dynamic> project, String newStatus) async {
    try {
      await _adminService.updateProjectStatus(project['id'], newStatus);
      setState(() {
        project['status'] = newStatus;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Project marked as $newStatus')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error updating status: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('Projects Management', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _loadProjects),
        ],
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)))
                : _filteredProjects.isEmpty
                    ? const Center(child: Text('No projects found.', style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filteredProjects.length,
                        itemBuilder: (context, index) {
                          final project = _filteredProjects[index];
                          return _buildProjectCard(project);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      color: const Color(0xFF1A1A2E),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search by project name...',
              hintStyle: const TextStyle(color: Colors.grey),
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            onChanged: (val) {
              _searchQuery = val.toLowerCase();
              _applyFilters();
            },
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All', 'Idea', 'Validation', 'Funding', 'Active', 'Suspended'].map((status) {
                final isSelected = _filterStatus == status;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(status),
                    selected: isSelected,
                    onSelected: (val) {
                      setState(() => _filterStatus = status);
                      _applyFilters();
                    },
                    backgroundColor: Colors.white.withOpacity(0.05),
                    selectedColor: const Color(0xFF7c5fe6).withOpacity(0.3),
                    labelStyle: TextStyle(color: isSelected ? const Color(0xFF7c5fe6) : Colors.white),
                    checkmarkColor: const Color(0xFF7c5fe6),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectCard(Map<String, dynamic> project) {
    final name = project['name'] ?? 'Untitled Project';
    final status = project['status'] ?? 'idea';
    final ownerName = project['profiles'] != null ? project['profiles']['full_name'] : 'Unknown Owner';
    final sector = project['sector'] ?? 'General';
    final pct = (project['progress'] as num?)?.toDouble() ?? 0;
    final date = project['created_at'] != null ? DateFormat.yMMMd().format(DateTime.parse(project['created_at'])) : 'Unknown';

    return Card(
      color: const Color(0xFF1A1A2E),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.white.withOpacity(0.05))),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFF2fd4ff).withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.rocket_launch, color: Color(0xFF2fd4ff)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
                      Text('By $ownerName', style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
                      const SizedBox(height: 4),
                      Text('Created $date', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, color: Colors.grey),
                  color: const Color(0xFF1A1A2E),
                  onSelected: (val) {
                    if (val == 'suspend') _updateStatus(project, 'suspended');
                    if (val == 'activate') _updateStatus(project, 'active');
                  },
                  itemBuilder: (context) => [
                    if (status != 'suspended')
                      const PopupMenuItem(value: 'suspend', child: Text('Suspend Project', style: TextStyle(color: Colors.red))),
                    if (status == 'suspended')
                      const PopupMenuItem(value: 'activate', child: Text('Activate Project', style: TextStyle(color: Colors.green))),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: LinearProgressIndicator(
                    value: pct / 100,
                    backgroundColor: Colors.white.withOpacity(0.1),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2fd4ff)),
                  ),
                ),
                const SizedBox(width: 12),
                Text('${pct.toStringAsFixed(0)}%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _badge(sector.toUpperCase(), Colors.purple),
                _badge(status.toUpperCase(), status == 'suspended' ? Colors.red : status == 'active' ? Colors.green : Colors.blue),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
    );
  }
}
