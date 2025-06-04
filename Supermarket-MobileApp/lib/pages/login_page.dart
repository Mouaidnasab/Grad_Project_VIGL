
import 'package:flutter/material.dart';
import 'package:vigil/pages/home_page.dart';



class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  
    bool loggedIn = false;
    String username = '';
    String password = '';

  void login() 
{
  if (username == 'admin' && password == '1234') {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => HomePage()),
      
    );
    loggedIn=true;
  } else {
    // Show an error message (optional)
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Invalid username or password')),
    );
  }
}


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Optional AppBar with menu icon (skip for now if needed)
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0), // Space around the edges
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center, // Center everything vertically
              crossAxisAlignment: CrossAxisAlignment.center, // Align text to the start (left)
              children: [
                // Menu Icon (top-left) - optional, can be part of an AppBar if needed
                Align(
                  alignment: Alignment.topLeft,
                  child: Icon(Icons.menu, color: Colors.green),
                ),
                SizedBox(height: 40), // Space below menu icon
            
                // Logo Text
                Text(
                  'VIGIL',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: const Color.fromARGB(255, 12, 16, 12),
                  ),
                ),
            
                SizedBox(height: 20),
            
                // Subtitle
                Text(
                  'Staff Login',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                ),
            
                SizedBox(height: 40),
            
                // Username TextField
                Text('Username'),
                SizedBox(height: 8),
                SizedBox(
                  width: 300,
                  child: TextField(
                    onChanged: (value) {
                      setState((){
                          username=value;
                      });
                    },
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
            
                SizedBox(height: 20),
            
                // Password TextField
                Text('Password'),
                SizedBox(height: 8),
                SizedBox(
                  width: 300,
                  child: TextField(
                    onChanged: (value) {
                        setState(() {
                        password = value;
                        });
                        },
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
            
                SizedBox(height: 30),
            
                // Login Button
                ElevatedButton(
                  onPressed: login ,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green, // Button color
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 40, vertical: 12),
                  ),
                  child: Text(
                    'Login',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.white,
                    ),
                  ),
                ),
            
                Spacer(), // Pushes the bottom bar to the bottom
            
                // Bottom Green Bar
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