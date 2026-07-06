import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../models/project.dart';
import '../services/project_service.dart';
import 'workflow_engine_screen.dart';
import 'documents_screen.dart';
import 'research_validation_screen.dart';

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
    _projectFuture = context.read<ProjectService>().getProject(widget.projectId);
  }

  Future<void> _deleteProject(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Project'),
        content: const Text('Are you sure you want to delete this project? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true), 
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true && context.mounted) {
      try {
        await context.read<ProjectService>().deleteProject(widget.projectId);
        if (context.mounted) {
          context.pop(); // Go back to list
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting project: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Innovation Editor'),
          actions: [
            IconButton(
              icon: const Icon(Icons.settings),
              onPressed: () {},
              tooltip: 'Project Settings',
            ),
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () => _deleteProject(context),
              tooltip: 'Delete Project',
            ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Workflow'),
              Tab(text: 'Validation'),
              Tab(text: 'Documents'),
              Tab(text: 'Experiments'),
            ],
          ),
        ),
        body: FutureBuilder<Project>(
          future: _projectFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              return Center(child: Text('Error loading project: ${snapshot.error}'));
            } else if (!snapshot.hasData) {
              return const Center(child: Text('Project not found'));
            }

            final project = snapshot.data!;
            return TabBarView(
              children: [
                _buildOverviewTab(project),
                WorkflowEngineScreen(projectId: project.id),
                ResearchValidationScreen(projectId: project.id),
                DocumentsScreen(projectId: project.id),
                const Center(child: Text('Experiments Module (Coming soon)')),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildOverviewTab(Project project) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            project.name,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (project.status != null)
                Chip(
                  label: Text(project.status!.toUpperCase()),
                  color: WidgetStatePropertyAll(Colors.blue.withValues(alpha: 0.1)),
                  labelStyle: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                ),
              const SizedBox(width: 8),
              if (project.sector != null)
                Chip(
                  avatar: const Icon(Icons.category, size: 16),
                  label: Text(project.sector!),
                ),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Executive Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            project.description?.isNotEmpty == true ? project.description! : 'No description provided.',
            style: const TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 32),
          const Divider(),
          const SizedBox(height: 16),
          Text(
            'Last Updated: ${DateFormat.yMMMMEEEEd().format(project.updatedAt)}',
            style: const TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
