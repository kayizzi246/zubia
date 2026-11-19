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
//  The one line to change when you deploy. Everything on this page —
//  the rails, the photos, the saved hearts — comes from the Next.js
//  app in /web, through its /api/v1 endpoints.
//
//    local dev   http://localhost:3001   (3000 if nothing else has it)
//    Android emulator talking to your laptop:  http://10.0.2.2:3001
//    live        https://zubia.ug
//
//  On a *web* build the browser enforces CORS. web/proxy.ts already
//  allows any localhost origin in development; add the real origin
//  there before shipping a web build.
// ═══════════════════════════════════════════════════════════════
const String _apiBase = 'http://localhost:3001';

// ═══════════════════════════════════════════════════════════════
//  TOKENS — identical in home, search, listing, saved and profile.
//  Flat: no shadows, no card borders. Glass only on what floats.
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
const Color _mint = Color(0xFF74CCA4);
const Color _clay = Color(0xFFA8441F);
const Color _clayPale = Color(0xFFFBF1EC);

/// One curve for every motion in the app.
const Cubic _ease = Cubic(0.23, 1, 0.32, 1);

const double _tabBarHeight = 56;

/// true  = the real Apple-style liquid glass bar (the ZubiaGlassTabBar
///         widget, drawn by the liquid_glass_widgets package).
/// false = the built-in glass bar below, which needs no package.
///
/// Set this to false in all four tab pages if the package will not
/// compile; nothing else has to change.
const bool _trueGlass = true;

/// Set once per build from the screen width.
double _ui = 1.0;

bool get _isApple =>
    !kIsWeb &&
    (defaultTargetPlatform == TargetPlatform.iOS ||
        defaultTargetPlatform == TargetPlatform.macOS);

/// Optical tracking: display sizes set tight, small sizes set loose.
double _trackingFor(double s) {
  if (s >= 24) return -0.025;
  if (s >= 20) return -0.020;
  if (s >= 17) return -0.013;
  if (s >= 15) return -0.007;
  if (s >= 13) return 0.0;
  return 0.008;
}

/// SF Pro where it is already on the device, the platform default
/// elsewhere. No downloaded font: these phones pay for data by the
/// megabyte and a font file is a tax on the first launch.
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

/// Liquid-glass surface for buttons: a soft top-to-bottom sheen with a
/// bright rim, like the controls on an iPhone. No blur, so it stays
/// cheap inside a scrolling list, and no shadow.
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

/// A rim that changes colour along its length, which is what makes a
/// glass edge look lit rather than outlined.
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

/// Real frosted glass: the page blurs underneath. Expensive, so it is
/// only for things that float — never a row in a scrolling list.
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

/// Anything tappable that is not a list row: it scales under the finger.
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

/// When the page opens, its content appears as if through frosted glass
/// that clears: blur 12 -> 0 over 300ms.
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

/// Grey blocks in the shape of what is coming, rather than a spinner.
/// A spinner says "wait"; this says "cards, shortly".
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

// ═══════════════════════════════════════════════════════════════
//  THE WEB APP'S API
//
//  Same seven endpoints the website itself uses. Every response is
//  wrapped as { data } or { error }, so a failure arrives with the
//  server's own wording rather than a status code.
// ═══════════════════════════════════════════════════════════════

class _ApiError implements Exception {
  _ApiError(this.message);
  final String message;
  @override
  String toString() => message;
}

Future<Map<String, dynamic>> _apiGet(
  String path, [
  Map<String, String>? query,
]) async {
  final uri = Uri.parse(_apiBase).resolve(path).replace(queryParameters: query);
  http.Response res;
  try {
    res = await http
        .get(uri, headers: const {'Accept': 'application/json'})
        // A Ugandan mobile connection stalls rather than fails, and a
        // request with no timeout leaves a spinner on screen forever.
        .timeout(const Duration(seconds: 20));
  } catch (_) {
    throw _ApiError("Can't reach Zubia. Check your connection.");
  }

  Map<String, dynamic> body;
  try {
    body = jsonDecode(res.body) as Map<String, dynamic>;
  } catch (_) {
    throw _ApiError('The server sent something unexpected. Try again.');
  }

  final error = body['error'];
  if (error is Map<String, dynamic>) {
    throw _ApiError(error['message'] as String? ?? 'Something went wrong.');
  }
  final data = body['data'];
  if (data is Map<String, dynamic>) return data;
  throw _ApiError('The server sent no data.');
}

