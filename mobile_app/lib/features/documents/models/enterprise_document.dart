class EnterpriseDocument {
  final String id;
  final String projectId;
  final String projectName;
  final String projectSector;
  final String authorName;
  final String name;
  final String fileUrl;
  final String? description;
  final String? category;
  final String module;
  final String version;
  final bool archived;
  final String fileKind;
  final int? sizeBytes;
  final List<String> tags;
  final DateTime createdAt;

  EnterpriseDocument({
    required this.id,
    required this.projectId,
    required this.projectName,
    required this.projectSector,
    required this.authorName,
    required this.name,
    required this.fileUrl,
    this.description,
    this.category,
    required this.module,
    required this.version,
    required this.archived,
    required this.fileKind,
    this.sizeBytes,
    required this.tags,
    required this.createdAt,
  });

  factory EnterpriseDocument.fromJson(Map<String, dynamic> json) {
    // Parse tags to extract module and version if present
    final tagsRaw = json['tags'] as List<dynamic>? ?? [];
    final tags = tagsRaw.map((e) => e.toString()).toList();
    
    String extractTagValue(String prefix) {
      final hit = tags.firstWhere((t) => t.startsWith('\$prefix:'), orElse: () => '');
      return hit.isNotEmpty ? hit.substring(prefix.length + 1) : '';
    }

    final moduleTag = extractTagValue('module');
    String module = moduleTag.isNotEmpty ? moduleTag : 'project';
    if (moduleTag.isEmpty) {
      final cat = (json['category'] as String?)?.toLowerCase() ?? '';
      if (cat == 'research' || cat == 'evidence') { module = 'research'; }
      else if (cat == 'prototype') { module = 'prototype'; }
      else if (cat == 'experiment') { module = 'experiment'; }
      else if (cat == 'validation') { module = 'validation'; }
      else if (cat == 'pitch' || cat == 'financial') { module = 'funding'; }
      else if (cat == 'legal' || cat == 'commercialization') { module = 'commercialization'; }
    }

    final versionTag = extractTagValue('version');
    final version = versionTag.isNotEmpty ? versionTag : '1.0';
    final archived = tags.contains('archived');

    // Parse file kind
    final name = json['name'] as String? ?? 'Unnamed Document';
    final mime = json['mime_type'] as String?;
    String fileKind = 'other';
    final n = name.toLowerCase();
    if (n.endsWith('.pdf') || (mime != null && mime.contains('pdf'))) { fileKind = 'pdf'; }
    else if (n.endsWith('.docx') || (mime != null && mime.contains('word'))) { fileKind = 'docx'; }
    else if (n.endsWith('.pptx') || (mime != null && mime.contains('presentation'))) { fileKind = 'pptx'; }
    else if (n.endsWith('.xlsx') || (mime != null && mime.contains('spreadsheet'))) { fileKind = 'xlsx'; }
    else if (n.endsWith('.txt') || (mime != null && mime.contains('text/plain'))) { fileKind = 'txt'; }
    else if (n.endsWith('.csv') || (mime != null && mime.contains('csv'))) { fileKind = 'csv'; }
    else if (n.endsWith('.png') || (mime != null && mime.contains('png'))) { fileKind = 'png'; }
    else if (n.endsWith('.jpg') || n.endsWith('.jpeg') || (mime != null && mime.contains('jpeg'))) { fileKind = 'jpg'; }
    else if (n.endsWith('.zip') || (mime != null && mime.contains('zip'))) { fileKind = 'zip'; }

    return EnterpriseDocument(
      id: json['id'] as String,
      projectId: json['project_id'] as String? ?? '',
      projectName: json['project_name'] as String? ?? 'Unknown Project',
      projectSector: json['project_sector'] as String? ?? 'General',
      authorName: json['author_name'] as String? ?? 'Unknown Author',
      name: name,
      fileUrl: json['file_url'] as String? ?? '',
      description: json['description'] as String?,
      category: json['category'] as String?,
      module: module,
      version: version,
      archived: archived,
      fileKind: fileKind,
      sizeBytes: json['size_bytes'] as int?,
      tags: tags,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now(),
    );
  }
}
