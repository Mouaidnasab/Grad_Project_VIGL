import 'package:flutter/material.dart';

class ProductToShelfForm extends StatelessWidget {
  const ProductToShelfForm({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          
          const SizedBox(height: 100 ),
          const Text(
            'The Following Product',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 25),
          Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color.fromARGB(255, 150, 192, 42),
              borderRadius: BorderRadius.circular(20),
            ),
            alignment: Alignment.center,
            child: const Text(
              'Product Info',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 135),
          
          const Text(
            'Will Be added To Shelf',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 25),
          Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color.fromARGB(255, 150, 192, 42),
              borderRadius: BorderRadius.circular(20),
            ),
            alignment: Alignment.center,
            child: const Text(
              'Shelf Info',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 167),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color.fromARGB(255, 146, 80, 75),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                onPressed: () {
                  // Cancel logic
                },
                child: const Text('Cancel',
                  style: TextStyle(color: Color.fromARGB(255, 222, 174, 174)),
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFAAC080),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                onPressed: () {
                  // Accept logic
                },
                child: const Text('Accept'),
              ),
                TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),

            ],
          ),
        ],
        
      ),
    );
  }
}
