# proto_claude

## לומדים אותיות עם ממתקים — Learn Hebrew Letters with Candy

A pixel-art p5.js game for kids learning the Hebrew alphabet. Candies (and
occasionally a Hebrew letter) roll out of a candy tub across the screen.
Tap a rolling candy to reveal its Hebrew word below, with the first letter
highlighted and underlined. Tap a rolling letter and its matching candy is
shown for 3 seconds before the word appears the same way. A tracker at the
bottom lights up each of the 22 letters as it's learned.

### Running it

No build step — just open `index.html` in a browser, or serve the folder
locally:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

### Files

- `index.html` — page shell, loads p5.js and the Heebo font
- `style.css` — responsive, pixelated canvas scaling
- `js/data.js` — the 22 letter → candy word pairs
- `js/sprites.js` — the pixel-art color palette and all icon drawing code
- `js/sketch.js` — game loop, spawning, catching, and the RTL word-emphasis renderer
