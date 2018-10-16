// --- OBJECT MODELS --- //

// Player class - node of this file, handles all interactions between player and the rest of the game objects
class Player {
  constructor(sprite, rectangle) {
    this.sprite = sprite;
    this.rectangle = rectangle;
    
    // handle player horizontal speed
    this.velocityX = 0;
    this.maximumVelocityX = 15;
    this.accelerationX = 1.2;
    this.frictionX = 0.9;
    
    // handle player vertical speed (acceleration/ gravity/ jump included)
    this.velocityY = 0;
    this.maximumVelocityY = 30;
    this.accelerationY = 3;
    this.jumpVelocity = -30;

    this.climbingSpeed = 5;
    
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
          if (state.keys[38] || state.keys[40]) {
            this.isOnLadder = true;
            this.isOnGround = false;
            this.velocityY = 0;
            this.velocityX = 0;
          }

          if (state.keys[38]) {
            this.rectangle.y -= this.climbingSpeed;
          }

          if (state.keys[40] && 
            me.y + me.height < you.y + you.height) {
            this.rectangle.y += this.climbingSpeed;
          }

          if (me.y <= you.x - me.height) {
            this.isOnLadder = false;
          }

          return;
        }

        if (collides && this.velocityY > 0 && you.y >= me.y) {
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
    })

    if (state.keys[32] && this.isOnGround) { // Press spacebar to jump
        this.velocityY = this.jumpVelocity;
        this.isOnGround = false;
        this.isOnSlope = false;
    }

    this.rectangle.x += this.velocityX;

    if (!this.isOnLadder) {
      this.rectangle.y += this.velocityY;
    }

    this.sprite.x = this.rectangle.x;
    this.sprite.y = this.rectangle.y;
  }
}

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

class Ladder {
  constructor(sprite, rectangle) {
    this.sprite = sprite;
    this.rectangle = rectangle;
  }

  get collides() {
    return false;
  }

  animate(state) {
    this.sprite.x = this.rectangle.x;
    this.sprite.y = this.rectangle.y;
  }
}

class LeftSlope {
  constructor(sprite, rectangle) {
    this.sprite = sprite;
    this.rectangle = rectangle;
  }

  get collides() {
    return false;
  }

  animate(state) {
    this.sprite.x = this.rectangle.x;
    this.sprite.y = this.rectangle.y;
  }
}

class RightSlope {
  constructor(sprite, rectangle) {
    this.sprite = sprite;
    this.rectangle = rectangle;
  }

  get collides() {
    return false;
  }

  animate(state) {
    this.sprite.x = this.rectangle.x;
    this.sprite.y = this.rectangle.y;
  }
}

class Decal {
  constructor(sprite, rectangle) {
    this.sprite = sprite;
    this.rectangle = rectangle;
  }

  get collides() {
    return false;
  }

  animate(state) {
    this.sprite.x = this.rectangle.x;
    this.sprite.y = this.rectangle.y;
  }
}

// Game class & functions used to instantiate the game scene and PixiJS concepts 
class Game {
  constructor() {
    this.state = {
      "keys": {},
      "clicks": {},
      "mouse": {},
      "objects": []
    }

    this.animate = this.animate.bind(this);
    this.app = new PIXI.Application(window.innerWidth, window.innerHeight, {backgroundColor : 0x000});
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
      window.innerWidth,
      window.innerHeight,
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
    })

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
    element.appendChild(this.app.view);
  }

  addObject(object) {
    this.state.objects.push(object);
    this.app.stage.addChild(object.sprite);
  }
}

// --- GAME SCENE SETUP --- //

// Create new instance of the game
const game = new Game();

// Setup the floor sprite
game.addObject(
  new Box(
    new PIXI.extras.TilingSprite.fromImage("https://s3.eu-west-3.amazonaws.com/scrollity-training/floor-tile.png", 
      window.innerWidth, 
      64),
    new PIXI.Rectangle(
      0,
      window.innerHeight - 64,
      window.innerWidth,
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
      0 + 32,
      window.innerHeight - 44 - 64,
      44,
      44,
    ),
  ),
);

game.addObject(
  new Box(
    new PIXI.Sprite.fromImage("https://s3.eu-west-3.amazonaws.com/scrollity-training/platform.png"),
    new PIXI.Rectangle(
      window.innerWidth - 400,
      window.innerHeight - 64 - 200,
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
      window.innerWidth - 250,
      window.innerHeight - 64 - 200,
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
      window.innerHeight - 64 - 64 + 1,
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
      window.innerHeight - 64 - 64 + 1,
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
      window.innerHeight - 64 + 1,
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
      window.innerHeight - 64 - 64 + 1,
      128,
      64,
    ),
  )
);

// Instantiate the player character
game.addObject(
  new Player(
    new PIXI.Sprite.fromImage("https://s3.eu-west-3.amazonaws.com/scrollity-training/player-idle.png"),
    new PIXI.Rectangle(
      window.innerWidth / 2,
      window.innerHeight / 2,
      44,
      56,
    ),
  )
);

game.addEventListenerTo(window);
game.addRendererTo(document.body);
game.animate();