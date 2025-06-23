import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vigl/utils/api_helper.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

final FlutterSecureStorage storage = const FlutterSecureStorage();

class ProductAccept extends StatefulWidget {
  final int shelfId;
  final int productId;

  const ProductAccept(
      {super.key, required this.shelfId, required this.productId});

  @override
  State<ProductAccept> createState() => _ProductAcceptState();
}

class _ProductAcceptState extends State<ProductAccept> {
  String productInfo = 'Loading...';
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

  Future<void> fetchProductInfo() async {
    final baseIp = await getBaseIp();
    if (baseIp == null || baseIp.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      return;
    }
    try {
      final uri = Uri.parse('$baseIp/product/get/${widget.productId}');
      final headers = await getHeaders(widget.productId);

      final response = await http.get(uri, headers: headers);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['Products'] != null && data['Products'].isNotEmpty) {
          final product = data['Products'][0];
          setState(() {
            productInfo = 'Name: ${product['ProductName'] ?? 'Unknown'}, '
                'Category: ${product['CategoryName'] ?? 'Unknown'}, '
                'Price: ${product['Price'] ?? 'N/A'}';
          });
        } else {
          setState(() {
            productInfo = 'No product data found';
          });
        }
      } else {
        setState(() {
          productInfo = 'Failed to load product info';
        });
      }
    } catch (e) {
      setState(() {
        productInfo = 'Error loading product info';
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
      final uri = Uri.parse('$baseIp/shelf/get/${widget.shelfId}');
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

  Future<void> assignProductToShelf() async {
    final baseIp = await getBaseIp();
    if (baseIp == null || baseIp.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      return;
    }
    try {
      final uri = Uri.parse('$baseIp/shelf/update_relation_product');
      final headers = await getHeaders(widget.shelfId);
      headers['Content-Type'] = 'application/json';

      final body = json.encode({
        "shelf_id": widget.shelfId,
        "product_id": widget.productId,
      });

      final response = await http.put(uri, headers: headers, body: body);
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
    fetchProductInfo();
    fetchShelfInfo();
  }

  ThemeData get _orangeTheme => ThemeData(
        scaffoldBackgroundColor: const Color(0xFFFFF3E0),
        primaryColor: const Color(0xFFFF9800),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFFF9800),
          secondary: Color(0xFFFFE0B2),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFFF9800),
          foregroundColor: Colors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFF9800),
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
            color: Color(0xFFEF6C00),
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
      data: _orangeTheme,
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
                _buildInfoCard(context, 'The Following Product', productInfo),
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
                        await assignProductToShelf();
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
