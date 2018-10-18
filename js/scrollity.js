// --- OBJECT MODELS --- //

// Player class - node of this file, handles all interactions between player and the rest of the game objects
class Player {
  constructor(sprite, rectangle) {
    this.sprite = sprite;
    this.rectangle = rectangle;
    
    // handle player horizontal speed
    this.velocityX = 0;
    this.maximumVelocityX = 10;
    this.accelerationX = 1.2;
    this.frictionX = 0.9;
    
    // handle player vertical speed (acceleration/ gravity/ jump included)
    this.velocityY = 0;
    this.maximumVelocityY = 30;
    this.accelerationY = 3;
    this.jumpVelocity = -30;

    this.climbingSpeed = 8;
    
    // boolean values to check whether the player falls, collides with a slope or if he collides with a ladder
    this.isOnGround = false;
    this.isOnLadder = false;
    this.isOnSlope = false;
  }

  animate(state) {
    if (state.keys[37] || state.keys[81]) { // left pressed
      this.velocityX = Math.max(
        this.velocityX - this.accelerationX,
        this.maximumVelocityX * -1,
      );
    }

    if (state.keys[39] || state.keys[68]) { // right pressed 
      this.velocityX = Math.min(
        this.velocityX + this.accelerationX,
        this.maximumVelocityX,
      );
    }

    this.velocityX *= this.frictionX;

    this.velocityY = Math.min(
      this.velocityY + this.accelerationY,
      this.maximumVelocityY,
    );

    state.objects.forEach((object) => {
      if (object === this) {
        return;
      }

      const me = this.rectangle;
      const you = object.rectangle;
      const collides = object.collides;

      if (me.x < you.x + you.width &&
          me.x + me.width > you.x &&
          me.y < you.y + you.height &&
          me.y + me.height > you.y) {

        if (object.constructor.name === "Enemy" && !this.invulnerable) {
          // collision detection for jumping on top of enemy's head
          if (you.x < me.x && (me.x + me.width) >= you.x && (me.y + me.height) >= you.y) {
            // prevent player from jumping if his vertical speed isn't null
            if (this.velocityY != 0) {
              this.isOnGround = false;
            }

            this.velocityY = 0;

            // scope test tells that we're close to the enemy, just have to test if we collide with the top of enemy's sprite
            if ((me.y + me.height) >= you.y && (me.y + me.height) <= (you.y + you.height)) {
              // knock back player just like Mario and remove the enemy's sprite from the game
              this.velocityY -= 20;
              state.game.removeObject(object);
            }
          } else {
            // general horizontal collision with the enemy
            if (this.velocityX >= 0) {
              this.velocityX = -10;
            } else {
              this.velocityX = 10;
            }

            this.velocityY *= -1;

            this.invulnerable = true;
            this.sprite.alpha = 0.5;

            setTimeout(() => {
              this.invulnerable = false;
              this.sprite.alpha = 1;
            }, 1000);

            // remove one heart from player's health
            if (typeof this.onHurt === "function") {
              this.onHurt.apply(this);
            }
          }

          return;
        }

        if (object.constructor.name === "LeftSlope") {
          const meCenter = Math.round(me.x + (me.width / 2));
          const youRight = you.x + you.width;
          const youBottom = you.y + you.height;
          const highest = you.y - me.height;
          const lowest = youBottom - me.height;

          this.isOnGround = true;
          this.isOnSlope = true;

          me.y = lowest - (meCenter - you.x);
          me.y = Math.max(me.y, highest);
          me.y = Math.min(me.y, lowest);

          if (me.y >= lowest || me.y <= highest) {
            this.isOnSlope = false;
          }

          return;
        }

        if (object.constructor.name === "RightSlope") {
          const meCenter = Math.round(me.x + (me.width / 2));
          const youBottom = you.y + you.height;
          const highest = you.y - you.height;
          const lowest = youBottom - me.height;

          this.isOnGround = true;
          this.isOnSlope = true;

          me.y = highest + (meCenter - you.x);
          me.y = Math.max(me.y, highest);
          me.y = Math.min(me.y, lowest);

          if (me.y >= lowest || me.y <= highest) {
            this.isOnSlope = false;
          }

          return;
        }

        if (object.constructor.name === "Ladder") {
          if (state.keys[38] || state.keys[40] ||
            state.keys[83] || state.keys[90]) {
            this.isOnLadder = true;
            this.isOnGround = false;
            this.velocityY = 0;
            this.velocityX = 0;
          }

          if (state.keys[38] || state.keys[90]) {
            this.rectangle.y -= this.climbingSpeed;
          }

          if ((state.keys[40] || state.keys[83]) && 
            me.y + me.height < you.y + you.height) {
            this.rectangle.y += this.climbingSpeed;
          }

          if (me.y <= you.x - me.height) {
            this.isOnLadder = false;
          }

          return;
        }

        if (collides && this.velocityY > 0 && you.y >= me.y) {
          me.y = you.y - me.height + 1;
          this.isOnGround = true;
          this.velocityY = 0;
          return;
        }

        if (collides && this.velocityY < 0 && you.y <= me.y) {
          this.velocityY = this.accelerationY;
          return;
        }

        if (collides && this.velocityX < 0 && you.x <= me.x) {
          this.velocityX = 0;
          return;
        }

        if (collides && this.velocityX > 0 && you.x >= me.x) {
          this.velocityX = 0;
          return;
        }
      }
    });

    if (state.keys[32] && this.isOnGround) { // Press spacebar to jump
        this.velocityY = this.jumpVelocity;
        this.isOnGround = false;
        this.isOnSlope = false;
    }

    this.rectangle.x += this.velocityX;

    if (!this.isOnLadder && !this.isOnSlope) {
      this.rectangle.y += this.velocityY;
    }

    if (this.isOnGround && Math.abs(this.velocityX) < 0.5) {
      state.game.stage.removeChild(this.sprite);
      state.game.stage.addChild(this.idleLeftSprite);
      this.sprite = this.idleLeftSprite;
    }

    if (this.isOnGround && Math.abs(this.velocityX) > 0.5) {
      state.game.stage.removeChild(this.sprite);
      state.game.stage.addChild(this.runLeftSprite);
      this.sprite = this.runLeftSprite;
    }

    if (this.isOnGround && this.velocityX > 0) {
      this.sprite.anchor.x = 0.5;
      this.sprite.scale.x = 1;
    }

    if (this.isOnGround && this.velocityX < 0) {
      this.sprite.anchor.x = 0.5;
      this.sprite.scale.x = -1;
    }

    this.sprite.x = this.rectangle.x;
    this.sprite.y = this.rectangle.y;
  }
}

