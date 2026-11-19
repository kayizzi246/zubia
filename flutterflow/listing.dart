// Automatic FlutterFlow imports
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/widgets/index.dart'; // Imports other custom widgets
import '/custom_code/actions/index.dart'; // Imports custom actions
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
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ═══════════════════════════════════════════════════════════════
//  WHERE THE WEB APP LIVES
//
//  The one line to change when you deploy. Must match the value in
//  home.dart, search.dart, saved.dart and profile.dart.
// ═══════════════════════════════════════════════════════════════
const String _apiBase = 'http://localhost:3001';

/// Which listing the page shows, e.g. "zb-046".
///
/// Set this immediately before opening the page and it is read on the
/// way in. It exists so the Listing page needs no parameter: Home,
/// Search and Saved each set it and then navigate.
///
/// Public on purpose: in FlutterFlow the other custom widgets see it
/// through `custom_code/widgets/index.dart`.
String zubiaListingId = '';

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
const Color _brandDark = Color(0xFF11513A);
const Color _brandPale = Color(0xFFEDF6F1);
const Color _mint = Color(0xFF74CCA4);
const Color _clay = Color(0xFFA8441F);
const Color _clayPale = Color(0xFFFBF1EC);
const Color _ember = Color(0xFFC0392B);

const Cubic _ease = Cubic(0.23, 1, 0.32, 1);

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
    TextDirection? textDirection,
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
    this.padding,
  });

  final Widget child;
  final double? height;
  final double radius;
  final double blur;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            height: height,
            padding: padding,
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

class _Skeleton extends StatefulWidget {
  const _Skeleton(this.width, this.height, {this.radius = 12});

  final double width;
  final double height;
  final double radius;

  @override
  State<_Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<_Skeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _c,
        builder: (_, __) => Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: Color.lerp(_tile, _hairline, _c.value),
            borderRadius: BorderRadius.circular(widget.radius),
          ),
        ),
      );
}

/// A text field styled to match the tiles, with no Material underline
/// or outline fighting the flat look.
class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.hint,
    this.validator,
    this.keyboardType,
    this.maxLines = 1,
    this.capitalisation = TextCapitalization.none,
  });

  final TextEditingController controller;
  final String hint;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final int maxLines;
  final TextCapitalization capitalisation;

  @override
  Widget build(BuildContext context) => TextFormField(
        controller: controller,
        validator: validator,
        keyboardType: keyboardType,
        maxLines: maxLines,
        textCapitalization: capitalisation,
        cursorColor: _brand,
        style: _txt(15, color: _ink),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: _txt(15, color: _light),
          filled: true,
          fillColor: _tile,
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
  _ApiError(this.message);
  final String message;
  @override
  String toString() => message;
}

Map<String, dynamic> _unwrap(http.Response res) {
  Map<String, dynamic> body;
  try {
    body = jsonDecode(res.body) as Map<String, dynamic>;
  } catch (_) {
    throw _ApiError('The server sent something unexpected. Try again.');
  }

  // The server wraps every response as { data } or { error }, so a
  // failure arrives with the wording it wrote — including the
  // rate-limit message, which explains itself better than "429" would.
  final error = body['error'];
  if (error is Map<String, dynamic>) {
    throw _ApiError(error['message'] as String? ?? 'Something went wrong.');
  }
  final data = body['data'];
  if (data is Map<String, dynamic>) return data;
  throw _ApiError('The server sent no data.');
}

