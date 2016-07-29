var regions = ["euw","eune","br","jp","kr","lan","las","na","oce","ru","tr"];

window.onpopstate = function(){
	location.href = location.href;
}

function drawItem(row,column,itemId,width){
	console.log("going to Fill Canvas")
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	var newImg = new Image();
	newImg.src = 'http://ddragon.leagueoflegends.com/cdn/6.11.1/img/item/'+itemId+'.png';
	newImg.onload = function(){
		console.log(row+"|"+column+"itemId")
		ctx.drawImage(newImg,width*0.05+((column)*0.14*width),0.17*width+(row*0.25*width),0.1*width,0.1*width);
	}
}

function alignFooter(){
	if ($(".bgimg").height()+$("#divider").height()+$("#set").height()+$(".fusser").height()>$(window).height()){
		$(".fusser").css("position","unset");
	}else{
		$(".fusser").css("position","absolute");
	}
}

$(window).resize(function(){
	alignFooter();
	try{
		sizeCanvas();
	}catch(e){} 
});

$(document).ready(function(){
	//PRETEND RESIZE
	$(window).resize();
	
	//COLOR ON HOVER
	$(".search").hover(function(){
		$("#iconSearch").animate({
			color: '#9C27B0'
		}, 200);
		$(".search").animate({
			borderBottomColor: '#9C27B0'
		}, 200);
		$(".region").animate({
			color:'#F9A825'
		},500)
	}, function(){
		$("#iconSearch").animate({
			color: '#c9c9c9'
		}, 200);
		$(".search").animate({
			borderBottomColor: '#c9c9c9'
		}, 200);
		$(".region").animate({
			color:'#c9c9c9'
		},200)
	});
	
	// FILL REGIONLIST
	$(".regList").html('<li valuel="'+regions[0]+'">'+regions[0].toUpperCase()+'</li>');
	
	// FIX INPUT HEIGHT
	$(".search").css("height",$(".search").height()+"px")
	
	//REGION COLLAPSE
		// HANDLER FUNCTIONS
	function ellapse(){
		for (i=1;i<regions.length;i++){
			$(".regList").append('<li valuel="'+regions[i]+'">'+regions[i].toUpperCase()+'</li>');
		}
		console.log(i)
		$('li').one('click',function(){
			var ind = $(this).index();
			var h = regions[ind];
			regions[ind] = regions[0];
			regions[0] = h;
			collapse();
		})
	}
	
	function collapse(){
		console.log("j")
		$(".regList").html('<li value="'+regions[0]+'">'+regions[0].toUpperCase()+'</li>')
		$("li").one("click",ellapse);
	}
	
	$('li').one('click',ellapse);
    
	$("#summonerSubmit").submit(function(e){
		e.preventDefault();
		
		$("#set").empty();
		$("#divider").empty();
		
		alignFooter();
		//GET SUGGESTED CHAMPIONS
        
        suggestChamps()
        
	});
    
    //SELECT PAGE STATE
    var path = location.pathname.replace(/%20/g," ");
    switch(true){
        //REGION
        case /\/sets\/[^\/]+$/.test(path):
            pathRegion(path);
            collapse();
            break;
        //PLAYER
        case /\/sets\/[^\/]+\/[^\/]+$/.test(path):
            pathRegion(path);
            collapse();
            $("#summonerInput").val(path.substring(1).split("/")[2]);
        
            suggestChamps();
            break;
        case /\/sets\/[^\/]+\/[^\/]+\/[^\/]+$/.test(path):
            pathRegion(path);
            collapse();
            $("#set").append()
            $("#summonerInput").val(path.substring(1).split("/")[2]);
            
            var reg = path.substring(1).split("/")[1]
            var name = path.substring(1).split("/")[2]
            var champ = path.substring(1).split("/")[3]
            
            $("#set").append('<img class="suggested animated champFocus" champion="'+champ+'" src="http://ddragon.leagueoflegends.com/cdn/6.11.1/img/champion/'+champ+'.png">')
            
            createSet(reg,name,champ);
            break;
    }
});

function pathRegion(path){
    //CHECK IF REGION IS VALID
    if (regions.indexOf(path.substring(1).split("/")[1])>-1){
        var h = regions[regions.indexOf(path.match(/[^\/]+$/)[0])];
        regions[regions.indexOf(path.substring(1).split("/")[1])] = regions[0];
        regions[0] = path.substring(1).split("/")[1];
    }else{
        history.pushState(null,"League-Set","/sets")
    }
}

