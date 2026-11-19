// Automatic FlutterFlow imports
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/widgets/index.dart'; // Imports other custom widgets
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart' hide RepeatMode;
// Begin custom widget code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

// ═══════════════════════════════════════════════════════════════════
//  ZUBIA — TRUE LIQUID GLASS TAB BAR
//
//  Real Apple-style glass: the page bends and shines through the bar
//  (drawn by the `liquid_glass_widgets` package), and the selection
//  flows between tabs like liquid when you switch pages.
//
//  SETUP IN FLUTTERFLOW
//   1. Custom Code → + Add → Widget → name it exactly: ZubiaGlassTabBar
//   2. Paste this whole file.
//   3. In the widget's "Dependencies" box add:
//          liquid_glass_widgets: ^1.18.0
//      (needs Flutter 3.41 or newer; FlutterFlow 7.2 ships 3.47.1)
//   4. Add one parameter:
//          activeIndex  Integer   (required)  0 Home · 1 Search
//                                             2 Saved · 3 Profile
//      Nothing else. The bar switches pages itself and counts the
//      saved listings itself, so there are no actions to wire up.
//   5. Save / Compile. The four page widgets build this one in code —
//      you do not need to drag it onto any page.
//
//  IF IT DOES NOT COMPILE: set `_trueGlass = false` at the top of each
//  of the four page widgets. They fall straight back to the built-in
//  glass bar, which needs no package at all, and nothing else changes.
// ═══════════════════════════════════════════════════════════════════

import 'dart:async';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart' as lg;

// Switching tabs goes through `ZubiaHome.openTab(context, index)`.
// It lives on the Home widget rather than here because Home is always
// present, while this file is optional — it is the only one that needs
// the liquid_glass_widgets package.

class ZubiaGlassTabBar extends StatefulWidget {
  const ZubiaGlassTabBar({
    super.key,
    this.width,
    this.height,
    required this.activeIndex,
  });

  /// FlutterFlow fills these in from the canvas when "Width and Height"
  /// is switched on for the widget. They are not something to wire up,
  /// but the constructor has to accept them or saving the widget fails
  /// with: Parameter "width" not found.
  final double? width;
  final double? height;

  /// The tab this page is: 0 Home, 1 Search, 2 Saved, 3 Profile.
  final int activeIndex;

  @override
  State<ZubiaGlassTabBar> createState() => _ZubiaGlassTabBarState();
}

class _ZubiaGlassTabBarState extends State<ZubiaGlassTabBar> {
  // Zubia's palette, matching the five page widgets and
  // web/app/globals.css.
  static const Color _brand = Color(0xFF1A6B4A);
  static const Color _ink = Color(0xFF10291F);
  static const Color _white = Color(0xFFFFFFFF);
  static const Color _clay = Color(0xFFA8441F);

  /// Matches `_tabBarHeight` in the page widgets, so the room they
  /// leave at the bottom of their scroll views is exactly right.
  static const double _barHeight = 56;

  /// The glass shaders are loaded once for the whole app.
  ///
  /// The package asks to be initialised in `main()` before `runApp()`,
  /// which FlutterFlow does not let you edit — so it is done lazily
  /// here instead, guarded so five pages cannot start five loads.
  static Future<void>? _boot;
  static bool _booted = false;

  static Future<void> _loadGlass() async {
    try {
      await lg.LiquidGlassWidgets.initialize();
    } catch (e) {
      // A device whose GPU refuses the shaders still gets a usable bar:
      // _booted flips either way and the plain bar below is shown.
      debugPrint('Liquid glass init: $e');
    }
    _booted = true;
  }

  late int _selected = widget.activeIndex;
  Timer? _go;
  Timer? _reset;

  /// Read here rather than passed in, so the bar needs no parameter for
  /// it. Same key the page widgets use.
  int _savedCount = 0;

  @override
  void initState() {
    super.initState();
    if (!_booted) {
      _boot ??= _loadGlass();
      _boot!.then((_) {
        if (mounted) setState(() {});
      });
    }
    _countSaved();
  }

