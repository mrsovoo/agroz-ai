import 'dart:async';

class AuthEventBus {
  static final AuthEventBus instance = AuthEventBus._internal();
  AuthEventBus._internal();

  final _controller = StreamController<void>.broadcast();

  Stream<void> get onUnauthorized => _controller.stream;

  void emitUnauthorized() {
    _controller.add(null);
  }
}
