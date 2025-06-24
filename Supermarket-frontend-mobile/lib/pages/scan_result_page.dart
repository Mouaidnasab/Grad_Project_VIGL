import 'package:flutter/material.dart';

class ScanResultPage extends StatelessWidget {
  final Map<String, dynamic> result;

  const ScanResultPage({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final scanned = result['scanned'] as String;
    final product = result['product'] as Map<String, dynamic>;
    final category = result['category'] as Map<String, dynamic>;
    final price = result['price'] as Map<String, dynamic>;
    final shelf = result['shelf'] as Map<String, dynamic>;
    final screen = result['screen'] as Map<String, dynamic>;

    final scannedLabel =
        'Scanned ${scanned[0].toUpperCase()}${scanned.substring(1)}';

    const allKeys = ['product', 'shelf', 'screen'];
    final ordered = [scanned, ...allKeys.where((k) => k != scanned)];

    Widget buildInfoCard(String key) {
      switch (key) {
        case 'product':
          return _buildProductCard(product, category, price);
        case 'shelf':
          return _buildShelfCard(shelf);
        case 'screen':
          return _buildScreenCard(screen);
        default:
          return const SizedBox.shrink();
      }
    }

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text(scannedLabel),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: SingleChildScrollView(
          child: Column(
            children: ordered.map(buildInfoCard).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(
    Map<String, dynamic> p,
    Map<String, dynamic> cat,
    Map<String, dynamic> pr,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '📦 Product',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          _infoRow('ID', '${p['ProductID']}'),
          _infoRow('Name', p['ProductName']),
          _infoRow('Desc', p['Description']),
          const SizedBox(height: 16),
          Row(
            children: [
              Chip(
                label: Text(cat['CategoryName'],
                    style: const TextStyle(fontWeight: FontWeight.w500)),
                backgroundColor: Colors.green.shade50,
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('\$${pr['Price']}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF8EA362),
                      )),
                  const SizedBox(height: 4),
                  Text(
                    '${pr['StartDate']}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.black54,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildShelfCard(Map<String, dynamic> s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '🗄️ Shelf',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          _infoRow('Isle', s['Isle']),
          _infoRow('Floor', s['Floor']),
          _infoRow('Section', s['Section']),
          _infoRow('Desc', s['Description']),
        ],
      ),
    );
  }

  Widget _buildScreenCard(Map<String, dynamic> s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '💻 Screen',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          _infoRow('IP', s['IP']),
          _infoRow('Status', s['Status']),
          _infoRow('Desc', s['Description']),
        ],
      ),
    );
  }

  BoxDecoration _cardDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      );

  Widget _infoRow(String label, dynamic value) {
    final text = value?.toString() ?? '-';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            '$label:',
            style: const TextStyle(
                fontWeight: FontWeight.w700, color: Colors.black87),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                  color: Colors.black54, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
