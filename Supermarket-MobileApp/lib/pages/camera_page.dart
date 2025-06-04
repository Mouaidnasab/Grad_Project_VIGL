import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPage();
}

class _CameraPage extends State<CameraPage> {
  final MobileScannerController _scannerController = MobileScannerController();
  bool _isScanned = false;

  void _onDetect(BarcodeCapture capture) {
    if (_isScanned) return; // prevent multiple triggers
    final barcode = capture.barcodes.first;
    final String? code = barcode.rawValue;
    if (code != null) {
      setState(() => _isScanned = true);
      _showResult(code);
    }
  }

void _showResult(String code) {
  final Uri? url = Uri.tryParse(code);
  final bool isValidUrl = url != null && (url.scheme == 'http' || url.scheme == 'https');

  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (_) => AlertDialog(
      title: const Text('QR Code Detected'),
      content: isValidUrl
          ? InkWell(
              onTap: () async {
                final launched = await launchUrl(
                  url!,
                  mode: LaunchMode.externalApplication, // ✅ use external browser
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
            setState(() => _isScanned = false);
          },
          child: const Text('OK'),
        ),
      ],
    ),
  );
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
          // MobileScanner automatically initializes and shows the camera
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
                  // Request permission
                  final status = await Permission.photos.request();
                  if (!status.isGranted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Gallery access denied')),
                    );
                    return;
                  }

                  // Pick image
                  final picker = ImagePicker();
                  final XFile? image = await picker.pickImage(source: ImageSource.gallery);

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
                child: const Text('Gallery Scan'), // ✅ make sure there's a comma here
              ),

            ),
          ),
        ],
      ),
    );
  }
}
