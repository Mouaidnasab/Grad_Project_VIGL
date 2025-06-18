import 'package:flutter/material.dart';

class ScanResultPage extends StatelessWidget {
  final Map<String, dynamic> result;

  const ScanResultPage({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final shelf = result['shelf'];
    final screen = result['screen'];
    final product = result['product'];
    final category = result['category'];

    return Scaffold(
      appBar: AppBar(title: Text('Scan Result')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          children: [
            Text("📦 Product", style: TextStyle(fontWeight: FontWeight.bold)),
            Text("ID: ${product['ProductID']}"),
            Text("Name: ${product['ProductName']}"),
            Text("Description: ${product['Description']}"),

            SizedBox(height: 20),

            Text("📚 Category", style: TextStyle(fontWeight: FontWeight.bold)),
            Text("Name: ${category['CategoryName']}"),
            Text("Description: ${category['Description']}"),

            SizedBox(height: 20),

            Text("🗄️ Shelf", style: TextStyle(fontWeight: FontWeight.bold)),
            Text("Isle: ${shelf['Isle']}"),
            Text("Floor: ${shelf['Floor']}"),
            Text("Section: ${shelf['Section']}"),
            Text("Description: ${shelf['Description']}"),

            SizedBox(height: 20),

            Text("💻 Screen", style: TextStyle(fontWeight: FontWeight.bold)),
            Text("IP: ${screen['IP']}"),
            Text("Status: ${screen['Status']}"),
            Text("Description: ${screen['Description']}"),
          ],
        ),
      ),
    );
  }
}
