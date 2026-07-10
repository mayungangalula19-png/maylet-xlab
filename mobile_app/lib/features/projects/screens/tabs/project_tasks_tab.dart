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
          .select('*, profiles:assigned_to(full_name)')
          .eq('project_id', widget.projectId)
          .order('created_at', ascending: false);
      
      if (mounted) {
        setState(() {
          _tasks = List<Map<String, dynamic>>.from(res);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading tasks: $e')));
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _addTask() async {
    if (_titleController.text.trim().isEmpty) return;
    try {
      await SupabaseConfig.client.from('tasks').insert({
        'project_id': widget.projectId,
        'title': _titleController.text.trim(),
        'description': _descController.text.trim(),
        'status': 'todo',
      });
      _titleController.clear();
      _descController.clear();
      setState(() => _showAddForm = false);
      _fetchTasks();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error adding task: $e')));
    }
  }

  Future<void> _updateStatus(String taskId, String status) async {
    try {
      await SupabaseConfig.client.from('tasks').update({'status': status}).eq('id', taskId);
      _fetchTasks();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error updating task: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF2fd4ff)));
    
    return Column(
      children: [
        if (!_showAddForm)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.add),
                label: const Text('Add Task'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2fd4ff),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => setState(() => _showAddForm = true),
              ),
            ),
          ),
          
        if (_showAddForm)
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('New Task', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                TextField(
                  controller: _titleController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Task Title',
                    hintStyle: const TextStyle(color: Colors.grey),
                    filled: true,
                    fillColor: Colors.black26,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _descController,
                  style: const TextStyle(color: Colors.white),
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'Description (optional)',
                    hintStyle: const TextStyle(color: Colors.grey),
                    filled: true,
                    fillColor: Colors.black26,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => setState(() => _showAddForm = false),
                      child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _addTask,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2fd4ff), foregroundColor: Colors.black),
                      child: const Text('Save'),
                    ),
                  ],
                ),
              ],
            ),
          ),

        Expanded(
          child: _tasks.isEmpty
              ? const Center(child: Text('No tasks found.', style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _tasks.length,
                  itemBuilder: (context, index) {
                    final task = _tasks[index];
                    final status = task['status'] ?? 'todo';
                    final date = task['created_at'] != null ? DateFormat.yMMMd().format(DateTime.parse(task['created_at'])) : '';
                    
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
                          backgroundColor: status == 'done' ? Colors.green.withOpacity(0.2) : const Color(0xFF2fd4ff).withOpacity(0.2),
                          child: Icon(status == 'done' ? Icons.check : Icons.assignment, color: status == 'done' ? Colors.green : const Color(0xFF2fd4ff)),
                        ),
                        title: Text(task['title'] ?? 'Task', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (task['description'] != null && task['description'].toString().isNotEmpty)
                              Padding(padding: const EdgeInsets.only(top: 4), child: Text(task['description'], style: TextStyle(color: Colors.grey.shade400))),
                            const SizedBox(height: 4),
                            Text('Created $date', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                          ],
                        ),
                        trailing: PopupMenuButton<String>(
                          icon: const Icon(Icons.more_vert, color: Colors.grey),
                          color: const Color(0xFF1A1A2E),
                          onSelected: (val) => _updateStatus(task['id'], val),
                          itemBuilder: (context) => [
                            const PopupMenuItem(value: 'todo', child: Text('To Do', style: TextStyle(color: Colors.white))),
                            const PopupMenuItem(value: 'in_progress', child: Text('In Progress', style: TextStyle(color: Colors.blue))),
                            const PopupMenuItem(value: 'done', child: Text('Done', style: TextStyle(color: Colors.green))),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
