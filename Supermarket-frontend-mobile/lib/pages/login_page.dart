import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vigl/pages/home_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool loggedIn = false;
  String username = '';
  String password = '';
  String baseIp = '';

  final storage = const FlutterSecureStorage();
  final TextEditingController ipController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadStoredIp();
  }

  Future<void> _loadStoredIp() async {
    String? storedIp = await storage.read(key: 'base_ip');
    // if nothing stored yet, use and persist the default
    if (storedIp == null || storedIp.isEmpty) {
      storedIp = 'https://market_back.vigl.store';
      await storage.write(key: 'base_ip', value: storedIp);
    }
    setState(() {
      baseIp = storedIp!;
      ipController.text = baseIp; // prefill the dialog
    });
  }

  Future<void> login() async {
    if (baseIp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please set the IP address first.')),
      );
      return;
    }

    final url = Uri.parse('$baseIp/user_auth/token');
    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'username': username,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await storage.write(key: 'access_token', value: data['access_token']);
        await storage.write(key: 'refresh_token', value: data['refresh_token']);
        await storage.write(key: 'token_type', value: data['token_type']);
        await storage.write(key: 'username', value: username);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Login successful! Redirecting...')),
        );

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomePage()),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: ${response.statusCode}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _showIpDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Set IP Address"),
        content: TextField(
          controller: ipController,
          decoration:
              const InputDecoration(hintText: "e.g. http://192.168.1.10"),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              if (ipController.text.isNotEmpty) {
                await storage.write(key: 'base_ip', value: ipController.text);
                setState(() => baseIp = ipController.text);
                Navigator.pop(context);
              }
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Align(
                  alignment: Alignment.topLeft,
                  child: IconButton(
                    icon: const Icon(Icons.menu, color: Colors.green),
                    onPressed: _showIpDialog,
                  ),
                ),
                const SizedBox(height: 40),
                const Text(
                  'VIGL',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(255, 12, 16, 12),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Staff Login',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 40),
                const Text('Username'),
                const SizedBox(height: 8),
                SizedBox(
                  width: 300,
                  child: TextField(
                    onChanged: (v) => setState(() => username = v),
                    decoration: InputDecoration(
                      hintText: 'Enter Username',
                      filled: true,
                      fillColor: Colors.grey[200],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Password'),
                const SizedBox(height: 8),
                SizedBox(
                  width: 300,
                  child: TextField(
                    onChanged: (v) => setState(() => password = v),
                    obscureText: true,
                    decoration: InputDecoration(
                      hintText: 'Enter your password',
                      filled: true,
                      fillColor: Colors.grey[200],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                ElevatedButton(
                  onPressed: login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 40, vertical: 12),
                  ),
                  child: const Text(
                    'Login',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.white,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  height: 20,
                  width: double.infinity,
                  color: Colors.green,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
