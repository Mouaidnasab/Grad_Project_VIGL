import 'package:flutter/material.dart';
import 'package:hope/pages/home.dart';



void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      //theme:There is no theme here ,
      home: const HomePage(),//redirect me to the home page
    );
  }
}
