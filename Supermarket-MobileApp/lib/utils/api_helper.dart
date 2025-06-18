import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final FlutterSecureStorage storage = const FlutterSecureStorage();

Future<Map<String, String>> getAuthHeaders({Map<String, String>? extraHeaders}) async {
  String? accessToken = await storage.read(key: 'access_token');

  final headers = <String, String>{};

  if ((accessToken ?? "0").isNotEmpty) {
    headers['Authorization'] = 'Bearer $accessToken';
  }

  if (extraHeaders != null) {
    headers.addAll(extraHeaders);
  }

  return headers;
}
