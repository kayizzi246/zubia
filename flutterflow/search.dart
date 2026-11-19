// Automatic FlutterFlow imports
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/widgets/index.dart'; // Imports other custom widgets
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart' hide RepeatMode;
// Begin custom widget code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart'
    show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

// ═══════════════════════════════════════════════════════════════
//  DEPENDENCIES for this widget's box in FlutterFlow
//
//      flutter_map: ^8.3.2
//      latlong2: ^0.10.1
//
//  latlong2 has to be listed as well: flutter_map depends on it but
//  does not re-export LatLng, so importing it directly needs its own
//  entry or the build fails on "Couldn't resolve the package".
// ═══════════════════════════════════════════════════════════════

/// Where the map gets its tiles.
///
/// OpenStreetMap's public tile servers are free and need no key, which
/// is why they are here — but their usage policy is aimed at modest,
/// non-commercial traffic. Before real users arrive, point this at your
/// own tile source or a paid provider, or the tiles will be cut off.
///
/// Tiles are also the heaviest thing this app downloads. The map opens
/// at a sensible zoom and the list sits over it precisely so that most
/// people never load more than a screen's worth.
const String _tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/// Sent with every tile request, as OSM's policy asks.
const String _tileAgent = 'ug.zubia.app';

/// Where the map looks when there is nothing to centre on yet.
const LatLng _kampala = LatLng(0.3476, 32.5825);

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

// The listing type Search opens on travels in `ZubiaSearch.openType` —
// a static on the widget class, declared further down. See the note in
// listing.dart for why it cannot be a top-level variable.

// ═══════════════════════════════════════════════════════════════
//  TOKENS — identical in home, search, listing, saved and profile.
//
//  Flat and white, in the manner of the big property apps: hairline
//  rules instead of boxes, bold section headings, generous air, one
//  accent colour. Nothing frosted; the tab bar floats on a soft lift.
//
//  The accent is Zubia's green, not the blue those apps use, so the
//  phone and web/app/globals.css stay the same product.
// ═══════════════════════════════════════════════════════════════
const Color _white = Color(0xFFFFFFFF);
const Color _bg = Color(0xFFFFFFFF);

/// Headings and prices.
const Color _ink = Color(0xFF0E1C16);

/// Body copy and the facts line.
const Color _body = Color(0xFF2F3A34);

/// Captions, addresses, anything secondary.
const Color _mid = Color(0xFF6E7873);

/// Placeholders and disabled glyphs. Never load-bearing.
const Color _light = Color(0xFFA0A8A4);

/// The hairline. Does the work a card border used to.
const Color _line = Color(0xFFE4E6E5);

/// The thick grey band that separates one block of content from the
/// next, instead of a card edge round each.
const Color _band = Color(0xFFF1F3F2);

const Color _tile = Color(0xFFF6F7F6);
const Color _brand = Color(0xFF1A6B4A);
const Color _brandPale = Color(0xFFEAF4EF);
const Color _clay = Color(0xFFA8441F);
const Color _clayPale = Color(0xFFFBF1EC);

const Cubic _ease = Cubic(0.23, 1, 0.32, 1);
const double _tabBarHeight = 58;

double _ui = 1.0;

bool get _isApple =>
    !kIsWeb &&
    (defaultTargetPlatform == TargetPlatform.iOS ||
        defaultTargetPlatform == TargetPlatform.macOS);

double _trackingFor(double s) {
  if (s >= 24) return -0.022;
  if (s >= 20) return -0.018;
  if (s >= 17) return -0.012;
  if (s >= 15) return -0.006;
  return 0.0;
}

TextStyle _font(
  double size, {
  FontWeight weight = FontWeight.w400,
  Color color = _body,
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
    _font(size, weight: weight, color: color, height: 1.18);

TextStyle _txt(double size,
        {FontWeight weight = FontWeight.w400,
        Color color = _body,
        double height = 1.3}) =>
    _font(size, weight: weight, color: color, height: height);

/// The soft lift used on the two things that float above the page: the
/// search bar and the tab bar. Everything else sits flat.
const List<BoxShadow> _lift = [
  BoxShadow(color: Color(0x1A0E1C16), blurRadius: 18, offset: Offset(0, 4)),
  BoxShadow(color: Color(0x0D0E1C16), blurRadius: 3, offset: Offset(0, 1)),
];

// ═══════════════════════════════════════════════════════════════
//  SHARED PIECES
// ═══════════════════════════════════════════════════════════════

/// Anything tappable: it dims and scales very slightly. Restrained on
/// purpose — a flat white page with bouncy buttons reads as a toy.
class _Press extends StatefulWidget {
  const _Press({required this.child, this.onTap, this.scale = 0.97});

  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  @override
  State<_Press> createState() => _PressState();
}

class _PressState extends State<_Press> {
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
          duration: Duration(milliseconds: _down ? 90 : 150),
          curve: _ease,
          child: AnimatedOpacity(
            opacity: _down ? 0.7 : 1,
            duration: const Duration(milliseconds: 90),
            child: widget.child,
          ),
        ),
      );
}

