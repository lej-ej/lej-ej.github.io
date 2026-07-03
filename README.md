# notes

A small workspace at https://lej-ej.github.io — writing, ideas,
and links to things being built.

## Structure

- `index.html` — home
- `blog.html` — writing index
- `blog/*.html` — individual posts
- `private.html` — password-gated area
- `css/style.css` — deep-green, earthy-warm palette in Lekton
- `js/main.js` — footer year
- `js/vines.js` — scroll-driven vine animation
- `js/gate.js` — client-side password gate

## Local preview

```
python3 -m http.server 8000
```

Then http://localhost:8000

## Changing the private password

Default password is `changeme`. To change it:

1. Pick a new password.
2. Compute its SHA-256 hash:
   ```
   echo -n "yourpassword" | shasum -a 256
   ```
3. Paste the hex string into `PASSWORD_HASH` in `js/gate.js`.

The gate is not real security — it's a curtain for casual visitors.

## Adding a blog post

1. Copy `blog/hello-world.html` to `blog/your-slug.html`.
2. Update the title, date, and content.
3. Add a new `<li>` to the `post-list` in `blog.html` (and on the
   home page if you want it featured).

## Notes on the vines

The scroll animation lives in `js/vines.js`. It draws SVG paths in
`index.html`, `blog.html`, and `blog/hello-world.html` using
`stroke-dashoffset` tied to page scroll progress. Leaves fade in
at thresholds set via `data-threshold` (0–1). Adjust in the SVG.