Future<Map<String, dynamic>> _apiGet(String path) async {
  try {
    final res = await http.get(
      Uri.parse(_apiBase).resolve(path),
      headers: const {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 20));
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
          headers: const {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
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

String _shortUgx(int amount) {
  if (amount >= 1000000) {
    final m = amount / 1000000;
    final t = m >= 100 || m == m.roundToDouble()
        ? m.round().toString()
        : m.toStringAsFixed(1);
    return '${t}M';
  }
  if (amount >= 1000) return '${(amount / 1000).round()}K';
  return '$amount';
}

String _fullUgx(int amount) =>
    'UGX ${amount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

class _Listing {
  _Listing(this.json);

  final Map<String, dynamic> json;

  String get id => json['id'] as String? ?? '';
  String get type => json['type'] as String? ?? 'rent';
  bool get isRent => type == 'rent';
  String get titleText => json['title'] as String? ?? '';
  int get priceUGX => (json['priceUGX'] as num?)?.toInt() ?? 0;
  String get area => json['area'] as String? ?? '';
  String get district => json['district'] as String? ?? '';
  int? get bedrooms => (json['bedrooms'] as num?)?.toInt();
  int? get bathrooms => (json['bathrooms'] as num?)?.toInt();
  int get sizeDecimals => (json['sizeDecimals'] as num?)?.toInt() ?? 0;
  bool get titleChecked => json['titleChecked'] as bool? ?? false;
  bool? get selfContained => json['selfContained'] as bool?;
  String? get unitType => json['unitType'] as String?;
  String get description => json['description'] as String? ?? '';
  String get tenure => json['tenure'] as String? ?? '';
  String get sellerType => json['sellerType'] as String? ?? 'owner';
  String? get sellerName => json['sellerName'] as String?;

  List<String> get photos => ((json['photos'] as List?) ?? const [])
      .map((p) => Uri.parse(_apiBase).resolve(p as String).toString())
      .toList(growable: false);

  Map<String, dynamic>? get moveIn => json['moveIn'] as Map<String, dynamic>?;
  int? get moveInTotal => (moveIn?['totalUGX'] as num?)?.toInt();

  /// The lines behind the total, as the server writes them: a label, an
  /// amount, and sometimes a note in plain words ("Refundable when you
  /// leave, if nothing is damaged. Get it in writing.").
  ///
  /// Taken from the server rather than rebuilt here, for the same
  /// reason the total is: the website, the app and anything built later
  /// must never word this differently.
  ///
  /// A zero line is kept when it carries a note, because "the landlord
  /// pays the broker on this one" is worth more than a hidden row.
  List<Map<String, dynamic>> get moveInLines =>
      (((moveIn?['breakdown'] as List?) ?? const [])
              .cast<Map<String, dynamic>>())
          .where((r) =>
              ((r['amountUGX'] as num?)?.toInt() ?? 0) > 0 ||
              (r['note'] as String?)?.isNotEmpty == true)
          .toList(growable: false);

  String get priceLabel => 'UGX ${_shortUgx(priceUGX)}${isRent ? '/month' : ''}';

  String get facts {
    if (isRent) {
      final parts = <String>[
        if (unitType != null) unitType!.replaceAll('_', ' '),
        if (selfContained == true) 'Self-contained',
      ];
      if (parts.isEmpty && bedrooms != null) parts.add('$bedrooms bd');
      return parts.join(' · ');
    }
    return <String>[
      if (bedrooms != null) '$bedrooms bds',
      if (bathrooms != null) '$bathrooms ba',
      '$sizeDecimals decimals',
      type == 'land' ? 'Land for sale' : 'For sale',
    ].join(' · ');
  }

  String get tenureLabel => switch (tenure) {
        'mailo' => 'Mailo',
        'freehold' => 'Freehold',
        'leasehold' => 'Leasehold',
        'kibanja' => 'Kibanja',
        'condominium' => 'Condominium',
        _ => tenure,
      };

  String get sellerLabel {
    final who = switch (sellerType) {
      'broker' => 'Broker',
      'agency' => 'Agency',
      'developer' => 'Developer',
      _ => isRent ? 'Landlord' : 'Owner',
    };
    return sellerName == null ? who : '$who — $sellerName';
  }
}

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
  bool isSaved(String id) => ids.contains(id);

  Future<void> toggle(String id) async {
    if (_prefs == null) await load();
    final list = [...ids];
    if (!list.remove(id)) list.insert(0, id);
    await _prefs!.setStringList(_key, list);
    notifyListeners();
  }
}

// ═══════════════════════════════════════════════════════════════
//  THE WIDGET
// ═══════════════════════════════════════════════════════════════

/// One listing in full, with the enquiry form.
///
/// The enquiry button floats in a glass bar at the bottom rather than
/// sitting at the end of the scroll. A call to action you have to
/// reach is one most people never reach, and on this page getting
/// someone in touch with the landlord is the whole point.
///
/// Takes no parameters. It shows [zubiaListingId], which whichever page
/// was tapped sets just before navigating here.
class ZubiaListing extends StatefulWidget {
  const ZubiaListing({super.key, this.width, this.height});

  /// FlutterFlow fills these in from the canvas when "Width and Height"
  /// is switched on. They are not something to wire up, but the
  /// constructor has to accept them or saving fails with:
  /// Parameter "width" not found.
  final double? width;
  final double? height;

  @override
  State<ZubiaListing> createState() => _ZubiaListingState();
}

class _ZubiaListingState extends State<ZubiaListing> {
  _Listing? _listing;
  String? _error;
  bool _loading = true;

  int _photo = 0;

  /// The warning the server writes, shown on every rental in every
  /// client, so nobody pays a "viewing fee" without having been told
  /// what that usually means.
  String _viewingFeeWarning = '';

  @override
  void initState() {
    super.initState();
    _SavedStore().load();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _apiGet('/api/v1/listings/$zubiaListingId');
      final json = (data['listing'] ?? data) as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        _listing = _Listing(json);
        _loading = false;
      });
    } on _ApiError catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
      return;
    }

    // Nothing waits on this: the warning simply appears a moment later.
    try {
      final meta = await _apiGet('/api/v1/meta');
      if (!mounted) return;
      setState(() =>
          _viewingFeeWarning = meta['viewingFeeWarning'] as String? ?? '');
    } on _ApiError {
      // Fine.
    }
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
        // The gallery runs under the status bar, so the clock and
        // battery need to be light over it.
        value: SystemUiOverlayStyle.light
            .copyWith(statusBarColor: Colors.transparent),
        child: Container(
          width: widget.width ?? mq.size.width,
          height: widget.height ?? mq.size.height,
          color: _bg,
          child: Scaffold(
            backgroundColor: _bg,
            body: _loading
                ? _loadingState(mq)
                : _error != null
                    ? _errorState(mq)
                    : _content(mq),
          ),
        ),
      ),
    );
  }

  Widget _loadingState(MediaQueryData mq) {
    final w = mq.size.width;
    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      children: [
        _Skeleton(w, mq.size.height * 0.42, radius: 0),
        Padding(
          padding: EdgeInsets.fromLTRB(_padH, 20, _padH, 0),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Skeleton(200, 30, radius: 8),
              SizedBox(height: 12),
              _Skeleton(150, 14, radius: 6),
              SizedBox(height: 24),
              _Skeleton(320, 96, radius: 20),
            ],
          ),
        ),
      ],
    );
  }

  Widget _errorState(MediaQueryData mq) => SafeArea(
        child: Stack(
          children: [
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 76,
                      height: 76,
                      decoration: const BoxDecoration(
                          color: _clayPale, shape: BoxShape.circle),
                      child: const Icon(Icons.cloud_off_rounded,
                          size: 32, color: _clay),
                    ),
                    const SizedBox(height: 16),
                    Text("Couldn't load this place", style: _title(19)),
                    const SizedBox(height: 8),
                    Text(_error!,
                        textAlign: TextAlign.center,
                        style: _txt(13.5, color: _mid, height: 1.5)),
                    const SizedBox(height: 20),
                    _Pressable(
                      scale: 0.98,
                      onTap: _load,
                      child: Container(
                        height: 46,
                        padding: const EdgeInsets.symmetric(horizontal: 22),
                        alignment: Alignment.center,
                        decoration: _liquid(tint: _brand, radius: 23),
                        child: Text('Try again',
                            style: _txt(15,
                                weight: FontWeight.w600, color: _white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              left: _padH,
              top: 8,
              child: _circle(Icons.arrow_back_rounded,
                  onDark: false, onTap: () => Navigator.of(context).maybePop()),
            ),
          ],
        ),
      );

  Widget _content(MediaQueryData mq) {
    final l = _listing!;

    return Stack(
      children: [
        CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _gallery(mq)),
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                  _padH, 20, _padH, mq.padding.bottom + 96),
              sliver: SliverList.list(
                children: [
                  Text(l.priceLabel,
                      style: _title(30, weight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(l.facts, style: _txt(15, color: _inkSoft)),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      const Icon(Icons.place_outlined, size: 15, color: _mid),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text('${l.area}, ${l.district}',
                            style: _txt(14, color: _mid)),
                      ),
                    ],
                  ),

                  if (l.moveInTotal != null) ...[
                    const SizedBox(height: 20),
                    _moveInPanel(l),
                  ],

                  const SizedBox(height: 22),
                  _facts(l),

                  const SizedBox(height: 24),
                  Text('About this place', style: _title(17)),
                  const SizedBox(height: 8),
                  Text(l.description,
                      style: _txt(14.5, color: _inkSoft, height: 1.55)),

                  if (l.isRent && _viewingFeeWarning.isNotEmpty) ...[
                    const SizedBox(height: 22),
                    Container(
                      padding: const EdgeInsets.all(15),
                      decoration: BoxDecoration(
                        color: _clayPale,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.info_outline_rounded,
                              size: 19, color: _clay),
                          const SizedBox(width: 11),
                          Expanded(
                            child: Text(_viewingFeeWarning,
                                style: _txt(13,
                                    color: _inkSoft, height: 1.5)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),

        // Floating controls over the gallery.
        Positioned(
          left: _padH,
          right: _padH,
          top: mq.padding.top + 8,
          child: Row(
            children: [
              _circle(Icons.arrow_back_rounded,
                  onDark: true, onTap: () => Navigator.of(context).maybePop()),
              const Spacer(),
              ListenableBuilder(
                listenable: _SavedStore(),
                builder: (_, __) {
                  final saved = _SavedStore().isSaved(l.id);
                  return _circle(
                    saved
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    onDark: true,
                    colour: saved ? _mint : _white,
                    onTap: () => _SavedStore().toggle(l.id),
                  );
                },
              ),
            ],
          ),
        ),

        Positioned(
          left: 14,
          right: 14,
          bottom: mq.padding.bottom + 10,
          child: _enquireBar(l),
        ),
      ],
    );
  }

  Widget _circle(
    IconData icon, {
    required bool onDark,
    required VoidCallback onTap,
    Color? colour,
  }) =>
      _Pressable(
        scale: 0.88,
        onTap: onTap,
        child: Container(
          width: 38,
          height: 38,
          decoration: _liquid(circle: true, onDark: onDark),
          child: Icon(icon,
              size: 19, color: colour ?? (onDark ? _white : _ink)),
        ),
      );

  // --- Gallery -----------------------------------------------------------

  Widget _gallery(MediaQueryData mq) {
    final photos = _listing!.photos;
    final height = mq.size.height * 0.42;

    if (photos.isEmpty) {
      return SizedBox(
        height: height,
        child: const ColoredBox(
          color: _tile,
          child: Center(
            child: Icon(Icons.image_not_supported_outlined,
                color: _light, size: 34),
          ),
        ),
      );
    }

    return SizedBox(
      height: height,
      child: Stack(
        fit: StackFit.expand,
        children: [
          PageView.builder(
            itemCount: photos.length,
            onPageChanged: (i) => setState(() => _photo = i),
            itemBuilder: (_, i) => CachedNetworkImage(
              imageUrl: photos[i],
              fit: BoxFit.cover,
              placeholder: (_, __) => const ColoredBox(color: _tile),
              errorWidget: (_, __, ___) => const ColoredBox(color: _tile),
            ),
          ),

          // A scrim under the top controls, so a white chevron does not
          // vanish against a bright sky.
          IgnorePointer(
            child: Align(
              alignment: Alignment.topCenter,
              child: FractionallySizedBox(
                heightFactor: 0.32,
                widthFactor: 1,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        _ink.withOpacity(0.38),
                        _ink.withOpacity(0),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          if (photos.length > 1)
            Positioned(
              bottom: 14,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < photos.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 240),
                      curve: _ease,
                      width: i == _photo ? 18 : 6,
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(3),
                        color: i == _photo
                            ? _white
                            : _white.withOpacity(0.55),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // --- Move-in -----------------------------------------------------------

  /// The lump sum, broken down. The number that decides whether a
  /// viewing is worth the trip across town.
  Widget _moveInPanel(_Listing l) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: _brandPale,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: const BoxDecoration(
                      color: _white, shape: BoxShape.circle),
                  child: const Icon(Icons.account_balance_wallet_outlined,
                      size: 16, color: _brand),
                ),
                const SizedBox(width: 10),
                Text('To move in you need',
                    style:
                        _txt(13, weight: FontWeight.w600, color: _inkSoft)),
              ],
            ),
            const SizedBox(height: 12),
            Text(_fullUgx(l.moveInTotal!),
                style: _title(25, weight: FontWeight.w800, color: _brandDark)),
            if (l.moveInLines.isNotEmpty) ...[
              const SizedBox(height: 14),
              for (final line in l.moveInLines) _moveInLine(line),
            ],
          ],
        ),
      );

  Widget _moveInLine(Map<String, dynamic> line) {
    final months = (line['months'] as num?)?.toInt() ?? 0;
    final amount = (line['amountUGX'] as num?)?.toInt() ?? 0;
    final note = line['note'] as String?;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  months > 0
                      ? '${line['label']} · $months ${months == 1 ? 'month' : 'months'}'
                      : '${line['label'] ?? ''}',
                  style: _txt(13.5, weight: FontWeight.w600, color: _ink),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                amount > 0 ? _fullUgx(amount) : 'Nothing',
                style: _txt(13.5,
                    weight: FontWeight.w600,
                    color: amount > 0 ? _ink : _brand),
              ),
            ],
          ),
          if (note != null && note.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(note, style: _txt(12, color: _mid, height: 1.4)),
          ],
        ],
      ),
    );
  }

  // --- Facts -------------------------------------------------------------

  Widget _facts(_Listing l) {
    final rows = <(String, String)>[
      ('Tenure', l.tenureLabel),
      ('Title checked', l.titleChecked ? 'Yes' : 'Not yet'),
      ('Plot size', '${l.sizeDecimals} decimals'),
      ('Listed by', l.sellerLabel),
    ];

    return Container(
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
                padding: EdgeInsets.only(left: 14),
                child: Divider(height: 1, thickness: 1, color: _hairline),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 13, 14, 13),
              child: Row(
                children: [
                  Expanded(
                    child: Text(rows[i].$1,
                        style: _txt(14.5, color: _inkSoft)),
                  ),
                  Text(rows[i].$2,
                      style:
                          _txt(14.5, weight: FontWeight.w600, color: _ink)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // --- Enquire -----------------------------------------------------------

  Widget _enquireBar(_Listing l) => _Glass(
        height: 64,
        radius: 32,
        blur: 26,
        padding: const EdgeInsets.fromLTRB(18, 0, 6, 0),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l.priceLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: _title(17)),
                  if (l.moveInTotal != null)
                    Text('Move in ${_fullUgx(l.moveInTotal!)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: _txt(11.5, color: _clay)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            _Pressable(
              scale: 0.98,
              onTap: () => _openEnquiry(l),
              child: Container(
                height: 52,
                padding: const EdgeInsets.symmetric(horizontal: 22),
                alignment: Alignment.center,
                decoration: _liquid(tint: _brand, radius: 26),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.chat_bubble_outline_rounded,
                        size: 18, color: _white),
                    const SizedBox(width: 8),
                    Text('Enquire',
                        style: _txt(15,
                            weight: FontWeight.w600, color: _white)),
                  ],
                ),
              ),
            ),
          ],
        ),
      );

  Future<void> _openEnquiry(_Listing l) => showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        backgroundColor: Colors.transparent,
        builder: (_) => _EnquirySheet(listing: l),
      );
}

