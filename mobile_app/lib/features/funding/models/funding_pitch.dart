class FundingPitch {
  final String id;
  final String projectId;
  final String title;
  final String? summary;
  final String? deckUrl;
  final String stage;
  final double targetAmount;
  final double raisedAmount;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  FundingPitch({
    required this.id,
    required this.projectId,
    required this.title,
    this.summary,
    this.deckUrl,
    required this.stage,
    required this.targetAmount,
    required this.raisedAmount,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FundingPitch.fromJson(Map<String, dynamic> json) {
    return FundingPitch(
      id: json['id'] as String,
      projectId: json['project_id'] as String,
      title: json['title'] as String,
      summary: json['summary'] as String?,
      deckUrl: json['deck_url'] as String?,
      stage: json['stage'] as String? ?? 'pre-seed',
      targetAmount: (json['target_amount'] as num?)?.toDouble() ?? 0.0,
      raisedAmount: (json['raised_amount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'draft',
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'project_id': projectId,
      'title': title,
      'summary': summary,
      'deck_url': deckUrl,
      'stage': stage,
      'target_amount': targetAmount,
      'raised_amount': raisedAmount,
      'status': status,
    };
  }
}
