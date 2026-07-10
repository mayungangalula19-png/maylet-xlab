import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/experiment.dart';
import '../services/experiment_service.dart';
import '../../auth/services/auth_service.dart';

class ExperimentsListScreen extends StatefulWidget {
  const ExperimentsListScreen({super.key});

  @override
  State<ExperimentsListScreen> createState() => _ExperimentsListScreenState();
}

class _ExperimentsListScreenState extends State<ExperimentsListScreen> {
  List<Experiment> _experiments = [];
  bool _loading = true;
  String _searchQuery = '';
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final userId = context.read<AuthService>().currentUser?.id;
    if (userId != null) {
      try {
        final exps = await context.read<ExperimentService>().listExperiments(userId: userId);
        setState(() {
          _experiments = exps;
          _loading = false;
        });
      } catch (e) {
        setState(() => _loading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading experiments: $e')));
        }
      }
    } else {
      setState(() => _loading = false);
    }
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

  List<Experiment> get _filteredExperiments {
    return _experiments.where((e) {
      final matchesSearch = _searchQuery.isEmpty || 
                            e.title.toLowerCase().contains(_searchQuery.toLowerCase()) || 
                            e.hypothesis.toLowerCase().contains(_searchQuery.toLowerCase());
      
      bool matchesStatus = true;
      if (_statusFilter == 'active') {
        matchesStatus = ['Running', 'Data Collection', 'Analysis'].contains(e.pipelineStage);
      } else if (_statusFilter == 'completed') {
        matchesStatus = ['Review', 'Validation Ready'].contains(e.pipelineStage);
      } else if (_statusFilter == 'planned') {
        matchesStatus = ['Draft', 'Planned', 'Approved'].contains(e.pipelineStage);
      }

      return matchesSearch && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F), // Dark gradient match
      body: RefreshIndicator(
        onRefresh: _load,
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
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Science Dashboard',
                                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Manage your scientific experiments',
                                style: TextStyle(color: Colors.grey, fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => context.go('/dashboard/experiments/create'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2fd4ff),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('New Experiment', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Search Bar
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Search experiments...',
                        hintStyle: const TextStyle(color: Colors.grey),
                        prefixIcon: const Icon(Icons.search, color: Color(0xFF2fd4ff)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
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
                          _buildFilterTab('active', 'Active'),
                          _buildFilterTab('planned', 'Planned'),
                          _buildFilterTab('completed', 'Completed'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
            
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
            else if (_experiments.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.science_outlined, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('No experiments yet', style: TextStyle(fontSize: 18, color: Colors.grey)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => context.go('/dashboard/experiments/create'),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2fd4ff)),
                        child: const Text('Design Experiment', style: TextStyle(color: Colors.black)),
                      ),
                    ],
                  ),
                ),
              )
            else if (_filteredExperiments.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Text('No matching experiments', style: TextStyle(fontSize: 16, color: Colors.grey)),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final exp = _filteredExperiments[index];
                      return _buildExperimentCard(exp);
                    },
                    childCount: _filteredExperiments.length,
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
            color: isActive ? const Color(0xFF2fd4ff).withOpacity(0.2) : Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isActive ? const Color(0xFF2fd4ff) : Colors.transparent),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isActive ? const Color(0xFF2fd4ff) : Colors.white70,
              fontSize: 14,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExperimentCard(Experiment exp) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 4,
      color: const Color(0xFF1A1A2E), // Dark theme match
      child: InkWell(
        onTap: () => context.go('/dashboard/experiments/${exp.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exp.title,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        if (exp.projectName != null)
                          Text(
                            exp.projectName!,
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: _stageColor(exp.pipelineStage).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: _stageColor(exp.pipelineStage).withOpacity(0.5),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      exp.pipelineStage.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: _stageColor(exp.pipelineStage),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                exp.hypothesis,
                style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.4),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 20),
              
              // Progress Bar Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Confidence Score', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  Text('${(exp.confidenceScore * 100).toStringAsFixed(0)}%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: exp.confidenceScore,
                  backgroundColor: Colors.white10,
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2fd4ff)),
                  minHeight: 6,
                ),
              ),
              
              const SizedBox(height: 20),
              const Divider(color: Colors.white10),
              const SizedBox(height: 12),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.science, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(exp.type, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                  Row(
                    children: [
                      const Icon(Icons.update, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat('MMM d, y').format(exp.updatedAt),
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
