const FULL_CIRCLE = Math.PI * 2;

const wRatio = 1 - 0.2158273381294964;
const hRatio = 1 - 0.19946808510638298;

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

function copyImageData(imageData){		
	let dataCopy = new Uint8ClampedArray(imageData.data);
	let w = imageData.width, h = imageData.height;
	let back = new ImageData(w, h);
    back.data.set(dataCopy);
    return back;
}

function insertAfter(el, referenceNode) {
	referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

class EZ_Canvas {
	constructor(canvas, jQuery = false) {
		if(jQuery) {
			this.canvas = canvas[0];			
		} else {
			this.canvas = canvas;
		}
		///-fit to container
		this.canvas.style.width ='100%';
		this.canvas.style.height='100%';
		
		this.canvas.width  = this.canvas.offsetWidth;
		this.canvas.height = this.canvas.offsetHeight;	
		///---	
		
		this.canvas.oncontextmenu = function() {
		  return false;
		}
		this.saveState();
	}
	saveState(){
	    this.canvas.getContext('2d').save();
	}
	restoreState(){
	    this.canvas.getContext('2d').restore();
	}
	setAlpha(alpha){
	    let imageData = this.getImageData();
		let data = imageData.data;
		let maxCount = data.length / 4;
		for(let count = 0; count < maxCount; count++){
			let aIndex = count * 4 + 3;
			data[aIndex] = alpha;
		}
		this.putImageData(imageData);
	}
	get width(){
		return this.canvas.width;
	}
	get height(){
		return this.canvas.height;
	}
	getContext(context = '2d'){
		return this.canvas.getContext(context);
	}
	getImageData(x = 0, y = 0, w = this.width, h = this.height){
		let context = this.getContext();
		return context.getImageData(x,y,w,h);
	}
	putImageData(imageData, dX = 0, dY = 0, scale = 1, sX = 0, sY = 0){
		let context = this.getContext();
		context.putImageData(imageData, dX, dY, sX, sY, this.width * scale, this.height * scale);
	}	
	copyData(){
	    let imageData = this.getImageData();
	    let copy = new Uint8ClampedArray(imageData.data);
	    return copy;
	}
	setData(data){
	    let imageData = this.getImageData();
	    imageData.data.set(data);
	}
	toImage(type = 'image/png') {
		let imageType = type;
		return this.focus.toDataURL(imageType);
	}
    getClone(){
        let old = this.canvas;
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        canvas.width = old.width;
        canvas.height = old.height;
        context.drawImage(old,0,0);
        return canvas;
    }
}

class EZ_Display {
	constructor (front, back) {
		this.brushSize = 50;
		this.front = new EZ_Canvas(front, true);
		this.back = new EZ_Canvas(back, true);
		this.focus = this.front;
		this.addMouseDrag(this.front.canvas);
		this.addMouseDrag(this.back.canvas);
		this.seeThrough = false;
		this.scaleFactor = 1;
		this.alpha = 255;
		this.lastClicked = {x:500,y:500};
		this.saveState();
		this.events = [];
	}
	copyAll(){
	    this.cBackCanvas = this.back.getClone();
	    this.cFrontCanvas = this.front.getClone();
	    this.cFrontContext = this.cFrontCanvas.getContext('2d');
	    let imageData = this.cFrontContext.getImageData(0,0,this.width,this.height);
	    let dataCopy = new Uint8ClampedArray(imageData.data);
    	let w = imageData.width, h = imageData.height;
    	let idCopy = new ImageData(w, h);
        idCopy.data.set(dataCopy);
        this.cFrontImageData = idCopy;
	}
	saveState(){
	    this.front.saveState();
	    this.back.saveState();
	}
	restoreState(){
	    this.front.restoreState();
	    this.back.restoreState();
	}
	addMouseDrag(canvas = this.front.canvas) {
	    canvas.addEventListener('mousedown', (e) => {
			this.mouseIsDragging = true;
			this.lastClicked.x = e.pageX;
			this.lastClicked.y = e.pageY;
			this.lastEvent = e;
			this.lastImageData = this.front.getImageData();
			this.lastCanvas = this.front.getClone();
		});
		canvas.addEventListener('mouseup', (e) => {
			this.mouseIsDragging = false;
		});
	}
	setAlpha(alpha = this.alpha){
	    this.focus.setAlpha(alpha);
	    this.alpha = alpha;
	}
	get frontCanvas(){
	    return this.front.canvas;
	}
	get focusCanvas(){
	    return this.focus.canvas;
	}
	get backCanvas(){
	    return this.back.canvas;
	}
	saveImage(){
	    let fClone = this.focus.getClone();
	    this.temp = new EZ_Canvas(fClone);
		this.lastImageData = this.focus.getImageData();
		this.lastCanvas = this.focus.getClone();
	}
	restoreImage(){
		this.focus = this.temp.getClone();
	}
	saveCanvas(){
	    this.lastCanvas = this.focus.getClone();
	    let context = this.lastCanvas.getContext('2d');
	    context.save();
	}
	saveFront(){
	    this.lastFront = this.front.getClone();
	}
	onMouse(mouseAction, f){
		let focan = this.focus.canvas;
		switch(mouseAction) {
			case "up":
				focan.addEventListener('mouseup',f);
				this.events.push('mouseup');
				this.events.push(f);
				break;
			case 'down':
				focan.addEventListener('mousedown',f);
				this.events.push('mousedown');
				this.events.push(f);
				break;
			case 'move':
				focan.addEventListener('mousemove',f);
				this.events.push('mousemove');
				this.events.push(f);
				break;
			case 'drag':
				this.onMouseDrag = f;
				this.events.push('mousemove');
				this.events.push(f);
				focan.addEventListener('mousemove',(e) => {
				    if(this.mouseIsDragging) {
				        this.onMouseDrag(e);
				    }
				});
				break;
			case 'out':
				focan.addEventListener('mouseout',f);
				this.events.push('mouseout');
				this.events.push(f);
				break;
			case 'enter':
				focan.addEventListener('mouseenter',f);
				this.events.push('mouseenter');
				this.events.push(f);
				break
			default:
				console.log("no action specified for mouse");
				break;
		}
	}
	removeEvents(){
	    if(!!this.events && this.events.length > 0){
	        for(let count = 0; count < this.events.length / 2; count++){
	            let typeIndex = count * 2;
	            let index = typeIndex + 1;
	            let type = this.events[typeIndex];
	            let event = this.events[index];
	            this.front.canvas.removeEventListener(type,event);
	        }
	       this.events = [];
	    }
	    this.addMouseDrag();
	}	
	onWheel(f){
		let canvas = this.focus.canvas;
		canvas.addEventListener('wheel',f);
		this.events.push('wheel');
		this.events.push(f);
	}
	refoc(canvas = this.front){
		this.focus = canvas;
		this.focus.canvas.addEventListener('mousedown',(e) => {
			this.mouseIsDragging = true;
		});
		this.focus.canvas.addEventListener('mouseup', (e) => {
			this.mouseIsDragging = false;
		});
	}
	swap(){
		let idFront = this.front.getImageData();
		let idBack = this.back.getImageData();
		this.front.putImageData(idBack);
		this.back.putImageData(idFront);
	}
	get width() {
		return this.focus.canvas.width;
	}
	get height() {
		return this.focus.canvas.height;
	}	
	drawImage(	img, destX, destY,
				sourceW, sourceH, 
				scaleWidth = this.width, scaleHeight = this.height,
				sourceX = 0, sourceY = 0) {
		let context = this.focus.getContext();
		context.drawImage(img, sourceX, sourceY, sourceW, sourceH, destX, destY, scaleWidth, scaleHeight);
	}
	getImage(type = 'image/png') {
		let imageType = type;
		return this.focus.toDataURL(imageType);
	}
	restoreDefaults(){
	    this.focus.getContext().rotate(0);
	    this.scaleFactor = 1;
	}
	reset(){
	    this.restoreState();
	    this.restoreDefaults();
	    this.removeEvents();	    
	}

}

///---------------------------------------------------------------------
$(document).ready(function(){
	
	//$("#ezMemeTextInputDialog_id").css("visibility","hidden");
	
	
	console.clear();
	let display = new EZ_Display(  $("#ezcLayerTop_id"),$("#ezcLayerBottom_id")  );
	let refoc = (canvas = display.front) => {  display.refoc(canvas);  };
	display.saveState();
	
	///-exit button
	$(".exitButton").mouseup(function() {
	    $(this).parent().css("visibility","hidden");
		display.reset();
		let w = display.width, h = display.height;
		display.drawImage(display.cFrontCanvas, 0, 0, w, h, 0, 0, w, h);	
	});
	
	///-toolbar buttons
	$(".ezToolbarButton").mousedown(function() {
		$(this).css("border","1px inset white");
    }).mouseup(function() {
        $(this).css("border", "1px outset white");
        display.removeEvents();
	});
	
	///-toggle buttons
	$(".ezToolbarToggle").mousedown(function() {
		let that = $(this);
		$(".ezToolbarToggle").each(function(index,element){
			if(element != that) { 
				$(this).removeClass("ezToolbarToggle_set");
			}
		});
		$(".ezToolbarToggle").toggleClass("ezToolbarToggle_set");
		display.restoreState();
		display.removeEvents();
	});
	
	///-rotate image
    $("#ezRotateButton_id").mousedown(function() {
		//display.saveCanvas();
		display.reset();
		display.copyAll();		
		let frontContext = display.front.getContext();
		frontContext.save();
		let f = function(e){
		    e.preventDefault();
			
			let x = e.pageX - display.lastClicked.x - 150;
			let y = e.pageY - display.lastClicked.y - 150;
			
			//let x = e.clientX - display.lastClicked.x;
			//let y = e.clientY - display.lastClicked.y;			
			
			// function getMousePos(canvas, evt) {
				// var rect = canvas.getBoundingClientRect();
				// return {
				  // x: evt.clientX - rect.left,
				  // y: evt.clientY - rect.top
				// };
			// }			
			
			// let canvas = display.front.canvas;
			// let mousePosition = getMousePos(canvas,e);
			// let x = mousePosition.x - display.lastClicked.x;
			// let y = mousePosition.y - display.lastClicked.y;
			
			
			
			let w = display.width;
			let h = display.height;		    
		    let direction = e.deltaY * FULL_CIRCLE / 180;
			let context = display.focus.getContext();	
			x += w / 2;// - 200;
			y += h / 2;// - 0;
			context.translate(x,y);
		    context.rotate(direction);	
		    context.translate(-x,-y);	
			context.drawImage(display.cFrontCanvas, 0, 0, w, h, 0, 0, w, h);
		};
		display.onWheel(f);
    });	 
	///-move image
    $("#ezMoveButton_id").mousedown(function() {
		display.copyAll();
		display.reset();
		let f  = function(e){
			let w = display.width;
			let h = display.height;
			let midX = w / 2;
			let midY = h / 2;
			let x = e.pageX - display.lastClicked.x;
			let y = e.pageY - display.lastClicked.y;
			let scaledWidth = Math.floor(w * display.scaleFactor);
			let scaledHeight = Math.floor(h * display.scaleFactor);
			let context = display.focus.getContext();
			context.drawImage(display.cFrontCanvas, 0, 0, w, h, x, y, scaledWidth, scaledHeight);
			display.setAlpha();
		};
		display.onMouse('drag',f);
    });	  
    ///-resize image
    $("#ezResizeButton_id").mousedown(function() {
		display.copyAll();
		display.reset();
		let f = function(e){
			e.preventDefault();
			let x = e.pageX - display.lastClicked.x;
			let y = e.pageY - display.lastClicked.y;
			if(e.deltaY > 0) {
				display.scaleFactor -= 0.01;
			}
			if(e.deltaY < 0) {
				display.scaleFactor += 0.01;
			}
			let w = display.width;
			let h = display.height;
			let scaledWidth = Math.floor(w * display.scaleFactor);
			let scaledHeight = Math.floor(h * display.scaleFactor);
			let context = display.focus.getContext();
			context.drawImage(display.cFrontCanvas, 0, 0, w, h, x, y, scaledWidth, scaledHeight);		
			display.setAlpha();
		};			
		display.onWheel(f);
	});
    ///-swap layers
    $("#ezSwapButton_id").mouseup(function() {
		display.swap();
    });
    ///-add text ___________________________________________
	let text = document.getElementById('ezMemeTextInputDialog_text_id');
	let size = document.getElementById('ezMemeTextInputDialog_size_id');
	let font = document.getElementById("ezMemeTextInputDialog_fontSelect_id");
	let color = document.getElementById("ezMemeTextInputDialog_colorSelect_id");
	let outline = document.getElementById("ezMemeTextInputDialog_outlineColorSelect_id");
	
	text.value = 'text';
	size.value = 50;
	
	function textToFront(x,y){
		let context = display.front.getContext();
		
		let selectedFont = font.options[font.selectedIndex].text;
		let selectedColor = color.options[color.selectedIndex].text;
		let selectedOutline = outline.options[outline.selectedIndex].text;
		
		context.font = "normal " + size.value + "px " +  selectedFont;
		context.lineWidth = 5;
		context.strokeStyle = selectedOutline;
		context.strokeText(text.value, x,y);
		context.lineWidth = 3;
		context.fillStyle = selectedColor;
		context.font = "normal " + size.value + "px " +  selectedFont;
		context.fillText(text.value, x, y);		
	}
    
    ///-add text
	$("#addTextBTN_id").mousedown(function() {
		$("#ezTextButton_id").mousedown();
	});
    $("#ezTextButton_id").mousedown(function() {
		$("#ezMemeTextInputDialog_id").css("visibility","visible");
		display.reset();
		display.copyAll();
		let move = function(e) {	
			let w = display.width, h = display.height;
			display.drawImage(display.cFrontCanvas, 0, 0, w, h);
			let x = e.pageX;
			let y = e.pageY;
			textToFront(x,y);
		};
		display.onMouse('move',move);
		
		let enter = function(e) {
			let w = display.width, h = display.height;
			display.drawImage(display.cFrontCanvas,0,0,w,h);
			let x = e.pageX;
			let y = e.pageY;
			textToFront(x,y);
		};
		display.onMouse('enter',enter);
		
		let down = function(e){
		    display.copyAll();
			let x = e.pageX;
			let y = e.pageY;			
			textToFront(x,y);
			
			display.reset();
			//let w = display.width, h = display.height;
			//display.drawImage(display.cFrontCanvas, 0, 0, w, h, 0, 0, w, h);	
			
		};
		display.onMouse('down',down);
		
		let w = function(e){
		    e.preventDefault();
			let x = e.pageX;
			let y = e.pageY;
			if(e.deltaY > 0) {
				size.value++;
			}
			if(e.deltaY < 0) {
				size.value--;
			}
			let w = display.width, h = display.height;
			display.drawImage(display.cFrontCanvas, 0, 0, w, h, 0, 0, w, h);	
			textToFront(x,y);
		};
		display.onWheel(w);
		
		display.onMouse('out',function(e){display.front.putImageData(display.cFrontImageData);});
	});
	$("#ezTextButton_id").hide();
	///-brush off top layer
	$("#ezBlendButton_id").mousedown(function(){
		display.refoc();
		display.copyAll();
		display.reset();
		display.originalFront = display.front.getClone(); ///-add to upload
		display.originalBack = display.back.getClone();
	    let f = function(e) {
			e.preventDefault();
			let x = e.pageX;
			let y = e.pageY;
			let radius = 50;
			x = x - display.brushSize / 2 - 10;// - display.front.canvas.offsetWidth;
			y = y - display.brushSize / 2 - 80;// - display.front.canvas.offsetHeight;
			let context = display.front.getContext();
			let imageData = display.front.getImageData();
			let data = imageData.data;
			let bSize = display.brushSize;
			let tile;
			switch (display.lastEvent.button) {
				case 0: ///-left button drag
					tile = display.originalBack.getContext('2d').getImageData(x,y,bSize,bSize);
					display.front.canvas.getContext('2d').putImageData(tile,x,y);
					break;
				case 2: ///-right button drag
					tile = display.originalFront.getContext('2d').getImageData(x,y,bSize,bSize);
					display.front.canvas.getContext('2d').putImageData(tile,x,y);
					break;
			}
        };
		display.onMouse("drag",f);
		display.onMouse('down',f);
		let w = function(e) {
			e.preventDefault();
			let x = e.pageX - display.lastClicked.x;
			let y = e.pageY - display.lastClicked.y;
			if(e.deltaY > 0) {
				display.brushSize--;
			}
			if(e.deltaY < 0) {
				display.brushSize++;
			}	
		};
		display.onWheel(w);
		display.onMouse('up',function(e){display.copyAll();});
		///-mouse cursor
		let moveCursor = function(e) {
    		    if(!display.mouseIsDragging){
    			let x = e.pageX;
    			let y = e.pageY;
    			x = x - display.brushSize / 2 - 10;
    			y = y - display.brushSize / 2 - 80;
    			display.front.putImageData(display.cFrontImageData);
    			let bSize = display.brushSize;
                let canvas2d = display.front.getContext();
                canvas2d.beginPath();
                canvas2d.rect(x,y,bSize,bSize);
                canvas2d.stroke();	
		    }
		}
		display.onMouse('move',moveCursor);
		display.onWheel(moveCursor);
		
		display.onMouse('out',function(e){display.front.putImageData(display.cFrontImageData);});
	});
	///-flip horizontally
	$("#ezFlipHorizontalButton_id").mouseup(function(e) {
		display.reset();
		display.copyAll();
		let context = display.front.getContext();
		context.save();
		let w = display.front.width;
		context.translate(w,0);
		context.scale(-1,1);
		context.drawImage(display.cFrontCanvas,0,0);
		context.restore();
		console.log('flip');
	});
	
	///-flip vertically
	$("#ezFlipVerticalButton_id").mouseup(function(e) {
		display.reset();
		display.copyAll();
		let context = display.front.getContext();
		context.save();
		let h = display.front.height;
		context.translate(0,h);
		context.scale(1,-1);
		context.drawImage(display.cFrontCanvas,0,0);
		context.restore();
		console.log('flip');
	});	
	
	///-upload image to top
    $("#ezUploadImageButton_id").mouseup(function() {
		//console.log('upload');
		refoc();
		$("#ezFileUpload_HIDDEN_id").click();
    });
	
    ///-upload image to bottom
	$("#ezUploadImageBottomButton_id").mouseup(function() {
		refoc(display.back);
		$("#ezFileUpload_HIDDEN_id").click();		
    });	
	
    ///-see through
    $('#ezSeeThroughButton_id').mouseup(function() {
        if(display.alpha == 255){
            display.setAlpha(128);
        } else {
            display.setAlpha(255);
        }
    });
	
	///-download image
	$('#ezDLButton_id').mousedown(function() {
		var canvas = display.front.canvas;//document.getElementById("mcanvas");
		image = canvas.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");
		var link = document.createElement('a');
		link.download = "myMeme.png";
		link.href = image;
		link.click();
	});
	
    ///-hidden file upload
    $("#ezFileUpload_HIDDEN_id").change(function(e){
        img = new Image();
		var files = e.target.files; // FileList object
		var file = files[0];
		if(file.type.match('image.*')) {
			var reader = new FileReader();
			// Read in the image file as a data URL.
			reader.readAsDataURL(file);
			reader.onload = function loadImage(e){
				if( e.target.readyState == FileReader.DONE) {
					img.src = e.target.result;
					setTimeout(function(){ 
						let w = img.width, h = img.height;
						console.log(`w = ${w} h = ${h}`);

						display.drawImage(img, 0, 0, w, h);	
						// display.drawImage(img, 0, 0, 1000, 800);	
						

					}, 10);
					if(display.focus == display.back) {
						display.front.setAlpha(50);	
						setTimeout(function(){ 
							display.front.setAlpha(255);
							display.focus = display.front;
						}, 500);						
					}
				} 
			}    
		} 
	});
});



class Pixel {
    rgba;
	meta;
    constructor(r, g, b, a) {
        this.a = a;
        this.b = b;
        this.g = g;
        this.r = r;
    }
    get a() {
        return this.rgba & 0x000000ff;
    }
    set a(a) {
        this.rgba = this.rgba & 0xffffff00 | a;
    }
    get b() {
        return (this.rgba >> 8) & 0x000000ff;
    }
    set b(b) {
        this.rgba = this.rgba & 0xffff00ff | b << 8;
    }
    get g() {
        return (this.rgba >> 16) & 0x000000ff;
    }
    set g(g) {
        this.rgba = this.rgba & 0xff00ffff | g << 16;
    }
    get r() {
        return (this.rgba >> 24) & 0x000000ff;
    }
    set r(r) {
        this.rgba = this.rgba & 0x00ffffff | r << 24;
    }    
};
const Color = {
	red   : new Pixel(255,0,0,255),
	blue  : new Pixel(0,0,255,255),
	green : new Pixel(0,255,0,255),
	white : new Pixel(255,255,255,255),
	black : new Pixel(0,0,0,255),
	trans : new Pixel(0,0,0,0)
};




