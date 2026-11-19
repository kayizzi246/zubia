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

import 'dart:async';
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
//  home.dart, listing.dart, saved.dart and profile.dart.
//
//    local dev   http://localhost:3001   (3000 if nothing else has it)
//    Android emulator talking to your laptop:  http://10.0.2.2:3001
//    live        https://zubia.ug
// ═══════════════════════════════════════════════════════════════
const String _apiBase = 'http://localhost:3001';

/// Which listing type the Search page opens on: "rent", "buy" or "land".
///
/// Set this immediately before opening the page and it is picked up on
/// the way in. It exists so Search needs no parameter — Home's hero
/// pills and its three tiles each set it and then navigate.
///
/// Public on purpose: in FlutterFlow the other custom widgets see it
/// through `custom_code/widgets/index.dart`.
String zubiaSearchType = 'rent';

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

/// true  = the real Apple-style liquid glass bar (the ZubiaGlassTabBar
///         widget, drawn by the liquid_glass_widgets package).
/// false = the built-in glass bar below, which needs no package.
const bool _trueGlass = true;

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

/// A selectable pill. Replaces Material's ChoiceChip, which brings its
/// own elevation and ripple and will not sit flat next to glass.
class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => _Pressable(
        scale: 0.94,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: _ease,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: selected
              ? _liquid(tint: _brand)
              : BoxDecoration(
                  color: _tile,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: _hairline),
                ),
          child: Text(label,
              style: _txt(13.5,
                  weight: FontWeight.w600,
                  color: selected ? _white : _ink)),
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

