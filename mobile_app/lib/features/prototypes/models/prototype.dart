class Prototype {
  final String id;
  final String? projectId;
  final String? userId;
  final String title;
  final String? name;
  final String? description;
  final String status;
  final String? lifecycleStatus;
  final String version;
  final String? fileUrl;
  final String? thumbnailUrl;
  final int views;
  final int downloads;
  final String? researchId;
  final String? projectName;
  final DateTime createdAt;
  final DateTime updatedAt;

  Prototype({
    required this.id,
    this.projectId,
    this.userId,
    required this.title,
    this.name,
    this.description,
    required this.status,
    this.lifecycleStatus,
    this.version = '0.1.0',
    this.fileUrl,
    this.thumbnailUrl,
    this.views = 0,
    this.downloads = 0,
    this.researchId,
    this.projectName,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Prototype.fromJson(Map<String, dynamic> json) {
    final rawStatus = (json['status'] ?? json['lifecycle_status'] ?? 'draft').toString();
    final rawTitle = (json['name'] ?? json['title'] ?? 'Untitled prototype').toString();
    final created = json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null;
    final updated = json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null;

    return Prototype(
      id: json['id']?.toString() ?? '',
      projectId: json['project_id']?.toString(),
      userId: json['user_id']?.toString(),
      title: rawTitle,
      name: rawTitle,
      description: json['description']?.toString(),
      status: rawStatus,
      lifecycleStatus: json['lifecycle_status']?.toString() ?? rawStatus,
      version: json['version']?.toString() ?? '0.1.0',
      fileUrl: json['file_url']?.toString(),
      thumbnailUrl: json['thumbnail_url']?.toString(),
      views: int.tryParse(json['views']?.toString() ?? '0') ?? 0,
      downloads: int.tryParse(json['downloads']?.toString() ?? '0') ?? 0,
      researchId: json['research_id']?.toString(),
      projectName: json['project_name']?.toString(),
      createdAt: created ?? DateTime.now(),
      updatedAt: updated ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'project_id': projectId,
      'user_id': userId,
      'name': title,
      'description': description,
      'status': status,
      'lifecycle_status': lifecycleStatus ?? status,
      'version': version,
      'file_url': fileUrl,
      'thumbnail_url': thumbnailUrl,
      'views': views,
      'downloads': downloads,
      'research_id': researchId,
    };
  }
}

class PrototypeBuild {
  final String id;
  final String prototypeId;
  final String status;
  final String? outputUrl;
  final String? buildConfig;
  final DateTime startedAt;
  final DateTime? completedAt;

  PrototypeBuild({
    required this.id,
    required this.prototypeId,
    required this.status,
    this.outputUrl,
    this.buildConfig,
    required this.startedAt,
    this.completedAt,
  });

  factory PrototypeBuild.fromJson(Map<String, dynamic> json) {
    return PrototypeBuild(
      id: json['id']?.toString() ?? '',
      prototypeId: json['prototype_id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'queued',
      outputUrl: json['output_url']?.toString(),
      buildConfig: json['build_config']?.toString(),
      startedAt: DateTime.tryParse(json['started_at']?.toString() ?? '') ?? DateTime.now(),
      completedAt: json['completed_at'] != null ? DateTime.tryParse(json['completed_at'].toString()) : null,
    );
  }
}

class PrototypeTestRun {
  final String id;
  final String prototypeId;
  final String name;
  final String verdict;
  final int? score;
  final String? notes;
  final DateTime createdAt;

  PrototypeTestRun({
    required this.id,
    required this.prototypeId,
    required this.name,
    required this.verdict,
    this.score,
    this.notes,
    required this.createdAt,
  });

  factory PrototypeTestRun.fromJson(Map<String, dynamic> json) {
    return PrototypeTestRun(
      id: json['id']?.toString() ?? '',
      prototypeId: json['prototype_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Test run',
      verdict: json['verdict']?.toString() ?? 'pending',
      score: int.tryParse(json['score']?.toString() ?? ''),
      notes: json['notes']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
