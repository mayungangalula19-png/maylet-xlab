import re

with open('mobile_app/lib/features/documents/screens/documents_screen.dart', 'r') as f:
    code = f.read()

# Add imports
imports = '''import 'dart:io';
import 'package:file_picker/file_picker.dart';
import '../../../core/supabase_client.dart';
'''
code = code.replace(\"import 'package:intl/intl.dart';\", imports + \"import 'package:intl/intl.dart';\")

# Add _uploading state
code = code.replace(\"bool _loading = true;\", \"bool _loading = true;\\n  bool _uploading = false;\")

# Add _handleUpload
upload_func = '''
  Future<void> _handleUpload() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles();
      if (result != null && result.files.single.path != null) {
        setState(() => _uploading = true);
        
        final file = File(result.files.single.path!);
        final fileName = result.files.single.name;
        final fileExtension = result.files.single.extension?.toLowerCase() ?? 'unknown';
        
        final user = context.read<AuthService>().currentUser;
        if (user == null) return;
        
        final filePath = '\/\_\';
        await SupabaseConfig.client.storage.from('project-documents').upload(
          filePath,
          file,
        );
        
        final publicUrl = SupabaseConfig.client.storage.from('project-documents').getPublicUrl(filePath);
        
        final newDoc = EnterpriseDocument(
          id: '',
          projectId: null,
          title: fileName,
          fileUrl: publicUrl,
          fileType: fileExtension,
          fileSize: file.lengthSync(),
          kind: 'general',
          accessLevel: 'private',
          uploadedBy: user.id,
          createdAt: DateTime.now(),
        );
        
        await context.read<DocumentService>().uploadDocument(newDoc);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Document uploaded successfully!')));
          _fetchDocs();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload error: \')));
      }
    } finally {
      if (mounted) {
        setState(() => _uploading = false);
      }
    }
  }
'''
code = code.replace(\"List<EnterpriseDocument> get _filteredDocs\", upload_func + \"\\n  List<EnterpriseDocument> get _filteredDocs\")

# Wrap in SafeArea
code = code.replace(\"body: RefreshIndicator(\", \"body: SafeArea(\\n        child: RefreshIndicator(\")
# Need to close the SafeArea properly
# Finding the closing tags of RefreshIndicator
code = re.sub(r\"(const SliverToBoxAdapter\\(child: SizedBox\\(height: 40\\)\\),\\n          \\],\\n        \\),\\n      \\),)\", r\"\\1\\n      ),\", code)

# Replace the Upload button
old_button = '''ElevatedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload feature coming soon.')));
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2fd4ff),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('Upload', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),'''

new_button = '''ElevatedButton(
                          onPressed: _uploading ? null : _handleUpload,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2fd4ff),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: _uploading 
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                              : const Text('Upload', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),'''

code = code.replace(old_button, new_button)

with open('mobile_app/lib/features/documents/screens/documents_screen.dart', 'w') as f:
    f.write(code)

print('Updated successfully.')
