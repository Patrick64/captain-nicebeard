rm propnames.json

uglifyjs \
tanks-in-time/game/js/class/class.js \
-o captain-nicebeard/game/js/class.js -m -c -screw-ie8  --reserve-domprops  --name-cache propnames.json --reserved-file reserved-props.json

uglifyjs \
tanks-in-time/game/js/class/sayings.js \
tanks-in-time/game/js/class/goo.js \
tanks-in-time/game/js/class/landscape.js \
tanks-in-time/game/js/class/game-events.js \
tanks-in-time/game/js/class/world.js \
tanks-in-time/game/js/class/bullet.js \
tanks-in-time/game/js/class/tank.js \
tanks-in-time/game/js/class/token.js \
tanks-in-time/game/js/class/floater.js \
tanks-in-time/game/js/tanks-cli.js \
-o captain-nicebeard/game/js/nicebeard.js -m -c -screw-ie8 --reserve-domprops --mangle-props --name-cache propnames.json --reserved-file reserved-props.json

uglifyjs \
tanks-in-time/game/my-game.js \
-o captain-nicebeard/game/my-game.js -m -c -screw-ie8 --reserve-domprops --mangle-props --name-cache propnames.json --reserved-file reserved-props.json

uglifyjs \
tanks-in-time/game/js/perlin.js \
-o captain-nicebeard/game/js/perlin.js -m -c -screw-ie8 --reserve-domprops --mangle-props --name-cache propnames.json --reserved-file reserved-props.json