/// UGX runs to seven figures for ordinary rent and nine for land, so a
/// full number does not fit on a card. 450000 -> "450K".
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

/// The full number with separators, for the places that have room.
String _fullUgx(int amount) =>
    'UGX ${amount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

/// One listing, as /api/v1/listings returns it.
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
  bool get featured => json['featured'] as bool? ?? false;
  bool get titleChecked => json['titleChecked'] as bool? ?? false;
  bool? get selfContained => json['selfContained'] as bool?;
  String? get unitType => json['unitType'] as String?;

  /// The API returns sample photos as site-relative paths and uploaded
  /// ones as absolute URLs. resolve() handles both, because an absolute
  /// URL is returned unchanged.
  List<String> get photos => ((json['photos'] as List?) ?? const [])
      .map((p) => Uri.parse(_apiBase).resolve(p as String).toString())
      .toList(growable: false);

  /// What a tenant must raise before they get the keys. The server
  /// computes it so the app and the website can never disagree.
  int? get moveInTotal =>
      ((json['moveIn'] as Map<String, dynamic>?)?['totalUGX'] as num?)?.toInt();

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

  String get address => '$titleText, $area, $district';
}

/// Saved listings, kept on this phone.
///
/// Deliberately local. Nothing about what someone is looking for leaves
/// the device until they enquire about a particular listing. In a market
/// where a landlord knowing you are desperate changes the price, that is
/// not a small thing.
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
    // Newly saved goes to the top, so the Saved page reads newest first
    // without storing a timestamp per listing.
    if (!list.remove(id)) list.insert(0, id);
    await _prefs!.setStringList(_key, list);
    notifyListeners();
  }
}

// ═══════════════════════════════════════════════════════════════
//  THE WIDGET
// ═══════════════════════════════════════════════════════════════

/// Zubia's home page.
///
/// For someone who has not decided what they are looking for yet;
/// Search is for someone who has. A search bar over a dark panel, one
/// recommended rail, one priced rail, then the three ways in.
///
/// Takes no parameters. Every move it makes — opening a listing, opening
/// a search, switching tabs — happens in code below, so there is nothing
/// to wire up in FlutterFlow. Drop it on a blank page and it works.
class ZubiaHome extends StatefulWidget {
  const ZubiaHome({super.key, this.width, this.height});

  /// FlutterFlow fills these in from the canvas when "Width and Height"
  /// is switched on. They are not something to wire up, but the
  /// constructor has to accept them or saving fails with:
  /// Parameter "width" not found.
  final double? width;
  final double? height;

  @override
  State<ZubiaHome> createState() => _ZubiaHomeState();
}

class _ZubiaHomeState extends State<ZubiaHome> {
  /// How many cards a rail holds. Twelve is three or four pages of
  /// swiping; past that nobody looks, and every extra card is another
  /// photo downloaded on a connection paying for it by the megabyte.
  static const _railSize = 12;

  List<_Listing> _recommended = const [];
  List<_Listing> _affordable = const [];
  bool _loading = true;
  String? _error;

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
      // One request for rentals, then the other two types, so the mix
      // shows that Zubia covers all three rather than burying two.
      final all = <_Listing>[];
      final rent = await _apiGet('/api/v1/listings', {
        'type': 'rent',
        'limit': '60',
        'offset': '0',
      });
      all.addAll(((rent['listings'] as List?) ?? const [])
          .map((j) => _Listing(j as Map<String, dynamic>)));

      for (final type in const ['buy', 'land']) {
        try {
          final page = await _apiGet('/api/v1/listings', {
            'type': type,
            'limit': '20',
            'offset': '0',
          });
          all.addAll(((page['listings'] as List?) ?? const [])
              .map((j) => _Listing(j as Map<String, dynamic>)));
        } on _ApiError {
          // One category failing must not empty the whole page.
        }
      }

      final picked = _recommend(all);

      /*
        The second rail is priced, not categorised. Rent is the decision
        most people arrive to make, and the number at the top of the card
        is what they decide on, so the cheapest rentals go first.

        Anything already in the first rail is left out: one listing shown
        twice on one screen looks like a bug.
      */
      final shown = picked.map((l) => l.id).toSet();
      final cheap = all.where((l) => l.isRent && !shown.contains(l.id)).toList()
        ..sort((a, b) => a.priceUGX.compareTo(b.priceUGX));

