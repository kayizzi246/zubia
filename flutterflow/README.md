# Zubia — FlutterFlow custom widgets

Five pages, each a single self-contained FlutterFlow **custom widget**.
Every one talks directly to the Next.js app in [`../web`](../web) over its
`/api/v1` endpoints, so the phone and the website always show the same
listings, the same prices and the same move-in costs.

| File | Widget class | What it is |
|---|---|---|
| `home.dart` | `ZubiaHome` | Hero, two rails, the three ways in |
| `search.dart` | `ZubiaSearch` | Results, type chips, filter sheet with a live count |
| `listing.dart` | `ZubiaListing` | One listing in full, with the enquiry form |
| `saved.dart` | `ZubiaSaved` | The listings hearted on this phone |
| `profile.dart` | `ZubiaProfile` | Sign-in, privacy, settings |
| `glass_tab_bar.dart` | `ZubiaGlassTabBar` | The real liquid-glass tab bar the four tab pages share. See §7 |

`glass_tab_bar.dart` is the one shared widget — paste it **first**, or the
four tab pages will not compile.

---

## 1. Before you paste anything

### Add the pub packages

FlutterFlow → **Settings → App Settings → Pub Dependencies**. Add:

Each custom widget has its own **Dependencies** box. Put the package in
the box of every widget that needs it.

| Package | Used for | Needed by |
|---|---|---|
| `http` | every API call | all five pages |
| `cached_network_image` | listing photos, cached on disk | home, search, listing, saved |
| `shared_preferences` | the saved-listing ids | all five pages |
| `flutter_secure_storage: ^9.2.2` | the session token | **profile only** |
| `liquid_glass_widgets: ^1.18.0` | the real glass tab bar | **glass_tab_bar.dart only** |

The first three usually resolve already. The last two are the ones that
produce `Couldn't resolve the package …` if you skip them:

- **`flutter_secure_storage` goes in `ZubiaProfile`'s box.** It is not
  interchangeable with `shared_preferences` — see §5.
- **`liquid_glass_widgets` goes in `ZubiaGlassTabBar`'s box**, and only
  if you want the shader-based bar. The four pages draw their own glass
  bar and need no extra package at all, so you can skip that widget
  entirely. See §7.

`liquid_glass_widgets` needs **Flutter 3.41 or newer**. FlutterFlow 7.2
ships Flutter 3.47.1, so it resolves.

`cached_network_image` matters more than it looks: photos are the
heaviest thing the app downloads, and data here is paid for by the
megabyte. `flutter_secure_storage` is not interchangeable with
`shared_preferences` — see §5.

### Point the widgets at your server

Each file opens with one line, just under the imports:

```dart
const String _apiBase = 'http://localhost:3001';
```

Change it in **all five files** — they must agree.

| Where the app runs | What `_apiBase` should be |
|---|---|
| FlutterFlow web preview, server on your laptop | `http://localhost:3001` |
| Android emulator, server on your laptop | `http://10.0.2.2:3001` |
| iOS simulator, server on your laptop | `http://localhost:3001` |
| A real phone, server on your laptop | `http://<your-laptop-LAN-ip>:3001` |
| Production | `https://zubia.ug` |

`10.0.2.2` is the Android emulator's alias for the host machine;
`127.0.0.1` inside the emulator is the emulator itself. Getting this
wrong is the commonest reason a new app cannot see a server the browser
on the same machine can.

> The port is **3001** and not 3000 only because something else was
> holding 3000 when this was set up. Check what `npm run dev` actually
> printed in `../web` and use that.

---

## 2. Creating each widget

For each file: **Custom Code → + Add → Widget**, name it exactly the
class name in the table above, then replace the whole editor contents
with the file.

FlutterFlow regenerates the import header at the top:

```dart
// Automatic FlutterFlow imports
import '/backend/backend.dart';
...
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!
```

Leave that block alone. Everything below it is the widget.

### Parameters to declare: none

The five page widgets take **no parameters** beyond `width` and
`height`, which FlutterFlow fills in from the canvas itself. Nothing to
declare, no actions to wire up. Paste each one, drop it on a blank page
at full size, and it works.

The one exception is `ZubiaGlassTabBar`, which also takes a single
`activeIndex` (Integer). The four pages build it in code and pass their
own index, so you only declare it if FlutterFlow asks.

> **Leave "Width and Height" switched on.** Every widget here accepts
> `width` and `height` for exactly that reason. Switching it off, or
> removing those two from the constructor, produces
> `Parameter "width" not found.` when you save.

### Replacing an earlier version of a widget

FlutterFlow keeps the parameter list you declared last time and checks
the new code against it. Pasting these files over an older version will
fail to save until the stale entries are gone.