Future<Map<String, dynamic>> _apiGet(
  String path, [
  Map<String, String>? query,
]) async {
  final uri = Uri.parse(_apiBase).resolve(path).replace(queryParameters: query);
  http.Response res;
  try {
    res = await http
        .get(uri, headers: const {'Accept': 'application/json'})
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

/// The vocabulary and filter options, served rather than hardcoded.
///
/// This matters more than it looks. The people using this are on cheap
/// Android phones that update apps rarely, over data they pay for by
/// the megabyte. Serving the labels means rewording "Single room
/// (muzigo)" does not need a store release.
class _Meta {
  _Meta(this.json);

  final Map<String, dynamic> json;

  static _Meta? current;

  List<Map<String, dynamic>> get unitTypes =>
      ((json['unitTypes'] as List?) ?? const [])
          .cast<Map<String, dynamic>>()
          .toList(growable: false);

  List<String> get districts =>
      ((json['districts'] as List?) ?? const []).cast<String>().toList();

  List<int> _ints(String key) => ((json[key] as List?) ?? const [])
      .map((v) => (v as num).toInt())
      .toList(growable: false);

  List<int> stepsFor(String type) => switch (type) {
        'buy' => _ints('buySteps'),
        'land' => _ints('landSteps'),
        _ => _ints('rentSteps'),
      };

  List<int> get moveInSteps => _ints('moveInSteps');
}

/// The search filters.
///
/// Field for field and name for name, the same thing web/lib/search.ts
/// parses, including leaving defaults out — so a link shared from the
/// app and one shared from the website mean exactly the same search.
class _Filters {
  const _Filters({
    this.type = 'rent',
    this.q = '',
    this.district = '',
    this.maxPrice,
    this.beds,
    this.titleChecked = false,
    this.unit,
    this.selfContained = false,
    this.maxMoveIn,
  });

  final String type;
  final String q;
  final String district;
  final int? maxPrice;
  final int? beds;
  final bool titleChecked;
  final String? unit;
  final bool selfContained;

  /// The most cash this person can raise to move in: advance, deposit
  /// and any broker fee together. The filter nobody else in this market
  /// offers, and the one that decides whether a viewing is worth the
  /// trip across town.
  final int? maxMoveIn;

  _Filters copyWith({
    String? type,
    String? q,
    String? district,
    int? maxPrice,
    int? beds,
    bool? titleChecked,
    String? unit,
    bool? selfContained,
    int? maxMoveIn,
    // Dart cannot tell copyWith(x: null) from copyWith(), so each
    // nullable field needs an explicit way to be cleared.
    bool clearMaxPrice = false,
    bool clearBeds = false,
    bool clearUnit = false,
    bool clearMaxMoveIn = false,
  }) =>
      _Filters(
        type: type ?? this.type,
        q: q ?? this.q,
        district: district ?? this.district,
        maxPrice: clearMaxPrice ? null : (maxPrice ?? this.maxPrice),
        beds: clearBeds ? null : (beds ?? this.beds),
        titleChecked: titleChecked ?? this.titleChecked,
        unit: clearUnit ? null : (unit ?? this.unit),
        selfContained: selfContained ?? this.selfContained,
        maxMoveIn: clearMaxMoveIn ? null : (maxMoveIn ?? this.maxMoveIn),
      );

  Map<String, String> toQuery() {
    final p = <String, String>{'type': type};
    if (q.trim().isNotEmpty) p['q'] = q.trim();
    if (district.isNotEmpty) p['district'] = district;
    if (maxPrice != null) p['max'] = '$maxPrice';
    // Bedroom counts mean nothing on a plot of land.
    if (beds != null && type != 'land') p['beds'] = '$beds';
    if (titleChecked) p['title'] = '1';
    if (unit != null) p['unit'] = unit!;
    if (selfContained) p['sc'] = '1';
    if (maxMoveIn != null) p['movein'] = '$maxMoveIn';
    return p;
  }

  /// How many filters are set beyond the listing type. Drives the badge
  /// on the filter button.
  int get activeCount => toQuery().length - 1;
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

/// Results, with the filters that produced them.
///
/// A list, not a map. A map looks impressive and is the wrong default
/// here: it costs tiles on metered data, and the thing people compare
/// is the price and the move-in cost, which a list shows and a pin
/// does not.
///
/// Takes no parameters. It opens on [zubiaSearchType], which whoever
/// navigated here sets first, and works out for itself whether it is the
/// Search tab or a page that was pushed on top of Home.
class ZubiaSearch extends StatefulWidget {
  const ZubiaSearch({super.key});

  @override
  State<ZubiaSearch> createState() => _ZubiaSearchState();
}

class _ZubiaSearchState extends State<ZubiaSearch> {
  late _Filters _filters =
      _Filters(type: zubiaSearchType);
  final TextEditingController _query = TextEditingController();

  List<_Listing> _listings = const [];
  int _total = 0;
  bool _loading = true;
  String? _error;

  /// True when Search was pushed on top of another page (Home's hero
  /// pills and tiles do that), false when it is the Search tab. Decides
  /// whether there is a back button and whether room is left at the
  /// bottom for the tab bar.
  ///
  /// Worked out on the first build and then kept, not asked again every
  /// build: once a listing is pushed on top of the Search tab, the
  /// question would start answering true and the tab would grow a back
  /// arrow it should not have.
  bool? _pushedCache;
  bool get _pushed => _pushedCache ??= Navigator.of(context).canPop();

  @override
  void initState() {
    super.initState();
    _SavedStore().load();
    _loadMeta();
    _load();
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  /// Nothing waits on this: the filter sheet simply has fewer options
  /// until it arrives, and the results do not depend on it at all.
  Future<void> _loadMeta() async {
    try {
      _Meta.current = _Meta(await _apiGet('/api/v1/meta'));
      if (mounted) setState(() {});
    } on _ApiError {
      // Fine. The sheet falls back to the options it already has.
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _apiGet('/api/v1/listings', {
        ..._filters.toQuery(),
        'limit': '40',
        'offset': '0',
      });
      if (!mounted) return;
      setState(() {
        _listings = ((data['listings'] as List?) ?? const [])
            .map((j) => _Listing(j as Map<String, dynamic>))
            .toList(growable: false);
        _total = (data['total'] as num?)?.toInt() ?? 0;
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

  void _apply(_Filters next) {
    _filters = next;
    _load();
  }

  /// Counts matches for a filter set that has not been applied yet.
  /// Asks for one listing rather than none, because `total` is what is
  /// wanted and a page of zero would still be a round trip.
  Future<int?> _count(_Filters candidate) async {
    try {
      final data = await _apiGet('/api/v1/listings', {
        ...candidate.toQuery(),
        'limit': '1',
        'offset': '0',
      });
      return (data['total'] as num?)?.toInt() ?? 0;
    } on _ApiError {
      // A broken count must not block the sheet: the search itself will
      // report the failure properly.
      return null;
    }
  }

  void _openListing(String id) {
    zubiaListingId = id;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ZubiaListing()),
    );
  }

  Future<void> _openFilters() async {
    final chosen = await showModalBottomSheet<_Filters>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FiltersSheet(start: _filters, count: _count),
    );
    if (chosen != null) _apply(chosen);
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
          width: mq.size.width,
          height: mq.size.height,
          color: _bg,
          child: Scaffold(
            backgroundColor: _bg,
            body: Stack(
              children: [
                _GlassArrive(
                  child: Column(
                    children: [
                      _controls(mq.padding.top),
                      Expanded(child: _results(mq.padding.bottom)),
                    ],
                  ),
                ),
                if (!_pushed)
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

  // --- Controls ----------------------------------------------------------

  Widget _controls(double top) {
    final active = _filters.activeCount;

    return Padding(
      padding: EdgeInsets.fromLTRB(_padH, top + 10, _padH, 12),
      child: Column(
        children: [
          Row(
            children: [
              if (_pushed) ...[
                _Pressable(
                  scale: 0.88,
                  onTap: () => Navigator.of(context).maybePop(),
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: _liquid(circle: true),
                    child: const Icon(Icons.arrow_back_rounded,
                        size: 19, color: _ink),
                  ),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: Container(
                  height: 46,
                  padding: const EdgeInsets.only(left: 14, right: 6),
                  decoration: BoxDecoration(
                    color: _tile,
                    borderRadius: BorderRadius.circular(23),
                    border: Border.all(color: _hairline),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search_rounded, size: 19, color: _mid),
                      const SizedBox(width: 9),
                      Expanded(
                        child: TextField(
                          controller: _query,
                          textInputAction: TextInputAction.search,
                          cursorColor: _brand,
                          style: _txt(14.5, color: _ink),
                          onSubmitted: (t) =>
                              _apply(_filters.copyWith(q: t.trim())),
                          decoration: InputDecoration(
                            isDense: true,
                            border: InputBorder.none,
                            hintText: 'Area, district or landmark',
                            hintStyle: _txt(14.5, color: _light),
                          ),
                        ),
                      ),
                      if (_query.text.isNotEmpty)
                        _Pressable(
                          scale: 0.85,
                          onTap: () {
                            _query.clear();
                            _apply(_filters.copyWith(q: ''));
                          },
                          child: const Padding(
                            padding: EdgeInsets.all(6),
                            child: Icon(Icons.close_rounded,
                                size: 17, color: _mid),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _Pressable(
                scale: 0.88,
                onTap: _openFilters,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: active > 0
                          ? _liquid(tint: _brand, circle: true)
                          : _liquid(circle: true),
                      child: Icon(Icons.tune_rounded,
                          size: 20, color: active > 0 ? _white : _ink),
                    ),
                    if (active > 0)
                      Positioned(
                        right: -2,
                        top: -2,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 5, vertical: 1),
                          constraints: const BoxConstraints(minWidth: 17),
                          decoration: BoxDecoration(
                            color: _clay,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: _white, width: 1.5),
                          ),
                          alignment: Alignment.center,
                          child: Text('$active',
                              style: _txt(10,
                                  weight: FontWeight.w700,
                                  color: _white,
                                  height: 1.2)),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // The listing type stays visible: rent, buy and land are three
          // different products, and landing on the wrong one is the
          // quickest way to think the app is empty.
          Row(
            children: [
              for (final o in const [
                ('rent', 'For rent'),
                ('buy', 'For sale'),
                ('land', 'Land'),
              ])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _Chip(
                    label: o.$2,
                    selected: _filters.type == o.$1,
                    onTap: () => _apply(
                      _filters.copyWith(
                        type: o.$1,
                        // Price bands differ by an order of magnitude
                        // between rent and land, so a kept range would
                        // return nothing at all.
                        clearMaxPrice: true,
                        clearMaxMoveIn: true,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // --- Results -----------------------------------------------------------

  Widget _results(double safeBottom) {
    final bottom =
        _pushed ? safeBottom + 24 : safeBottom + _tabBarHeight + 24;
    final cardW = MediaQuery.sizeOf(context).width - _padH * 2;

    if (_loading) {
      return ListView.separated(
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(_padH, 4, _padH, bottom),
        itemCount: 3,
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

    if (_error != null) {
      return _state(
        icon: Icons.cloud_off_rounded,
        iconBg: _clayPale,
        iconColor: _clay,
        title: "Couldn't load that",
        body: _error!,
        action: 'Try again',
        onAction: _load,
      );
    }

    if (_listings.isEmpty) {
      return _state(
        icon: Icons.travel_explore_rounded,
        iconBg: _brandPale,
        iconColor: _brand,
        title: 'Nothing matches that yet',
        body: 'Try a higher budget, a different room type, or a nearby area.',
        action: _filters.activeCount > 0 ? 'Clear filters' : null,
        onAction: _filters.activeCount > 0
            ? () => _apply(_Filters(type: _filters.type))
            : null,
      );
    }

    return ListView.separated(
      physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics()),
      padding: EdgeInsets.fromLTRB(_padH, 0, _padH, bottom),
      itemCount: _listings.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 22),
      itemBuilder: (_, i) {
        if (i == 0) {
          return Text(
            '$_total ${_filters.type == 'rent' ? 'rentals' : 'listings'} available',
            style: _txt(13, weight: FontWeight.w600, color: _mid),
          );
        }
        return _card(_listings[i - 1], cardW);
      },
    );
  }

  Widget _state({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String body,
    String? action,
    VoidCallback? onAction,
  }) =>
      Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration:
                    BoxDecoration(color: iconBg, shape: BoxShape.circle),
                child: Icon(icon, size: 32, color: iconColor),
              ),
              const SizedBox(height: 16),
              Text(title, style: _title(19), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(body,
                  textAlign: TextAlign.center,
                  style: _txt(13.5, color: _mid, height: 1.5)),
              if (action != null && onAction != null) ...[
                const SizedBox(height: 20),
                _Pressable(
                  scale: 0.98,
                  onTap: onAction,
                  child: Container(
                    height: 46,
                    padding: const EdgeInsets.symmetric(horizontal: 22),
                    alignment: Alignment.center,
                    decoration: _liquid(tint: _brand, radius: 23),
                    child: Text(action,
                        style:
                            _txt(15, weight: FontWeight.w600, color: _white)),
                  ),
                ),
              ],
            ],
          ),
        ),
      );

  // --- One card ----------------------------------------------------------

  Widget _card(_Listing l, double width) {
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
        builder: (_, __) => _trueGlass
            ? const ZubiaGlassTabBar(activeIndex: 1)
            : _Glass(
                height: _tabBarHeight,
                radius: _tabBarHeight / 2,
                blur: 26,
                child: Row(
                  children: [
                    _tab(Icons.home_outlined, 'Home', false, 0, 0),
                    _tab(Icons.search_rounded, 'Search', true, 1, 0),
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

// ═══════════════════════════════════════════════════════════════
//  FILTER SHEET
//
//  The live count on the button is the whole point: changing a filter
//  and watching the number move tells you whether you have asked for
//  something impossible before you commit to the search.
// ═══════════════════════════════════════════════════════════════

class _FiltersSheet extends StatefulWidget {
  const _FiltersSheet({required this.start, required this.count});

  final _Filters start;
  final Future<int?> Function(_Filters) count;

  @override
  State<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends State<_FiltersSheet> {
  late _Filters _draft = widget.start;

  int? _count;
  bool _counting = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _recount();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  /// Tapping through filters fires on every change. Without this the
  /// app makes a request per tap, and on a Ugandan mobile connection
  /// the answer for one arrives after the answer for the next.
  void _update(_Filters next) {
    setState(() => _draft = next);
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), _recount);
  }

  Future<void> _recount() async {
    setState(() => _counting = true);
    final total = await widget.count(_draft);
    if (!mounted) return;
    setState(() {
      _count = total;
      _counting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    _ui = (mq.size.width / 390).clamp(0.86, 1.08);
    final meta = _Meta.current;
    final isRent = _draft.type == 'rent';

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, controller) => Container(
        decoration: const BoxDecoration(
          color: _white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
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
              padding: const EdgeInsets.fromLTRB(14, 2, 14, 10),
              child: Row(
                children: [
                  _Pressable(
                    scale: 0.88,
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: _liquid(circle: true),
                      child: const Icon(Icons.close_rounded,
                          size: 17, color: _ink),
                    ),
                  ),
                  Expanded(
                    child: Text('Filters',
                        textAlign: TextAlign.center, style: _title(17)),
                  ),
                  _Pressable(
                    scale: 0.92,
                    onTap: () => _update(_Filters(type: _draft.type)),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 8),
                      child: Text('Reset',
                          style: _txt(14,
                              weight: FontWeight.w600, color: _brand)),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, thickness: 1, color: _hairline),
            Expanded(
              child: ListView(
                controller: controller,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
                children: [
                  Text(isRent ? 'Monthly rent' : 'Price', style: _title(17)),
                  const SizedBox(height: 12),
                  _valueChips(
                    labels: [
                      for (final s in meta?.stepsFor(_draft.type) ?? const [])
                        'Up to ${_shortUgx(s)}',
                    ],
                    values: meta?.stepsFor(_draft.type) ?? const [],
                    selected: _draft.maxPrice,
                    onChanged: (v) => _update(v == null
                        ? _draft.copyWith(clearMaxPrice: true)
                        : _draft.copyWith(maxPrice: v)),
                  ),

                  if (isRent) ...[
                    const SizedBox(height: 28),
                    Text('Cash you can raise to move in', style: _title(17)),
                    const SizedBox(height: 5),
                    // Monthly rent is not what stops people moving: the
                    // advance, deposit and broker's cut together are,
                    // and they routinely come to four or five months of
                    // rent in one payment.
                    Text('Advance, deposit and any broker fee together.',
                        style: _txt(12.5, color: _mid, height: 1.45)),
                    const SizedBox(height: 12),
                    _valueChips(
                      labels: [
                        for (final s in meta?.moveInSteps ?? const [])
                          'Up to ${_shortUgx(s)}',
                      ],
                      values: meta?.moveInSteps ?? const [],
                      selected: _draft.maxMoveIn,
                      onChanged: (v) => _update(v == null
                          ? _draft.copyWith(clearMaxMoveIn: true)
                          : _draft.copyWith(maxMoveIn: v)),
                    ),

                    const SizedBox(height: 28),
                    Text('Room type', style: _title(17)),
                    const SizedBox(height: 5),
                    Text(
                      'What people here actually search by — a single room '
                      'and a one bedroom are different products at different '
                      'prices.',
                      style: _txt(12.5, color: _mid, height: 1.45),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final u in meta?.unitTypes ?? const [])
                          _Chip(
                            // The local word in brackets, because
                            // "muzigo" is what people say out loud.
                            label: u['localName'] == null
                                ? '${u['label']}'
                                : '${u['label']} (${u['localName']})',
                            selected: _draft.unit == u['value'],
                            onTap: () => _update(
                              _draft.unit == u['value']
                                  ? _draft.copyWith(clearUnit: true)
                                  : _draft.copyWith(
                                      unit: u['value'] as String),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 20),
                    _switchTile(
                      title: 'Self-contained only',
                      sub: 'Toilet and shower inside the unit',
                      value: _draft.selfContained,
                      onChanged: (v) =>
                          _update(_draft.copyWith(selfContained: v)),
                    ),
                  ] else ...[
                    const SizedBox(height: 28),
                    Text('Bedrooms', style: _title(17)),
                    const SizedBox(height: 12),
                    _valueChips(
                      labels: const ['1+', '2+', '3+', '4+', '5+'],
                      values: const [1, 2, 3, 4, 5],
                      selected: _draft.beds,
                      onChanged: (v) => _update(v == null
                          ? _draft.copyWith(clearBeds: true)
                          : _draft.copyWith(beds: v)),
                    ),
                    const SizedBox(height: 20),
                    _switchTile(
                      title: 'Title checked only',
                      sub: 'We searched the title at the land registry',
                      value: _draft.titleChecked,
                      onChanged: (v) =>
                          _update(_draft.copyWith(titleChecked: v)),
                    ),
                  ],

                  const SizedBox(height: 28),
                  Text('District', style: _title(17)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final d in meta?.districts ?? const [])
                        _Chip(
                          label: d,
                          selected: _draft.district == d,
                          onTap: () => _update(_draft.copyWith(
                              district: _draft.district == d ? '' : d)),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              decoration: const BoxDecoration(
                color: _white,
                border: Border(top: BorderSide(color: _hairline)),
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                  child: _Pressable(
                    scale: 0.98,
                    // Live even on zero: disabling it would trap someone
                    // who has over-filtered with no way out but close.
                    onTap: () => Navigator.of(context).pop(_draft),
                    child: Container(
                      height: 52,
                      width: double.infinity,
                      alignment: Alignment.center,
                      decoration: _liquid(tint: _brand, radius: 26),
                      child: Text(
                        _counting
                            ? 'Counting…'
                            : _count == null
                                ? 'See results'
                                : 'See $_count ${_count == 1 ? 'result' : 'results'}',
                        style:
                            _txt(15, weight: FontWeight.w600, color: _white),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// A wrapping row of values where tapping the selected one clears it.
  Widget _valueChips({
    required List<String> labels,
    required List<int> values,
    required int? selected,
    required void Function(int?) onChanged,
  }) =>
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (var i = 0; i < labels.length && i < values.length; i++)
            _Chip(
              label: labels[i],
              selected: selected == values[i],
              onTap: () => onChanged(selected == values[i] ? null : values[i]),
            ),
        ],
      );

  Widget _switchTile({
    required String title,
    required String sub,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) =>
      Container(
        padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
        decoration: BoxDecoration(
          color: _tile,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style:
                          _txt(14.5, weight: FontWeight.w600, color: _ink)),
                  const SizedBox(height: 2),
                  Text(sub, style: _txt(12, color: _mid, height: 1.35)),
                ],
              ),
            ),
            Switch.adaptive(
              value: value,
              onChanged: onChanged,
              activeColor: _brand,
            ),
          ],
        ),
      );
}
