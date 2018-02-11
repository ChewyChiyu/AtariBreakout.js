window.onload = function(){ //wrapper, observe for fully loaded game

//global class

class GameObject{
	constructor(x,y,dx,dy,w,h,img){
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.w = w;
		this.h = h;
		this.img = img;
	}
}

class Paddle extends GameObject{
	constructor(x,y,speed, scale){
		super( x - (paddleTexture.width*scale)/2,y,0,0, paddleTexture.width * scale, paddleTexture.height * scale, paddleTexture)
		this.speed = speed
	}

	move(){

		//bounds check
		if((this.dx < 0 && this.x < 0 )|| (this.dx > 0 && this.x + this.w > canvas.width ) ){ 
			return
		}

		this.x += this.dx
		this.dy += this.dy
	}

	draw(context){
		context.drawImage(this.img,this.x,this.y,this.w,this.h);
	}

	isContact(x,y){
		if(this.x < x && this.x + this.w > x && this.y < y && this.y + this.h > y){
			return true
		}
		return false
	}


}

class Brick extends GameObject{
	constructor(x,y,w,h,color){
		super(x,y,0,0,w,h,null)
		this.color = color
	}

	draw(context){
		const border = this.w*.05
		context.fillStyle = shadeColor(this.color, -40)
		context.fillRect(this.x,this.y,this.w,this.h) //bordre brick

		context.fillStyle = this.color
		context.fillRect(this.x + border ,this.y + border ,this.w - border*2,this.h - border*2) //actual border

	}


	isContact(x,y){

		if(((x > this.x && x < this.x + this.w*.2) || (x > this.x + this.w*.8 && x < this.x + this.w) ) && y > this.y && y < this.y + this.h){

			if( y > this.y + this.h*.2 && y < this.y + this.h*.8){ //horizontal shift
				return 0
			}else{ //vertial shift
				return 1
			}
		}



		if(((y > this.y && y < this.y + this.h*.2) || (y > this.y + this.h*.8 && y < this.y + this.h) ) && x > this.x && x < this.x + this.w){

			if( x > this.x + this.w*.2 && x < this.x + this.w*.8){ //horizontal shift
				return 1
			}else{ //vertial shift
				return 0
			}
		}


		return -1

	}
}

class Ball extends GameObject{

	constructor(x,y,raidus){
		super(x,y,0,0,raidus,raidus,null)
		this.isLaunched = false
		this.initialSpeed = 6
	}

	draw(context){
		context.fillStyle="#000000";
		context.beginPath();
		context.arc(this.x, this.y, this.w, 0, 2 * Math.PI);
		context.fill();
	}

	move(){
		if(!this.isLaunched){ //attach to paddle
			this.dx = paddle.dx
		}

		this.x += this.dx
		this.y += this.dy

	}
}


//global vars
const canvas = document.getElementById("AtariBreakout")
const context = canvas.getContext("2d")
const MAX_FPS = 60;


//textures
var paddleTexture = new Image();
paddleTexture.src = "Paddle.png"

var gameLoop  //max fps, engine of game

var paddle //player
var ball
var bricks

//keys

window.addEventListener("keydown", function (event) {
	if (event.defaultPrevented) {
    //return; 
}
switch(event.key){
	case "a":
	paddle.dx = -paddle.speed
	break;
	case "d":
	paddle.dx = paddle.speed
	break;
	case " ":
	launchBall()
	break
	default:
	break;
}


event.preventDefault();
}, true);



window.addEventListener("keyup", function (event) {
	if (event.defaultPrevented) {
    //return; 
}
switch(event.key){
	case "a":
	paddle.dx = 0
	break;
	case "d":
	paddle.dx = 0
	break;
	default:
	break;
}


event.preventDefault();
}, true);




function start(){
	startNewGame()
	gameLoop = setInterval(run, 1000 / MAX_FPS);
}

function stop(){
	clearInterval(gameLoop)
}

function run(){
	update(); //updating what is happening in the game
	draw(); //drawing afterwards
}


//game update functions
function update(){
	//move sprites
	paddle.move()

	//moving balls
	for(var index = 0; index < ball.length; index++){
		ball[index].move()
	}

	//collisions for balls
	for(var index = 0; index < ball.length; index++){

		var b = ball[index] 

		//ball inContact with walls
		if(b.x < 0 || b.x > canvas.width){
			b.dx *= -1
		}	

		if(b.y < 0){
			b.dy *= -1
		}

		//ball and paddle
		if(paddle.isContact(b.x+b.w/2,b.y+b.h/2)){
			b.dy *= -1
			b.dx = paddle.dx
		}



		//ball and brick
		for(var index = 0; index < bricks.length; index++){
			var brick = bricks[index]
			var contactKey = brick.isContact(b.x,b.y)

			if(contactKey == 0){ //east west
				b.dx *= -1
			}
			if(contactKey == 1){
				b.dy *= -1
			}

			if(contactKey != -1){
				bricks.splice(index,1)
				index--
			}

		}

	}

	//checking to see if new ball
	for(var index = 0; index < ball.length; index++){
		var b = ball[index]
		if(b.y > canvas.height){ //spawning in a new ball if out of bounds
			ball.splice(index,1)
			index--
			newBall()
		}
	}

}

//game draw functions
function draw(){
	//redraw
	context.fillStyle="#FFFFFF";
	//coloring backgrounds
	context.fillRect(0,0,canvas.width,canvas.height)
	//drawing paddle
	paddle.draw(context)

	//drawing balls
	for(var index = 0; index < ball.length; index++){
		ball[index].draw(context)
	}

	for(var index = 0; index < bricks.length; index++){
		bricks[index].draw(context)
	}
}


//misc. functions

function startNewGame(){
	//new instance of paddle
	paddle = new Paddle(canvas.width/2,canvas.height*.9, 5,  0.7)
	//reseting balls
	ball = []
	newBall()
	//reseting blocks
	//a 5 x 10 grid
	bricks = []
	const spacer = 10
	const maxRows = 10
	const blockHeight = canvas.height*.04
	var xBuffer = spacer + (canvas.width*.02) + Math.ceil((Math.random() * canvas.width*.02))
	var yBuffer = spacer

	for(var rows = 0; rows< maxRows; rows++){
		//random block between canvas.width*.1 and canvas.width.2
		var blockWidth = (canvas.width*.085) + Math.ceil((Math.random() * canvas.width*.03))
		while(xBuffer + blockWidth + spacer < canvas.width){
			bricks.push(new Brick(xBuffer,yBuffer,blockWidth,blockHeight,getRandomColor()))
			xBuffer += (spacer + blockWidth)
			blockWidth = (canvas.width*.085) + Math.ceil((Math.random() * canvas.width*.03))
		}
		xBuffer = spacer + (canvas.width*.02) + Math.ceil((Math.random() * canvas.width*.02))
		yBuffer += (spacer + blockHeight)
	}
}


function getRandomColor() {
	var letters = "0123456789ABCDEF";
	var color = "#";
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function shadeColor(color, percent) { //https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors

	var R = parseInt(color.substring(1,3),16);
	var G = parseInt(color.substring(3,5),16);
	var B = parseInt(color.substring(5,7),16);

	R = parseInt(R * (100 + percent) / 100);
	G = parseInt(G * (100 + percent) / 100);
	B = parseInt(B * (100 + percent) / 100);

	R = (R<255)?R:255;  
	G = (G<255)?G:255;  
	B = (B<255)?B:255;  

	var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
	var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
	var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

	return "#"+RR+GG+BB;
}



function launchBall(){ //launch balls that are not launched
	for(var index = 0; index < ball.length; index++){
		if(!ball[index].isLaunched){
			ball[index].isLaunched = true
			//giving it some impulse
			ball[index].dx = paddle.dx
			ball[index].dy = -ball[index].initialSpeed
		}
	}
}

function newBall(){
	ball.push(new Ball(paddle.x+paddle.w/2,paddle.y, 10 ))
}


function verbose(arg){
	console.log(arg)
}

function loadObserve(){
	if(paddleTexture.complete){
		//starting game after loading all textures
		start() 
	}else{
		setTimeout(loadObserve, 100) // try again 100 mill sec
	}
}

loadObserve()




}