// Generic Box object model
class Box {
  constructor(sprite, rectangle) {
    this.sprite = sprite;
    this.rectangle = rectangle;
  }

  get collides() {
    return true;
  }

  animate(state) {
    this.sprite.x = this.rectangle.x;
    this.sprite.y = this.rectangle.y;
  }
}

// Custom object model for the enemies of the game
// - the player needs to jump on them in order to kill them
class Enemy extends Box {
  constructor(sprite, rectangle) {
    super(sprite, rectangle);

    this.limit = 200;
    this.left = true;

    this.sprites = [
      "https://s3.eu-west-3.amazonaws.com/scrollity-training/blob-idle-1.png",
      "https://s3.eu-west-3.amazonaws.com/scrollity-training/blob-idle-2.png"
    ];

    this.leftSprite = new PIXI.Sprite.fromImage(this.sprites[0]);
    this.rightSprite = new PIXI.Sprite.fromImage(this.sprites[1]);
  }

  animate(state) {
    if (this.left) {
      state.game.stage.removeChild(this.sprite);
      state.game.stage.addChild(this.leftSprite);
      this.sprite = this.leftSprite;

      this.rectangle.x -= 2;
    }

    if (!this.left) {
      state.game.stage.removeChild(this.sprite);
      state.game.stage.addChild(this.rightSprite);
      this.sprite = this.rightSprite;

      this.rectangle.x += 2;
    }

    this.limit -= 2;

    if (this.limit <= 0) {
      this.left = !this.left;
      this.limit = 200;
    }

    this.sprite.x = this.rectangle.x;
    this.sprite.y = this.rectangle.y;
  }
}

// Ladder object model
class Ladder extends Box {
  get collides() {
    return false;
  }
}

// Slopes object models
class LeftSlope extends Box {
  get collides() {
    return false;
  }
}

class RightSlope extends Box {
  get collides() {
    return false;
  }
}

