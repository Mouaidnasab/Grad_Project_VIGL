import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vigil/utils/api_helper.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

final FlutterSecureStorage storage = const FlutterSecureStorage();

class ScreenAccept extends StatefulWidget {
  final int shelfId;
  final int screenId;

  const ScreenAccept(
      {super.key, required this.shelfId, required this.screenId});

  @override
  State<ScreenAccept> createState() => _ScreenAcceptState();
}

class _ScreenAcceptState extends State<ScreenAccept> {
  String screenInfo = 'Loading...';
  String shelfInfo = 'Loading...';

  Future<String?> getBaseIp() async {
    final ip = await storage.read(key: 'base_ip');
    return ip;
  }

  Future<Map<String, String>> getHeaders(int id) async {
    return await getAuthHeaders(extraHeaders: {
      "id": id.toString(),
    });
  }

  Future<void> fetchScreenInfo() async {
    final baseIp = await getBaseIp();
    if (baseIp == null || baseIp.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      return;
    }
    try {
      final uri =
          Uri.parse('http://$baseIp:8000/screen/get/${widget.screenId}');
      final headers = await getHeaders(widget.screenId);

      final response = await http.get(uri, headers: headers);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          screenInfo =
              'IP: ${data['IP'] ?? 'Unknown'}, Status: ${data['Status'] ?? 'Unknown'}';
        });
      } else {
        setState(() {
          screenInfo = 'Failed to load screen info';
        });
      }
    } catch (e) {
      setState(() {
        screenInfo = 'Error loading screen info';
      });
    }
  }

  Future<void> fetchShelfInfo() async {
    final baseIp = await getBaseIp();
    if (baseIp == null || baseIp.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      return;
    }
    try {
      final uri = Uri.parse('http://$baseIp:8000/shelf/get/${widget.shelfId}');
      final headers = await getHeaders(widget.shelfId);

      final response = await http.get(uri, headers: headers);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          shelfInfo =
              'Section: ${data['Section']}, Isle: ${data['Isle']}, Floor: ${data['Floor']}';
        });
      } else {
        setState(() {
          shelfInfo = 'Failed to load shelf info';
        });
      }
    } catch (e) {
      setState(() {
        shelfInfo = 'Error loading shelf info';
      });
    }
  }

  Future<void> assignScreenToShelf() async {
    final baseIp = await getBaseIp();
    if (baseIp == null || baseIp.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      return;
    }
    try {
      final uri = Uri.parse('http://$baseIp:8000/shelf/create_relation_screen');
      final headers = await getHeaders(widget.shelfId);
      headers['Content-Type'] = 'application/json';

      final body = json.encode({
        "shelf_id": widget.shelfId,
        "screen_id": widget.screenId,
      });

      final response = await http.post(uri, headers: headers, body: body);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final message = data['message'] ?? 'Relation created successfully';

        if (!mounted) return;
        await _showDialog(message);
        if (mounted) Navigator.pop(context, true);
      } else {
        _showDialog("Server error: ${response.statusCode}");
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

  @override
  void initState() {
    super.initState();
    fetchScreenInfo();
    fetchShelfInfo();
  }

  ThemeData get _blueTheme => ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF0F6FF),
        primaryColor: const Color(0xFF42A5F5),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF42A5F5),
          secondary: Color(0xFFBBDEFB),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF42A5F5),
          foregroundColor: Colors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF42A5F5),
            foregroundColor: Colors.white,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(30)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          ),
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1565C0),
            fontFamily: 'ComicSans',
          ),
          bodyLarge: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
            fontFamily: 'ComicSans',
          ),
        ),
      );

  Widget _buildInfoCard(BuildContext context, String label, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Theme.of(context)
                .colorScheme
                .secondary
                .withAlpha((0.3 * 255).toInt()),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(
            child: Text(content, style: Theme.of(context).textTheme.bodyLarge),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: _blueTheme,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Confirm Add to Shelf'),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoCard(context, 'The Following Screen', screenInfo),
                _buildInfoCard(context, 'Will Be Added To Shelf', shelfInfo),
                const Spacer(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, false),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () async {
                        await assignScreenToShelf();
                      },
                      child: const Text('Accept'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
