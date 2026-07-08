import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/research_project.dart';
import '../services/research_service.dart';
import 'tabs/research_overview_tab.dart';
import 'tabs/research_forms_tab.dart';
import 'tabs/research_notes_tab.dart';
import 'tabs/research_problem_tab.dart';
import 'tabs/research_findings_tab.dart';
import 'tabs/research_literature_tab.dart';
import 'tabs/research_documents_tab.dart';
import 'tabs/research_maya_tab.dart';
import 'tabs/research_analytics_tab.dart';
import 'tabs/research_impact_tab.dart';
import 'tabs/research_gate_tab.dart';

class ResearchWorkspaceScreen extends StatefulWidget {
  final String projectId;

  const ResearchWorkspaceScreen({super.key, required this.projectId});

  @override
  State<ResearchWorkspaceScreen> createState() => _ResearchWorkspaceScreenState();
}

class _ResearchWorkspaceScreenState extends State<ResearchWorkspaceScreen> {
  late Future<ResearchProject> _projectFuture;

  @override
  void initState() {
    super.initState();
    _projectFuture = context.read<ResearchService>().getProject(widget.projectId);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ResearchProject>(
      future: _projectFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: Color(0xFF0A0A0F),
            body: Center(child: CircularProgressIndicator(color: Color(0xFF2fd4ff))),
          );
        } else if (snapshot.hasError || !snapshot.hasData) {
          return Scaffold(
            backgroundColor: const Color(0xFF0A0A0F),
            appBar: AppBar(backgroundColor: const Color(0xFF0A0A0F)),
            body: Center(child: Text('Error: ${snapshot.error ?? 'Not found'}', style: const TextStyle(color: Colors.red))),
          );
        }

        final project = snapshot.data!;
        return DefaultTabController(
          length: 11,
          child: Scaffold(
            backgroundColor: const Color(0xFF0A0A0F),
            appBar: AppBar(
              backgroundColor: const Color(0xFF0A0A0F),
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => context.pop(),
              ),
              title: Text(
                project.name,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              bottom: const TabBar(
                isScrollable: true,
                indicatorColor: Color(0xFF2fd4ff),
                labelColor: Color(0xFF2fd4ff),
                unselectedLabelColor: Colors.grey,
                tabAlignment: TabAlignment.start,
                tabs: [
                  Tab(text: 'Overview'),
                  Tab(text: 'All Forms'),
                  Tab(text: 'Notes'),
                  Tab(text: 'Problem'),
                  Tab(text: 'Findings'),
                  Tab(text: 'Literature'),
                  Tab(text: 'Documents'),
                  Tab(text: 'MAYA'),
                  Tab(text: 'Analytics'),
                  Tab(text: 'Impact'),
                  Tab(text: 'Gate'),
                ],
              ),
            ),
            body: TabBarView(
              children: [
                ResearchOverviewTab(project: project),
                ResearchFormsTab(project: project),
                ResearchNotesTab(project: project),
                ResearchProblemTab(project: project),
                ResearchFindingsTab(project: project),
                ResearchLiteratureTab(project: project),
                ResearchDocumentsTab(project: project),
                ResearchMayaTab(project: project),
                ResearchAnalyticsTab(project: project),
                ResearchImpactTab(project: project),
                ResearchGateTab(project: project),
              ],
            ),
          ),
        );
      },
    );
  }
}
