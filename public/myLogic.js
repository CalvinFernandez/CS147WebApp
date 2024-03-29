// JavaScript Document
$(function(){
        var zoom = new ZoomView('#zoom','#zoom :first');
        var zoomlisten = new ZoomListener('#listener', '#listener :first');
    });


    /**
    * Inspired by Jesse Guardiani - May 1st, 2012
    */
	
	var zIndexBackup = 10;
	var itemsOnCanvas = 1;

    function DragView(target) {
      this.target = target[0];
      this.drag = [];
      this.lastDrag = {};

      
      this.WatchDrag = function()
      {
        if(!this.drag.length) {
          return;
        }

        for(var d = 0; d<this.drag.length; d++) {
          var left = $(this.drag[d].el).offset().left;
          var top = $(this.drag[d].el).offset().top;

          var x_offset = -(this.lastDrag.pos.x - this.drag[d].pos.x);
          var y_offset = -(this.lastDrag.pos.y - this.drag[d].pos.y);

          left = left + x_offset;
          top = top + y_offset;

          this.lastDrag = this.drag[d];

          this.drag[d].el.style.left = left +'px';
          this.drag[d].el.style.top = top +'px';
        }
      }

      this.OnDragStart = function(event) {
        var touches = event.originalEvent.touches || [event.originalEvent];
        for(var t=0; t<touches.length; t++) {
          var el = touches[t].target.parentNode;
		  
		  if(el.className.search('polaroid') > -1){
			  	
				 el = touches[t].target.parentNode.parentNode;
		  }
			el.style.zIndex = zIndexBackup + 1;
			zIndexBackup = zIndexBackup +1;
			
          if(el && el == this.target) {
			$(el).children().toggleClass('upSky');
            this.lastDrag = {
              el: el,
              pos: event.touches[t]
            };
            return; 
          }
		  
        }
      }

      this.OnDrag = function(event) {
        this.drag = [];
        var touches = event.originalEvent.touches || [event.originalEvent];
        for(var t=0; t<touches.length; t++) {
          var el = touches[t].target.parentNode;

		if(el.className.search('polaroid') > -1){
				 el = touches[t].target.parentNode.parentNode;
		  }
		  
          if(el && el == this.target) {
            this.drag.push({
              el: el,
              pos: event.touches[t]
            });
          }
        }
      }

      this.OnDragEnd = function(event) {
		  	this.drag = [];
        	var touches = event.originalEvent.touches || [event.originalEvent];
		 	for(var t=0; t<touches.length; t++) {
          			var el = touches[t].target.parentNode;
		  
		  			if(el.className.search('polaroid') > -1){
				 			el = touches[t].target.parentNode.parentNode;
		  			}
					$(el).children().toggleClass('upSky');
			
		  }
      }
    }

    //Helper function to determine pinch direction//
    function transformDirection(event, tch1, tch2)
    {
      var pinch = 0;
      var drop = 1;
      var e = event;
      //Pinch event if either x or y diff is smaller than previous x or y diff//
      if ( Math.abs(e.touches[0].x - e.touches[1].x) < Math.abs( tch1[0] - tch2[0] ) || 
            Math.abs(e.touches[0].y - e.touches[1].y ) < Math.abs( tch1[1] - tch2[1] ) )
      {
        return pinch;
      }
      //Drop event if either x or y difference is smaller than previous difference//
      if ( Math.abs(e.touches[0].x - e.touches[1].x) > Math.abs( tch1[0] - tch2[0] ) || 
            Math.abs(e.touches[0].y - e.touches[1].y ) > Math.abs( tch1[1] - tch2[1] ) )
      {
        return drop;
      }
      //No difference//
      return -1;
    }

    function ZoomView(container, element) {

        container = $(container).hammer({
            prevent_default: true,
            scale_treshold: 0,
            drag_min_distance: 0
        });

        element = $(element);


        var displayWidth = container.width();
        var displayHeight = container.height();

        //These two constants specify the minimum and maximum zoom
        var MIN_ZOOM = 0;
        var MAX_ZOOM = 3;

        var scaleFactor = 1;
        var previousScaleFactor = 1;

        //These two variables keep track of the X and Y coordinate of the finger when it first
        //touches the screen
        var startX = 0;
        var startY = 0;

        //These two variables keep track of the amount we need to translate the canvas along the X
        //and the Y coordinate
        var translateX = 0;
        var translateY = 0;

        //These two variables keep track of the amount we translated the X and Y coordinates, the last time we
        //panned.
        var previousTranslateX = 0;
        var previousTranslateY = 0;

        //Translate Origin variables

        var tch1 = 0, 
            tch2 = 0, 
            tcX = 0, 
            tcY = 0,
            toX = 0,
            toY = 0,
            cssOrigin = "";

        container.bind("transformstart", function(event){

            //We save the initial midpoint of the first two touches to say where our transform origin is.
            e = event

            tch1 = [e.touches[0].x, e.touches[0].y],
            tch2 = [e.touches[1].x, e.touches[1].y]

            tcX = (tch1[0]+tch2[0])/2,
            tcY = (tch1[1]+tch2[1])/2

            toX = tcX
            toY = tcY

            var left = $(element).offset().left;
            var top = $(element).offset().top;

            cssOrigin = (-(left) + toX)/scaleFactor +"px "+ (-(top) + toY)/scaleFactor +"px";
        })

        container.bind("transform", function(event) {
            if (itemsOnCanvas > 0 )
            {
              //Check for a pinch action//
              e = event
              if ( Math.abs(e.touches[0].x - e.touches[1].x) < 80 )
              {
                if ( Math.abs( e.touches[0].y - e.touches[1].y) < 80 )
                {
                  itemsOnCanvas = 0;
                  document.getElementById("zoom").innerHTML = "";
                  document.getElementById("output").innerHTML = "<h1> Great! Now just drop it on your friend's screen. </h1>";
                }
              }
              scaleFactor = previousScaleFactor * event.scale;
			
              scaleFactor = Math.max(MIN_ZOOM, Math.min(scaleFactor, MAX_ZOOM));
              transform(event);
            }
            else if (itemsOnCanvas == 0 )
            {
              //Check for shit on server//
            }
          });

        container.bind("transformend", function(event) {
            previousScaleFactor = scaleFactor;
        });


        /**
        * on drag
        */
        var dragview = new DragView($(container));
        container.bind("dragstart", $.proxy(dragview.OnDragStart, dragview));
        container.bind("drag", $.proxy(dragview.OnDrag, dragview));
        container.bind("dragend", $.proxy(dragview.OnDragEnd, dragview));

        setInterval($.proxy(dragview.WatchDrag, dragview), 10);



        function transform(e) {
            //We're going to scale the X and Y coordinates by the same amount
            var cssScale = "scaleX("+ scaleFactor +") scaleY("+ scaleFactor +") rotateZ("+ e.rotation +"deg)";

            element.css({
                webkitTransform: cssScale,
                webkitTransformOrigin: cssOrigin,

                transform: cssScale,
                transformOrigin: cssOrigin,
            });

            
        }

    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var numGetItems = 0;
    var transforming = false;

    function ZoomListener(container, element) 
    {
        var tch1 = 0, 
            tch2 = 0;

        container = $(container).hammer({
            prevent_default: true,
            scale_treshold: 0,
            drag_min_distance: 0
        });

        element = $(element);

        container.bind("transformstart", function(event){
            var e = event;
            tch1 = [e.touches[0].x, e.touches[0].y],
            tch2 = [e.touches[1].x, e.touches[1].y]
        })

        container.bind("transform", function(event) {
            var e = event;
            var t = transformDirection(event, tch1, tch2);
            if ( t == 1 )
            {
              //Query Server for unpulled elements//
              //If unpulled element exists create a new div for it and place it on the screen//
              //For now we'll just do one item and make it the stock image//
              if ( numGetItems == 0 )
              {

                //Construct a new instance//   
                var zdiv = document.createElement('div');
                var pdiv = document.createElement('div');
                var itag = document.createElement('img');
                zdiv.setAttribute('id', 'getZoom');
                zdiv.setAttribute('class', 'zoomProps');
                pdiv.setAttribute('class', 'polaroid');
                itag.src = 'images/screen.jpg';
                itag.style.width = '200px';
                itag.style.height = '200px';

                document.getElementById("listener").appendChild(zdiv);
                zdiv.appendChild(pdiv);
                pdiv.appendChild(itag);
                //Initialize all listeners on this object so it can be moved around//
                var getZoom = new ZoomView('#getZoom', '#getZoom :first');

                //Set number of items on the screen to one. For now we'll only allow one
                //but we can change it later//
                numGetItems = 1;
              }
            }

            tch1 = [e.touches[0].x, e.touches[0].y],
            tch2 = [e.touches[1].x, e.touches[1].y]
          });

        container.bind("transformend", function(event) {
           
        });
    }