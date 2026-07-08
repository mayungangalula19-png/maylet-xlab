import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/project.dart';
import '../services/project_service.dart';
import '../widgets/project_card.dart';
import '../../auth/services/auth_service.dart';

class ProjectsListScreen extends StatefulWidget {
  const ProjectsListScreen({super.key});

  @override
  State<ProjectsListScreen> createState() => _ProjectsListScreenState();
}

class _ProjectsListScreenState extends State<ProjectsListScreen> {
  List<Project> _projects = [];
  bool _loading = true;
  String _searchQuery = '';
  String _statusFilter = 'all'; // 'all', 'active', 'completed', 'hold'

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    setState(() => _loading = true);
    final userId = context.read<AuthService>().currentUser?.id;
    if (userId != null) {
      try {
        final projects = await context.read<ProjectService>().fetchUserProjects(userId);
        setState(() {
          _projects = projects;
          _loading = false;
        });
      } catch (e) {
        setState(() => _loading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading projects: $e')));
        }
      }
    } else {
      setState(() => _loading = false);
    }
  }

  List<Project> get _filteredProjects {
    return _projects.where((p) {
      final matchesSearch = _searchQuery.isEmpty || 
                            p.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
                            (p.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
      
      bool matchesStatus = true;
      if (_statusFilter == 'active') {
        matchesStatus = p.status == 'Experiment' || p.status == 'Prototype';
      } else if (_statusFilter == 'completed') {
        matchesStatus = p.status == 'Launched' || p.progress == 100;
      } else if (_statusFilter == 'hold') {
        matchesStatus = p.status == 'Idea';
      }

      return matchesSearch && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F), // Dark gradient match
      body: RefreshIndicator(
        onRefresh: _loadProjects,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Innovation Command Center',
                              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Portfolio operations and live metrics',
                              style: TextStyle(color: Colors.grey, fontSize: 14),
                            ),
                          ],
                        ),
                        ElevatedButton(
                          onPressed: () => context.go('/dashboard/projects/create'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF7c5fe6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('New Project', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Search Bar
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Search projects...',
                        hintStyle: const TextStyle(color: Colors.grey),
                        prefixIcon: const Icon(Icons.search, color: Color(0xFF667eea)),
                        filled: true,
                        fillColor: Colors.white.withValues(alpha: 0.05),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(40),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      ),
                      style: const TextStyle(color: Colors.white),
                      onChanged: (val) => setState(() => _searchQuery = val),
                    ),
                    const SizedBox(height: 16),
                    
                    // Filter Tabs
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterTab('all', 'All'),
                          _buildFilterTab('active', 'In Progress'),
                          _buildFilterTab('completed', 'Completed'),
                          _buildFilterTab('hold', 'On Hold'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Portfolio Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Portfolio',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${_filteredProjects.length}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            // Projects List
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
            else if (_projects.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.folder_open, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('You have no projects yet.', style: TextStyle(fontSize: 16, color: Colors.grey)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => context.go('/dashboard/projects/create'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7c5fe6),
                        ),
                        child: const Text('Create Project', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              )
            else if (_filteredProjects.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Text('No matching projects', style: TextStyle(fontSize: 16, color: Colors.grey)),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final project = _filteredProjects[index];
                      return ProjectCard(
                        project: project,
                        onTap: () => context.go('/dashboard/projects/${project.id}'),
                      );
                    },
                    childCount: _filteredProjects.length,
                  ),
                ),
              ),
              
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterTab(String id, String label) {
    final isActive = _statusFilter == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: InkWell(
        onTap: () => setState(() => _statusFilter = id),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF7c5fe6) : Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isActive ? Colors.white : Colors.white70,
              fontSize: 14,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}
