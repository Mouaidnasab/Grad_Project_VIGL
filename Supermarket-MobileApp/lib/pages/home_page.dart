import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:vigil/pages/login_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final MobileScannerController _scannerController = MobileScannerController();
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

  void _onDetect(BarcodeCapture capture) {
    if (!_scanningEnabled || _hasDetected) return;

    final barcode = capture.barcodes.first;
    final String? code = barcode.rawValue;
    if (code != null) {
      _hasDetected = true;
      _showResultDialog(code);
    }
  }

  Future<void> _showResultDialog(String code) async {
    final Uri? uri = Uri.tryParse(code);
    final bool isValidUrl =
        uri != null && (uri.scheme == 'http' || uri.scheme == 'https');

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Text('QR Code Detected'),
        content: isValidUrl
            ? InkWell(
                onTap: () async {
                  final launched = await launchUrl(
                    uri,
                    mode: LaunchMode.externalApplication,
                  );
                  if (!launched) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Could not launch URL')),
                    );
                  }
                },
                child: Text(
                  code,
                  style: const TextStyle(
                    color: Colors.blue,
                    decoration: TextDecoration.underline,
                  ),
                ),
              )
            : Text(code),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _hasDetected = false;
                _scanningEnabled = false;
              });
            },
            child: const Text('OK'),
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
