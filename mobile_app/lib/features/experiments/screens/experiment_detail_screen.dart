import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/experiment.dart';
import '../services/experiment_service.dart';

// Tabs
import 'tabs/experiment_overview_tab.dart';
import 'tabs/experiment_hypothesis_tab.dart';
import 'tabs/experiment_design_tab.dart';
import 'tabs/experiment_data_tab.dart';
import 'tabs/experiment_results_tab.dart';
import 'tabs/experiment_integrations_tab.dart';

class ExperimentDetailScreen extends StatefulWidget {
  final String experimentId;

  const ExperimentDetailScreen({super.key, required this.experimentId});

  @override
  State<ExperimentDetailScreen> createState() => _ExperimentDetailScreenState();
}

class _ExperimentDetailScreenState extends State<ExperimentDetailScreen> {
  late Future<Experiment> _experimentFuture;

  @override
  void initState() {
    super.initState();
    _loadExperiment();
  }

  void _loadExperiment() {
    setState(() {
      _experimentFuture = context.read<ExperimentService>().getExperiment(widget.experimentId);
    });
  }

  Color _stageColor(String stage) {
    switch (stage) {
      case 'Draft': return Colors.grey;
      case 'Planned': return Colors.blue;
      case 'Approved': return Colors.teal;
      case 'Running': return Colors.orange;
      case 'Data Collection': return Colors.purple;
      case 'Analysis': return Colors.indigo;
      case 'Review': return Colors.amber;
      case 'Validation Ready': return Colors.green;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 6, // Overview, Hypothesis, Design, Data, Results, Integrations
      child: Scaffold(
        backgroundColor: const Color(0xFF0A0A0F),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0A0A0F),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.pop(),
          ),
          title: FutureBuilder<Experiment>(
            future: _experimentFuture,
            builder: (context, snapshot) {
              if (snapshot.hasData) {
                final exp = snapshot.data!;
                return Row(
                  children: [
                    Expanded(
                      child: Text(
                        exp.title, 
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      margin: const EdgeInsets.only(left: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _stageColor(exp.pipelineStage).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _stageColor(exp.pipelineStage).withOpacity(0.5)),
                      ),
                      child: Text(
                        exp.pipelineStage.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: _stageColor(exp.pipelineStage),
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
            indicatorColor: Color(0xFF2fd4ff),
            labelColor: Color(0xFF2fd4ff),
            unselectedLabelColor: Colors.grey,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Hypothesis'),
              Tab(text: 'Test Design'),
              Tab(text: 'Data Collection'),
              Tab(text: 'Results'),
              Tab(text: 'Integrations'),
            ],
          ),
        ),
        body: FutureBuilder<Experiment>(
          future: _experimentFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator(color: Color(0xFF2fd4ff)));
            } else if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
            } else if (!snapshot.hasData) {
              return const Center(child: Text('Experiment not found', style: TextStyle(color: Colors.grey)));
            }

            final exp = snapshot.data!;
            return TabBarView(
              children: [
                ExperimentOverviewTab(experiment: exp),
                ExperimentHypothesisTab(experiment: exp),
                ExperimentDesignTab(experiment: exp),
                ExperimentDataTab(experiment: exp),
                ExperimentResultsTab(experiment: exp),
                ExperimentIntegrationsTab(experimentId: exp.id),
              ],
            );
          },
        ),
      ),
    );
  }
}