/// The one primary button: a full-width green pill. Used for the main
/// action on a screen and nothing else.
class _PillButton extends StatelessWidget {
  const _PillButton({
    required this.label,
    required this.onTap,
    this.height = 52,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onTap;
  final double height;
  final bool expand;

  @override
  Widget build(BuildContext context) => _Press(
        scale: 0.985,
        onTap: onTap,
        child: Container(
          height: height,
          width: expand ? double.infinity : null,
          padding: expand ? null : const EdgeInsets.symmetric(horizontal: 24),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: _brand,
            borderRadius: BorderRadius.circular(height / 2),
          ),
          child: Text(label,
              style: _txt(16, weight: FontWeight.w600, color: _white)),
        ),
      );
}

/// A white pill with a hairline border — "Reset", "Clear all".
class _GhostPill extends StatelessWidget {
  const _GhostPill({
    required this.label,
    required this.onTap,
    this.color = _brand,
  });

  final String label;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) => _Press(
        scale: 0.95,
        onTap: onTap,
        child: Container(
          height: 38,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: _white,
            borderRadius: BorderRadius.circular(19),
            border: Border.all(color: _line),
          ),
          child: Text(label,
              style: _txt(14.5, weight: FontWeight.w600, color: color)),
        ),
      );
}

/// A round icon button on a light fill — back, close.
class _CircleBtn extends StatelessWidget {
  const _CircleBtn({
    required this.icon,
    required this.onTap,
    this.size = 38,
  });

  final IconData icon;
  final VoidCallback onTap;
  final double size;

  @override
  Widget build(BuildContext context) => _Press(
        scale: 0.9,
        onTap: onTap,
        child: Container(
          width: size,
          height: size,
          decoration: const BoxDecoration(color: _tile, shape: BoxShape.circle),
          child: Icon(icon, size: size * 0.5, color: _ink),
        ),
      );
}

/// A selectable pill. Flat, not glass: pale green with a green rule
/// when on, white with a hairline when off.
class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.showClear = false,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  /// Draws an ✕ when selected, for the row of applied filters where
  /// tapping means "take this one off".
  final bool showClear;

  @override
  Widget build(BuildContext context) => _Press(
        scale: 0.95,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          curve: _ease,
          padding:
              EdgeInsets.fromLTRB(14, 9, showClear && selected ? 9 : 14, 9),
          decoration: BoxDecoration(
            color: selected ? _brandPale : _white,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? _brand : _line,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label,
                  style: _txt(14,
                      weight: FontWeight.w600,
                      color: selected ? _brand : _body)),
              if (showClear && selected) ...[
                const SizedBox(width: 5),
                const Icon(Icons.close_rounded, size: 15, color: _brand),
              ],
            ],
          ),
        ),
      );
}

/// A bold section heading.
class _SectionHead extends StatelessWidget {
  const _SectionHead(this.title);

  final String title;

  @override
  Widget build(BuildContext context) => Text(title, style: _title(18));
}

class _Skeleton extends StatefulWidget {
  const _Skeleton(this.width, this.height, {this.radius = 10});

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
            color: Color.lerp(_tile, _line, _c.value),
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

  double? get lat => (json['lat'] as num?)?.toDouble();
  double? get lng => (json['lng'] as num?)?.toDouble();

  /// Null when the listing has no usable coordinates, so it is simply
  /// left off the map rather than dropped at 0,0 in the Gulf of Guinea.
  LatLng? get point {
    final a = lat, b = lng;
    if (a == null || b == null) return null;
    if (a == 0 && b == 0) return null;
    return LatLng(a, b);
  }

  /// The server's own wording — "Boys' quarters", not the raw "bq".
  /// Falling back to the code with its underscores stripped would put
  /// "bq" on the card, which means nothing to anyone.
  String? get unitLabel =>
      (json['unitLabel'] as String?) ??
      (json['unitType'] as String?)?.replaceAll('_', ' ');

  List<String> get photos => ((json['photos'] as List?) ?? const [])
      .map((p) => Uri.parse(_apiBase).resolve(p as String).toString())
      .toList(growable: false);

  int? get moveInTotal =>
      ((json['moveIn'] as Map<String, dynamic>?)?['totalUGX'] as num?)?.toInt();

  /// How this price sits against what the area normally asks. The
  /// server decides; the card only reports it.
  String? get priceVerdict =>
      (json['typicalRent'] as Map<String, dynamic>?)?['verdict'] as String?;

  String get priceLabel => 'UGX ${_shortUgx(priceUGX)}${isRent ? '/mo' : ''}';

