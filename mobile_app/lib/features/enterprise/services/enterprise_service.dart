import 'package:flutter/foundation.dart';
import '../../../core/supabase_client.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class EnterpriseMetrics {
  final int projectCount;
  final int departmentCount;
  final int activeResearch;
  final int activePrototypes;
  final int experimentsRunning;
  final int validationsPending;
  final int fundingSecured;
  final int commercializedProducts;

  EnterpriseMetrics({
    required this.projectCount,
    required this.departmentCount,
    required this.activeResearch,
    required this.activePrototypes,
    required this.experimentsRunning,
    required this.validationsPending,
    required this.fundingSecured,
    required this.commercializedProducts,
  });

  factory EnterpriseMetrics.empty() {
    return EnterpriseMetrics(
      projectCount: 0,
      departmentCount: 0,
      activeResearch: 0,
      activePrototypes: 0,
      experimentsRunning: 0,
      validationsPending: 0,
      fundingSecured: 0,
      commercializedProducts: 0,
    );
  }
}

class DepartmentMetric {
  final String id;
  final int projectCount;
  final int researchCount;
  final int memberCount;
  final int activePrototypes;
  final int avgProgress;

  DepartmentMetric({
    required this.id,
    required this.projectCount,
    required this.researchCount,
    required this.memberCount,
    required this.activePrototypes,
    required this.avgProgress,
  });
}

class EnterpriseService extends ChangeNotifier {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<int> _count(String table, [String? eqField, String? eqValue]) async {
    try {
      var query = _client.from(table).select('id');
      if (eqField != null && eqValue != null) {
        query = query.eq(eqField, eqValue);
      }
      final res = await query.limit(1000);
      return res.length;
    } catch (e) {
      debugPrint('Error counting $table: $e');
      return 0;
    }
  }

  Future<EnterpriseMetrics> loadMetrics() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return EnterpriseMetrics.empty();

    try {
      final futures = await Future.wait([
        _count('projects'),
        _count('research_assets'),
        _count('prototypes', 'status', 'active'),
        _count('experiments', 'status', 'running'),
        _count('validations', 'status', 'pending'),
        _count('funding', 'status', 'secured'),
        _count('projects', 'status', 'Launched'),
      ]);

      return EnterpriseMetrics(
        projectCount: futures[0],
        departmentCount: 4, // Hardcoded typical departments for now
        activeResearch: futures[1],
        activePrototypes: futures[2],
        experimentsRunning: futures[3],
        validationsPending: futures[4],
        fundingSecured: futures[5],
        commercializedProducts: futures[6],
      );
    } catch (e) {
      debugPrint('Error loading enterprise metrics: $e');
      return EnterpriseMetrics.empty();
    }
  }

  Future<List<DepartmentMetric>> loadDepartments() async {
    // For mobile parity, aggregate projects by sector manually
    try {
      final projects = await _client.from('projects').select('sector, progress');
      final Map<String, List<int>> sectorProgress = {};
      
      for (final p in projects) {
        final sector = _mapSectorToDept(p['sector']?.toString() ?? '');
        sectorProgress.putIfAbsent(sector, () => []).add((p['progress'] ?? 0) as int);
      }

      final List<DepartmentMetric> depts = [];
      sectorProgress.forEach((sector, progresses) {
        final avg = progresses.isNotEmpty ? (progresses.reduce((a, b) => a + b) / progresses.length).round() : 0;
        depts.add(DepartmentMetric(
          id: sector,
          projectCount: progresses.length,
          researchCount: 0, // Simplified for mobile UI
          memberCount: 0,
          activePrototypes: 0,
          avgProgress: avg,
        ));
      });

      depts.sort((a, b) => b.projectCount.compareTo(a.projectCount));
      return depts;
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> loadTeams() async {
    try {
      return await _client.from('teams').select('*').order('created_at', ascending: false);
    } catch (e) {
      return [];
    }
  }

  String _mapSectorToDept(String sector) {
    final s = sector.toLowerCase();
    if (s.contains('agri') || s.contains('farm')) return 'Agriculture';
    if (s.contains('health') || s.contains('med')) return 'Health';
    if (s.contains('energy') || s.contains('power')) return 'Energy';
    if (s.contains('manufact') || s.contains('industrial')) return 'Manufacturing';
    if (s.contains('ict') || s.contains('software') || s.contains('digital')) return 'ICT';
    if (s.contains('business') || s.contains('finance') || s.contains('market')) return 'Business';
    if (s.contains('research') || s.contains('edu')) return 'Research';
    return 'Engineering';
  }
}
