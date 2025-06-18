// ==================== 🔁 Imports ====================
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vigil/utils/api_helper.dart'; // make sure this has getAuthHeaders()
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';

// ==================== 🔐 Secure storage instance ====================
final FlutterSecureStorage storage = const FlutterSecureStorage();

// ==================== 🚀 Function Template ====================
Future<void> yourFunctionName(BuildContext context, int id) async {
  // added id parameter

  // your code here

  // 1️⃣ Read IP from secure storage
  final baseIp = await storage.read(key: 'base_ip');
  if (baseIp == null || baseIp.isEmpty) {
    _showDialog(
        context, "IP address not set. Please log in again."); // added context
    return;
  }

  try {
    // ID HERE IS JUST AN EXAMPLE
    final uri = Uri.parse('http://$baseIp:8000/your/api/path/$id/');
    // 🖊️ write your link here only rename this part of the link "your/api/path/$id"

    final headers = await getAuthHeaders(extraHeaders: {
      "id": id
          .toString(), // remove this line only if you don't need it or it is used if you want extra headers some require it some don't MUST BE A STRING "string":"string"
    });

    //////////////////////////////////////////////////////////////////////
    /// ALL THE FOLLOWING IS OPTIONAL IF YOU ARE WAITING FOR A RESPONSE //
    ////////////////////////////////////////////////////////////////////

    final response = await http.get(uri,
        headers: headers); // if it has a response and you waiting for it

    // 5️⃣ Handle success
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);

      // 🧠 Optional: check if still mounted before navigation
      if (!context.mounted) return; // updated to context.mounted in Flutter 3+

      // 6️⃣ Navigate or update UI optional
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => YourNextPage(
              result: jsonData), // 🖊️ create or point to your page
        ),
      );
    } else {
      _showDialog(context, "Server error: ${response.statusCode}");
    }
  } catch (e) {
    _showDialog(context, "Request failed: $e");
  }
}

// Example _showDialog function to match your usage (pass context!)
void _showDialog(BuildContext context, String message) {
  showDialog(
    context: context,
    builder: (_) => AlertDialog(
      title: const Text("Error"),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("OK"),
        ),
      ],
    ),
  );
}