  /// The facts line, pipe-separated the way every property listing in
  /// the world sets it.
  String get facts {
    if (isRent) {
      return <String>[
        if (unitLabel != null) unitLabel!,
        if (selfContained == true) 'Self-contained',
        if (bedrooms != null) '$bedrooms bd',
      ].join('  |  ');
    }
    return <String>[
      if (bedrooms != null) '$bedrooms bds',
      if (bathrooms != null) '$bathrooms ba',
      '$sizeDecimals decimals',
      type == 'land' ? 'Land for sale' : 'House for sale',
    ].join('  |  ');
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
    this.minPrice,
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
  final int? minPrice;
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
    int? minPrice,
    int? maxPrice,
    int? beds,
    bool? titleChecked,
    String? unit,
    bool? selfContained,
    int? maxMoveIn,
    // Dart cannot tell copyWith(x: null) from copyWith(), so each
    // nullable field needs an explicit way to be cleared.
    bool clearMinPrice = false,
    bool clearMaxPrice = false,
    bool clearBeds = false,
    bool clearUnit = false,
    bool clearMaxMoveIn = false,
  }) =>
      _Filters(
        type: type ?? this.type,
        q: q ?? this.q,
        district: district ?? this.district,
        minPrice: clearMinPrice ? null : (minPrice ?? this.minPrice),
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
    if (minPrice != null) p['min'] = '$minPrice';
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

  /// The applied filters as removable chips, in the order someone would
  /// read them. Each carries the edit that takes it off again.
  ///
  /// Without this row, a filter set three screens ago silently hides
  /// half the market and there is nothing on screen saying so.
  List<(String, _Filters)> get chips {
    final out = <(String, _Filters)>[];
    if (q.trim().isNotEmpty) out.add((q.trim(), copyWith(q: '')));
    if (district.isNotEmpty) out.add((district, copyWith(district: '')));
    if (minPrice != null && maxPrice != null) {
      out.add((
        '${_shortUgx(minPrice!)} – ${_shortUgx(maxPrice!)}',
        copyWith(clearMinPrice: true, clearMaxPrice: true),
      ));
    } else if (maxPrice != null) {
      out.add(('Up to ${_shortUgx(maxPrice!)}', copyWith(clearMaxPrice: true)));
    } else if (minPrice != null) {
      out.add(('From ${_shortUgx(minPrice!)}', copyWith(clearMinPrice: true)));
    }
    if (maxMoveIn != null) {
      out.add((
        'Move in ≤ ${_shortUgx(maxMoveIn!)}',
        copyWith(clearMaxMoveIn: true),
      ));
    }
    if (beds != null) out.add(('$beds+ bd', copyWith(clearBeds: true)));
    if (unit != null) {
      out.add((unit!.replaceAll('_', ' '), copyWith(clearUnit: true)));
    }
    if (selfContained) {
      out.add(('Self-contained', copyWith(selfContained: false)));
    }
    if (titleChecked) {
      out.add(('Title checked', copyWith(titleChecked: false)));
    }
    return out;
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

/// Results, with the filters that produced them.
///
/// A list, not a map. A map looks impressive and is the wrong default
/// here: it costs tiles on metered data, and the thing people compare
/// is the price and the move-in cost, which a list shows and a pin
/// does not.
///
/// Takes no parameters. It opens on [ZubiaSearch.openType], which
/// whoever navigated here sets first, and works out for itself whether
/// it is the Search tab or a page pushed on top of Home.
class ZubiaSearch extends StatefulWidget {
  const ZubiaSearch({super.key, this.width, this.height});

  /// "rent", "buy" or "land". Renting is the default because far more
  /// people are looking for a room to live in than are buying land.
  ///
  /// Set it, then navigate:
  ///
  ///     ZubiaSearch.openType = 'buy';
  ///     Navigator.of(context).push(
  ///       MaterialPageRoute(builder: (_) => const ZubiaSearch()),
  ///     );
  static String openType = 'rent';

  /// Opens one of the three tab pages, replacing the current one.
  ///
  /// A static on this class, not a top-level function: FlutterFlow's
  /// `custom_code/widgets/index.dart` exports each file with
  /// `show <WidgetName>`, so a widget class is the only thing another
  /// custom widget can see. It lives on Search because Search is the
  /// page the app opens on and is always present.
  ///
  /// `pushReplacement`, not `push`: tapping Search from Saved must land
  /// on Search, not stack a second Search on top of it.
  static Future<void> openTab(BuildContext context, int index) {
    final Widget page = switch (index) {
      1 => const ZubiaSaved(),
      2 => const ZubiaProfile(),
      _ => const ZubiaSearch(),
    };
    return Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => page,
        transitionsBuilder: (_, a, __, child) =>
            FadeTransition(opacity: a, child: child),
        transitionDuration: const Duration(milliseconds: 180),
      ),
    );
  }

  /// FlutterFlow fills these in from the canvas when "Width and Height"
  /// is switched on. They are not something to wire up, but the
  /// constructor has to accept them or saving fails with:
  /// Parameter "width" not found.
  final double? width;
  final double? height;

  @override
  State<ZubiaSearch> createState() => _ZubiaSearchState();
}

class _ZubiaSearchState extends State<ZubiaSearch> {
  late _Filters _filters = _Filters(type: ZubiaSearch.openType);
  final TextEditingController _query = TextEditingController();
  final MapController _map = MapController();

  /// Set once the map is built, so a result set that arrives first does
  /// not try to move a map that is not there yet.
  bool _mapReady = false;

  List<_Listing> _listings = const [];
  int _total = 0;
  bool _loading = true;
  String? _error;

