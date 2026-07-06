class VaultEntry {
  final String id;
  final String userId;
  final String title;
  final String? description;
  final String? content;
  final List<String> tags;
  final bool isConfidential;
  final bool isPublic;
  final DateTime createdAt;
  final DateTime updatedAt;

  VaultEntry({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.content,
    required this.tags,
    required this.isConfidential,
    required this.isPublic,
    required this.createdAt,
    required this.updatedAt,
  });

  factory VaultEntry.fromJson(Map<String, dynamic> json) {
    return VaultEntry(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      content: json['content'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ?? [],
      isConfidential: json['is_confidential'] as bool? ?? false,
      isPublic: json['is_public'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'content': content,
      'tags': tags,
      'is_confidential': isConfidential,
      'is_public': isPublic,
    };
  }
}
