import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vigl/utils/api_helper.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

final _storage = const FlutterSecureStorage();

class ScreenAccept extends StatefulWidget {
  final int shelfId;
  final int screenId;

  const ScreenAccept({
    super.key,
    required this.shelfId,
    required this.screenId,
  });

  @override
  State<ScreenAccept> createState() => _ScreenAcceptState();
}

class _ScreenAcceptState extends State<ScreenAccept> {
  String screenInfo = 'Loading...';
  String shelfInfo = 'Loading...';

  @override
  void initState() {
    super.initState();
    _fetchScreenInfo();
    _fetchShelfInfo();
  }

  Future<String?> _getBaseIp() async => await _storage.read(key: 'base_ip');

  Future<Map<String, String>> _getHeaders(int id) =>
      getAuthHeaders(extraHeaders: {'id': id.toString()});

  Future<void> _fetchScreenInfo() async {
    final ip = await _getBaseIp();
    if (ip == null || ip.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      return;
    }
    try {
      final uri = Uri.parse('$ip/screen/get/${widget.screenId}');
      final resp =
          await http.get(uri, headers: await _getHeaders(widget.screenId));
      if (resp.statusCode == 200) {
        final data = json.decode(resp.body);
        setState(() {
          screenInfo = 'IP: ${data['IP'] ?? '-'}\n'
              'Status: ${data['Status'] ?? '-'}\n'
              'Desc: ${data['Description'] ?? '-'}';
        });
      } else {
        setState(() => screenInfo = 'Failed to load screen info');
      }
    } catch (_) {
      setState(() => screenInfo = 'Error loading screen info');
    }
  }

  Future<void> _fetchShelfInfo() async {
    final ip = await _getBaseIp();
    if (ip == null || ip.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      return;
    }
    try {
      final uri = Uri.parse('$ip/shelf/get/${widget.shelfId}');
      final resp =
          await http.get(uri, headers: await _getHeaders(widget.shelfId));
      if (resp.statusCode == 200) {
        final d = json.decode(resp.body);
        setState(() {
          shelfInfo = 'Section: ${d['Section'] ?? '-'}\n'
              'Isle:    ${d['Isle'] ?? '-'}\n'
              'Floor:   ${d['Floor'] ?? '-'}';
        });
      } else {
        setState(() => shelfInfo = 'Failed to load shelf info');
      }
    } catch (_) {
      setState(() => shelfInfo = 'Error loading shelf info');
    }
  }

  Future<void> _assignScreenToShelf() async {
    final ip = await _getBaseIp();
    if (ip == null || ip.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      return;
    }
    try {
      final uri = Uri.parse('$ip/shelf/create_relation_screen');
      final headers = await _getHeaders(widget.shelfId)
        ..['Content-Type'] = 'application/json';
      final body = json.encode({
        "shelf_id": widget.shelfId,
        "screen_id": widget.screenId,
      });

      final resp = await http.post(uri, headers: headers, body: body);
      if (resp.statusCode == 200) {
        final msg = json.decode(resp.body)['message'] ??
            'Relation created successfully';
        await _showDialog(msg);
        if (mounted) Navigator.pop(context, true);
      } else {
        _showDialog("Server error: ${resp.statusCode}");
      }
    } catch (e) {
      _showDialog("Request failed: $e");
    }
  }

  Future<void> _showDialog(String message) async {
    if (!mounted) return;
    return showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Info"),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("OK"),
          )
        ],
      ),
    );
  }

  Widget _buildAccentCard({
    required IconData icon,
    required Color accentColor,
    required String title,
    required String content,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(
          left: BorderSide(color: accentColor, width: 6),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.07),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: accentColor, size: 22),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: accentColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Divider(color: Colors.grey.shade300),
            const SizedBox(height: 8),
            Text(
              content,
              style: const TextStyle(
                fontSize: 16,
                height: 1.4,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Confirm Add to Shelf'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          children: [
            _buildAccentCard(
              icon: Icons.desktop_windows_outlined,
              accentColor: const Color(0xFF42A5F5),
              title: 'The Following Screen',
              content: screenInfo,
            ),
            _buildAccentCard(
              icon: Icons.view_in_ar_outlined,
              accentColor: const Color.fromARGB(255, 135, 151, 101),
              title: 'Will Be Added To Shelf',
              content: shelfInfo,
            ),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(color: Colors.red, fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _assignScreenToShelf,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF8EA362),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text(
                      'Accept',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
