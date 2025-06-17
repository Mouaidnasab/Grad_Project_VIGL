import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:vigil/utils/api_helper.dart'; // your shared getAuthHeaders
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vigil/pages/login_page.dart';
import 'package:vigil/pages/scan_result_page.dart'; // assume you have this page

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final MobileScannerController _scannerController = MobileScannerController();
  final FlutterSecureStorage storage = const FlutterSecureStorage();

  bool _scanningEnabled = false;
  bool _hasDetected = false;

  @override
  void initState() {
    super.initState();
    _scannerController.start();
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    if (!_scanningEnabled || _hasDetected) return;

    final barcode = capture.barcodes.first;
    final String? code = barcode.rawValue;
    if (code == null) return;

    _hasDetected = true;

    final id = int.tryParse(code);
    if (id == null) {
      _showDialog("Invalid code scanned: $code");
      _resetScanner();
      return;
    }

//add this to every page except login
    final baseIp = await storage.read(key: 'base_ip');
    if (baseIp == null || baseIp.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      _resetScanner();
      return;
    }

    try {
      final uri = Uri.parse('http://$baseIp:8000/shelf/get_relations_by_unkown/$id');
      final headers = await getAuthHeaders(extraHeaders: {"id": id.toString()});

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);

        if (!mounted) return; // check if still in widget tree

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ScanResultPage(result: jsonData),
          ),
        ).then((_) => _resetScanner());
      } else {
        _showDialog("Server error: ${response.statusCode}");
        _resetScanner();
      }
    } catch (e) {
      _showDialog("Request failed: $e");
      _resetScanner();
    }
  }

  void _resetScanner() {
    setState(() {
      _hasDetected = false;
      _scanningEnabled = false;
    });
  }

  void _showDialog(String message) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Error"),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resetScanner();
            },
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  void _showSettingsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Sign Out'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginPage()),
                  (Route<dynamic> route) => false,
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAddOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.inventory, color: Colors.blue),
              title: const Text('Assign Product'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to Assign Product page
              },
            ),
            ListTile(
              leading: const Icon(Icons.smart_screen, color: Colors.green),
              title: const Text('Assign Screen'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to Assign Screen page
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _roundIconButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.green[300],
          shape: BoxShape.circle,
        ),
        padding: const EdgeInsets.all(12),
        child: Icon(icon, color: Colors.white, size: 28),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
          ),
          SafeArea(
            child: Column(
              children: [
                const Spacer(),
                Padding(
                  padding: const EdgeInsets.only(bottom: 30.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _roundIconButton(Icons.menu, () {
                        _showSettingsMenu(context);
                      }),
                      _roundIconButton(Icons.camera_alt, () {
                        setState(() {
                          _scanningEnabled = true;
                          _hasDetected = false;
                        });
                      }),
                      _roundIconButton(Icons.add_circle_sharp, () {
                        _showAddOptions(context);
                      }),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
