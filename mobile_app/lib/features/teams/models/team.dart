class Team {
  final String id;
  final String ownerId;
  final String name;
  final String? description;
  final String? projectId;
  final DateTime createdAt;

  Team({
    required this.id,
    required this.ownerId,
    required this.name,
    this.description,
    this.projectId,
    required this.createdAt,
  });

  factory Team.fromJson(Map<String, dynamic> json) {
    return Team(
      id: json['id'] as String,
      ownerId: json['owner_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      projectId: json['project_id'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'owner_id': ownerId,
      'name': name,
      if (description != null) 'description': description,
      if (projectId != null) 'project_id': projectId,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
