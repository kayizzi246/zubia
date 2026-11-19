// Automatic FlutterFlow imports
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/widgets/index.dart'; // Imports other custom widgets
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart' hide RepeatMode;
// Begin custom widget code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart'
    show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// ═══════════════════════════════════════════════════════════════
//  WHERE THE WEB APP LIVES
//
//  The one line to change when you deploy. Must match the value in
//  home.dart, search.dart, listing.dart and saved.dart.
// ═══════════════════════════════════════════════════════════════
const String _apiBase = 'http://localhost:3001';

// ═══════════════════════════════════════════════════════════════
//  TOKENS — identical in home, search, listing, saved and profile.
// ═══════════════════════════════════════════════════════════════
const Color _white = Color(0xFFFFFFFF);
const Color _bg = Color(0xFFFFFFFF);
const Color _ink = Color(0xFF10291F);
const Color _inkSoft = Color(0xFF3B4A42);
const Color _mid = Color(0xFF6B6560);
const Color _light = Color(0xFFA8A29B);
const Color _hairline = Color(0xFFE8E3DB);
const Color _tile = Color(0xFFFAF8F5);
const Color _brand = Color(0xFF1A6B4A);
const Color _brandPale = Color(0xFFEDF6F1);
const Color _clay = Color(0xFFA8441F);
const Color _clayPale = Color(0xFFFBF1EC);
const Color _ember = Color(0xFFC0392B);
const Color _emberPale = Color(0xFFFCEDEB);

const Cubic _ease = Cubic(0.23, 1, 0.32, 1);
const double _tabBarHeight = 56;

// WANT THE REAL LIQUID GLASS BAR?
//
// This file draws its own glass bar below, which needs no package.
// To use the shader-based one instead:
//   1. add  liquid_glass_widgets: ^1.18.0  to the widget dependencies
//   2. paste glass_tab_bar.dart in as the ZubiaGlassTabBar widget
//   3. in _tabBar() below, replace the _Glass(...) call with
//          const ZubiaGlassTabBar(activeIndex: N)
//      where N is this page's tab: 0 Home, 1 Search, 2 Saved, 3 Profile

double _ui = 1.0;

bool get _isApple =>
    !kIsWeb &&
    (defaultTargetPlatform == TargetPlatform.iOS ||
        defaultTargetPlatform == TargetPlatform.macOS);

double _trackingFor(double s) {
  if (s >= 24) return -0.025;
  if (s >= 20) return -0.020;
  if (s >= 17) return -0.013;
  if (s >= 15) return -0.007;
  if (s >= 13) return 0.0;
  return 0.008;
}

TextStyle _font(
  double size, {
  FontWeight weight = FontWeight.w400,
  Color color = _inkSoft,
  double height = 1.3,
}) {
  final s = size * _ui;
  return TextStyle(
    fontFamily: _isApple ? (s >= 20 ? '.SF Pro Display' : '.SF Pro Text') : null,
    fontFamilyFallback:
        _isApple ? const ['.SF UI Display', '.SF UI Text', 'Helvetica Neue'] : null,
    fontSize: s,
    fontWeight: weight,
    color: color,
    height: height,
    letterSpacing: s * _trackingFor(s),
  );
}

TextStyle _title(double size,
        {FontWeight weight = FontWeight.w700, Color color = _ink}) =>
    _font(size, weight: weight, color: color, height: 1.15);

TextStyle _txt(double size,
        {FontWeight weight = FontWeight.w400,
        Color color = _inkSoft,
        double height = 1.3}) =>
    _font(size, weight: weight, color: color, height: height);