/// The enquiry form.
///
/// Lands in the admin dashboard's inbox: the same inbox the website's
/// contact form writes to.
class _EnquirySheet extends StatefulWidget {
  const _EnquirySheet({required this.listing});

  final _Listing listing;

  @override
  State<_EnquirySheet> createState() => _EnquirySheetState();
}

class _EnquirySheetState extends State<_EnquirySheet> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  late final _message = TextEditingController(
    text: 'Hello, is "${widget.listing.titleText}" still available?',
  );

  bool _sending = false;
  String? _sendError;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _message.dispose();
    super.dispose();
  }

  String? _validateName(String? v) =>
      (v == null || v.trim().isEmpty) ? 'Enter your name.' : null;

  /// Ugandan numbers are 10 digits as people write them (0772 123 456),
  /// 9 without the leading zero, 12 with the country code. Nine is the
  /// shortest thing that could be real.
  String? _validatePhone(String? v) =>
      (v == null || v.replaceAll(RegExp(r'[^0-9]'), '').length < 9)
          ? 'They need a number to call you back on.'
          : null;

  String? _validateMessage(String? v) =>
      (v == null || v.trim().length < 5) ? 'Tell them a little more.' : null;

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _sending = true;
      _sendError = null;
    });

    // Captured before the await: this sheet is popped on success, so by
    // the time the snack bar is shown its own context is gone.
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      await _apiPost('/api/v1/messages', {
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
        'message': _message.text.trim(),
        'listingId': widget.listing.id,
      });
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      navigator.pop();
      messenger.showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: _ink,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          content: Text('Sent. They will call or WhatsApp you.',
              style: _txt(13.5, color: _white)),
        ),
      );
    } on _ApiError catch (e) {
      if (!mounted) return;
      setState(() {
        _sendError = e.message;
        _sending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    _ui = (mq.size.width / 390).clamp(0.86, 1.08);

    return Padding(
      // Lifts the sheet above the keyboard, or the send button sits
      // under it and cannot be reached.
      padding: EdgeInsets.only(bottom: mq.viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: _white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
        clipBehavior: Clip.antiAlias,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(top: 10, bottom: 8),
                decoration: BoxDecoration(
                  color: _hairline,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Enquire', style: _title(21)),
                      const SizedBox(height: 4),
                      Text(
                        'Your name and number go to whoever listed this '
                        'place, and nowhere else.',
                        style: _txt(13, color: _mid, height: 1.45),
                      ),
                      const SizedBox(height: 18),
                      _Field(
                        controller: _name,
                        hint: 'Your name',
                        capitalisation: TextCapitalization.words,
                        validator: _validateName,
                      ),
                      const SizedBox(height: 10),
                      _Field(
                        controller: _phone,
                        hint: 'Phone, e.g. 0772 123 456',
                        keyboardType: TextInputType.phone,
                        validator: _validatePhone,
                      ),
                      const SizedBox(height: 10),
                      _Field(
                        controller: _message,
                        hint: 'Your message',
                        maxLines: 4,
                        validator: _validateMessage,
                      ),
                      if (_sendError != null) ...[
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.error_outline_rounded,
                                size: 16, color: _ember),
                            const SizedBox(width: 7),
                            Expanded(
                              child: Text(_sendError!,
                                  style: _txt(12.5,
                                      color: _ember, height: 1.4)),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 20),
                      _Pressable(
                        scale: 0.98,
                        onTap: _sending ? null : _send,
                        child: Container(
                          height: 52,
                          width: double.infinity,
                          alignment: Alignment.center,
                          decoration: _liquid(tint: _brand, radius: 26),
                          child: _sending
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: _white),
                                )
                              : Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.send_rounded,
                                        size: 18, color: _white),
                                    const SizedBox(width: 8),
                                    Text('Send enquiry',
                                        style: _txt(15,
                                            weight: FontWeight.w600,
                                            color: _white)),
                                  ],
                                ),
                        ),
                      ),
                      SizedBox(height: mq.padding.bottom + 4),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
