class ValidationScores {
  final int market;
  final int technical;
  final int financial;
  final int team;
  final int overall;

  ValidationScores({
    required this.market,
    required this.technical,
    required this.financial,
    required this.team,
    required this.overall,
  });

  factory ValidationScores.fromJson(Map<String, dynamic> json) {
    return ValidationScores(
      market: json['market'] as int? ?? 0,
      technical: json['technical'] as int? ?? 0,
      financial: json['financial'] as int? ?? 0,
      team: json['team'] as int? ?? 0,
      overall: json['overall'] as int? ?? 0,
    );
  }
}

class ValidationEvidence {
  final bool marketResearch;
  final bool technicalFeasibility;
  final bool financialProjections;
  final bool teamCapabilities;
  final bool userFeedback;

  ValidationEvidence({
    required this.marketResearch,
    required this.technicalFeasibility,
    required this.financialProjections,
    required this.teamCapabilities,
    required this.userFeedback,
  });

  factory ValidationEvidence.fromJson(Map<String, dynamic> json) {
    return ValidationEvidence(
      marketResearch: json['marketResearch'] as bool? ?? false,
      technicalFeasibility: json['technicalFeasibility'] as bool? ?? false,
      financialProjections: json['financialProjections'] as bool? ?? false,
      teamCapabilities: json['teamCapabilities'] as bool? ?? false,
      userFeedback: json['userFeedback'] as bool? ?? false,
    );
  }
}

class ValidationRecord {
  final String id;
  final String projectId;
  final String? projectName;
  final String? userId;
  final ValidationScores scores;
  final ValidationEvidence evidence;
  final String decision; // 'pass', 'hold', 'fail', 'pending'
  final String? reviewerNotes;
  final String? promotedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  ValidationRecord({
    required this.id,
    required this.projectId,
    this.projectName,
    this.userId,
    required this.scores,
    required this.evidence,
    required this.decision,
    this.reviewerNotes,
    this.promotedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ValidationRecord.fromJson(Map<String, dynamic> json) {
    return ValidationRecord(
      id: json['id'] as String,
      projectId: json['project_id'] as String,
      projectName: json['project_name'] as String?,
      userId: json['user_id'] as String?,
      scores: ValidationScores.fromJson(json['scores'] as Map<String, dynamic>? ?? {}),
      evidence: ValidationEvidence.fromJson(json['evidence'] as Map<String, dynamic>? ?? {}),
      decision: (json['decision'] ?? 'pending') as String,
      reviewerNotes: json['reviewer_notes'] as String?,
      promotedAt: json['promoted_at'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at'] as String) : DateTime.now(),
    );
  }
}
