
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vigil/pages/login_page.dart';

void main() {
  runApp(VIGIL());
  //Notice the command runApp, and the app I want to run is VIGIL.
  //VIGIL is a class that extends StatelessWidget.
}

class VIGIL extends StatelessWidget {
  //VIGIL isn't stateful.
  const VIGIL({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => VigilState(),
      child: MaterialApp(
        title: 'VIGIL',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: const Color.fromARGB(255, 179, 196, 209)),
        ),
        home: LoginPage(),
      ),
    );
  }
}



class VigilState extends ChangeNotifier {}