      if (!mounted) return;
      setState(() {
        _recommended = picked;
        _affordable = cheap.take(_railSize).toList(growable: false);
        _loading = false;
      });
    } on _ApiError catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  /// What to put in front of someone who has just arrived and has told
  /// us nothing about themselves: the hand-picked listings first, then a
  /// rotation through rentals, homes and land.
  List<_Listing> _recommend(List<_Listing> all) {
    final picked = all.where((l) => l.featured).take(4).toList();
    final pools = <String, List<_Listing>>{
      for (final t in const ['rent', 'buy', 'land'])
        t: all.where((l) => l.type == t && !l.featured).toList(),
    };

    const order = ['rent', 'buy', 'land'];
    var turn = 0;
    while (picked.length < _railSize && order.any((t) => pools[t]!.isNotEmpty)) {
      final pool = pools[order[turn % order.length]]!;
      if (pool.isNotEmpty) picked.add(pool.removeAt(0));
      turn += 1;
    }
    return picked;
  }

  double get _padH =>
      (MediaQuery.sizeOf(context).width * 0.04).clamp(14.0, 22.0);

  // --- Going places ------------------------------------------------------
  //
  // No callbacks and nothing to wire up: the pages know each other by
  // name, and the one value each needs travels in a public variable
  // declared beside the page that reads it.

  void _openSearch(String type) {
    zubiaSearchType = type;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ZubiaSearch()),
    );
  }

  void _openListing(String id) {
    zubiaListingId = id;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ZubiaListing()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    _ui = (mq.size.width / 390).clamp(0.86, 1.08);
    final bottom = mq.padding.bottom;

    return MediaQuery(
      // Someone on the largest text setting still gets bigger type; they
      // do not get a layout that breaks.
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
                  child: RefreshIndicator(
                    color: _brand,
                    backgroundColor: _white,
                    onRefresh: _load,
                    child: ListView(
                      physics: const BouncingScrollPhysics(
                          parent: AlwaysScrollableScrollPhysics()),
                      padding: EdgeInsets.only(
                        top: mq.padding.top + 8,
                        bottom: bottom + _tabBarHeight + 24,
                      ),
                      children: [
                        _wordmark(),
                        _hero(),
                        if (_error != null)
                          _errorState()
                        else ...[
                          _rail(
                            title: 'Recommended.',
                            accent: 'Start here.',
                            blurb: 'A mix of hand-picked places, rentals, '
                                'homes for sale and land — every card shows '
                                'what it really costs to move in.',
                            listings: _recommended,
                          ),
                          _rail(
                            title: 'Rentals on a budget.',
                            accent: 'Cheapest first.',
                            blurb: 'Sorted by monthly rent, lowest first.',
                            listings: _affordable,
                            onSeeAll: () => _openSearch('rent'),
                          ),
                        ],
                        _tiles(),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 14,
                  right: 14,
                  bottom: bottom + 8,
                  child: _tabBar(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- Wordmark ----------------------------------------------------------

  Widget _wordmark() => Padding(
        padding: EdgeInsets.fromLTRB(_padH, 4, _padH, 12),
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: _brand,
                borderRadius: BorderRadius.circular(9),
              ),
              alignment: Alignment.center,
              child: Text('Z', style: _title(17, color: _white)),
            ),
            const SizedBox(width: 9),
            Text('Zubia', style: _title(20)),
            const Spacer(),
            _Pressable(
              scale: 0.88,
              onTap: () => _openSearch('rent'),
              child: Container(
                width: 38,
                height: 38,
                decoration: _liquid(circle: true),
                child: const Icon(Icons.search_rounded, size: 19, color: _ink),
              ),
            ),
          ],
        ),
      );

  // --- Hero --------------------------------------------------------------

  Widget _hero() => Padding(
        padding: EdgeInsets.symmetric(horizontal: _padH),
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 26, 20, 22),
          decoration: BoxDecoration(
            // Ink rather than black, so the panel belongs to the palette.
            color: _ink,
            borderRadius: BorderRadius.circular(26),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "UGANDA'S PROPERTY MARKETPLACE",
                style: _txt(10, weight: FontWeight.w700, color: _mint)
                    .copyWith(letterSpacing: 1.4),
              ),
              const SizedBox(height: 12),
              Text(
                'Homes. Rentals.\nLand. All of Uganda.',
                style: _title(27, weight: FontWeight.w800, color: _white)
                    .copyWith(height: 1.14),
              ),
              const SizedBox(height: 10),
              Text(
                'Every listing shows the tenure, whether the title was '
                'searched, and what it really costs to move in.',
                style: _txt(13.5,
                    color: _white.withOpacity(0.82), height: 1.45),
              ),
              const SizedBox(height: 18),

              // Tapping opens the Search page rather than typing in
              // place: the keyboard would take half a phone screen and
              // leave the results nowhere to go.
              _Pressable(
                scale: 0.98,
                onTap: () => _openSearch('rent'),
                child: Container(
                  height: 50,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: _liquid(radius: 25),
                  child: Row(
                    children: [
                      const Icon(Icons.search_rounded, size: 19, color: _mid),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text('Enter an area, e.g. Ntinda',
                            style: _txt(14, color: _mid)),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final e in const [
                    ('Rentals', 'rent'),
                    ('Homes for sale', 'buy'),
                    ('Land', 'land'),
                  ])
                    _Pressable(
                      scale: 0.94,
                      onTap: () => _openSearch(e.$2),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: _liquid(onDark: true),
                        child: Text(e.$1,
                            style: _txt(12.5,
                                weight: FontWeight.w600, color: _white)),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      );

  // --- Rails -------------------------------------------------------------

  Widget _rail({
    required String title,
    required String accent,
    required String blurb,
    required List<_Listing> listings,
    VoidCallback? onSeeAll,
  }) {
    if (_loading) return _railSkeleton();
    if (listings.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(_padH, 26, _padH, 0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text.rich(
                      TextSpan(
                        style: _title(22, weight: FontWeight.w800),
                        children: [
                          TextSpan(text: '$title '),
                          TextSpan(
                              text: accent,
                              style: const TextStyle(color: _brand)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 5),
                    // A rail with no stated reason reads as filler, so
                    // each says why these listings and not others.
                    Text(blurb, style: _txt(12.5, color: _mid, height: 1.45)),
                  ],
                ),
              ),
              if (onSeeAll != null) ...[
                const SizedBox(width: 10),
                _Pressable(
                  scale: 0.92,
                  onTap: onSeeAll,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 13, vertical: 8),
                    decoration: BoxDecoration(
                      color: _brandPale,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text('See all',
                        style: _txt(12.5,
                            weight: FontWeight.w600, color: _brand)),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),
        SizedBox(
          // Tall enough for the photo, price, facts, move-in line and
          // address without the card clipping its own text.
          height: 300,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: EdgeInsets.symmetric(horizontal: _padH),
            itemCount: listings.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => _card(listings[i]),
          ),
        ),
      ],
    );
  }

  Widget _railSkeleton() => Padding(
        padding: EdgeInsets.fromLTRB(_padH, 26, 0, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _Skeleton(200, 22, radius: 7),
            const SizedBox(height: 10),
            const _Skeleton(260, 12, radius: 6),
            const SizedBox(height: 18),
            SizedBox(
              height: 300,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: 3,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, __) => const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Skeleton(268, 179, radius: 18),
                    SizedBox(height: 12),
                    _Skeleton(130, 18, radius: 7),
                    SizedBox(height: 8),
                    _Skeleton(190, 12, radius: 6),
                  ],
                ),
              ),
            ),
          ],
        ),
      );

  // --- One card ----------------------------------------------------------

  Widget _card(_Listing l) {
    final photos = l.photos;

    return _Pressable(
      scale: 0.98,
      onTap: () => _openListing(l.id),
      child: SizedBox(
        width: 268,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: AspectRatio(
                aspectRatio: 3 / 2,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (photos.isEmpty)
                      const ColoredBox(color: _tile)
                    else
                      CachedNetworkImage(
                        imageUrl: photos.first,
                        fit: BoxFit.cover,
                        memCacheWidth: 640,
                        // A tinted block, not a spinner: one spinner per
                        // card turns a list into a slot machine.
                        placeholder: (_, __) => const ColoredBox(color: _tile),
                        errorWidget: (_, __, ___) => const ColoredBox(
                          color: _tile,
                          child: Icon(Icons.image_not_supported_outlined,
                              color: _light, size: 26),
                        ),
                      ),
                    if (l.featured)
                      Positioned(
                        left: 10,
                        top: 10,
                        child: _tag('Featured', solid: true),
                      )
                    else if (l.selfContained == true)
                      Positioned(
                        left: 10,
                        top: 10,
                        child: _tag('Self-contained'),
                      )
                    else if (l.titleChecked)
                      Positioned(
                        left: 10,
                        top: 10,
                        child: _tag('Title checked'),
                      ),
                    Positioned(
                      right: 8,
                      top: 8,
                      child: ListenableBuilder(
                        listenable: _SavedStore(),
                        builder: (_, __) {
                          final saved = _SavedStore().isSaved(l.id);
                          return _Pressable(
                            scale: 0.82,
                            onTap: () => _SavedStore().toggle(l.id),
                            child: Container(
                              width: 34,
                              height: 34,
                              decoration: _liquid(circle: true, onDark: true),
                              child: Icon(
                                saved
                                    ? Icons.favorite_rounded
                                    : Icons.favorite_border_rounded,
                                size: 18,
                                // White reads against a photo of any
                                // brightness; saved goes to mint.
                                color: saved ? _mint : _white,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(l.priceLabel, style: _title(20)),
            const SizedBox(height: 3),
            Text(l.facts,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: _txt(13, color: _inkSoft)),

            // The lump sum before the keys change hands. Stating it on
            // the card is the point of the whole product: nobody should
            // travel to a viewing to find the landlord wants four months
            // up front.
            if (l.moveInTotal != null) ...[
              const SizedBox(height: 5),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _clayPale,
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Text(
                  'Move in ${_fullUgx(l.moveInTotal!)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: _txt(11.5, weight: FontWeight.w600, color: _clay),
                ),
              ),
            ],

            const SizedBox(height: 5),
            Text(l.address,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: _txt(12.5, color: _mid, height: 1.35)),
          ],
        ),
      ),
    );
  }

  Widget _tag(String label, {bool solid = false}) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        decoration: solid
            ? BoxDecoration(
                color: _clay,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _white.withOpacity(0.35)),
              )
            : _liquid(onDark: true, radius: 8),
        child: Text(label,
            style: _txt(10.5, weight: FontWeight.w700, color: _white)),
      );

  // --- The three ways in -------------------------------------------------

  Widget _tiles() {
    /*
      One colour each, at full strength. Brand green, clay and ink —
      three depths rather than three hues, so the row reads as one
      family. White clears 4.5:1 on all three.
    */
    const tiles = [
      (
        'Buy a home',
        'Houses and apartments for sale, with the tenure and title status '
            'on every listing.',
        Icons.key_rounded,
        _brand,
        'buy',
      ),
      (
        'Rent a home',
        'From self-contained units to family homes, with the move-in cost '
            'on every card.',
        Icons.meeting_room_rounded,
        _clay,
        'rent',
      ),
      (
        'Land and plots',
        'Plots with the tenure stated and the title checked.',
        Icons.landscape_rounded,
        _ink,
        'land',
      ),
    ];

    return Padding(
      padding: EdgeInsets.fromLTRB(_padH, 30, _padH, 0),
      child: Column(
        children: [
          for (final t in tiles)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _Pressable(
                scale: 0.98,
                onTap: () => _openSearch(t.$5),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: t.$4,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: _liquid(onDark: true, circle: true),
                            child: Icon(t.$3, size: 19, color: _white),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(t.$1,
                                style: _title(19,
                                    weight: FontWeight.w800, color: _white)),
                          ),
                          const Icon(Icons.arrow_forward_rounded,
                              size: 18, color: _white),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(t.$2,
                          style: _txt(13.5,
                              color: _white.withOpacity(0.82), height: 1.5)),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _errorState() => Padding(
        padding: const EdgeInsets.fromLTRB(32, 48, 32, 32),
        child: Column(
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
            Text("Couldn't load Zubia", style: _title(19)),
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
                    style: _txt(15, weight: FontWeight.w600, color: _white)),
              ),
            ),
          ],
        ),
      );

  // --- Tab bar -----------------------------------------------------------

  /// The floating liquid-glass bar. Home is index 0 here; each page
  /// widget hard-codes its own.
  Widget _tabBar() => ListenableBuilder(
        listenable: _SavedStore(),
        builder: (_, __) => _trueGlass
            ? const ZubiaGlassTabBar(activeIndex: 0)
            : _Glass(
                height: _tabBarHeight,
                radius: _tabBarHeight / 2,
                blur: 26,
                child: Row(
                  children: [
                    _tab(Icons.home_rounded, 'Home', true, 0, 0),
                    _tab(Icons.search_rounded, 'Search', false, 1, 0),
                    _tab(Icons.favorite_border_rounded, 'Saved', false, 2,
                        _SavedStore().ids.length),
                    _tab(Icons.person_outline_rounded, 'Profile', false, 3, 0),
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
                zubiaOpenTab(context, index);
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
                    // The count only appears when there is something to
                    // count, so the tab never nags for nothing.
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