BoxDecoration _liquid({
  Color? tint,
  bool onDark = false,
  double radius = 999,
  bool circle = false,
}) {
  final List<Color> fill;
  final Color rim;
  if (tint != null) {
    fill = [Color.lerp(tint, _white, 0.20)!, tint];
    rim = _white.withOpacity(0.40);
  } else if (onDark) {
    fill = [_white.withOpacity(0.30), _white.withOpacity(0.12)];
    rim = _white.withOpacity(0.42);
  } else {
    fill = const [_white, Color(0xFFF3F1ED)];
    rim = _ink.withOpacity(0.10);
  }
  return BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: fill,
    ),
    shape: circle ? BoxShape.circle : BoxShape.rectangle,
    borderRadius: circle ? null : BorderRadius.circular(radius),
    border: Border.all(color: rim, width: 1),
  );
}

class _GradientRim extends BoxBorder {
  const _GradientRim(this.gradient, {this.width = 1});

  final Gradient gradient;
  final double width;

  @override
  BorderSide get top => BorderSide.none;
  @override
  BorderSide get bottom => BorderSide.none;
  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.all(width);
  @override
  bool get isUniform => true;

  @override
  void paint(
    Canvas canvas,
    Rect rect, {
    ui.TextDirection? textDirection,
    BoxShape shape = BoxShape.rectangle,
    BorderRadius? borderRadius,
  }) {
    final paint = Paint()
      ..strokeWidth = width
      ..shader = gradient.createShader(rect)
      ..style = PaintingStyle.stroke;
    final inner = rect.deflate(width / 2);
    if (borderRadius != null) {
      canvas.drawRRect(borderRadius.toRRect(inner), paint);
    } else {
      canvas.drawRect(inner, paint);
    }
  }

  @override
  ShapeBorder scale(double t) => _GradientRim(gradient, width: width * t);
}

class _Glass extends StatelessWidget {
  const _Glass({
    required this.child,
    this.height,
    this.radius = 22,
    this.blur = 24,
  });

  final Widget child;
  final double? height;
  final double radius;
  final double blur;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            height: height,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(radius),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [_white.withOpacity(0.78), _white.withOpacity(0.58)],
              ),
              border: _GradientRim(
                LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [_white.withOpacity(0.95), _ink.withOpacity(0.12)],
                ),
              ),
            ),
            child: child,
          ),
        ),
      );
}

class _Pressable extends StatefulWidget {
  const _Pressable({required this.child, this.onTap, this.scale = 0.96});

  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  @override
  State<_Pressable> createState() => _PressableState();
}

class _PressableState extends State<_Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (_down != v && mounted) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => _set(true),
        onTapUp: (_) => _set(false),
        onTapCancel: () => _set(false),
        onTap: widget.onTap == null
            ? null
            : () {
                HapticFeedback.lightImpact();
                widget.onTap!();
              },
        child: AnimatedScale(
          scale: _down ? widget.scale : 1.0,
          duration: Duration(milliseconds: _down ? 100 : 160),
          curve: _ease,
          child: widget.child,
        ),
      );
}

/// A list row: it tints like a table cell instead of sliding, because a
/// full-width row that scales looks like the page is coming apart.
class _PressRow extends StatefulWidget {
  const _PressRow({required this.child, this.onTap});

  final Widget child;
  final VoidCallback? onTap;

  @override
  State<_PressRow> createState() => _PressRowState();
}

class _PressRowState extends State<_PressRow> {
  bool _down = false;

  void _set(bool v) {
    if (_down != v && mounted) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => _set(true),
        onTapUp: (_) => _set(false),
        onTapCancel: () => _set(false),
        onTap: widget.onTap == null
            ? null
            : () {
                HapticFeedback.lightImpact();
                widget.onTap!();
              },
        child: AnimatedContainer(
          duration: Duration(milliseconds: _down ? 60 : 220),
          color: _down ? _ink.withOpacity(0.05) : Colors.transparent,
          child: widget.child,
        ),
      );
}

