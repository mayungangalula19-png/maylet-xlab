import 'package:flutter/material.dart';
import '../../../../core/supabase_client.dart';
import 'package:intl/intl.dart';

class ProjectTasksTab extends StatefulWidget {
  final String projectId;

  const ProjectTasksTab({super.key, required this.projectId});

  @override
  State<ProjectTasksTab> createState() => _ProjectTasksTabState();
}

class _ProjectTasksTabState extends State<ProjectTasksTab> {
  List<Map<String, dynamic>> _tasks = [];
  bool _loading = true;
  bool _showAddForm = false;
  
  final _titleController = TextEditingController();
  final _descController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchTasks();
  }

  Future<void> _fetchTasks() async {
    setState(() => _loading = true);
    try {
      final res = await SupabaseConfig.client
          .from('tasks')
          .select('*')
          .eq('project_id', widget.projectId)
          .order('created_at', ascending: false);
      setState(() {
        _tasks = List<Map<String, dynamic>>.from(res);
        _loading = false;
      });
    } catch (_) {
      // Demo data if table doesn't exist
      setState(() {
        _tasks = [
          {'id': '1', 'title': 'Market Research', 'description': 'Analyze top 3 competitors', 'status': 'done', 'due_date': DateTime.now().subtract(const Duration(days: 2)).toIso8601String()},
          {'id': '2', 'title': 'Wireframing', 'description': 'Create initial screens', 'status': 'in_progress', 'due_date': DateTime.now().add(const Duration(days: 2)).toIso8601String()},
          {'id': '3', 'title': 'Pitch Deck', 'description': 'Draft investor slides', 'status': 'todo', 'due_date': DateTime.now().add(const Duration(days: 5)).toIso8601String()},
        ];
        _loading = false;
      });
    }
  }

  Future<void> _updateStatus(String taskId, String currentStatus) async {
    final newStatus = currentStatus == 'done' ? 'todo' :
                      currentStatus == 'in_progress' ? 'done' : 'in_progress';
    try {
      await SupabaseConfig.client.from('tasks').update({'status': newStatus}).eq('id', taskId);
    } catch (_) {} // Ignored for demo mode
    _fetchTasks();
  }

  Future<void> _deleteTask(String taskId) async {
    try {
      await SupabaseConfig.client.from('tasks').delete().eq('id', taskId);
    } catch (_) {} // Ignored for demo mode
    _fetchTasks();
  }

  Future<void> _addTask() async {
    if (_titleController.text.isEmpty) return;
    try {
      await SupabaseConfig.client.from('tasks').insert({
        'project_id': widget.projectId,
        'title': _titleController.text,
        'description': _descController.text,
        'status': 'todo',
      });
    } catch (_) {} // Ignored for demo mode
    
    _titleController.clear();
    _descController.clear();
    setState(() => _showAddForm = false);
    _fetchTasks();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final todo = _tasks.where((t) => t['status'] == 'todo').toList();
    final inProgress = _tasks.where((t) => t['status'] == 'in_progress').toList();
    final done = _tasks.where((t) => t['status'] == 'done').toList();

    return RefreshIndicator(
      onRefresh: _fetchTasks,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Project Tasks', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ElevatedButton.icon(
                  onPressed: () => setState(() => _showAddForm = !_showAddForm),
                  icon: Icon(_showAddForm ? Icons.close : Icons.add, size: 18),
                  label: Text(_showAddForm ? 'Cancel' : 'Add Task'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7c5fe6),
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            if (_showAddForm) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    TextField(
                      controller: _titleController,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Task Title', labelStyle: TextStyle(color: Colors.grey)),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _descController,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Description', labelStyle: TextStyle(color: Colors.grey)),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _addTask,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6)),
                        child: const Text('Save Task', style: TextStyle(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            _buildKanbanColumn('To Do', todo, Colors.orange),
            _buildKanbanColumn('In Progress', inProgress, Colors.blue),
            _buildKanbanColumn('Done', done, Colors.green),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildKanbanColumn(String title, List<Map<String, dynamic>> columnTasks, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text('$title (${columnTasks.length})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
        ),
        if (columnTasks.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.02), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10, style: BorderStyle.solid)),
            child: const Text('No tasks', style: TextStyle(color: Colors.white54, fontStyle: FontStyle.italic), textAlign: TextAlign.center),
          )
        else
          ...columnTasks.map((task) => _buildTaskCard(task)),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildTaskCard(Map<String, dynamic> task) {
    final status = task['status'] as String;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(task['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
              IconButton(icon: const Icon(Icons.close, color: Colors.grey, size: 20), onPressed: () => _deleteTask(task['id'].toString())),
            ],
          ),
          if (task['description'] != null && task['description'].toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(task['description'], style: const TextStyle(color: Colors.white70, fontSize: 14)),
            ),
          if (task['due_date'] != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text('Due: ${DateFormat.yMMMd().format(DateTime.parse(task['due_date']))}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => _updateStatus(task['id'].toString(), status),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: status == 'done' ? Colors.orange : status == 'in_progress' ? Colors.green : Colors.blue),
                foregroundColor: status == 'done' ? Colors.orange : status == 'in_progress' ? Colors.green : Colors.blue,
              ),
              child: Text(
                status == 'done' ? 'Reopen →' :
                status == 'in_progress' ? 'Complete →' : 'Start Progress →',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
