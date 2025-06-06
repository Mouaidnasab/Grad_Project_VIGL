import 'package:flutter/material.dart';

import 'package:vigil/pages/login_page.dart';
import 'package:vigil/widgets/camera_button.dart';

import 'package:vigil/services/camera_service.dart';



class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(height: 20),
            Text(
              'The main page, where the worker can scan a product or a screen',
              style: TextStyle(
                color: Colors.orange,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            Expanded(
              child: Center(
                child: Text(
                'Maybe we can add a meaningful thing here, the page is empty!',
                style: TextStyle(
                fontSize: 18,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
                ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 30),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _roundIconButton(Icons.menu, () {
                    _showSettingsMenu(context);
                  }),
                  CameraButton(),
                  _roundIconButton(Icons.add_circle_sharp, () {
                    _showAddOptions(context);
                  }),
                ],
              ),
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
        padding: EdgeInsets.all(12),
        child: Icon(icon, color: Colors.white, size: 28),
      ),
    );
  }

  Widget _scanButton() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 30, vertical: 15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
      ),
      child: Text(
        'SCAN',
        style: TextStyle(
          color: Colors.green[800],
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
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
              leading: Icon(Icons.logout, color: Colors.red),
              title: Text('Sign Out'),
              onTap: () {
              Navigator.pop(context); // Close the bottom sheet first
              Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => LoginPage()), // your main page class
              (Route<dynamic> route) => false, // Remove all old pages
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
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (context) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: Icon(Icons.inventory, color: Colors.blue),
            title: Text('Assign Product'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to Assign Product page

            },
          ),
          ListTile(
            leading: Icon(Icons.smart_screen, color: Colors.green),
            title: Text('Assign Screen'),
            onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => CameraService()),
                  );
                },

            ),
          ],
        ),
      ),
    );
  }
  }
