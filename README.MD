# fitbox v2

## DEVELOPMENT

### Android

```bash
yarn android
```

### iOS

```bash
yarn ios
```

## RELEASE

Run `yarn release:[type]` to bump the version and create a new release. This will also update native version codes. (e.g. build.gradle, Info.plist)

```
yarn release:patch
```

### Patch: 0.0.X

For `bug fixes or small changes` that do not affect existing features or APIs.
These changes are backward-compatible and do not add new features.

Examples:

-   Fixing a crash in a specific scenario.
-   Correcting typos or minor UI alignment issues.
-   Resolving security vulnerabilities without altering functionality.

<br />
<b>Run command:</b>

```
yarn release:patch
```

### Minor: 0.X.0

For `new features or enhancements` that are added in a _backward-compatible_ way.
The existing app still works as before, but with additional functionality.

Examples:

-   Adding a new feature, like a "dark mode" toggle.
-   Improving app performance without breaking compatibility.
-   Introducing new APIs while keeping old ones functional.

<br />
<b>Run command:</b>

```
yarn release:minor
```

### Major: X.0.0

For `breaking changes` that are introduced in a non-backward-compatible manner.
These changes are not backward-compatible and may require updates to the app's codebase.

Examples:

-   Removing or significantly altering existing features.
-   Reworking the core functionality, requiring users to adapt.
-   Switching to a new framework or architecture that may require changes on the user’s end.

<br />
<b>Run command:</b>

```
yarn release:major
```

### PUSH TO GIT (Important) :bangbang: :bangbang:

```bash
git push --follow-tags origin [branch-name]
```

## CONVENTIONAL COMMITS:

In creating commits, always follow the conventional commits.

Please refer to: https://kapeli.com/cheat_sheets/Conventional_Commits.docset/Contents/Resources/Documents/index

## TRANSLATION

Make sure to place text to translations files.

:bangbang: On-hold, to speed up development, we will not be using translations for now. :bangbang:

```
- DashboardScreen   |   src\translations\en\dashboard.json
- Landing           |   src\translations\en\landing.json
```

## COMPONENTS

In creating screens, make sure to follow atomic design methodology and place it under `\src\components`

### `Atom`

These are the basic building blocks and the smallest functional units. In web design, an atom could be a button, a text field, or an icon. In software development, it might be a basic function or a variable.

### `Molecules`

When atoms are combined, they form molecules. In the context of a website, a molecule could be a form field (label + input + button) which combines multiple atoms.

### `Organisms`

Molecules come together to form organisms, which are relatively complex UI components. An example might be a header on a website that includes the logo, navigation, and search form (each of these components being a molecule).

### `Templates`

These are groups of organisms stitched together to form pages or sections of an interface. Templates provide a context for organisms to interact and serve as the backbone of a design system.