In **Define Parameters**, delete everything except `activeIndex` — that
means `savedCount`, `onHome`, `onSearch`, `onSaved`, `onProfile`,
`onOpenSearch`, `onOpenListing`, `onHomeTap`, `onSearchTap`,
`onSavedTap`, `onProfileTap`, `onBack`, `initialType` and `listingId`,
wherever each appears. Keep `width` and `height`, and keep `activeIndex`
on `ZubiaGlassTabBar` only.

A dialog saying `Parameter "x" not found. Are you sure you want to save?`
is naming a declaration you still need to delete. Cancel, remove it, and
save again — saying "Yes, Save" leaves a declaration pointing at a
constructor argument that no longer exists.

### How they reach each other, with no parameters

Everything happens in code — but **only through statics on the widget
classes**, and that detail is not optional.

FlutterFlow generates `custom_code/widgets/index.dart` as a list of
`export 'zubia_listing.dart' show ZubiaListing;` lines. The `show` means
**the widget class is the only thing that crosses from one custom widget
file to another**. A top-level function or variable is invisible, and the
build fails with `The setter 'x' isn't defined` / `The method 'x' isn't
defined`.

So everything shared hangs off a class:

| Member | Lives on | Set by | Read by |
|---|---|---|---|
| `ZubiaListing.openId` | `listing.dart` | Home, Search, Saved, before navigating | `ZubiaListing` on open |
| `ZubiaSearch.openType` | `search.dart` | Home's hero pills and its three tiles | `ZubiaSearch` on open |
| `ZubiaHome.openTab(context, i)` | `home.dart` | every tab bar | — |

```dart
ZubiaListing.openId = l.id;
Navigator.of(context).push(
  MaterialPageRoute(builder: (_) => const ZubiaListing()),
);
```

`openTab` lives on `ZubiaHome` rather than on the tab bar because Home is
always present, while `glass_tab_bar.dart` is optional. It uses
`pushReplacement`, so tapping Home from Search lands on Home instead of
stacking a second Home on top of it. Opening a listing uses a plain
`push`, so the back button returns where you were.

### The import header

FlutterFlow writes the header itself, and it only lists files your
project actually has. A project with no backend configured has no
`lib/backend/`, so these three lines must **not** be there:

```dart
import '/backend/backend.dart';              // only with a backend
import '/backend/schema/structs/index.dart';  // only with a backend
import '/custom_code/actions/index.dart';     // only with custom actions
```

Leaving them in gives `Error reading 'lib/backend/backend.dart' (No such
file or directory)`. The files here ship with only the four lines that
always exist. If your project does have a backend, let FlutterFlow
regenerate the header rather than pasting one in.

> **One trap in that header:** `flutter_flow_util.dart` re-exports
> `package:intl`, which has its own `TextDirection` class. Anything
> overriding a Flutter method that takes a `TextDirection` must write
> `ui.TextDirection` or the override is invalid. `_GradientRim.paint`
> in each file does exactly that.

Each widget draws its own tab bar with its own tab already selected, so
there is no shared scaffold to build.

---

## 3. What each page asks the web app for

