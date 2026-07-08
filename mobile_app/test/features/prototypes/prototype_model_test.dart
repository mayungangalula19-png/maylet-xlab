import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/prototypes/models/prototype.dart';

void main() {
  group('Prototype.fromJson', () {
    test('maps supabase prototype rows to the mobile model', () {
      final prototype = Prototype.fromJson({
        'id': 'proto-1',
        'user_id': 'user-1',
        'project_id': 'project-1',
        'name': 'Wearable sensor',
        'description': 'A smart wearable prototype',
        'status': 'testing',
        'lifecycle_status': 'testing',
        'version': '0.2.0',
        'file_url': 'https://example.com/file.zip',
        'thumbnail_url': 'https://example.com/thumb.png',
        'views': 12,
        'downloads': 4,
        'research_id': 'research-1',
        'created_at': '2026-07-01T12:00:00.000Z',
        'updated_at': '2026-07-02T12:00:00.000Z',
      });

      expect(prototype.name, 'Wearable sensor');
      expect(prototype.projectId, 'project-1');
      expect(prototype.status, 'testing');
      expect(prototype.version, '0.2.0');
      expect(prototype.views, 12);
      expect(prototype.downloads, 4);
    });
  });
}
