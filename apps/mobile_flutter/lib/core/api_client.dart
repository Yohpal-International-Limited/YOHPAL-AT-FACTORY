import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;
  final Duration timeout;

  ApiClient(this.baseUrl, {this.timeout = const Duration(seconds: 10)});

  Future<Map<String, dynamic>> get(String path) async {
    final response = await http
        .get(Uri.parse('$baseUrl$path'))
        .timeout(timeout);
    return _handle(response);
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl$path'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(timeout);
    return _handle(response);
  }

  Map<String, dynamic> _handle(http.Response response) {
    final decoded = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(decoded['error'] ?? 'Request failed');
    }
    return decoded;
  }
}
