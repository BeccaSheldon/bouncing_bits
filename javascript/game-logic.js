// Pacman-type game, avoid the big bitcoins & eat smaller ones to grow

/** TO DO:
* Add 'Game Won' message when cursor size is > than cdlc.RADIUS_SIZES
*
* Refactor stopGame() on line 174
*/

var CONTAINER_ID    = 'coins-container',
NUM_COINS           = 20;

$(function(){
  canvas        = document.getElementById(CONTAINER_ID);
  canvas.width  = cdlc.CANVAS_WIDTH;
  canvas.height = cdlc.CANVAS_HEIGHT;

  var ctx       = canvas.getContext('2d');

  var CursorModel = Backbone.Model.extend({
    defaults: {
      x: 0,
      y: 0,
      radius: cdlc.RADIUS_SIZES[0],
      size: 0,
      color: '#333'
    },

    grow: function() {
      var newSize = this.get('size') + 1;

      this.set({
        size: newSize,
        radius: cdlc.RADIUS_SIZES[newSize]
      });
    }
  });

  // The CoinView renders the CoinModel based on x, y, radius, and color
  var CoinView = Backbone.View.extend({
    initialize: function() {
      this.model.bind('change', _.bind(this.render, this));
    },

    render: function() {
      var x = this.model.get('x');
      var y = this.model.get('y');
      var radius = this.model.get('radius');

      var img = new Image();
      img.src = "images/bitcoin.png";

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = this.model.get('color');
      ctx.fill();
      // Draw Bitcoin "B" logo to the gold coins
      if (this.model.get('color') === "tan") {
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
      }
    }
  });

  var GameView = Backbone.View.extend({
    initialize: function() {
      this.coins = this.createCoins();
      this.cursor = new CursorModel();
      this.$overlay = $('#overlay');
      this.$restart = $('#restart-button');
    },

    // Return an array of coins that have been positioned
    createCoins: function() {
      var coins = [];
      for(var i = 0; i < NUM_COINS; i++) {
        var coin = new cdlc.CoinModel();
        coins.push(coin);

        // Create a new view to render the coin
        new CoinView({model: coin, el: CONTAINER_ID});
      }
      return coins;
    },

    render: function() {
      // Make 'this' the view instead of the window by using 'bind(this)'
      window.requestAnimationFrame(this.takeStep.bind(this));
      $(document).mousemove(this.cursorMoved.bind(this));
      $(this.$overlay).click(this.$restart, this.restartGame.bind(this));
    },

    // Update and render all the coins for the new frame
    moveAllCoins: function() {
      for(var i = 0; i < NUM_COINS; i++) {
        this.coins[i].move();
      }
    },

    // Clear the canvas
    startNewFrame: function() {
      ctx.clearRect(0, 0, cdlc.CANVAS_WIDTH, cdlc.CANVAS_HEIGHT);
    },

    // Return the colliding coin if there is a collision (otherwise false)
    lookForCollisions: function() {
      for(var i = 0; i < NUM_COINS; i++) {
        // Calculate the distance between the cursor and the coin
        var coinX = this.coins[i].get('x'),
            coinY = this.coins[i].get('y'),
            coinRadius = this.coins[i].get('radius'),
            cursorX = this.cursor.get('x'),
            cursorY = this.cursor.get('y'),
            cursorRadius = this.cursor.get('radius'),
            hasCollided = this.coins[i].get('hasCollided');

        // Distance formula
        var distance = Math.sqrt(Math.pow(coinX - cursorX, 2) + Math.pow(coinY - cursorY, 2));
        if(distance <= coinRadius + cursorRadius && !hasCollided) {
          // A collision has occured
          this.coins[i].set('hasCollided', true);
          return this.coins[i];
        }
      }
      return false;
    },

    growOrDie: function(collidingCoin) {
      if(collidingCoin.get('radius') > this.cursor.get('radius')) {
        this.gameOver();
      }
      else {
        this.cursor.grow();
      }
    },

    takeStep: function() {
      this.startNewFrame();
      this.moveAllCoins();
      this.drawCursor();

      var collision = this.lookForCollisions();
      if(collision) {
        this.growOrDie(collision);
      }

      window.requestAnimationFrame(this.takeStep.bind(this));
    },

    cursorMoved: function(event) {
      this.cursor.set({
        x: event.clientX,
        y: event.clientY
      });
    },

    drawCursor: function() {
      var x       = this.cursor.get('x');
      var y       = this.cursor.get('y');
      var radius  = this.cursor.get('radius');

      var img     = new Image();
      img.src = "images/cdlc-logo-black-red.png";

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = this.cursor.get('color');
      ctx.strokeStyle="#333";
      ctx.lineWidth=5;
      ctx.fill();
      ctx.stroke();
      // Add brand logo to cursor coin
      ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    },

    stopGame: function() {
      // Hack to prevent end the game; move coins off screen & prevent re-entry
      for(var i = 0; i < NUM_COINS; i++) {
        this.coins[i].set({
          radius: 100,
          x: -1 * this.coins[i].get('radius'),
          y: -1 * this.coins[i].get('radius'),
          velocity: 0
        });
        this.coins[i].destroy();
      }
      this.unbind();
      this.remove();
    },

    restartGame: function(){
      this.$overlay.addClass('hidden');
      this.$overlay.empty();
      this.initialize();
    },

    displayOverlay: function() {
      var gameOverMessage = '<div>GAME OVER.</div>';
      var winningsMessage = '<div>You won ' + this.cursor.get('size') + ' Bitcoins!</div>';
      var restartButton   = '<button id="restart-button">Restart</button>';
      var overlayMessages = gameOverMessage + winningsMessage + restartButton;

      this.$overlay.removeClass('hidden');
      this.$overlay.append(overlayMessages);
    },

    gameOver: function() {
      this.stopGame();
      this.displayOverlay();
    }
  });

  var game = new GameView();
  game.render();
});