class _GlassArrive extends StatelessWidget {
  const _GlassArrive({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
        tween: Tween(begin: 1, end: 0),
        duration: const Duration(milliseconds: 300),
        curve: _ease,
        child: child,
        builder: (_, v, ch) => ImageFiltered(
          enabled: v > 0.01,
          imageFilter: ui.ImageFilter.blur(
              sigmaX: 12 * v, sigmaY: 12 * v, tileMode: TileMode.decal),
          child: Opacity(opacity: 1 - 0.30 * v, child: ch),
        ),
      );
}

/// A text field styled to match the tiles.
class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.hint,
    this.validator,
    this.keyboardType,
    this.obscure = false,
    this.autofill,
  });

  final TextEditingController controller;
  final String hint;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final bool obscure;
  final List<String>? autofill;

  @override
  Widget build(BuildContext context) => TextFormField(
        controller: controller,
        validator: validator,
        keyboardType: keyboardType,
        obscureText: obscure,
        autofillHints: autofill,
        cursorColor: _brand,
        style: _txt(15, color: _ink),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: _txt(15, color: _light),
          filled: true,
          fillColor: _white,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: _hairline),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: _hairline),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: _brand, width: 1.5),
          ),
          errorStyle: _txt(12, color: _ember),
        ),
      );
}

// ═══════════════════════════════════════════════════════════════
//  THE WEB APP'S API
// ═══════════════════════════════════════════════════════════════

class _ApiError implements Exception {
  _ApiError(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  bool get isUnauthorized => statusCode == 401;
  @override
  String toString() => message;
}

/// The bearer token lives in the Keychain / Keystore, never in
/// preferences: it is a credential, and anything that can read app
/// preferences could otherwise sign in as this person.
const _secure = FlutterSecureStorage();
const _tokenKey = 'zubia_session_token';

Future<String?> _readToken() => _secure.read(key: _tokenKey);

Future<void> _writeToken(String? token) async {
  if (token == null) {
    await _secure.delete(key: _tokenKey);
  } else {
    await _secure.write(key: _tokenKey, value: token);
  }
}

Future<Map<String, String>> _headers({bool json = false}) async {
  final token = await _readToken();
  return {
    'Accept': 'application/json',
    if (json) 'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };
}

Map<String, dynamic> _unwrap(http.Response res) {
  Map<String, dynamic> body;
  try {
    body = jsonDecode(res.body) as Map<String, dynamic>;
  } catch (_) {
    throw _ApiError('The server sent something unexpected. Try again.',
        statusCode: res.statusCode);
  }

  // The server's own wording, which distinguishes a wrong password from
  // "accounts are not switched on yet" and from a rate limit.
  final error = body['error'];
  if (error is Map<String, dynamic>) {
    throw _ApiError(error['message'] as String? ?? 'Something went wrong.',
        statusCode: res.statusCode);
  }
  final data = body['data'];
  if (data is Map<String, dynamic>) return data;
  throw _ApiError('The server sent no data.', statusCode: res.statusCode);
}

Future<Map<String, dynamic>> _apiGet(String path) async {
  try {
    final res = await http
        .get(Uri.parse(_apiBase).resolve(path), headers: await _headers())
        .timeout(const Duration(seconds: 20));
    return _unwrap(res);
  } on _ApiError {
    rethrow;
  } catch (_) {
    throw _ApiError("Can't reach Zubia. Check your connection.");
  }
}

Future<Map<String, dynamic>> _apiPost(String path, Object body) async {
  try {
    final res = await http
        .post(
          Uri.parse(_apiBase).resolve(path),
          headers: await _headers(json: true),
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 20));
    return _unwrap(res);
  } on _ApiError {
    rethrow;
  } catch (_) {
    throw _ApiError("Can't reach Zubia. Check your connection.");
  }
}

/// Saved listings, kept on this phone. Only the count is shown here.
class _SavedStore extends ChangeNotifier {
  factory _SavedStore() => _instance;
  _SavedStore._();
  static final _SavedStore _instance = _SavedStore._();

  static const _key = 'zubia.saved';
  SharedPreferences? _prefs;

  Future<void> load() async {
    _prefs = await SharedPreferences.getInstance();
    notifyListeners();
  }

