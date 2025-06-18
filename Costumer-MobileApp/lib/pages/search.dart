import 'package:flutter/material.dart';
import 'package:hope/pages/home.dart'; // adjust the path if it's in a folder
import 'package:hope/pages/product_details.dart'; // or adjust the path if it's in /pages/


class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, dynamic>> _allProducts = [
    {'name': 'Apples', 'price': '100 TL'},
    {'name': 'Orange', 'price': '80 TL'},
    {'name': 'Tomatoes', 'price': '30 TL'},
    {'name': 'Bananas', 'price': '50 TL'},
    {'name': 'Strawberries', 'price': '120 TL'},
  ];

  List<Map<String, dynamic>> _filteredProducts = [];

  @override
  void initState() {
    super.initState();
    _filteredProducts = List.from(_allProducts);
  }

  void _filterProducts(String query) {
    setState(() {
      _filteredProducts = _allProducts
          .where((product) =>
              product['name'].toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  Widget _buildProductCard(String name, String price) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F3F3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            name,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color: Color(0xFF1A320B),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              price,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A320B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
          child: Column(
            children: [
              // Search bar
              TextField(
                controller: _searchController,
                onChanged: _filterProducts,
                decoration: InputDecoration(
                  hintText: 'Search',
                  hintStyle: const TextStyle(color: Colors.grey),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                  filled: true,
                  fillColor: Colors.grey[200],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Product list
              Expanded(
                child: ListView.builder(
                    itemCount: _filteredProducts.length,
                  itemBuilder: (context, index) {
                    final item = _filteredProducts[index];

                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ProductDetailPage(
                              productName: item['name'],
                              description: 'Details about ${item['name']}', // replace if dynamic
                              governmentPrice: item['price'],
                              marketPrices: [
                                {'market': 'Lemar', 'price': '100 TL'},
                                {'market': 'Onder', 'price': '90 TL'},
                                {'market': 'Macro', 'price': '120 TL'},
                              ],
                            ),
                          ),
                        );
                      },
                      child: _buildProductCard(item['name'], item['price']),
                    );
                  }

                ),
              ),
            ],
          ),
        ),
      ),

      // SCAN button at bottom
      bottomSheet: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const HomePage()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFA5D6A7),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text(
              'Home',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
