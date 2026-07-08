import '../../../core/supabase_client.dart';
import '../models/enterprise_document.dart';

class MayaDocInsight {
  final String summary;
  final List<String> keyFindings;
  final List<String> insights;
  final List<String> importantFlags;
  final List<String> nextActions;

  MayaDocInsight({
    required this.summary,
    required this.keyFindings,
    required this.insights,
    required this.importantFlags,
    required this.nextActions,
  });
}

class DashboardMetrics {
  final int total;
  final int research;
  final int prototype;
  final int experiment;
  final int validation;
  final int funding;
  final int commercialization;
  final int project;
  final int storageBytes;

  DashboardMetrics({
    this.total = 0,
    this.research = 0,
    this.prototype = 0,
    this.experiment = 0,
    this.validation = 0,
    this.funding = 0,
    this.commercialization = 0,
    this.project = 0,
    this.storageBytes = 0,
  });
}

class DocumentService {
  Future<List<EnterpriseDocument>> listDocuments(String userId) async {
    // In a real app we'd fetch from research_documents and join with projects
    // For now we'll fetch from research_documents. Assuming we have some data there.
    try {
      final res = await SupabaseConfig.client
          .from('research_documents')
          .select('*, projects!inner(name, sector, user_id), profiles!inner(full_name)')
          .eq('projects.user_id', userId)
          .order('created_at', ascending: false);

      return (res as List).map((json) {
        final Map<String, dynamic> mutableJson = Map<String, dynamic>.from(json);
        mutableJson['project_name'] = json['projects']?['name'];
        mutableJson['project_sector'] = json['projects']?['sector'];
        mutableJson['author_name'] = json['profiles']?['full_name'];
        return EnterpriseDocument.fromJson(mutableJson);
      }).toList();
    } catch (e) {
      // Return empty list if table doesn't exist or query fails
      return [];
    }
  }

  DashboardMetrics calculateMetrics(List<EnterpriseDocument> docs) {
    int research = 0, prototype = 0, experiment = 0, validation = 0;
    int funding = 0, commercialization = 0, project = 0, bytes = 0;

    for (var d in docs) {
      bytes += d.sizeBytes ?? 0;
      switch (d.module) {
        case 'research': research++; break;
        case 'prototype': prototype++; break;
        case 'experiment': experiment++; break;
        case 'validation': validation++; break;
        case 'funding': funding++; break;
        case 'commercialization': commercialization++; break;
        default: project++; break;
      }
    }

    return DashboardMetrics(
      total: docs.length,
      research: research,
      prototype: prototype,
      experiment: experiment,
      validation: validation,
      funding: funding,
      commercialization: commercialization,
      project: project,
      storageBytes: bytes,
    );
  }

  String _formatModule(String module) {
    if (module.isEmpty) return 'Project';
    return module[0].toUpperCase() + module.substring(1);
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  MayaDocInsight generateMayaInsight(EnterpriseDocument doc, List<EnterpriseDocument> allDocs) {
    final sameProject = allDocs.where((d) => d.projectId == doc.projectId && d.id != doc.id).length;
    
    // Summary
    final moduleName = _formatModule(doc.module);
    String summary = '${doc.name} supports the $moduleName phase for ${doc.projectName}. ';
    if (doc.description != null && doc.description!.trim().isNotEmpty) {
      summary += doc.description!.trim();
    } else {
      final reviewType = doc.module == 'validation' ? 'gate review' : 'pipeline reviews';
      summary += 'This ${doc.fileKind.toUpperCase()} artifact should be referenced during $reviewType.';
    }

    // Key Findings
    List<String> keyFindings = [
      'Linked to ${doc.projectName} (${doc.projectSector}) in the $moduleName module.',
      'Version ${doc.version} uploaded on ${doc.createdAt.toString().split(' ')[0]}.',
    ];
    if (doc.module == 'research') { keyFindings.add('Supports problem evidence and literature traceability.'); }
    if (doc.module == 'validation') { keyFindings.add('Eligible as validation gate supporting material.'); }
    if (doc.module == 'funding') { keyFindings.add('May be cited in investor diligence and pitch workflows.'); }

    // Insights
    List<String> insights = [
      '$sameProject related file(s) exist for this project.',
      doc.archived ? 'Document is archived — restore before external sharing.' : 'Active document — suitable for workspace linking.',
      'Storage footprint: ${_formatBytes(doc.sizeBytes ?? 0)}.',
    ];

    // Important Flags
    List<String> flags = [];
    if (doc.fileUrl.isEmpty) { flags.add('Missing file URL — re-upload required.'); }
    if (doc.module == 'funding' && doc.fileKind == 'pdf') { flags.add('Investor-facing PDF — ensure version matches live pitch.'); }
    if (doc.module == 'validation' && (doc.description == null || doc.description!.isEmpty)) { flags.add('Add description for auditor context.'); }
    if (flags.isEmpty) { flags.add('No critical issues detected.'); }

    // Next Actions
    Map<String, String> routes = {
      'project': 'Open project detail and link tasks.',
      'research': 'Attach to research workspace findings.',
      'prototype': 'Reference in prototype build notes.',
      'experiment': 'Cite in experiment results.',
      'validation': 'Include in validation gate reviewer notes.',
      'funding': 'Attach to funding pitch workspace.',
      'commercialization': 'Add to GTM launch packet.',
    };
    
    List<String> actions = [
      routes[doc.module] ?? 'Open associated module.',
      'Tag collaborators and set version before investor share.',
      doc.module == 'validation' ? 'Run validation gate when evidence set is complete.' : 'Advance to next pipeline stage when ready.',
    ];

    return MayaDocInsight(
      summary: summary,
      keyFindings: keyFindings,
      insights: insights,
      importantFlags: flags,
      nextActions: actions,
    );
  }
}