  List<String> get ids => _prefs?.getStringList(_key) ?? const [];
}

// ═══════════════════════════════════════════════════════════════
//  THE WIDGET
// ═══════════════════════════════════════════════════════════════

/// Account and settings.
///
/// Signing in is offered, never required: searching, saving and
/// enquiring all work signed out, and asking someone to make an account
/// before they have seen a single room is how a property app loses its
/// first-time users. So the signed-out state is a card that explains
/// who signing in is for, not a wall.
/// Takes no parameters: it switches tabs in code.
class ZubiaProfile extends StatefulWidget {
  const ZubiaProfile({super.key, this.width, this.height});

  /// FlutterFlow fills these in from the canvas when "Width and Height"
  /// is switched on. They are not something to wire up, but the
  /// constructor has to accept them or saving fails with:
  /// Parameter "width" not found.
  final double? width;
  final double? height;

  @override
  State<ZubiaProfile> createState() => _ZubiaProfileState();
}

class _ZubiaProfileState extends State<ZubiaProfile> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  /// Null when signed out.
  Map<String, dynamic>? _user;

  bool _busy = false;
  String? _error;

  bool get _signedIn => _user != null;

  String get _displayName =>
      (_user?['fullName'] as String?) ?? (_user?['email'] as String?) ?? '';

  String get _userEmail => (_user?['email'] as String?) ?? '';