  /// True when Search was pushed on top of another page, false when it
  /// is the Search tab. Decides whether there is a back button and
  /// whether room is left at the bottom for the tab bar.
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
    _map.dispose();
    super.dispose();
  }

  /// Puts the map over whatever the search just returned.
  ///
  /// The centre is the average of the pins rather than a fitted
  /// bounding box: one listing 200km away would otherwise zoom the map
  /// out until every pin in Kampala sat on top of the others.
  void _recentre() {
    if (!_mapReady) return;
    final pts = _listings.map((l) => l.point).whereType<LatLng>().toList();
    if (pts.isEmpty) return;

    var lat = 0.0, lng = 0.0;
    for (final p in pts) {
      lat += p.latitude;
      lng += p.longitude;
    }
    _map.move(LatLng(lat / pts.length, lng / pts.length), pts.length == 1 ? 15 : 12);
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
      _recentre();
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
    ZubiaListing.openId = id;
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
      builder: (_) => _FiltersSheet(
        start: _filters,
        count: _count,
        // The histogram is drawn from the prices already on screen:
        // honest, and free — no extra request on a metered connection.
        prices: _listings.map((l) => l.priceUGX).toList(growable: false),
      ),
    );
    if (chosen != null) _apply(chosen);
  }

  double get _padH =>
      (MediaQuery.sizeOf(context).width * 0.045).clamp(16.0, 24.0);

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
                // The map fills the screen; the results sheet covers the
                // bottom half of it and can be dragged up over the lot.
                Positioned.fill(child: _mapView()),

                // The sheet. Its lowest stop leaves the map readable,
                // its highest covers it completely, so the same screen
                // works for someone browsing an area and someone
                // reading through a list.
                DraggableScrollableSheet(
                  initialChildSize: 0.55,
                  minChildSize: 0.28,
                  maxChildSize: 0.94,
                  snap: true,
                  snapSizes: const [0.28, 0.55, 0.94],
                  builder: (context, controller) =>
                      _sheet(controller, mq.padding.bottom),
                ),

                // Controls ride on top of the map, not in a bar above
                // it: the map is the page, so nothing should push it
                // down.
                Positioned(
                  left: 0,
                  right: 0,
                  top: 0,
                  child: Column(
                    children: [
                      _searchBar(mq.padding.top),
                      if (_filters.chips.isNotEmpty) _chipRow(),
                    ],
                  ),
                ),

                if (!_pushed)
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: mq.padding.bottom + 10,
                    child: _tabBar(),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- Map ---------------------------------------------------------------

  Widget _mapView() {
    final pins = _listings.where((l) => l.point != null).toList(growable: false);

    return FlutterMap(
      mapController: _map,
      options: MapOptions(
        initialCenter: _kampala,
        initialZoom: 12,
        minZoom: 5,
        maxZoom: 18,
        backgroundColor: _tile,
        // Rotation is a nuisance on a property map: people spin it by
        // accident with two fingers and cannot find north again.
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.pinchZoom |
              InteractiveFlag.drag |
              InteractiveFlag.doubleTapZoom |
              InteractiveFlag.flingAnimation,
        ),
        onMapReady: () {
          _mapReady = true;
          _recentre();
        },
      ),
      children: [
        TileLayer(urlTemplate: _tileUrl, userAgentPackageName: _tileAgent),
        MarkerLayer(
          markers: [
            for (final l in pins)
              Marker(
                point: l.point!,
                width: 74,
                height: 30,
                child: _Press(
                  scale: 0.9,
                  onTap: () => _openListing(l.id),
                  child: Container(
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: _brand,
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(color: _white, width: 1.5),
                      boxShadow: _lift,
                    ),
                    // The price on the pin, not a dot. On a map of
                    // rentals the number is the whole reason to look.
                    child: Text(
                      _shortUgx(l.priceUGX),
                      style: _txt(12.5,
                          weight: FontWeight.w700, color: _white, height: 1.1),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  // --- The results sheet -------------------------------------------------

  Widget _sheet(ScrollController controller, double safeBottom) {
    return Container(
      decoration: const BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        boxShadow: [
          BoxShadow(color: Color(0x1F0E1C16), blurRadius: 20, offset: Offset(0, -4)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: _results(controller, safeBottom),
    );
  }

  /// The grabber and the count, as the first item of the list, so the
  /// whole sheet scrolls as one piece.
  Widget _sheetHead() => Column(
        children: [
          Container(
            width: 38,
            height: 4,
            margin: const EdgeInsets.only(top: 8, bottom: 10),
            decoration: BoxDecoration(
              color: _line,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Text(
            _loading
                ? 'Searching…'
                : '$_total ${_filters.type == 'rent' ? 'rentals' : 'listings'} available',
            style: _title(17),
          ),
          const SizedBox(height: 14),
        ],
      );

  // --- Search bar --------------------------------------------------------

  /// A floating white bar, the way every property app opens: one field,
  /// one filter button, nothing else competing.
  Widget _searchBar(double top) {
    final active = _filters.activeCount;

    return Padding(
      padding: EdgeInsets.fromLTRB(_padH, top + 10, _padH, 10),
      child: Row(
        children: [
          if (_pushed) ...[
            _CircleBtn(
              icon: Icons.arrow_back_rounded,
              onTap: () => Navigator.of(context).maybePop(),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Container(
              height: 48,
              padding: const EdgeInsets.only(left: 16, right: 6),
              decoration: BoxDecoration(
                color: _white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: _lift,
              ),
              child: Row(
                children: [
                  const Icon(Icons.search_rounded, size: 20, color: _mid),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _query,
                      textInputAction: TextInputAction.search,
                      cursorColor: _brand,
                      style: _txt(15, color: _ink),
                      onSubmitted: (t) => _apply(_filters.copyWith(q: t.trim())),
                      decoration: InputDecoration(
                        isDense: true,
                        border: InputBorder.none,
                        hintText: 'Area, district or landmark',
                        hintStyle: _txt(15, color: _light),
                      ),
                    ),
                  ),
                  if (_query.text.isNotEmpty)
                    _Press(
                      scale: 0.85,
                      onTap: () {
                        _query.clear();
                        _apply(_filters.copyWith(q: ''));
                      },
                      child: const Padding(
                        padding: EdgeInsets.all(7),
                        child: Icon(Icons.close_rounded, size: 18, color: _mid),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),
          _Press(
            scale: 0.9,
            onTap: _openFilters,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _white,
                    shape: BoxShape.circle,
                    boxShadow: _lift,
                  ),
                  child: Icon(Icons.tune_rounded,
                      size: 21, color: active > 0 ? _brand : _ink),
                ),
                if (active > 0)
                  Positioned(
                    right: -1,
                    top: -1,
                    child: Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      constraints: const BoxConstraints(minWidth: 18),
                      decoration: BoxDecoration(
                        color: _brand,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: _white, width: 1.5),
                      ),
                      alignment: Alignment.center,
                      child: Text('$active',
                          style: _txt(10.5,
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
    );
  }

  /// The applied filters, each removable with one tap.
  Widget _chipRow() => SizedBox(
        height: 46,
        child: ListView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: EdgeInsets.fromLTRB(_padH, 0, _padH, 8),
          children: [
            for (final c in _filters.chips) ...[
              _Chip(
                label: c.$1,
                selected: true,
                showClear: true,
                onTap: () => _apply(c.$2),
              ),
              const SizedBox(width: 8),
            ],
            _GhostPill(
              label: 'Clear all',
              color: _mid,
              onTap: () => _apply(_Filters(type: _filters.type)),
            ),
          ],
        ),
      );

  // --- Results -----------------------------------------------------------

  Widget _results(ScrollController controller, double safeBottom) {
    final bottom = _pushed ? safeBottom + 28 : safeBottom + _tabBarHeight + 28;
    final cardW = MediaQuery.sizeOf(context).width - _padH * 2;

    // The sheet's own controller has to drive whatever scrolls inside
    // it, or dragging the list will not drag the sheet.
    if (_loading) {
      return ListView.separated(
        controller: controller,
        padding: EdgeInsets.fromLTRB(_padH, 0, _padH, bottom),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 26),
        itemBuilder: (_, i) {
          if (i == 0) return _sheetHead();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Skeleton(cardW, cardW / 1.6, radius: 12),
              const SizedBox(height: 12),
              const _Skeleton(150, 20, radius: 6),
              const SizedBox(height: 9),
              const _Skeleton(210, 13, radius: 5),
              const SizedBox(height: 7),
              const _Skeleton(170, 13, radius: 5),
            ],
          );
        },
      );
    }

    if (_error != null) {
      return ListView(
        controller: controller,
        padding: EdgeInsets.only(bottom: bottom),
        children: [
          _sheetHead(),
          _state(
            icon: Icons.cloud_off_rounded,
            iconBg: _clayPale,
            iconColor: _clay,
            title: "Couldn't load that",
            body: _error!,
            action: 'Try again',
            onAction: _load,
          ),
        ],
      );
    }

    if (_listings.isEmpty) {
      return ListView(
        controller: controller,
        padding: EdgeInsets.only(bottom: bottom),
        children: [
          _sheetHead(),
          _state(
            icon: Icons.search_off_rounded,
            iconBg: _brandPale,
            iconColor: _brand,
            title: 'No matches yet',
            body:
                'Try a higher budget, a different room type, or a nearby area.',
            action: _filters.activeCount > 0 ? 'Clear filters' : null,
            onAction: _filters.activeCount > 0
                ? () => _apply(_Filters(type: _filters.type))
                : null,
          ),
        ],
      );
    }

    return ListView.separated(
      controller: controller,
      padding: EdgeInsets.fromLTRB(_padH, 0, _padH, bottom),
      itemCount: _listings.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 26),
      itemBuilder: (_, i) =>
          i == 0 ? _sheetHead() : _card(_listings[i - 1]),
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
          padding: const EdgeInsets.all(36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                child: Icon(icon, size: 30, color: iconColor),
              ),
              const SizedBox(height: 18),
              Text(title, style: _title(20), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(body,
                  textAlign: TextAlign.center,
                  style: _txt(15, color: _mid, height: 1.5)),
              if (action != null && onAction != null) ...[
                const SizedBox(height: 22),
                _PillButton(
                    label: action, onTap: onAction, expand: false, height: 46),
              ],
            ],
          ),
        ),
      );

  // --- One card ----------------------------------------------------------

  /// Photo, price, facts, address — in that order, the way the big
  /// property apps set it. Flat: no border, no shadow. The photo's own
  /// rounded corner is what separates one card from the next.
  Widget _card(_Listing l) {
    final photos = l.photos;
    final badge = _badge(l);

    return _Press(
      scale: 0.99,
      onTap: () => _openListing(l.id),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: 16 / 10,
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

                  // One badge, top left. More than one and the photo
                  // stops being a photo.
                  if (badge != null)
                    Positioned(left: 12, top: 12, child: badge),

                  Positioned(
                    right: 10,
                    top: 10,
                    child: ListenableBuilder(
                      listenable: _SavedStore(),
                      builder: (_, __) {
                        final saved = _SavedStore().isSaved(l.id);
                        return _Press(
                          scale: 0.82,
                          onTap: () => _SavedStore().toggle(l.id),
                          child: Icon(
                            saved
                                ? Icons.favorite_rounded
                                : Icons.favorite_border_rounded,
                            size: 27,
                            color: saved ? _clay : _white,
                            shadows: const [
                              Shadow(color: Color(0x80000000), blurRadius: 6),
                            ],
                          ),
                        );
                      },
                    ),
                  ),

                  if (photos.length > 1)
                    Positioned(
                      bottom: 10,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          for (var i = 0;
                              i < (photos.length > 5 ? 5 : photos.length);
                              i++)
                            Container(
                              width: 5,
                              height: 5,
                              margin:
                                  const EdgeInsets.symmetric(horizontal: 2.5),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color:
                                    i == 0 ? _white : _white.withOpacity(0.55),
                              ),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 11),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(l.priceLabel, style: _title(21, weight: FontWeight.w800)),
              if (l.moveInTotal != null) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Move in ${_fullUgx(l.moveInTotal!)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: _txt(13, weight: FontWeight.w600, color: _clay),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 5),
          Text(l.facts,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: _txt(14.5, color: _body)),
          const SizedBox(height: 3),
          Text(l.address,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: _txt(14.5, color: _mid)),
        ],
      ),
    );
  }

  /// The single badge a card may carry, in order of what a renter most
  /// needs to know. "Good price" is the server's verdict, not ours.
  Widget? _badge(_Listing l) {
    if (l.priceVerdict == 'low') return _photoPill('Good price', color: _brand);
    if (l.featured) return _photoPill('Featured', color: _clay);
    if (l.selfContained == true) return _photoPill('Self-contained');
    if (l.titleChecked) return _photoPill('Title checked');
    return null;
  }

  /// A white pill on the photo. Dark text on white reads at any photo
  /// brightness, which white-on-translucent does not.
  Widget _photoPill(String label, {Color? color}) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: _white,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(label,
            style: _txt(12, weight: FontWeight.w700, color: color ?? _ink)),
      );

  // --- Tab bar -----------------------------------------------------------

  /// A floating white pill with a soft lift, in the manner of the big
  /// property apps. No blur, which also keeps long lists smooth on a
  /// cheap phone.
  Widget _tabBar() => ListenableBuilder(
        listenable: _SavedStore(),
        builder: (_, __) => Container(
          height: _tabBarHeight,
          decoration: BoxDecoration(
            color: _white,
            borderRadius: BorderRadius.circular(_tabBarHeight / 2),
            boxShadow: _lift,
          ),
          child: Row(
            children: [
              _tab(Icons.search_rounded, Icons.search_rounded, 'Search', true,
                  0, 0),
              _tab(Icons.favorite_border_rounded, Icons.favorite_rounded,
                  'Saved', false, 1, _SavedStore().ids.length),
              _tab(Icons.person_outline_rounded, Icons.person_rounded, 'Profile',
                  false, 2, 0),
            ],
          ),
        ),
      );

  Widget _tab(
    IconData icon,
    IconData activeIcon,
    String label,
    bool active,
    int index,
    int badge,
  ) {
    final color = active ? _brand : _mid;

    return Expanded(
      child: _Press(
        scale: 0.92,
        onTap: active
            ? null
            : () {
                HapticFeedback.selectionClick();
                ZubiaSearch.openTab(context, index);
              },
        child: SizedBox(
          height: _tabBarHeight,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: 24,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(active ? activeIcon : icon, size: 22, color: color),
                    // The count only appears when there is something to
                    // count, so the tab never nags for nothing.
                    if (badge > 0)
                      Positioned(
                        right: -8,
                        top: -3,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 4.5, vertical: 1),
                          constraints: const BoxConstraints(minWidth: 16),
                          decoration: BoxDecoration(
                            color: _clay,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: _white, width: 1.5),
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
              const SizedBox(height: 2),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(label,
                    maxLines: 1,
                    style: _txt(10.5,
                        weight: active ? FontWeight.w700 : FontWeight.w500,
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
  const _FiltersSheet({
    required this.start,
    required this.count,
    required this.prices,
  });

  final _Filters start;
  final Future<int?> Function(_Filters) count;

  /// The prices currently on screen, for the histogram above the
  /// slider.
  final List<int> prices;

  @override
  State<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends State<_FiltersSheet> {
  late _Filters _draft = widget.start;

  late final TextEditingController _min = TextEditingController(
      text: widget.start.minPrice == null ? '' : '${widget.start.minPrice}');
  late final TextEditingController _max = TextEditingController(
      text: widget.start.maxPrice == null ? '' : '${widget.start.maxPrice}');

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
    _min.dispose();
    _max.dispose();
    super.dispose();
  }

  /// The top of the slider's range: whichever is higher, the dearest
  /// price band the server offers or the dearest place on screen, plus
  /// a tenth so the handle has somewhere to go.
  double get _ceiling {
    final steps = _Meta.current?.stepsFor(_draft.type) ?? const <int>[];
    final fromSteps = steps.isEmpty ? 0 : steps.last;
    final fromPrices = widget.prices.isEmpty
        ? 0
        : widget.prices.reduce((a, b) => a > b ? a : b);
    final top = (fromSteps > fromPrices ? fromSteps : fromPrices).toDouble();
    return top <= 0 ? 1000000 : top * 1.1;
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

  void _setRange(RangeValues v) {
    final top = _ceiling.round();
    final lo = v.start.round();
    final hi = v.end.round();
    _min.text = lo <= 0 ? '' : '$lo';
    _max.text = hi >= top ? '' : '$hi';
    _update(_draft.copyWith(
      minPrice: lo <= 0 ? null : lo,
      maxPrice: hi >= top ? null : hi,
      clearMinPrice: lo <= 0,
      clearMaxPrice: hi >= top,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    _ui = (mq.size.width / 390).clamp(0.86, 1.08);
    final meta = _Meta.current;
    final isRent = _draft.type == 'rent';
    final ceiling = _ceiling;

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      minChildSize: 0.5,
      maxChildSize: 0.96,
      expand: false,
      builder: (context, controller) => Container(
        decoration: const BoxDecoration(
          color: _white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  _CircleBtn(
                    icon: Icons.arrow_back_rounded,
                    size: 36,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  Expanded(
                    child: Text('Filters',
                        textAlign: TextAlign.center, style: _title(18)),
                  ),
                  _GhostPill(
                    label: 'Reset',
                    onTap: () {
                      _min.clear();
                      _max.clear();
                      _update(_Filters(type: _draft.type));
                    },
                  ),
                ],
              ),
            ),
            const Divider(height: 1, thickness: 1, color: _line),

            Expanded(
              child: ListView(
                controller: controller,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.only(bottom: 24),
                children: [
                  _block([
                    _SectionHead(isRent ? 'Monthly rent' : 'Price'),
                    const SizedBox(height: 14),
                    _PriceHistogram(
                      prices: widget.prices,
                      ceiling: ceiling,
                      from: (_draft.minPrice ?? 0).toDouble(),
                      to: (_draft.maxPrice ?? ceiling.round()).toDouble(),
                    ),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 3,
                        activeTrackColor: _brand,
                        inactiveTrackColor: _line,
                        thumbColor: _white,
                        overlayColor: _brand.withOpacity(0.12),
                        rangeThumbShape: const RoundRangeSliderThumbShape(
                            enabledThumbRadius: 11, elevation: 2),
                        showValueIndicator: ShowValueIndicator.never,
                      ),
                      child: RangeSlider(
                        min: 0,
                        max: ceiling,
                        values: RangeValues(
                          (_draft.minPrice ?? 0).toDouble().clamp(0, ceiling),
                          (_draft.maxPrice ?? ceiling.round())
                              .toDouble()
                              .clamp(0, ceiling),
                        ),
                        onChanged: _setRange,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: _MoneyField(
                            controller: _min,
                            hint: 'No min',
                            label: 'Min',
                            onDone: (v) => _update(v == null
                                ? _draft.copyWith(clearMinPrice: true)
                                : _draft.copyWith(minPrice: v)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _MoneyField(
                            controller: _max,
                            hint: 'No max',
                            label: 'Max',
                            onDone: (v) => _update(v == null
                                ? _draft.copyWith(clearMaxPrice: true)
                                : _draft.copyWith(maxPrice: v)),
                          ),
                        ),
                      ],
                    ),
                  ]),

                  if (isRent) ...[
                    _bandGap(),
                    _block([
                      const _SectionHead('Cash to move in'),
                      const SizedBox(height: 4),
                      // Monthly rent is not what stops people moving:
                      // the advance, deposit and broker's cut together
                      // are, and they routinely come to four or five
                      // months of rent in one payment.
                      Text('Advance, deposit and any broker fee together.',
                          style: _txt(14, color: _mid, height: 1.45)),
                      const SizedBox(height: 14),
                      _valueChips(
                        labels: [
                          for (final s in meta?.moveInSteps ?? const <int>[])
                            'Up to ${_shortUgx(s)}',
                        ],
                        values: meta?.moveInSteps ?? const <int>[],
                        selected: _draft.maxMoveIn,
                        onChanged: (v) => _update(v == null
                            ? _draft.copyWith(clearMaxMoveIn: true)
                            : _draft.copyWith(maxMoveIn: v)),
                      ),
                    ]),
                    _bandGap(),
                    _block([
                      const _SectionHead('Room type'),
                      const SizedBox(height: 4),
                      Text(
                        'What people here actually search by — a single room '
                        'and a one bedroom are different products at '
                        'different prices.',
                        style: _txt(14, color: _mid, height: 1.45),
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 8,
                        runSpacing: 10,
                        children: [
                          for (final u
                              in meta?.unitTypes ?? const <Map<String, dynamic>>[])
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
                      const SizedBox(height: 18),
                      _switchRow(
                        title: 'Self-contained only',
                        sub: 'Toilet and shower inside the unit',
                        value: _draft.selfContained,
                        onChanged: (v) =>
                            _update(_draft.copyWith(selfContained: v)),
                      ),
                    ]),
                  ] else ...[
                    _bandGap(),
                    _block([
                      const _SectionHead('Bedrooms'),
                      const SizedBox(height: 14),
                      _valueChips(
                        labels: const ['1+', '2+', '3+', '4+', '5+'],
                        values: const [1, 2, 3, 4, 5],
                        selected: _draft.beds,
                        onChanged: (v) => _update(v == null
                            ? _draft.copyWith(clearBeds: true)
                            : _draft.copyWith(beds: v)),
                      ),
                      const SizedBox(height: 18),
                      _switchRow(
                        title: 'Title checked only',
                        sub: 'We searched the title at the land registry',
                        value: _draft.titleChecked,
                        onChanged: (v) =>
                            _update(_draft.copyWith(titleChecked: v)),
                      ),
                    ]),
                  ],

                  _bandGap(),
                  _block([
                    const _SectionHead('District'),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 8,
                      runSpacing: 10,
                      children: [
                        for (final d in meta?.districts ?? const <String>[])
                          _Chip(
                            label: d,
                            selected: _draft.district == d,
                            onTap: () => _update(_draft.copyWith(
                                district: _draft.district == d ? '' : d)),
                          ),
                      ],
                    ),
                  ]),
                ],
              ),
            ),

            Container(
              decoration: const BoxDecoration(
                color: _white,
                border: Border(top: BorderSide(color: _line)),
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                  child: _PillButton(
                    label: _counting
                        ? 'Counting…'
                        : _count == null
                            ? 'See results'
                            : 'See $_count ${_count == 1 ? 'result' : 'results'}',
                    // Live even on zero: disabling it would trap someone
                    // who has over-filtered with no way out but close.
                    onTap: () => Navigator.of(context).pop(_draft),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _block(List<Widget> children) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: children,
        ),
      );

  /// The thick grey rule between groups of filters — cheaper to read
  /// than a card edge round each one.
  Widget _bandGap() => Container(height: 8, color: _band);

  /// A wrapping row of values where tapping the selected one clears it.
  Widget _valueChips({
    required List<String> labels,
    required List<int> values,
    required int? selected,
    required void Function(int?) onChanged,
  }) =>
      Wrap(
        spacing: 8,
        runSpacing: 10,
        children: [
          for (var i = 0; i < labels.length && i < values.length; i++)
            _Chip(
              label: labels[i],
              selected: selected == values[i],
              onTap: () => onChanged(selected == values[i] ? null : values[i]),
            ),
        ],
      );

  Widget _switchRow({
    required String title,
    required String sub,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) =>
      Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: _txt(16, weight: FontWeight.w600, color: _ink)),
                const SizedBox(height: 2),
                Text(sub, style: _txt(13.5, color: _mid, height: 1.35)),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeColor: _brand,
          ),
        ],
      );
}

/// A price box with its own label above it.
class _MoneyField extends StatelessWidget {
  const _MoneyField({
    required this.controller,
    required this.hint,
    required this.label,
    required this.onDone,
  });

  final TextEditingController controller;
  final String hint;
  final String label;
  final void Function(int?) onDone;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: _txt(13.5, weight: FontWeight.w600, color: _mid)),
          const SizedBox(height: 6),
          TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            cursorColor: _brand,
            style: _txt(16, color: _ink),
            onSubmitted: (v) => onDone(int.tryParse(v)),
            onEditingComplete: () => onDone(int.tryParse(controller.text)),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: _txt(16, color: _light),
              isDense: true,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: _line),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: _line),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: _brand, width: 1.6),
              ),
            ),
          ),
        ],
      );
}

/// The bars above the price slider: how many of the places on screen
/// sit in each price band.
///
/// Drawn from the results already loaded rather than from a separate
/// request, so it costs nothing on a metered connection. It is a shape,
/// not a statistic — enough to show where the market actually is before
/// someone drags the handle somewhere empty.
class _PriceHistogram extends StatelessWidget {
  const _PriceHistogram({
    required this.prices,
    required this.ceiling,
    required this.from,
    required this.to,
  });

  final List<int> prices;
  final double ceiling;
  final double from;
  final double to;

  static const int _buckets = 28;

  @override
  Widget build(BuildContext context) {
    if (prices.isEmpty || ceiling <= 0) return const SizedBox(height: 56);

    final counts = List<int>.filled(_buckets, 0);
    for (final p in prices) {
      var i = (p / ceiling * _buckets).floor();
      if (i < 0) i = 0;
      if (i >= _buckets) i = _buckets - 1;
      counts[i]++;
    }
    final peak = counts.reduce((a, b) => a > b ? a : b);
    if (peak == 0) return const SizedBox(height: 56);

    return SizedBox(
      height: 56,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var i = 0; i < _buckets; i++)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 1),
                child: Container(
                  // A band with nothing in it still gets a sliver, so
                  // the row reads as a range rather than as gaps.
                  height: (counts[i] / peak * 52).clamp(3.0, 52.0),
                  decoration: BoxDecoration(
                    // Bars inside the chosen range are green, the rest
                    // grey, so the slider and the shape agree at a
                    // glance.
                    color: _inRange(i) ? _brand : _line,
                    borderRadius: BorderRadius.circular(1.5),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _inRange(int i) {
    final lo = i / _buckets * ceiling;
    final hi = (i + 1) / _buckets * ceiling;
    return hi >= from && lo <= to;
  }
}
