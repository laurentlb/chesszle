# Chesszle

A chess-inspired puzzle game.

Work in progress, feedback welcomed.

The prototype can be tested here: https://laurent.le-brun.eu/games/chesszle/

## Hidden level editor

To create a level:
1. Open the JS console
2. Execute this command (adjust the list of pieces as needed):

```js
editor([{type: "rook", x: 0, y: 0}, {type: "bishop", x: 2, y: 3}, {type: "knight", x: 4, y: 4}]);
```

3. Move pieces (execute the solution)
4. Execute this command to get your level as JSON:

```js
editorSave();
```

5. To load a level and try it, run `loadLevel` with the JSON:

```js
loadLevel({"id": ...});
```