class Decal extends Box {
  get collides() {
    return false;
  }
}

// Game class & functions used to instantiate the game scene and PixiJS concepts 
class Game {
  constructor(w, h) {
    this.w = w;
    this.h = h;

    this.state = {
      "keys": {},
      "clicks": {},
      "mouse": {},
      "objects": [],
      "game": this
    }

    this.animate = this.animate.bind(this);
  }

  get stage() {    
    if (!this._stage) {      
      this._stage = this.newStage();   
    }
    
    return this._stage;  
  }

  set stage(stage) {    
    this._stage = stage; 
  }

  newStage() {    
    return new PIXI.Container();  
  }

  get renderer() {    
    if (!this._renderer) {      
      this._renderer = this.newRenderer();    
    }

    return this._renderer;  
  }

  set renderer(renderer) {    
    this._renderer = renderer;  
  }

  newRenderer() {
    return new PIXI.autoDetectRenderer(
      this.w,
      this.h,
      this.newRendererOptions()
    );
  }

  newRendererOptions() {
    return {
      "antialias": true,
      "autoResize": true,
      "transparent": true,
      "roundPixels": true,
      "resolution": 2,
    };
  }

  animate() {
    requestAnimationFrame(this.animate);

    this.state.renderer = this.renderer;
    this.state.stage = this.stage;

    this.state.objects.forEach((object) => {
      object.animate(this.state);
    });

    // Add camera logic, focused on player
    if (this.player) {
      const offsetLeft = Math.round(
        this.player.rectangle.x - (window.innerWidth / 2)
      ) * -1;

      const offsetTop = Math.round(
        this.player.rectangle.y - (window.innerHeight / 2)
      ) * -1;

      this.element.style = `
        transform:
        scale(1.2)
        translate(${offsetLeft}px)
        translateY(${offsetTop}px)
      `;
    }

    this.renderer.render(this.stage);
  }

  addEventListenerTo(element) {
    element.addEventListener("keydown", (event) => {
      this.state.keys[event.keyCode] = true;
    });

    element.addEventListener("keyup", (event) => {
      this.state.keys[event.keyCode] = false;
    });

    element.addEventListener("mousedown", (event) => {
      this.state.clicks[event.which] = {
        "clientX": event.clientX,
        "clientY": event.clientY,
      };
    });

    element.addEventListener("mouseup", (event) => {
      this.state.clicks[event.which] = false;
    });

    element.addEventListener("mousemove", (event) => {
      this.state.mouse.clientX = event.clientX;
      this.state.mouse.clientY = event.clientY;
    });
  }

  addRendererTo(element) {
    this.element = element;
    this.element.appendChild(this.renderer.view);
  }

  addObject(object) {
    this.state.objects.push(object);
    this.stage.addChild(object.sprite);
  }

  removeObject(object) {
    this.state.objects = this.state.objects.filter(
      function(next) {
        return next !== object;
      }
    );

    this.stage.removeChild(object.sprite);
  }
}

// --- GAME SCENE SETUP --- //

// Create new instance of the game
const width = window.innerWidth;
const height = window.innerHeight + 200;

const game = new Game(width, height);

// Setup the floor sprite
game.addObject(
  new Box(
    new PIXI.extras.TilingSprite.fromImage("https://s3.eu-west-3.amazonaws.com/scrollity-training/floor-tile.png", 
      window.innerWidth, 
      64),
    new PIXI.Rectangle(
      0,
      height - 64,
      width,
      64,
    ),
  )
);

// Setup the different game objects and obstacles
game.addObject(
  new Box(
    new PIXI.Sprite.fromImage(
      "https://s3.eu-west-3.amazonaws.com/scrollity-training/box.png",
    ),
    new PIXI.Rectangle(
      0 + 128,
      height - 44 - 64,
      44,
      44,
    ),
  ),
);

game.addObject(
  new Box(
    new PIXI.Sprite.fromImage("https://s3.eu-west-3.amazonaws.com/scrollity-training/platform.png"),
    new PIXI.Rectangle(
      width - 400,
      height - 64 - 200,
      256,
      64,
    ),
  )
);

game.addObject(
  new Ladder(
    new PIXI.extras.TilingSprite.fromImage("https://s3.eu-west-3.amazonaws.com/scrollity-training/ladder.png", 
      44, 
      200),
    new PIXI.Rectangle(
      width - 250,
      height - 64 - 200,
      44,
      200,
    ),
  )
);

