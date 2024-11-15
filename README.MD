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

### Patch: 0.0.X

```
yarn release:patch
```

### Minor: 0.X.0

```
yarn release:minor
```

### Major: X.0.0

```
yarn release:major
```

### PUSH TO GIT :bangbang: :bangbang:

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

### Atom

These are the basic building blocks and the smallest functional units. In web design, an atom could be a button, a text field, or an icon. In software development, it might be a basic function or a variable.

### Molecules

When atoms are combined, they form molecules. In the context of a website, a molecule could be a form field (label + input + button) which combines multiple atoms.

### Organisms

Molecules come together to form organisms, which are relatively complex UI components. An example might be a header on a website that includes the logo, navigation, and search form (each of these components being a molecule).

### Templates

These are groups of organisms stitched together to form pages or sections of an interface. Templates provide a context for organisms to interact and serve as the backbone of a design system.
