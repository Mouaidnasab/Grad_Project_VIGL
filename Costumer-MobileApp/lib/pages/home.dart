import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';//A flutter defined package.
import 'package:hope/pages/search.dart'; 


class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final MobileScannerController _scannerController = MobileScannerController();
  bool _hasDetected = false;

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasDetected) return;

    final barcode = capture.barcodes.first;
    final String? code = barcode.rawValue;
    if (code == null) return;

    setState(() => _hasDetected = true);
    _handleResult(code);
  }

  void _handleResult(String code) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("QR Code Detected"),
        content: Text(code),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _hasDetected = false);
            },
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 📷 Camera View
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
          ),

          // 📌 Instruction Text
          Positioned(
            top: 60,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'Scan any barcode',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
            ),
          ),

          // 🏠 Home Button
          Positioned(
            bottom: 30,
            left: 20,
            child: ElevatedButton(
                  onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const SearchPage()),
                );
              },

              style: ElevatedButton.styleFrom(
                shape: const CircleBorder(),
                padding: const EdgeInsets.all(14),
                backgroundColor: Colors.white,
                elevation: 4,
              ),
              child: const Icon(Icons.search, color: Colors.black),
            ),
          ),
        ],
      ),
    );
  }
}