function suggestChamps(){
    		
    var name = $("#summonerInput").val();
    var region = regions[0];
    
    $.ajax({
    type:"GET",
    url:"/content/"+region+"/"+name,
    dataType: "json",
    complete: function(data){
        console.log(data);
        if(data.status==200){
            
            //HISTORY CHANGE
            history.pushState(null,name+"'s Champions on League-Set","/sets/"+region+"/"+name);
            
            data = data.responseJSON;
            $("#divider").append('<h2>Pick a Champion</h2><hr>')

            //APPEND CHAMP PICTURES
            for (i=0;i<data.suggested.length;i++){
                $("#set").append('<img class="suggested animated champsIn" champion="'+data.suggested[i]+'" index="'+i+'" src="http://ddragon.leagueoflegends.com/cdn/6.11.1/img/champion/'+data.suggested[i]+'.png">');
            }

            alignFooter();	

            $(".suggested").on("animationend",function(){
                $(this).removeClass("champsIn");
            })
            
            $(".suggested").one("click",function(){
                $("h2").html("Win Games!");
                $(".suggested").not(this).remove();
                $(this).addClass("champFocus");
                var champion = $(this).attr("champion")
                createSet(region,name,champion);
            })
		


        }else{
            console.log(data.status)

            switch(data.status){
                case 404: 
                    alert("user not found");
                    break;
                case 607:
                    alert("user has no ranked games");
                    break;
                case 429:
                    alert("too many requests. pls wait a few seconds");
                    break;
                case 400:
                    $(".search").addClass("badRequest");
                    $(".search").on("animationend",function(){
                        $(this).removeClass("badRequest");
                    });
                    break;
                case "error0":
                    alert("gj you just crashed the FUCKING SERVER");
                    break;
                default:
                    alert("error"+data.status);
            }
        }
    }
    })
}

function createSet(region,name,champion){

		//GET ITEMSET
		$.ajax({
			type:"GET",
			url:"/content/"+region+"/"+name+"/"+champion,
			dataType:"json",
			complete:function(data){

				if (data.status==200){
                    
                    history.pushState(null,name+"'s "+champion+"-Build on League-Set","/sets/"+region+"/"+name+"/"+champion);
                    
					data = data.responseJSON;
					itemset = data.itemset;
					console.log(itemset);
					fillCanvas(itemset);
					giveDload(itemset,data.zipcode);

					$(".fusser").css("position","unset");
					
					var fac = 200; 
					
					for (i=0;i<fac;i+=1){
						setTimeout(function(){window.scrollBy(0,$(window).height()/fac)},5*i);
					}
					
				}else{
					console.log(data.status);
				}
				
			}
		})
}

function fillCanvas(data){
	$("#set").append('<canvas id="myCanvas" class="itemset">Your Browser sucks</canvas>');
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	sizeCanvas();
	width = $("#myCanvas").width();
	for (block in data.blocks){
		for (item in data.blocks[block].items){
			drawItem(block,item,data.blocks[block].items[item].id,width)
		}

	}
}

function sizeCanvas(){
	var canvas = document.getElementById("myCanvas");
	if ($(window).width()<1000){
		$(".download").width("98%");
		$(".download").css("margin-left","1vw")
	}else{
		$("#myCanvas").css("margin-bottom","10vh");
		$(".download").width("44vw");
		$(".download").css("margin-left","3vw")
	}
	if ($(window).width()<=$(window).height()){
		canvas.width = $(window).width()*0.4;
		canvas.height = $(window).width()*0.6;	
		console.log("höher als breit");	
	}else{
		canvas.width = $(window).height()*0.5222;
		canvas.height = $(window).height()*0.8;
		console.log("breiter als hoch");		
	}
	$("#myCanvas").css("margin-right",$(window).width()/4 - $("#myCanvas").width()/2);
}

function giveDload(data,fileNum){
	var howFast = 'Open the ZIP Archive with your extracter of choice. Then copy the League Of Legends folder in your Riot Games installation folder <b>NEXT TO</b> the existing LoL Folder.'
	var howSlow = 'Click the copy button. Open Riot Games &rarr;LeagueOfLegends &rarr;config &rarr;Champions &rarr;*Champion* &rarr; Recommended. There you have to create a JSON file.(right click <b>&rarr;</b> new <b>&rarr;</b> textfile <b>&rarr;</b> paste the copied string and save as something.json).'
	var content = '<p class="setOption" id="dLoad">Download → Pasta</p><p class="setOption" id="copy">Copy→*a lot of steps*→ Pasta</p><button id="downloadSet">Download</button><textarea readonly wrap="off" id="itemSetString">'+JSON.stringify(data,null,"\t")+'</textarea><button id="copyText">Copy</button><p id="where">Where should I put these things</p><p class="dLoadHow"style="clear:left">'+howFast+'</p><p class="dLoadHow">'+howSlow+'</p>'
	$("#set").append('<div class="download">'+content+'</div>');
	$("#downloadSet").on('click',function(){
		window.location.href="/download/"+fileNum;
	})
	if ($(window).width()<1000){
		$(".download").width("98%");
		$(".download").css("margin-left","1vw")
	}else{
		$("#myCanvas").css("margin-bottom","10vh");
		$(".download").width("44vw");
		$(".download").css("margin-left","3vw")
	}
	
	
	$("#copyText").click(function(){
		$("#itemSetString").select()
		 try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'coppied' : 'not coppied';
    console.log(msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }
	})
}