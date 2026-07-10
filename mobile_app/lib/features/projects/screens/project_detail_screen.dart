import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/project.dart';
import '../services/project_service.dart';

// Tabs
import 'tabs/project_overview_tab.dart';
import 'tabs/project_tasks_tab.dart';
import 'tabs/project_team_tab.dart';
import 'documents_screen.dart'; // Using the existing one for Documents
import 'tabs/project_ai_lab_tab.dart';
import 'tabs/project_funding_tab.dart';
import 'tabs/project_settings_tab.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectId;

  const ProjectDetailScreen({super.key, required this.projectId});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  late Future<Project> _projectFuture;

  @override
  void initState() {
    super.initState();
    _refreshProject();
  }

  void _refreshProject() {
    setState(() {
      _projectFuture = context.read<ProjectService>().getProject(widget.projectId);
    });
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'launched': return Colors.green;
      case 'prototype': return const Color(0xFF7c5fe6);
      case 'experiment': return const Color(0xFF2fd4ff);
      case 'idea': return const Color(0xFFf6c90e);
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 7, // Overview, Tasks, Team, Documents, AI Lab, Funding, Settings
      child: Scaffold(
        backgroundColor: const Color(0xFF0A0A0F),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0A0A0F),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.pop(),
          ),
          title: FutureBuilder<Project>(
            future: _projectFuture,
            builder: (context, snapshot) {
              if (snapshot.hasData) {
                return Row(
                  children: [
                    Expanded(
                      child: Text(
                        snapshot.data!.name, 
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (snapshot.data!.status != null)
                      Container(
                        margin: const EdgeInsets.only(left: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStatusColor(snapshot.data!.status!).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _getStatusColor(snapshot.data!.status!).withOpacity(0.5)),
                        ),
                        child: Text(
                          snapshot.data!.status!.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: _getStatusColor(snapshot.data!.status!),
                          ),
                        ),
                      ),
                  ],
                );
              }
              return const Text('Loading...', style: TextStyle(color: Colors.white));
            },
          ),
          bottom: const TabBar(
            isScrollable: true,
            indicatorColor: Color(0xFF7c5fe6),
            labelColor: Color(0xFF7c5fe6),
            unselectedLabelColor: Colors.grey,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Tasks'),
              Tab(text: 'Team'),
              Tab(text: 'Documents'),
              Tab(text: 'AI Lab'),
              Tab(text: 'Funding'),
              Tab(text: 'Settings'),
            ],
          ),
        ),
        body: FutureBuilder<Project>(
          future: _projectFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
            } else if (!snapshot.hasData) {
              return const Center(child: Text('Project not found', style: TextStyle(color: Colors.grey)));
            }

            final project = snapshot.data!;
            return TabBarView(
              children: [
                ProjectOverviewTab(project: project, onRefresh: _refreshProject),
                ProjectTasksTab(projectId: project.id),
                ProjectTeamTab(projectId: project.id, projectName: project.name),
                DocumentsScreen(projectId: project.id),
                ProjectAILabTab(projectId: project.id, projectName: project.name),
                ProjectFundingTab(projectId: project.id),
                ProjectSettingsTab(project: project),
              ],
            );
          },
        ),
      ),
    );
  }
}
