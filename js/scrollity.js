// OBJECT MODELS //
class Player {
  constructor(sprite, rectangle) {
    this.sprite = sprite;
    this.rectangle = rectangle;
    
    this.velocityX = 0;
    this.maximumVelocityX = 15;
    this.accelerationX = 1.2;
    this.frictionX = 0.9;
    
    this.velocityY = 0;
    this.maximumVelocityY = 30;
    this.accelerationY = 3;
    this.jumpVelocity = -30;

    this.climbingSpeed = 5;
    
    // boolean values to check whether the player falls or if he collides with a ladder
    this.isOnGround = false;
    this.isOnLadder = false;
  }

  animate(state) {
    if (state.keys[37] || state.keys[81]) { // left
      this.velocityX = Math.max(
        this.velocityX - this.accelerationX,
        this.maximumVelocityX * -1,
      );
    }

    if (state.keys[39] || state.keys[68]) { // right
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

    if (state.keys[32] && this.isOnGround) {
        this.velocityY = this.jumpVelocity;
        this.isOnGround = false;
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