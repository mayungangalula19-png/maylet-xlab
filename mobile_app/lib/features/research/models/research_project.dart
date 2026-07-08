class ResearchProject {
  final String id;
  final String name;
  final String? description;
  final int progress;
  final String status;
  final DateTime createdAt;

  ResearchProject({
    required this.id,
    required this.name,
    this.description,
    required this.progress,
    required this.status,
    required this.createdAt,
  });

  factory ResearchProject.fromJson(Map<String, dynamic> json) {
    return ResearchProject(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      progress: (json['progress'] as num?)?.toInt() ?? 0,
      status: (json['status'] ?? 'Idea') as String,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now(),
    );
  }
}
