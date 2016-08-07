
//REFRESH PAGE
window.onpopstate = function(){
	location.reload();
}

var regions = ["euw","eune","br","jp","kr","lan","las","na","oce","ru","tr"];

$(document).ready(function(){
	
	if(localStorage.reg){
		regions[regions.indexOf(localStorage.reg)] = regions[0];
		regions[0] = localStorage.reg;
	}

	
	//PRETEND RESIZE - FOR PLACEHOLDER REFRESH
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
	
	//CHOOSE REGION	
	$('.regList>*').one('click',ellapse);

    function ellapse(){
	
		for (i=1;i<regions.length;i++){
            $(".regList").append('<li valuel="'+regions[i]+'">'+regions[i].toUpperCase()+'</li>');
        }
        
        setTimeout(function(){
        	$("body").one("click",function(e){
        	
	        	// WENN OPTION HITTET
	        	if(e.target.parentElement.className=="regList"){
	        		var ind = $(e.target).index();
	        		var h = regions[ind];
	        		regions[ind] = regions[0];
	        		regions[0] = h;
	        		localStorage.reg = regions[0];
	        	}
	        	
				collapse();	
	        })
        },1)
    }

    function collapse(){
        console.log("j")
        $(".regList").html('<li value="'+regions[0]+'">'+regions[0].toUpperCase()+'</li>')
        $("li").one("click",ellapse);
    }
    
	$("#summonerSubmit").submit(function(e){
		e.preventDefault();
		
		$("#set").empty();
		$("#divider").empty();
		
		alignFooter();
		
        //GET SUGGESTED CHAMPIONS
        suggestChamps()
        
	});
    
    //GET PAGE STATE
    var path = location.pathname.replace(/%20/g," ");
    
    
    if (/\/sets\/[^\/]+/.test(path)){
        
        //CHECK IF REGION IS VALID
        if (regions.indexOf(path.substring(1).split("/")[1])>-1){
            
            //URL REGION NOW FIRST
            var h = regions[regions.indexOf(path.match(/[^\/]+$/)[0])];
            regions[regions.indexOf(path.substring(1).split("/")[1])] = regions[0];
            regions[0] = path.substring(1).split("/")[1];
            
            collapse();
            
            //PLAYER IN URL
            if (/\/sets\/[^\/]+\/[^\/]+$/.test(path)){
                $("#summonerInput").val(path.substring(1).split("/")[2]);
        
                suggestChamps();
            //CHAMPION IN URL
            }else if(/\/sets\/[^\/]+\/[^\/]+\/.+$/.test(path)){
                
                //EVALUATE URL
                var reg = path.substring(1).split("/")[1];
                var name = path.substring(1).split("/")[2];
                var champ = path.substring(1).split("/")[3];
                
                //FILL INPUT WITH PLAYERNAME
                $("#summonerInput").val(name);
                
                //APPEND CHAMP PICTURE
                $("#set").append('<img class="suggested animated champFocus" champion="'+champ+'" src="http://ddragon.leagueoflegends.com/cdn/6.11.1/img/champion/'+champ+'.png">')

                createSet(reg,name,champ);
            }
            
        }else{
            history.pushState(null,"League-Set","/sets")
        }
        
    }
});

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
            
            //CHANGE HISTORY
            history.pushState(null,name+"'s Champions on League-Set","/sets/"+region+"/"+name);
            
            data = data.responseJSON;
            
            $("#divider").append('<h2>Pick a Champion</h2><hr>')

            //APPEND CHAMP PICTURES
            for (i=0;i<data.suggested.length;i++){
                $("#set").append('<img class="suggested animated champsIn" champion="'+data.suggested[i]+'" src="http://ddragon.leagueoflegends.com/cdn/6.11.1/img/champion/'+data.suggested[i]+'.png">');
            }

            alignFooter();	

            $(".suggested").on("animationend",function(){
                $(this).removeClass("champsIn");
            })
            
            $('body').contextmenu(function(e) {
			    return false;
			});
            
            $(".suggested").on("mousedown",function(e){
            	
            	var champion = $(this).attr("champion");
            	var chaSel = $(this);
            	
                $("h2").html("eZ wins inc!");
            	//OPEN AMOUNT-CHOOSER IF RIGHT-CLICK
            	if(e.which==3){
                	
            		$("body").append('<ul class="selAmount"><li value="5">5</li><li value="10">10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;✓</li><li value="15">15</li><li value="20">20</li></ul>');
                	$(".selAmount").css({left:e.pageX+'px',top:e.pageY+'px'});
            		
                	$(".selAmount>*").hover(function(){
                		$(this).animate({
                			backgroundColor:"#3399ff",
                			color:"white"
                		},100);
                	},function(){
                		$(this).animate({
                			backgroundColor:"white",
                			color:"black"
                		},100);
                	})
                	
                	$("body").one("click",function(e){
                		
                		//WENN EL IN SELAMOUNT
                		if (e.target.parentElement.getAttribute("class")=="selAmount"){
                			
                			var amount = e.target.value;
                			
                			$(".suggested").not(chaSel).remove();
                			
                			createSet(region,name,champion,amount)
                		}
                		
                		$(".selAmount").remove();
                	
                	})
            	}else{
                    $(".suggested").not(chaSel).remove();
                    createSet(region,name,champion);
            	}
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

//GET ITEMSET
function createSet(region,name,champion,amount){
	
		$("img").addClass("champFocus");
	
		for (j=0;j<5;j+=1){
			setTimeout(function(){
				alignFooter();
			},200*j);
		}
	
		var setUrl = "/content/"+region+"/"+name+"/"+champion;
		setUrl += (amount)?"/"+amount:"";
	
		if (amount){
			setUrl+="/"+amount;
			amount = "/"+amount;
		}else{
			amount = "";
		}
		
		$.ajax({
			type:"GET",
			url:setUrl,
			dataType:"json",
			complete:function(data){

				if (data.status==200){
                    
                    history.pushState(null,name+"'s "+champion+"-Build on League-Set","/sets/"+region+"/"+name+"/"+champion+amount);
                    
					data = data.responseJSON;
					itemset = data.itemset;
					console.log(itemset);

					$("#set").append('<canvas id="myCanvas" class="itemset">Your Browser sucks</canvas>');
					
					fillCanvas(itemset);
					
					giveDload(itemset,data.zipcode);

					$(".fusser").css("position","unset");
					
                    
                    //SCROLL ANIMATION
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
    //CREATE CANVAS
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
	
	//COPY TEXTAREA
	$("#copyText").click(function(){
		$("#itemSetString").select()
        document.execCommand('copy');
    
	})
}