| Page | Request |
|---|---|
| Home | `GET /api/v1/listings?type=rent&limit=60`, then `type=buy` and `type=land` at `limit=20` |
| Search | `GET /api/v1/listings?…filters…&limit=40` and `GET /api/v1/meta` |
| Search (count on the button) | `GET /api/v1/listings?…&limit=1` — `total` is what is wanted |
| Listing | `GET /api/v1/listings/{id}` and `GET /api/v1/meta` |
| Listing (enquiry) | `POST /api/v1/messages` |
| Saved | `GET /api/v1/listings/{id}` once per saved id |
| Profile | `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `DELETE /api/v1/auth/me` |

Every response is wrapped as `{ data }` or `{ error }`. The widgets
unwrap it and show the server's own `error.message` rather than a status
code — that wording already distinguishes a wrong password from
"accounts are not switched on yet" from a rate limit.

The filter names in `search.dart` (`q`, `district`, `max`, `beds`,
`title`, `unit`, `sc`, `movein`) are the same ones `web/lib/search.ts`
parses, so a search built in the app and one built on the website mean
exactly the same thing.

---

## 4. CORS, for web builds only

A web build is a different origin from the API, and without the right
headers the browser blocks every response — and reports it as a network
failure, which looks exactly like the server being down. Native Android
and iOS builds never hit this; CORS is a browser rule.

[`../web/proxy.ts`](../web/proxy.ts) already allows any `localhost` or
`127.0.0.1` origin **outside production**. Before shipping a web build
on a real domain, add that one origin there. Do not reach for a
wildcard: it would let any site on the internet call this API using its
visitors' sessions.

---

## 5. Two things not to "simplify"

**The session token is in the Keychain / Keystore, not preferences.**
`profile.dart` uses `flutter_secure_storage` for it deliberately. It is
a bearer credential; anything that can read app preferences could
otherwise sign in as that person. Saved listing ids are fine in
`shared_preferences` because they are not credentials.

**Saved listings stay on the phone.** Only ids are stored, never whole
listings, so a price that changed or a listing that was taken down is
never remembered wrongly. Nothing about what someone is searching for
reaches the server until they enquire about a particular listing — in a
market where a landlord knowing you are desperate changes the price,
that is not a small thing. The trade-off is honest: saved listings do
not follow you to a new phone.

---

## 6. Two lints you will see, and why they stay

Analysed on Flutter 3.47-dev these files report 115 info-level lints and
**no errors or warnings**. All of them are one of two rules:

- **`deprecated_member_use` (83)** — `withOpacity`, whose replacement
  `withValues` arrived in Flutter 3.27.
- **`unnecessary_underscores` (32)** — wants `(_, _)` instead of
  `(_, __)`. Duplicate `_` parameters only became legal in Dart 3.7.

Both older forms still compile — `withOpacity` is deprecated, not
removed — so the files build as they are. They are kept because they
also work on a project pinned to an older Flutter, where the modern
forms would not.

> **Correction to an earlier note:** this section first claimed that
> modernising either one would break "the SDK that matters". That was
> wrong. FlutterFlow 7.2 ships Flutter 3.47.1, which supports
> `withValues` and `(_, _)` perfectly well, so you may switch to them
> if you never intend to open these files on an older SDK. Nothing
> about the current code is broken either way.

---

## 7. The real glass tab bar, which is optional

**The four tab pages do not need this widget or its package.** Each one
draws its own glass bar from `BackdropFilter` and a gradient rim. Paste
the five pages, add nothing, and you have a working app.

`glass_tab_bar.dart` is the upgrade. It draws the bar with
`liquid_glass_widgets`, so the page genuinely bends and shines through
it and the selection flows between tabs like liquid. To switch it on:

1. add `liquid_glass_widgets: ^1.18.0` to that widget's Dependencies box
2. paste `glass_tab_bar.dart` in as `ZubiaGlassTabBar`, with the single
   `activeIndex` (Integer) parameter
3. in each page's `_tabBar()`, replace the `_Glass(...)` call with
   `const ZubiaGlassTabBar(activeIndex: N)` — N being that page's tab:
   0 Home, 1 Search, 2 Saved, 3 Profile

Each page carries that instruction as a comment above `_tabBar()`.

Nothing references `ZubiaGlassTabBar` until you make step 3, which is
deliberate: a page that merely *mentions* the class still needs it to
compile, so the missing package would break all four pages rather than
none.

Three details worth knowing before you change it:

- **Initialisation.** The package wants `LiquidGlassWidgets.initialize()`
  in `main()` before `runApp()`, which FlutterFlow does not let you
  edit. The widget loads the shaders lazily instead, behind a static
  guard so four pages cannot start four loads. Until they are ready it
  draws a plain bar of exactly the same size, so nothing jumps.
- **The 260ms pause.** Tapping a tab flows the glass first and navigates
  after. That wait is deliberate: FlutterFlow replaces the whole page on
  navigation, so switching immediately would tear the bar down mid-flow
  and the effect would never be seen.
- **Padding.** The bar is told `horizontalPadding: 0, verticalPadding: 0`
  and `barHeight: 56`, because the pages already position it 14 from
  each edge and clear of the home indicator. Changing `barHeight` means
  changing `_tabBarHeight` in all four pages too, or the last card will
  sit under the glass.

## 8. The design system

Tokens, type, glass and press behaviour are duplicated at the top of
every file — each widget has to compile on its own when pasted into
FlutterFlow. The blocks are identical; if you change one, change all
five.

- **Flat by default.** No shadows, no card borders. Glass only on what
  floats above the content: the tab bar, sheets, buttons over a photo.
- **Colours** are Zubia's, matching `web/app/globals.css` — one green at
  three depths (`#1A6B4A` / `#11513A` / `#EDF6F1`), warm neutrals, clay
  (`#A8441F`) as the single supporting hue, ember reserved for
  destructive actions so it keeps its meaning.
- **Type** carries optical tracking: the larger it is, the tighter it
  sets. SF Pro on Apple platforms, the platform default elsewhere — no
  downloaded font, which would be a tax on the first launch.
- **Every tap responds**: buttons and cards scale, list rows tint.
- **Loading shows skeletons, not spinners.** A spinner says "wait"; a
  card-shaped block says "cards, shortly".
