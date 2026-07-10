import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/supabase_client.dart';
import '../../projects/models/project.dart';
import '../../auth/services/auth_service.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  bool _isLoading = false;
  List<Project> _projectResults = [];

  void _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _projectResults = []);
      return;
    }

    final userId = context.read<AuthService>().currentUser?.id;
    if (userId == null) return;

    setState(() => _isLoading = true);
    
    try {
      final response = await SupabaseConfig.client
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .ilike('name', '%$query%')
          .limit(10);
          
      setState(() {
        _projectResults = (response as List<dynamic>)
            .map((e) => Project.fromJson(e as Map<String, dynamic>))
            .toList();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Search error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchCtrl,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Search projects...',
            border: InputBorder.none,
            suffixIcon: IconButton(
              icon: const Icon(Icons.clear),
              onPressed: () {
                _searchCtrl.clear();
                _performSearch('');
              },
            ),
          ),
          onChanged: _performSearch,
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _projectResults.isEmpty && _searchCtrl.text.isNotEmpty
          ? const Center(child: Text('No results found.'))
          : ListView.builder(
              itemCount: _projectResults.length,
              itemBuilder: (context, index) {
                final proj = _projectResults[index];
                return ListTile(
                  leading: const Icon(Icons.folder, color: Colors.blue),
                  title: Text(proj.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(proj.sector ?? 'Unspecified sector'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: scheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(proj.status ?? 'idea', style: TextStyle(fontSize: 10, color: scheme.primary)),
                  ),
                  onTap: () {
                    context.push('/projects/${proj.id}');
                  },
                );
              },
            ),
    );
  }
}
