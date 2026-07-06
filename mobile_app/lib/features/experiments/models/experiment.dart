class Experiment {
  final String id;
  final String title;
  final String hypothesis;
  final String type;
  final String status;
  final String pipelineStage;
  final String? projectId;
  final String? projectName;
  final String? results;
  final String? findings;
  final double confidenceScore;
  final DateTime createdAt;
  final DateTime updatedAt;

  Experiment({
    required this.id,
    required this.title,
    required this.hypothesis,
    required this.type,
    required this.status,
    required this.pipelineStage,
    this.projectId,
    this.projectName,
    this.results,
    this.findings,
    required this.confidenceScore,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Experiment.fromJson(Map<String, dynamic> json) {
    return Experiment(
      id: json['id'] as String,
      title: (json['title'] ?? 'Untitled') as String,
      hypothesis: (json['hypothesis'] ?? '') as String,
      type: (json['type'] ?? 'general') as String,
      status: (json['status'] ?? 'draft') as String,
      pipelineStage: (json['pipeline_stage'] ?? 'Draft') as String,
      projectId: json['project_id'] as String?,
      projectName: json['project_name'] as String?,
      results: json['results'] as String?,
      findings: json['findings'] as String?,
      confidenceScore: (json['confidence_score'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
    );
  }
}
