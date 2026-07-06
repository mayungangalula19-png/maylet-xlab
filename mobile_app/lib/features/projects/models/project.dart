class Project {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final String? sector;
  final String? status;
  final DateTime updatedAt;

  Project({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    this.sector,
    this.status,
    required this.updatedAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      sector: json['sector'] as String?,
      status: json['status'] as String?,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      if (description != null) 'description': description,
      if (sector != null) 'sector': sector,
      if (status != null) 'status': status,
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
