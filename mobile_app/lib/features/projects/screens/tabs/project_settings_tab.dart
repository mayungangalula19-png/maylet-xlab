import 'package:flutter/material.dart';
import '../../../../core/supabase_client.dart';
import '../../models/project.dart';
import 'package:go_router/go_router.dart';

class ProjectSettingsTab extends StatefulWidget {
  final Project project;

  const ProjectSettingsTab({super.key, required this.project});

  @override
  State<ProjectSettingsTab> createState() => _ProjectSettingsTabState();
}

class _ProjectSettingsTabState extends State<ProjectSettingsTab> {
  late TextEditingController _nameController;
  late TextEditingController _descController;
  late TextEditingController _sectorController;
  late String _status;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.project.name);
    _descController = TextEditingController(text: widget.project.description ?? '');
    _sectorController = TextEditingController(text: widget.project.sector ?? '');
    _status = widget.project.status ?? 'Idea';
  }

  Future<void> _saveProject() async {
    setState(() => _saving = true);
    try {
      await SupabaseConfig.client.from('projects').update({
        'name': _nameController.text,
        'description': _descController.text,
        'sector': _sectorController.text,
        'status': _status,
      }).eq('id', widget.project.id);
      
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Project updated successfully', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red));
    }
    setState(() => _saving = false);
  }

  Future<void> _deleteProject() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Delete Project', style: TextStyle(color: Colors.white)),
        content: const Text('Are you sure you want to delete this project? This action cannot be undone.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          TextButton(
            onPressed: () => Navigator.pop(context, true), 
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      try {
        await SupabaseConfig.client.from('projects').delete().eq('id', widget.project.id);
        if (mounted) context.pop(); // Go back to list
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error deleting: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Project Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 24),
          
          TextField(
            controller: _nameController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Project Name',
              labelStyle: const TextStyle(color: Colors.grey),
              filled: true,
              fillColor: const Color(0xFF1A1A2E),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),
          
          TextField(
            controller: _descController,
            style: const TextStyle(color: Colors.white),
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'Description',
              labelStyle: const TextStyle(color: Colors.grey),
              filled: true,
              fillColor: const Color(0xFF1A1A2E),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),
          
          TextField(
            controller: _sectorController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Sector',
              labelStyle: const TextStyle(color: Colors.grey),
              filled: true,
              fillColor: const Color(0xFF1A1A2E),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),
          
          DropdownButtonFormField<String>(
            initialValue: _status,
            dropdownColor: const Color(0xFF1A1A2E),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Status',
              labelStyle: const TextStyle(color: Colors.grey),
              filled: true,
              fillColor: const Color(0xFF1A1A2E),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            items: const [
              DropdownMenuItem(value: 'Idea', child: Text('Idea (Hold)')),
              DropdownMenuItem(value: 'Experiment', child: Text('Experiment')),
              DropdownMenuItem(value: 'Prototype', child: Text('Prototype')),
              DropdownMenuItem(value: 'Launched', child: Text('Launched (Completed)')),
            ],
            onChanged: (val) => setState(() => _status = val!),
          ),
          const SizedBox(height: 32),
          
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _saving ? null : _saveProject,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7c5fe6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _saving 
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Save Changes', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
          
          const SizedBox(height: 48),
          const Divider(color: Colors.white10),
          const SizedBox(height: 24),
          
          const Text('Danger Zone', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.redAccent)),
          const SizedBox(height: 8),
          const Text('Once you delete a project, there is no going back. Please be certain.', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 16),
          
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton(
              onPressed: _deleteProject,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.redAccent),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Delete Project', style: TextStyle(color: Colors.redAccent, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
