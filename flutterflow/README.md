# Zubia — FlutterFlow custom widgets

Five pages, each a single self-contained FlutterFlow **custom widget**.
Every one talks directly to the Next.js app in [`../web`](../web) over its
`/api/v1` endpoints, so the phone and the website always show the same
listings, the same prices and the same move-in costs.

| File | Widget class | What it is |
|---|---|---|
| `search.dart` | `ZubiaSearch` | **The page the app opens on.** Map, results sheet, filters |
| `listing.dart` | `ZubiaListing` | One listing in full, with the enquiry form |
| `saved.dart` | `ZubiaSaved` | The listings hearted on this phone |
| `profile.dart` | `ZubiaProfile` | Sign-in, privacy, settings |

**Three tabs: Search, Saved, Profile.** Search leads, the way the big
property apps do it — they have no "home" tab either, because the map
and the search field *are* the home screen. Listing is reached by
tapping a card, so it is a page but never a tab.

Set `ZubiaSearch` on your initial FlutterFlow page. `ZubiaSearch` also
hosts `openTab`, so it is the one widget the others depend on — paste it
**first**, or the other pages will not compile.

---

## 1. Before you paste anything

### Add the pub packages

FlutterFlow → **Settings → App Settings → Pub Dependencies**. Add:

Each custom widget has its own **Dependencies** box. Put the package in
the box of every widget that needs it.

| Package | Used for | Needed by |
|---|---|---|
| `http` | every API call | all four |
| `cached_network_image` | listing photos, cached on disk | search, listing, saved |
| `shared_preferences` | the saved-listing ids | all four |
| `flutter_map: ^8.3.2` | the map on the landing page | **search only** |
| `latlong2: ^0.10.1` | `LatLng` for the map | **search only** |
| `flutter_secure_storage: ^9.2.2` | the session token | **profile only** |

The first three usually resolve already. The last three are the ones
that produce `Couldn't resolve the package …` if you skip them:

- **`flutter_map` and `latlong2` both go in `ZubiaSearch`'s box.**
  latlong2 is not optional: flutter_map depends on it but does not
  re-export `LatLng`, so importing it directly needs its own entry.
- **`flutter_secure_storage` goes in `ZubiaProfile`'s box.** It is not
  interchangeable with `shared_preferences` — see §5.

### Before real users: your own map tiles

The map points at OpenStreetMap's public tile servers, which are free
and need no key. Their usage policy is aimed at modest, non-commercial
traffic, so **swap `_tileUrl` in `search.dart` for your own tile source
or a paid provider before launch**, or the tiles will be cut off.

Tiles are also the heaviest thing this app downloads, on connections
paid for by the megabyte. The map opens at one sensible zoom and the
results sheet covers most of it on purpose, so an ordinary search
fetches one screen of tiles and no more.

**The attribution is not optional.** OpenStreetMap's licence requires
the data to be credited wherever the map is shown, which is what the
`© OpenStreetMap` chip above the sheet is for. If you move to another
tile source, credit that one instead — do not simply delete it.

### Tuning the map's colour

Raw OSM tiles are bright: green parks, yellow trunk roads, pink
motorways. A green price pin lands on them invisibly, so the tiles are
muted through a saturation filter and the pins carry the only strong
colour on the screen — which is how every property app does it.

Two constants at the top of `search.dart` control it:

```dart
const double _mapColour = 0.3;  // 0 = grey, 1 = OSM's own palette
const double _mapLift = 18;     // nudges the tiles toward white
```

Turn `_mapColour` up if you want more of the city legible, down for a
quieter backdrop. The filter is applied to the tile layer only, never
to the whole map — filtering the markers too would wash the price green
out along with everything else.

`cached_network_image` matters more than it looks: photos are the
heaviest thing the app downloads, and data here is paid for by the
megabyte. `flutter_secure_storage` is not interchangeable with
`shared_preferences` — see §5.

### Point the widgets at your server

Each file opens with one line, just under the imports:

```dart
const String _apiBase = 'http://localhost:3001';
```

Change it in **all four files** — they must agree.

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

There are no exceptions: all four widgets take `width` and `height` and
nothing else.

> **Leave "Width and Height" switched on.** Every widget here accepts
> `width` and `height` for exactly that reason. Switching it off, or
> removing those two from the constructor, produces
> `Parameter "width" not found.` when you save.

### Replacing an earlier version of a widget

FlutterFlow keeps the parameter list you declared last time and checks
the new code against it. Pasting these files over an older version will
fail to save until the stale entries are gone.

In **Define Parameters**, delete everything except `width` and `height`
— that means `activeIndex`, `savedCount`, `onHome`, `onSearch`,
`onSaved`, `onProfile`, `onOpenSearch`, `onOpenListing`, `onHomeTap`,
`onSearchTap`, `onSavedTap`, `onProfileTap`, `onBack`, `initialType` and
`listingId`, wherever each appears.

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
| `ZubiaListing.openId` | `listing.dart` | Search and Saved, before navigating | `ZubiaListing` on open |
| `ZubiaSearch.openType` | `search.dart` | whoever opens a typed search | `ZubiaSearch` on open |
| `ZubiaSearch.openTab(context, i)` | `search.dart` | every tab bar | — |

```dart
ZubiaListing.openId = l.id;
Navigator.of(context).push(
  MaterialPageRoute(builder: (_) => const ZubiaListing()),
);
```

`openTab` lives on `ZubiaSearch` because Search is the page the app
opens on and is always present. It uses `pushReplacement`, so tapping
Search from Saved lands on Search instead of stacking a second Search on
top of it. Opening a listing uses a plain `push`, so the back button
returns where you were.

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

## 7. The map and the results sheet

The landing page is a map with the results over it, the way the big
property apps open.

- **Pins carry the price**, not a dot. On a map of rentals the number is
  the whole reason to look.
- **The sheet snaps** to three stops: 28% leaves the map readable, 55%
  is the default, 94% covers it for reading through a list. The same
  screen serves someone browsing an area and someone comparing places.
- **The map re-centres** on the average of the pins after each search,
  not on a fitted bounding box: one listing 200km away would otherwise
  zoom out until every pin in Kampala sat on top of the others.
- **Rotation is off.** People spin a map by accident with two fingers
  and then cannot find north again.
- **A listing with no coordinates** is left off the map rather than
  dropped at 0,0 in the Gulf of Guinea. It still appears in the list.

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
