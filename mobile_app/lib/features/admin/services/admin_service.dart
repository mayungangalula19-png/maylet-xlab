import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';

class AdminService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<Map<String, dynamic>> getSystemStats() async {
    // Perform parallel count queries to emulate the dashboard data
    final results = await Future.wait([
      _client.from('profiles').select('id, status, role'),
      _client.from('projects').select('id, progress'),
      _client.from('funding_pitches').select('id, amount'),
      _client.from('experiments').select('id'),
      _client.from('prototypes').select('id'),
      _client.from('vault_items').select('id'),
      _client.from('payments').select('id, amount, created_at'),
    ]);

    final users = results[0] as List<dynamic>;
    final projects = results[1] as List<dynamic>;
    final pitches = results[2] as List<dynamic>;
    final experiments = results[3] as List<dynamic>;
    final prototypes = results[4] as List<dynamic>;
    final vaultItems = results[5] as List<dynamic>;
    final orders = results[6] as List<dynamic>;

    // Calc active users
    int activeUsers = 0;
    int innovators = 0;
    int mentors = 0;
    int investors = 0;
    for (var u in users) {
      if (u['status'] == 'active') activeUsers++;
      final role = u['role']?.toString().toLowerCase();
      if (role == 'innovator') innovators++;
      if (role == 'mentor') mentors++;
      if (role == 'investor') investors++;
    }

    // Calc avg progress
    double totalProgress = 0;
    for (var p in projects) {
      totalProgress += (p['progress'] as num?)?.toDouble() ?? 0;
    }
    double avgProgress = projects.isEmpty ? 0 : totalProgress / projects.length;

    // Calc revenue
    double totalRevenue = 0;
    double monthlyRevenue = 0;
    final now = DateTime.now();
    for (var o in orders) {
      final amount = (o['amount'] as num?)?.toDouble() ?? 0;
      totalRevenue += amount;
      final created = DateTime.tryParse(o['created_at'].toString());
      if (created != null && now.difference(created).inDays <= 30) {
        monthlyRevenue += amount;
      }
    }

    return {
      'totalUsers': users.length,
      'activeUsers': activeUsers,
      'newUsersThisMonth': 0, // Placeholder
      'totalProjects': projects.length,
      'projectsThisMonth': 0, // Placeholder
      'totalExperiments': experiments.length,
      'totalPrototypes': prototypes.length,
      'totalVaultItems': vaultItems.length,
      'totalFundingPitches': pitches.length,
      'fundingPitchesThisMonth': 0, // Placeholder
      'totalRevenue': totalRevenue,
      'monthlyRevenue': monthlyRevenue,
      'totalMentors': mentors,
      'totalInvestors': investors,
      'totalInnovators': innovators,
      'avgProjectProgress': avgProgress.round(),
    };
  }

  Future<List<Map<String, dynamic>>> getRecentActivity() async {
    try {
      final data = await _client
          .from('audit_logs')
          .select('*')
          .order('created_at', ascending: false)
          .limit(10);
      return List<Map<String, dynamic>>.from(data);
    } catch (_) {
      // Return empty if audit_logs table does not exist
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getUsers() async {
    final response = await _client
        .from('profiles')
        .select('*')
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> updateUserStatus(String userId, String status) async {
    await _client.from('profiles').update({'status': status}).eq('id', userId);
  }

  Future<List<Map<String, dynamic>>> getProjects() async {
    final response = await _client
        .from('projects')
        .select('*')
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> updateProjectStatus(String projectId, String status) async {
    await _client.from('projects').update({'status': status}).eq('id', projectId);
  }
}
