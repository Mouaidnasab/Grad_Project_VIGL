import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:vigil/utils/api_helper.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vigil/pages/login_page.dart';
import 'package:vigil/pages/scan_result_page.dart';
import 'package:vigil/pages/Screen_accept.dart';
import 'package:vigil/pages/product_accept.dart';

// TODO: Import your ScreenAccept and ProductAccept pages
// import 'package:vigil/pages/screen_accept.dart';
// import 'package:vigil/pages/product_accept.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final MobileScannerController _scannerController = MobileScannerController(
    formats: [
      BarcodeFormat.code128,
      BarcodeFormat.code39,
      BarcodeFormat.code93,
      BarcodeFormat.ean13,
      BarcodeFormat.ean8,
      BarcodeFormat.upcA,
      BarcodeFormat.upcE,
      BarcodeFormat.itf,
    ],
  );

  final FlutterSecureStorage storage = const FlutterSecureStorage();

  bool _scanningEnabled = false;
  bool _hasDetected = false;

  int _modeIndex = 0;

  List<int> _scannedIds = [];

  final List<IconData> _icons = [
    Icons.inventory,
    Icons.smart_screen,
    Icons.qr_code_scanner,
  ];

  final List<String> _modeLabels = [
    "Add Product",
    "Add Screen",
    "View Relations and Details",
  ];

  final List<Color> _modeColors = [
    Colors.orange,
    Colors.blue,
    Colors.green,
  ];

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

    if (capture.barcodes.isEmpty) return;
    final barcode = capture.barcodes.first;
    final String? code = barcode.rawValue;
    if (code == null) return;

    final id = int.tryParse(code);
    if (id == null) {
      _showDialog("Invalid code scanned: $code");
      _resetScanner();
      return;
    }

    if (_modeIndex == 2) {
      _hasDetected = true;
      await _handleViewRelations(id);
    } else if (_modeIndex == 1) {
      await _handleDoubleScan(id, isScreenMode: true);
    } else if (_modeIndex == 0) {
      await _handleDoubleScan(id, isScreenMode: false);
    }
  }

  Future<void> _handleViewRelations(int id) async {
    final baseIp = await storage.read(key: 'base_ip');
    if (baseIp == null || baseIp.isEmpty) {
      _showDialog("IP address not set. Please log in again.");
      _resetScanner();
      return;
    }

    try {
      final uri =
          Uri.parse('http://$baseIp:8000/shelf/get_relations_by_unkown/$id/');
      final headers = await getAuthHeaders(extraHeaders: {"id": id.toString()});

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);

        if (!mounted) return;

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

  Future<void> _handleDoubleScan(int id, {required bool isScreenMode}) async {
    if (_scannedIds.contains(id)) {
      _showDialog(
          "This code was already scanned. Please scan a different code.");
      return;
    }

    setState(() {
      _scannedIds.add(id);
    });

    if (_scannedIds.length < 2) {
      _showDialog("Scanned ID: $id\nPlease scan the second barcode.");
      return;
    }

    _hasDetected = true;
    _scanningEnabled = false;

    if (isScreenMode) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ScreenAccept(
            shelfId: _scannedIds[0],
            screenId: _scannedIds[1],
          ),
        ),
      ).then((_) {
        _resetScanner();
        _scannedIds.clear();
      });
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ProductAccept(
            shelfId: _scannedIds[0],
            productId: _scannedIds[1],
          ),
        ),
      ).then((_) {
        _resetScanner();
        _scannedIds.clear();
      });
    }
  }

  void _resetScanner() {
    setState(() {
      _hasDetected = false;
      _scanningEnabled = false;
      _scannedIds.clear();
    });
  }

  void _showDialog(String message) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Info"),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  void _onModeSwitch() {
    setState(() {
      _modeIndex = (_modeIndex + 1) % _icons.length;
      _resetScanner();

      if (_modeIndex == 2) {
        _scanningEnabled = true;
      }
    });
  }

  Widget _roundIconButton(IconData icon, VoidCallback onTap, Color color) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
        padding: const EdgeInsets.all(12),
        child: Icon(icon, color: Colors.white, size: 28),
      ),
    );
  }

  Widget _buildInstructions() {
    String instructionText = "";
    switch (_modeIndex) {
      case 0: // Add Product
        if (_scannedIds.isEmpty) {
          instructionText = "Scan shelf";
        } else if (_scannedIds.length == 1) {
          instructionText = "Scan product";
        }
        break;
      case 1: // Add Screen
        if (_scannedIds.isEmpty) {
          instructionText = "Scan shelf";
        } else if (_scannedIds.length == 1) {
          instructionText = "Scan screen";
        }
        break;
      case 2: // View Relations
        instructionText = "Scan shelf";
        break;
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Text(
        instructionText,
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: _modeColors[_modeIndex],
        ),
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
                const SizedBox(height: 20),
                Text(
                  _modeLabels[_modeIndex],
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: _modeColors[_modeIndex],
                  ),
                ),
                _buildInstructions(),
                const Spacer(),
                Padding(
                  padding: const EdgeInsets.only(bottom: 30.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _roundIconButton(
                        _icons[_modeIndex],
                        _onModeSwitch,
                        _modeColors[_modeIndex],
                      ),
                      _roundIconButton(
                        Icons.camera_alt,
                        () {
                          if (_modeIndex == 2 ||
                              _modeIndex == 0 ||
                              _modeIndex == 1) {
                            setState(() {
                              _scanningEnabled = true;
                              _hasDetected = false;
                              _scannedIds.clear();
                            });
                          }
                        },
                        Colors.grey,
                      ),
                      _roundIconButton(
                        Icons.logout,
                        () {
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(
                                builder: (context) => const LoginPage()),
                            (Route<dynamic> route) => false,
                          );
                        },
                        Colors.red,
                      ),
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

// ===
// You need to create the ScreenAccept and ProductAccept pages, for example:
//
// class ScreenAccept extends StatelessWidget {
//   final int shelfId;
//   final int screenId;
//
//   const ScreenAccept({required this.shelfId, required this.screenId, Key? key}) : super(key: key);
//
//   @override
//   Widget build(BuildContext context) {
//     // Your UI + API calls to handle assignment
//   }
// }
//
// class ProductAccept extends StatelessWidget {
//   final int shelfId;
//   final int productId;
//
//   const ProductAccept({required this.shelfId, required this.productId, Key? key}) : super(key: key);
//
//   @override
//   Widget build(BuildContext context) {
//     // Your UI + API calls to handle assignment
//   }
// }