  @override
  void initState() {
    super.initState();
    _SavedStore().load();
    _restore();
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  /// Checks the stored token on open. An expired one is dropped quietly
  /// and the person carries on browsing signed out, because none of the
  /// four pages needs an account.
  Future<void> _restore() async {
    if (await _readToken() == null) return;
    try {
      final data = await _apiGet('/api/v1/auth/me');
      if (!mounted) return;
      setState(() => _user = data['user'] as Map<String, dynamic>?);
    } on _ApiError catch (e) {
      if (e.isUnauthorized) await _writeToken(null);
    }
  }

  Future<void> _signIn() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final data = await _apiPost('/api/v1/auth/login', {
        'email': _email.text.trim(),
        'password': _password.text,
      });
      await _writeToken(data['token'] as String?);
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      setState(() {
        _user = data['user'] as Map<String, dynamic>?;
        _password.clear();
        _busy = false;
      });
    } on _ApiError catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _busy = false;
      });
    }
  }

  Future<void> _signOut() async {
    try {
      await http
          .delete(Uri.parse(_apiBase).resolve('/api/v1/auth/me'),
              headers: await _headers())
          .timeout(const Duration(seconds: 20));
    } catch (_) {
      // Offline: still forget the token locally. The session row is
      // revoked next time the server hears from this device.
    }
    await _writeToken(null);
    if (!mounted) return;
    setState(() => _user = null);
  }

  double get _padH =>
      (MediaQuery.sizeOf(context).width * 0.04).clamp(14.0, 22.0);

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    _ui = (mq.size.width / 390).clamp(0.86, 1.08);

    return MediaQuery(
      data: mq.copyWith(
        textScaler:
            mq.textScaler.clamp(minScaleFactor: 0.9, maxScaleFactor: 1.2),
      ),
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.dark
            .copyWith(statusBarColor: Colors.transparent),
        child: Container(
          width: widget.width ?? mq.size.width,
          height: widget.height ?? mq.size.height,
          color: _bg,
          child: Scaffold(
            backgroundColor: _bg,
            body: Stack(
              children: [
                _GlassArrive(
                  child: ListenableBuilder(
                    listenable: _SavedStore(),
                    builder: (context, _) => ListView(
                      physics: const BouncingScrollPhysics(
                          parent: AlwaysScrollableScrollPhysics()),
                      padding: EdgeInsets.only(
                        top: mq.padding.top + 8,
                        bottom: mq.padding.bottom + _tabBarHeight + 24,
                      ),
                      children: [
                        _header(),
                        const SizedBox(height: 16),
                        if (_signedIn) _accountCard() else _guestCard(),
                        const SizedBox(height: 10),
                        _quickRow(),
                        _groupTitle('Your privacy'),
                        _privacy(),
                        _groupTitle('About'),
                        _group([
                          _row(
                            icon: Icons.info_outline_rounded,
                            title: 'Version',
                            trailing: '0.1.0',
                          ),
                        ]),
                        if (_signedIn) ...[
                          const SizedBox(height: 22),
                          _group([
                            _row(
                              icon: Icons.logout_rounded,
                              title: 'Sign out',
                              destructive: true,
                              onTap: _confirmSignOut,
                            ),
                          ]),
                        ],
                        const SizedBox(height: 28),
                        Center(
                          child: Column(
                            children: [
                              Text('Zubia',
                                  style: _txt(12.5,
                                      weight: FontWeight.w600, color: _mid)),
                              Text("Uganda's property marketplace",
                                  style: _txt(11.5, color: _light)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 14,
                  right: 14,
                  bottom: mq.padding.bottom + 8,
                  child: _tabBar(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- Header ------------------------------------------------------------

  Widget _header() {
    final name = _signedIn ? _displayName.trim() : '';
    final first = name.isEmpty ? '' : name.split(' ').first;
    final initial = name.isEmpty ? 'Z' : name[0].toUpperCase();

    return Padding(
      padding: EdgeInsets.fromLTRB(_padH, 8, _padH, 0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  first.isNotEmpty ? 'Hi, $first' : 'Profile',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: _title(26, weight: FontWeight.w800),
                ),
                if (_signedIn && _userEmail.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(_userEmail,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: _txt(13, color: _mid)),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          Container(
            width: 54,
            height: 54,
            decoration:
                const BoxDecoration(color: _brand, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(initial, style: _title(21, color: _white)),
          ),
        ],
      ),
    );
  }

  // --- Account -----------------------------------------------------------

  Widget _accountCard() => Padding(
        padding: EdgeInsets.symmetric(horizontal: _padH),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _brandPale,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              const Icon(Icons.verified_user_rounded, size: 20, color: _brand),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  "You're signed in. Listings you manage are tied to this "
                  'account.',
                  style: _txt(13, color: _inkSoft, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      );

  /// The signed-out state. The form sits inside the card rather than
  /// behind a button, because one extra tap on an optional thing is how
  /// an optional thing never gets done by the agents who do need it.
  Widget _guestCard() => Padding(
        padding: EdgeInsets.symmetric(horizontal: _padH),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: _brandPale,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sign in', style: _title(19)),
                const SizedBox(height: 5),
                Text(
                  'Optional. Searching, saving and enquiring all work '
                  'without an account — signing in is for agents and owners '
                  'managing their own listings.',
                  style: _txt(13, color: _inkSoft, height: 1.45),
                ),
                const SizedBox(height: 16),
                _Field(
                  controller: _email,
                  hint: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  autofill: const [AutofillHints.email],
                  validator: (v) => (v == null || !v.contains('@'))
                      ? 'Check that email address.'
                      : null,
                ),
                const SizedBox(height: 10),
                _Field(
                  controller: _password,
                  hint: 'Password',
                  obscure: true,
                  autofill: const [AutofillHints.password],
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Enter your password.' : null,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.error_outline_rounded,
                          size: 16, color: _ember),
                      const SizedBox(width: 7),
                      Expanded(
                        child: Text(_error!,
                            style: _txt(12.5, color: _ember, height: 1.4)),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                _Pressable(
                  scale: 0.98,
                  onTap: _busy ? null : _signIn,
                  child: Container(
                    height: 52,
                    width: double.infinity,
                    alignment: Alignment.center,
                    decoration: _liquid(tint: _brand, radius: 26),
                    child: _busy
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: _white),
                          )
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.login_rounded,
                                  size: 18, color: _white),
                              const SizedBox(width: 8),
                              Text('Sign in',
                                  style: _txt(15,
                                      weight: FontWeight.w600,
                                      color: _white)),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );

  // --- Quick tiles -------------------------------------------------------

  Widget _quickRow() {
    final saved = _SavedStore().ids.length;

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: _padH),
      child: Row(
        children: [
          Expanded(
            child: _quickTile(
              icon: Icons.favorite_rounded,
              iconBg: _clayPale,
              iconColor: _clay,
              title: 'Saved',
              sub: saved == 0 ? 'Tap ♥ on a listing' : '$saved on this phone',
              onTap: () => ZubiaHome.openTab(context, 2),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _quickTile(
              icon: Icons.search_rounded,
              iconBg: _brandPale,
              iconColor: _brand,
              title: 'Search',
              sub: 'Rentals, homes, land',
              onTap: () => ZubiaHome.openTab(context, 1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _quickTile({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String sub,
    required VoidCallback onTap,
  }) =>
      _Pressable(
        scale: 0.97,
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _tile,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration:
                    BoxDecoration(color: iconBg, shape: BoxShape.circle),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: _txt(13.5,
                            weight: FontWeight.w600, color: _ink)),
                    Text(sub,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: _txt(11.5, color: _mid)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );

  // --- Grouped rows ------------------------------------------------------

  Widget _groupTitle(String t) => Padding(
        padding: EdgeInsets.fromLTRB(_padH + 6, 22, _padH, 8),
        child: Text(t.toUpperCase(),
            style: _txt(11.5, weight: FontWeight.w600, color: _mid)),
      );

  Widget _group(List<Widget> rows) => Padding(
        padding: EdgeInsets.symmetric(horizontal: _padH),
        child: Container(
          decoration: BoxDecoration(
            color: _tile,
            borderRadius: BorderRadius.circular(18),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              for (var i = 0; i < rows.length; i++) ...[
                if (i > 0)
                  const Padding(
                    padding: EdgeInsets.only(left: 58),
                    child:
                        Divider(height: 1, thickness: 1, color: _hairline),
                  ),
                rows[i],
              ],
            ],
          ),
        ),
      );

  Widget _row({
    required IconData icon,
    required String title,
    String? sub,
    String? trailing,
    bool destructive = false,
    VoidCallback? onTap,
  }) {
    final color = destructive ? _ember : _ink;

    return _PressRow(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 11, 12, 11),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: destructive ? _emberPale : _white,
                borderRadius: BorderRadius.circular(9),
              ),
              alignment: Alignment.center,
              child:
                  Icon(icon, size: 18, color: destructive ? _ember : _brand),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style:
                          _txt(15, weight: FontWeight.w500, color: color)),
                  if (sub != null)
                    Text(sub,
                        maxLines: 2,
                        style: _txt(12, color: _mid, height: 1.35)),
                ],
              ),
            ),
            if (trailing != null)
              Text(trailing,
                  style: _txt(14, weight: FontWeight.w600, color: _mid))
            else if (onTap != null && !destructive)
              const Icon(Icons.chevron_right_rounded,
                  size: 20, color: _light),
          ],
        ),
      ),
    );
  }

  // --- Privacy -----------------------------------------------------------

  Widget _privacy() {
    // Said plainly, because it is a promise and not a feature: in a
    // market where a landlord knowing you are desperate changes the
    // price, where this data sits matters.
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: _padH),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _tile,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                      color: _white, shape: BoxShape.circle),
                  child: const Icon(Icons.lock_outline_rounded,
                      size: 17, color: _brand),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Text('Kept on this phone',
                      style:
                          _txt(14.5, weight: FontWeight.w600, color: _ink)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Saved places never leave this device. Nothing about what you '
              'are looking for is sent to Zubia until you enquire about a '
              'particular listing.',
              style: _txt(13, color: _inkSoft, height: 1.5),
            ),
            const SizedBox(height: 10),
            Text(
              'Zubia never charges the person looking for a home.',
              style: _txt(13,
                  weight: FontWeight.w600, color: _brand, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  // --- Confirm -----------------------------------------------------------

  /// Two stacked full-width buttons rather than a dialog with two small
  /// ones side by side — on a phone the destructive choice should not
  /// be a thumb-width away from the safe one.
  void _confirmSignOut() {
    HapticFeedback.mediumImpact();
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SafeArea(
        child: Container(
          margin: const EdgeInsets.all(10),
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
          decoration: BoxDecoration(
            color: _white,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: _hairline,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 18),
              Text('Sign out?', style: _title(19), textAlign: TextAlign.center),
              const SizedBox(height: 6),
              Text(
                "You'll need to sign in again to manage your listings. Your "
                'saved places stay on this phone either way.',
                textAlign: TextAlign.center,
                style: _txt(13.5, color: _mid, height: 1.45),
              ),
              const SizedBox(height: 20),
              _Pressable(
                scale: 0.98,
                onTap: () {
                  Navigator.pop(ctx);
                  _signOut();
                },
                child: Container(
                  height: 50,
                  width: double.infinity,
                  alignment: Alignment.center,
                  decoration: _liquid(tint: _ember, radius: 25),
                  child: Text('Sign out',
                      style:
                          _txt(15, weight: FontWeight.w600, color: _white)),
                ),
              ),
              const SizedBox(height: 8),
              _Pressable(
                scale: 0.98,
                onTap: () => Navigator.pop(ctx),
                child: Container(
                  height: 50,
                  width: double.infinity,
                  alignment: Alignment.center,
                  decoration: _liquid(radius: 25),
                  child: Text('Cancel',
                      style: _txt(15, weight: FontWeight.w600, color: _ink)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- Tab bar -----------------------------------------------------------

  Widget _tabBar() => ListenableBuilder(
        listenable: _SavedStore(),
        builder: (_, __) => _Glass(
                height: _tabBarHeight,
                radius: _tabBarHeight / 2,
                blur: 26,
                child: Row(
                  children: [
                    _tab(Icons.home_outlined, 'Home', false, 0, 0),
                    _tab(Icons.search_rounded, 'Search', false,
                        1, 0),
                    _tab(Icons.favorite_border_rounded, 'Saved', false,
                        2, _SavedStore().ids.length),
                    _tab(Icons.person_rounded, 'Profile', true, 3, 0),
                  ],
                ),
              ),
      );

  Widget _tab(
    IconData icon,
    String label,
    bool active,
    int index,
    int badge,
  ) {
    final color = active ? _brand : _ink.withOpacity(0.72);

    return Expanded(
      child: _Pressable(
        scale: 0.90,
        onTap: active
            ? null
            : () {
                HapticFeedback.selectionClick();
                ZubiaHome.openTab(context, index);
              },
        child: Container(
          height: _tabBarHeight,
          margin: const EdgeInsets.all(4),
          decoration: active
              ? BoxDecoration(
                  borderRadius: BorderRadius.circular((_tabBarHeight - 8) / 2),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      _brand.withOpacity(0.20),
                      _brand.withOpacity(0.10),
                    ],
                  ),
                  border: Border.all(color: _white.withOpacity(0.85)),
                )
              : null,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: 24,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(icon, size: 21, color: color),
                    if (badge > 0)
                      Positioned(
                        right: -7,
                        top: -3,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 4.5, vertical: 1),
                          constraints: const BoxConstraints(minWidth: 16),
                          decoration: BoxDecoration(
                            color: _clay,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(
                                color: _white.withOpacity(0.9), width: 1),
                          ),
                          alignment: Alignment.center,
                          child: Text(badge > 99 ? '99+' : '$badge',
                              style: _txt(9.5,
                                  weight: FontWeight.w700,
                                  color: _white,
                                  height: 1.2)),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 1),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(label,
                    maxLines: 1,
                    style: _txt(9.5,
                        weight: active ? FontWeight.w600 : FontWeight.w500,
                        color: color,
                        height: 1.1)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