  Future<void> _countSaved() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (!mounted) return;
      setState(
          () => _savedCount = (prefs.getStringList('zubia.saved') ?? []).length);
    } catch (_) {
      // A phone that will not give up its preferences still gets a bar;
      // it just shows no badge.
    }
  }

  @override
  void didUpdateWidget(covariant ZubiaGlassTabBar old) {
    super.didUpdateWidget(old);
    if (old.activeIndex != widget.activeIndex) _selected = widget.activeIndex;
  }

  @override
  void dispose() {
    _go?.cancel();
    _reset?.cancel();
    super.dispose();
  }

  void _fire(int i) {
    if (!mounted) return;
    ZubiaHome.openTab(context, i);
  }

  /// Tap a tab: the glass flows to it first, then the page switches.
  ///
  /// The wait is the point. FlutterFlow replaces the whole page on
  /// navigation, so switching immediately would tear the bar down
  /// mid-flow and the effect would never be seen.
  void _select(int i) {
    if (_go?.isActive ?? false) return;
    // Tapping the tab you are already on does nothing. Reloading the
    // page under someone would lose their scroll position and cost
    // another round of photos on metered data.
    if (i == widget.activeIndex) return;
    HapticFeedback.selectionClick();
    setState(() => _selected = i);
    _go = Timer(const Duration(milliseconds: 260), () {
      if (!mounted) return;
      _fire(i);
      // If this page is still around later (the person comes back),
      // the selection is home again.
      _reset = Timer(const Duration(milliseconds: 900), () {
        if (mounted) setState(() => _selected = widget.activeIndex);
      });
    });
  }

  /// An icon with the saved count over it. `GlassTab.icon` takes a
  /// widget, so the badge rides along rather than needing the package
  /// to support one.
  Widget _icon(IconData icon, {int badge = 0}) {
    final glyph = Icon(icon, size: 21);
    if (badge <= 0) return glyph;

    return SizedBox(
      width: 30,
      height: 24,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          glyph,
          Positioned(
            right: 0,
            top: -2,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 4.5, vertical: 1),
              constraints: const BoxConstraints(minWidth: 16),
              decoration: BoxDecoration(
                color: _clay,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: _white, width: 1),
              ),
              alignment: Alignment.center,
              child: Text(
                badge > 99 ? '99+' : '$badge',
                style: const TextStyle(
                  fontSize: 9.5,
                  height: 1.2,
                  fontWeight: FontWeight.w700,
                  color: _white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Until the glass is ready (a moment on first launch) show a plain
    // bar of the same size, so nothing jumps.
    if (!_booted) {
      return SizedBox(
        width: widget.width,
        height: widget.height ?? _barHeight,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: _white.withOpacity(0.86),
            borderRadius: BorderRadius.circular(_barHeight / 2),
            border: Border.all(color: _ink.withOpacity(0.08)),
          ),
        ),
      );
    }

    final bar = lg.GlassTabBar.bottom(
      selectedIndex: _selected,
      onTabSelected: _select,

      // The pages position the bar themselves, 14 from each edge and
      // clear of the home indicator, so it must not add padding of its
      // own on top of that.
      horizontalPadding: 0,
      verticalPadding: 0,
      barHeight: widget.height ?? _barHeight,

      // Zubia green on the selection, ink on the rest. Set directly
      // rather than through a Theme override, because the bar takes
      // these as real parameters.
      indicatorColor: _brand,
      selectedIconColor: _brand,
      selectedLabelColor: _brand,
      unselectedIconColor: _ink,
      unselectedLabelColor: _ink,
      labelFontSize: 9.5,

      tabs: [
        lg.GlassTab(
          icon: _icon(Icons.home_outlined),
          activeIcon: _icon(Icons.home_rounded),
          label: 'Home',
          glowColor: _brand,
        ),
        lg.GlassTab(
          icon: _icon(Icons.search_rounded),
          activeIcon: _icon(Icons.search_rounded),
          label: 'Search',
          glowColor: _brand,
        ),
        lg.GlassTab(
          icon: _icon(Icons.favorite_border_rounded,
              badge: _savedCount),
          activeIcon:
              _icon(Icons.favorite_rounded, badge: _savedCount),
          label: 'Saved',
          glowColor: _brand,
        ),
        lg.GlassTab(
          icon: _icon(Icons.person_outline_rounded),
          activeIcon: _icon(Icons.person_rounded),
          label: 'Profile',
          glowColor: _brand,
        ),
      ],
    );

    // The pages already keep the bar above the phone's home indicator,
    // so the bar must not add that space a second time.
    final content = MediaQuery.removePadding(
      context: context,
      removeBottom: true,
      removeTop: true,
      child: bar,
    );

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxWidth: widget.width ?? double.infinity,
        maxHeight: widget.height ?? _barHeight,
      ),
      child: lg.LiquidGlassWidgets.wrap(
        brightnessResolver: Theme.maybeBrightnessOf,
        child: Material(type: MaterialType.transparency, child: content),
      ),
    );
  }
}
