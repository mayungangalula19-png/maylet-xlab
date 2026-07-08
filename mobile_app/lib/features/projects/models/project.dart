class Project {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final String? sector;
  final String? status; // 'Idea' | 'Experiment' | 'Prototype' | 'Launched'
  final DateTime updatedAt;
  final DateTime createdAt;
  
  // New fields from web schema
  final int progress;
  final int teamSize;
  final int tasksCompleted;
  final int tasksTotal;
  final double? budgetUsed;
  final double? budgetTotal;
  final List<String> techStack;

  Project({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    this.sector,
    this.status,
    required this.updatedAt,
    required this.createdAt,
    this.progress = 0,
    this.teamSize = 1,
    this.tasksCompleted = 0,
    this.tasksTotal = 0,
    this.budgetUsed,
    this.budgetTotal,
    this.techStack = const [],
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
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      progress: json['progress'] as int? ?? 0,
      teamSize: json['team_size'] as int? ?? 1,
      tasksCompleted: json['tasks_completed'] as int? ?? 0,
      tasksTotal: json['tasks_total'] as int? ?? 0,
      budgetUsed: (json['budget_used'] as num?)?.toDouble(),
      budgetTotal: (json['budget_total'] as num?)?.toDouble(),
      techStack: (json['tech_stack'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
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
      'created_at': createdAt.toIso8601String(),
      'progress': progress,
      'team_size': teamSize,
      'tasks_completed': tasksCompleted,
      'tasks_total': tasksTotal,
      if (budgetUsed != null) 'budget_used': budgetUsed,
      if (budgetTotal != null) 'budget_total': budgetTotal,
      'tech_stack': techStack,
    };
  }
}
