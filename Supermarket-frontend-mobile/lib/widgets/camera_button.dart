import 'package:flutter/material.dart';
import 'package:vigl/pages/camera_page.dart';

class CameraButton extends StatelessWidget {
  const CameraButton({super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CameraPage()),
        );
      },
      icon: Icon(Icons.camera_outlined),
      label: Text('Scan'),
    );
  }
}
