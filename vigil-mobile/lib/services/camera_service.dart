import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

class CameraService extends StatefulWidget {
  const CameraService({super.key});

  @override
  State<CameraService> createState() => _CameraPage();
}

class _CameraPage extends State<CameraService> {
  final MobileScannerController _scannerController = MobileScannerController();
  bool _isScanned = false;

  void _onDetect(BarcodeCapture capture) {
    if (_isScanned) return; // prevent multiple triggers
    final barcode = capture.barcodes.first;
    final String? code = barcode.rawValue;
    if (code != null) {
      setState(() => _isScanned = true);
      _handleScannedCode(code);
    }
  }

  void _handleScannedCode(String qrCode) async {
    try {
      // 🧠 BACKEND HANDOFF: This is where the FastAPI call should be made.
      final data = await _fetchFromBackend(qrCode);

      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          title: const Text('Scan Result'),
          content: Text(data),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                setState(() => _isScanned = false);
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching data: $e')),
      );
      setState(() => _isScanned = false);
    }
  }

  /// 🔁 BACKEND INTEGRATION POINT:
  /// Replace this mock function with a real FastAPI HTTP request.
  ///
  /// Example (using `http` package):
  /// final response = await http.get(Uri.parse('http://your-api.com/item/$qrCode'));
  /// if (response.statusCode == 200) return response.body;
  ///
  /// For now, this just returns a placeholder string.
  Future<String> _fetchFromBackend(String qrCode) async {
    await Future.delayed(const Duration(seconds: 1)); // Simulate delay

    return '''
Scanned QR Code:
$qrCode

(Mock result — FastAPI response should be shown here)
''';
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
          ),
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Center(
              child: ElevatedButton(
                onPressed: () async {
                  final status = await Permission.photos.request();
                  if (!status.isGranted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Gallery access denied')),
                    );
                    return;
                  }

                  final picker = ImagePicker();
                  final XFile? image =
                      await picker.pickImage(source: ImageSource.gallery);

                  if (image != null) {
                    try {
                      await _scannerController.analyzeImage(image.path);
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error analyzing image: $e')),
                      );
                    }
                  }
                },
                child: const Text('Gallery Scan'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
