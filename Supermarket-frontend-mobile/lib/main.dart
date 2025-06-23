import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vigl/pages/login_page.dart';

void main() {
  runApp(VIGL());
  //Notice the command runApp, and the app I want to run is VIGL.
  //VIGL is a class that extends StatelessWidget.
}

class VIGL extends StatelessWidget {
  //VIGL isn't stateful.
  const VIGL({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => ViglState(),
      child: MaterialApp(
        title: 'VIGL',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
              seedColor: const Color.fromARGB(255, 179, 196, 209)),
        ),
        home: LoginPage(),
      ),
    );
  }
}

class ViglState extends ChangeNotifier {}