game.addObject(
  new LeftSlope(
    new PIXI.Sprite.fromImage(
      "https://s3.eu-west-3.amazonaws.com/scrollity-training/slope-left.png",
    ),
    new PIXI.Rectangle(
      0 + 250,
      height - 64 - 64 + 1,
      64,
      64,
    ),
  )
);

game.addObject(
  new RightSlope(
    new PIXI.Sprite.fromImage(
      "https://s3.eu-west-3.amazonaws.com/scrollity-training/slope-right.png",
    ),
    new PIXI.Rectangle(
      0 + 250 + 64 + 128,
      height - 64 - 64 + 1,
      64,
      64,
    ),
  )
);

game.addObject(
  new Decal(
    new PIXI.Sprite.fromImage(
      "https://s3.eu-west-3.amazonaws.com/scrollity-training/hill-base.png",
    ),
    new PIXI.Rectangle(
      0 + 250,
      height - 64 + 1,
      128,
      64,
    ),
  )
);

game.addObject(
  new Box(
    new PIXI.Sprite.fromImage(
      "https://s3.eu-west-3.amazonaws.com/scrollity-training/hill-top.png",
    ),
    new PIXI.Rectangle(
      0 + 250 + 64,
      height - 64 - 64 + 1,
      128,
      64,
    ),
  )
);

// Instantiate a new enemy to be interacted with
game.addObject(
  new Enemy(
    new PIXI.Sprite.fromImage(
      "https://s3.eu-west-3.amazonaws.com/scrollity-training/blob-idle-1.png",
    ),
    new PIXI.Rectangle(
      width - 450,
      height - 64 - 48,
      48,
      48,
    ),
  ),
);

// Handle player's character animation by replacing its default sprite by an AnimatedSprite (cf. PixiJS documentation)
const playerIdleLeftImages = [
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-idle-1.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-idle-2.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-idle-3.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-idle-4.png"
];

// Handle player's character animation while running
const playerRunLeftImages = [
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-1.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-2.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-3.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-4.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-5.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-6.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-7.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-8.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-9.png",
  "https://s3.eu-west-3.amazonaws.com/scrollity-training/player-run-10.png"
];

const playerIdleLeftTextures = playerIdleLeftImages.map(
  function(image) {
    return PIXI.Texture.fromImage(image);
  }
);

const playerRunLeftTextures = playerRunLeftImages.map(
  function(image) {
    return PIXI.Texture.fromImage(image);
  }
);

const playerIdleLeftSprite = new PIXI.extras.AnimatedSprite(playerIdleLeftTextures);
const playerRunLeftSprite = new PIXI.extras.AnimatedSprite(playerRunLeftTextures);

playerIdleLeftSprite.play();
playerIdleLeftSprite.animationSpeed = 0.12;

playerRunLeftSprite.play();
playerRunLeftSprite.animationSpeed = 0.2;

// Instantiate the player character and add it to the world as a constant
const player = new Player(
  playerIdleLeftSprite,
  new PIXI.Rectangle(
    Math.round(width / 2),
    Math.round(height / 2),
    48,
    56,
  )
);

player.idleLeftSprite = playerIdleLeftSprite;
player.runLeftSprite = playerRunLeftSprite;

game.addObject(player);
game.player = player;

// Function displaying the game over text
function end() {
  // Create the text sprite and add it to the game scene by preventing the player from.. playing
  let style = new PIXI.TextStyle({
    fontFamily: "Tahoma",
    fontSize: 64,
    fill: "white"
  });

  message = new PIXI.Text("You lost !", style);

  message.x = game.player.rectangle.x - 175;
  message.y = game.player.rectangle.y - 64;

  game.stage.addChild(message);
}

// Display player's health, heart by heart
var hearts = 3;

player.onHurt = function() {
  document.querySelector(`.heart-${hearts}`).className += " heart-grey";

  hearts--;

  if (hearts < 1) {
    end();

    game.removeObject(player);

    return;
  }
}

// Render the whole game scene
game.addEventListenerTo(window);

// Add renderer to the Camera div so that it renders the game world only when the player moves
game.addRendererTo(document.querySelector(".camera"));
game.animate();