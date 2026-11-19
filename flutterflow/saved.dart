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
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ═══════════════════════════════════════════════════════════════
//  WHERE THE WEB APP LIVES
//
//  The one line to change when you deploy. Must match the value in
//  home.dart, search.dart, listing.dart and profile.dart.
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
const Color _mint = Color(0xFF74CCA4);
const Color _clay = Color(0xFFA8441F);
const Color _clayPale = Color(0xFFFBF1EC);

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
// ═══════════════════════════════════════════════════════════════

class _ApiError implements Exception {
  _ApiError(this.message);
  final String message;
  @override
  String toString() => message;
}

Future<Map<String, dynamic>> _apiGet(String path) async {
  http.Response res;
  try {
    res = await http.get(
      Uri.parse(_apiBase).resolve(path),
      headers: const {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 20));
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
  bool get featured => json['featured'] as bool? ?? false;
  bool get titleChecked => json['titleChecked'] as bool? ?? false;
  bool? get selfContained => json['selfContained'] as bool?;
  String? get unitType => json['unitType'] as String?;

  List<String> get photos => ((json['photos'] as List?) ?? const [])
      .map((p) => Uri.parse(_apiBase).resolve(p as String).toString())
      .toList(growable: false);

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

/// The listings someone has hearted.
///
/// Ids are stored, not whole listings: a price that changed or a
/// listing that was taken down must not be remembered wrongly on the
/// phone. The cost is a fetch per saved listing, which is why results
/// are held for the life of the page.
/// Takes no parameters: it opens listings and switches tabs in code.
class ZubiaSaved extends StatefulWidget {
  const ZubiaSaved({super.key, this.width, this.height});

  /// FlutterFlow fills these in from the canvas when "Width and Height"
  /// is switched on. They are not something to wire up, but the
  /// constructor has to accept them or saving fails with:
  /// Parameter "width" not found.
  final double? width;
  final double? height;

  @override
  State<ZubiaSaved> createState() => _ZubiaSavedState();
}

class _ZubiaSavedState extends State<ZubiaSaved> {
  final Map<String, _Listing> _cache = {};

  /// Ids that came back as an error: taken down, or never existed. Kept
  /// so a missing listing is not refetched on every rebuild.
  final Set<String> _gone = {};

  bool _loading = false;

  /// The id list this page was last built for.
  String _loadedFor = '';

  @override
  void initState() {
    super.initState();
    _SavedStore().addListener(_onSavedChanged);
    _SavedStore().load().then((_) => _refresh());
  }

  @override
  void dispose() {
    _SavedStore().removeListener(_onSavedChanged);
    super.dispose();
  }

  void _onSavedChanged() {
    // Saving a listing from another page should show up here, but only
    // when the set of ids actually changed.
    if (_SavedStore().ids.join('|') != _loadedFor) _refresh();
  }

  void _openListing(String id) {
    ZubiaListing.openId = id;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ZubiaListing()),
    );
  }

  Future<void> _refresh() async {
    final ids = _SavedStore().ids;
    _loadedFor = ids.join('|');

    final missing = ids
        .where((id) => !_cache.containsKey(id) && !_gone.contains(id))
        .toList(growable: false);
    if (missing.isEmpty) {
      if (mounted) setState(() {});
      return;
    }

    setState(() => _loading = true);
    for (final id in missing) {
      try {
        final data = await _apiGet('/api/v1/listings/$id');
        final json = (data['listing'] ?? data) as Map<String, dynamic>;
        _cache[id] = _Listing(json);
      } on _ApiError {
        _gone.add(id);
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  /// Saved listings, newest first, with any that have been taken down
  /// quietly left out.
  List<_Listing> get _listings => _SavedStore()
      .ids
      .map((id) => _cache[id])
      .whereType<_Listing>()
      .toList(growable: false);

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
                    builder: (context, _) {
                      final count = _SavedStore().ids.length;
                      return Column(
                        children: [
                          _header(mq.padding.top, count),
                          Expanded(
                            child: count == 0
                                ? _empty()
                                : _list(mq.padding.bottom),
                          ),
                        ],
                      );
                    },
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

  Widget _header(double top, int count) => Padding(
        padding: EdgeInsets.fromLTRB(_padH, top + 10, _padH, 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('Saved', style: _title(26, weight: FontWeight.w800)),
            const SizedBox(width: 9),
            if (count > 0)
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Text(count == 1 ? '1 place' : '$count places',
                    style: _txt(13, color: _mid)),
              ),
          ],
        ),
      );

  Widget _empty() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: const BoxDecoration(
                    color: _brandPale, shape: BoxShape.circle),
                child: const Icon(Icons.favorite_border_rounded,
                    size: 32, color: _brand),
              ),
              const SizedBox(height: 16),
              Text('Nothing saved yet', style: _title(19)),
              const SizedBox(height: 8),
              Text(
                'Tap the heart on any listing. Saved places stay on this '
                'phone, so nobody sees what you are looking at.',
                textAlign: TextAlign.center,
                style: _txt(13.5, color: _mid, height: 1.5),
              ),
              const SizedBox(height: 20),
              _Pressable(
                scale: 0.98,
                onTap: () => ZubiaSearch.openTab(context, 0),
                child: Container(
                  height: 46,
                  padding: const EdgeInsets.symmetric(horizontal: 22),
                  alignment: Alignment.center,
                  decoration: _liquid(tint: _brand, radius: 23),
                  child: Text('Find a place',
                      style:
                          _txt(15, weight: FontWeight.w600, color: _white)),
                ),
              ),
            ],
          ),
        ),
      );

  Widget _list(double safeBottom) {
    final bottom = safeBottom + _tabBarHeight + 24;
    final cardW = MediaQuery.sizeOf(context).width - _padH * 2;
    final listings = _listings;

    // The ids are known before the listings are, so the wait shows the
    // right number of card-shaped blocks rather than one spinner.
    if (_loading && listings.isEmpty) {
      return ListView.separated(
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(_padH, 0, _padH, bottom),
        itemCount: _SavedStore().ids.length.clamp(1, 4),
        separatorBuilder: (_, __) => const SizedBox(height: 22),
        itemBuilder: (_, __) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Skeleton(cardW, cardW / 1.5, radius: 18),
            const SizedBox(height: 12),
            const _Skeleton(140, 18, radius: 7),
            const SizedBox(height: 8),
            const _Skeleton(200, 12, radius: 6),
          ],
        ),
      );
    }

    return ListView.separated(
      physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics()),
      padding: EdgeInsets.fromLTRB(_padH, 0, _padH, bottom),
      itemCount: listings.length,
      separatorBuilder: (_, __) => const SizedBox(height: 22),
      itemBuilder: (_, i) => _card(listings[i]),
    );
  }

  // --- One card ----------------------------------------------------------

  Widget _card(_Listing l) {
    final photos = l.photos;

    return _Pressable(
      scale: 0.98,
      onTap: () => _openListing(l.id),
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
                      memCacheWidth: 900,
                      placeholder: (_, __) => const ColoredBox(color: _tile),
                      errorWidget: (_, __, ___) => const ColoredBox(
                        color: _tile,
                        child: Icon(Icons.image_not_supported_outlined,
                            color: _light, size: 28),
                      ),
                    ),
                  if (l.featured)
                    Positioned(
                        left: 10, top: 10, child: _tag('Featured', solid: true))
                  else if (l.selfContained == true)
                    Positioned(
                        left: 10, top: 10, child: _tag('Self-contained'))
                  else if (l.titleChecked)
                    Positioned(left: 10, top: 10, child: _tag('Title checked')),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: _Pressable(
                      scale: 0.82,
                      // Always saved on this page, so this is the way
                      // back out. The card leaves as soon as it is
                      // tapped, which is the clearest confirmation
                      // there is.
                      onTap: () => _SavedStore().toggle(l.id),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: _liquid(circle: true, onDark: true),
                        child: const Icon(Icons.favorite_rounded,
                            size: 18, color: _mint),
                      ),
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
          if (l.moveInTotal != null) ...[
            const SizedBox(height: 5),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: _clayPale,
                borderRadius: BorderRadius.circular(7),
              ),
              child: Text('Move in ${_fullUgx(l.moveInTotal!)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: _txt(11.5, weight: FontWeight.w600, color: _clay)),
            ),
          ],
          const SizedBox(height: 5),
          Text(l.address,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: _txt(12.5, color: _mid, height: 1.35)),
        ],
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

  // --- Tab bar -----------------------------------------------------------

  Widget _tabBar() => ListenableBuilder(
        listenable: _SavedStore(),
        builder: (_, __) => _Glass(
                height: _tabBarHeight,
                radius: _tabBarHeight / 2,
                blur: 26,
                child: Row(
                  children: [
                    _tab(Icons.search_rounded, 'Search', false, 0, 0),
                    _tab(Icons.favorite_rounded, 'Saved', true, 1,
                        _SavedStore().ids.length),
                    _tab(Icons.person_outline_rounded, 'Profile', false,
                        2, 0),
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
                ZubiaSearch.openTab(context, index);
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
