# lej-ej.github.io

Personal site — published at https://lej-ej.github.io

## Structure

- `index.html` — home / about
- `blog.html` — blog index
- `blog/*.html` — individual posts
- `private.html` — password-gated area
- `css/style.css` — styles
- `js/main.js` — shared JS (footer year, etc.)
- `js/gate.js` — client-side password gate

## Local preview

Open `index.html` in a browser, or run:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Changing the private-area password

Default password is `changeme`. To change it:

1. Pick a new password.
2. Compute its SHA-256 hash:
   ```
   echo -n "yourpassword" | shasum -a 256
   ```
3. Paste the hex string into `PASSWORD_HASH` in `js/gate.js`.

This gate is not real security — it's just a curtain for casual visitors.

## Adding a blog post

1. Copy `blog/hello-world.html` to `blog/your-slug.html`.
2. Update the title, date, and content.
3. Add a new `<li>` to the `post-list` in `blog.html`.
