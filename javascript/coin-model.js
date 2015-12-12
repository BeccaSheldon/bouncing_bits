if(typeof(window.cdlc) === 'undefined') {
  window.cdlc = {};
}

cdlc.RADIUS_SIZES        = [10, 15, 20, 25, 30, 40, 50, 60];
cdlc.COLORS              = ['white', 'firebrick', 'tan'];
cdlc.CANVAS_WIDTH        = window.innerWidth;
cdlc.CANVAS_HEIGHT       = window.innerHeight;
cdlc.MAX_START_DISTANCE  = 100;
cdlc.NOT_ENTERED_MAX     = 10;

cdlc.CoinModel = Backbone.Model.extend({
  initialize: function() {
    // Choose a random size from the possible cdlc.RADIUS_SIZES
    this.set('radius', cdlc.RADIUS_SIZES[Math.floor(Math.random() * cdlc.RADIUS_SIZES.length)]);
    // Choose a random color
    this.set('color', cdlc.COLORS[Math.floor(Math.random() * cdlc.COLORS.length)]);
    // Choose a random velocity from 1-4
    this.set('velocity', Math.random() * 3 + 1);
    // Position the coin on the outside and angle towards the screen
    this.position();
  },

  /**
  * Calculate a starting position around the perimeter of the canvas with an angle
  * pointing toward it so the coins don't fly away
  */
  position: function() {
    var x, y, angle;
    // Each side of the canvas will have a different way to calculate position and angle
    var startSide = Math.random() * 4;
    if(startSide < 1) {
      // Top
      x = Math.random() * cdlc.CANVAS_WIDTH;
      y = -1 * Math.random() * cdlc.MAX_START_DISTANCE;
      angle = Math.random() * Math.PI + Math.PI;
    }
    else if(startSide < 2) {
      // Right
      // This one's tricky because it crosses the 0 boundary so it's treated in two parts
      x = cdlc.CANVAS_WIDTH + Math.random() * cdlc.MAX_START_DISTANCE;
      y = Math.random() * cdlc.CANVAS_HEIGHT;

      angle = Math.random() * Math.PI;
      if(angle > Math.PI/2) {
        angle = angle + Math.PI;
      }
    }
    else if(startSide < 3) {
      // Bottom
      x = Math.random() * cdlc.CANVAS_WIDTH;
      y = cdlc.CANVAS_HEIGHT + Math.random() * cdlc.MAX_START_DISTANCE;
      angle = Math.random() * Math.PI + Math.PI/2;
    }
    else {
      // Left
      x = -1 * Math.random() * cdlc.MAX_START_DISTANCE;
      y = Math.random() * cdlc.CANVAS_HEIGHT;
      angle = Math.random() * Math.PI;
    }

    // The coin is being positioned so we'll set its state to not yet entered
    this.set({
      x: x,
      y: y,
      angle: angle,
      hasEntered: false,
      notEnteredCount: 0,
      hasCollided: false
    });
  },

  // Calculate the new x and y for the next frame
  move: function() {
    var newX = this.get('x') + this.get('velocity') * Math.sin(this.get('angle'));
    var newY = this.get('y') + this.get('velocity') * Math.cos(this.get('angle'));
    this.set({x: newX, y: newY});

    if(this.isOutOfBounds()) {
      if(this.get('hasEntered')) {
        // Reposition the coin after it 'hasEntered' and then goes off screen
        this.position();
      }
      else {
        this.set('notEnteredCount', this.get('notEnteredCount') + 1);
      }
    }
    else {
      // Once the coin is viewable on screen, we'll say that it 'hasEntered'
      this.set('hasEntered', true);
    }

    // Recycle coins that have been out of bounds for too long (a little hacky)
    if(this.get('notEnteredCount') > cdlc.NOT_ENTERED_MAX) {
      this.position();
    }
  },

  isOutOfBounds: function() {
    var x = this.get('x'), y = this.get('y');
    var radius = this.get('radius');

    return y < -1 * radius // Top
        || x > cdlc.CANVAS_WIDTH + radius // Right
        || y > cdlc.CANVAS_HEIGHT + radius // Bottom
        || x < -1 * radius; // Left
  }
});