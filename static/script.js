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


$(window).resize(function(){
	sizeCanvas();
});

$(document).ready(function(){	
	$("#summonerInput").hover(function(){
		$("#iconSearch").animate({
			color: '#9C27B0'
		}, 200);
		$("#summonerInput").animate({
			borderBottomColor: '#9C27B0'
		}, 200);
	}, function(){
		$("#iconSearch").animate({
			color: '#c9c9c9'
		}, 200);
		$("#summonerInput").animate({
			borderBottomColor: '#c9c9c9'
		}, 200);
	});
	
	$("#summonerSubmit").submit(function(e){
		e.preventDefault();
		
		$("#set").empty();
		
		var obj = {
				name: $("#summonerInput").val()
		};
		
		$.ajax({
			type:"POST",
			url:"/getData",
			dataType: "json",
			data: obj,
			complete: function(data){
				console.log(data);
				if(data.status==200){
				data = data.responseJSON;
				for (i=0;i<data.sugList.suggested.length;i++){
					$("#set").append('<img class="suggested animated champsIn" champion="'+data.sugList.suggested[i]+'" src="http://ddragon.leagueoflegends.com/cdn/6.11.1/img/champion/'+data.sugList.suggested[i]+'.png">');
				}
				$(".suggested").on("animationend",function(){
					$(this).removeClass("champsIn");
				})
					$(".suggested").one("click",function(){
						$(".suggested").not(this).remove();
						$(this).addClass("champFocus");
						
						var champion = {
							champion:$(this).attr("champion"),
							matches:data.matches
						}
						
						$.ajax({
							type:"POST",
							url:"/getSet",
							dataType:"json",
							data:champion,
							complete:function(data){
								if (data.status==200){
									data = data.responseJSON;
									console.log(data);
									fillCanvas(data);
									giveDload(data);
									var fac = 200; 
									for (i=0;i<fac;i+=1){
										setTimeout(function(){window.scrollBy(0,$(window).height()/fac)},5*i);
									}
								}else{
									console.log(data.status);
								}
							}
						})
					})
//center Pictures
				}else{
					console.log(data.status)
					if (data.status==404){
						alert("user not found");
					}else if(data.status==607){
						alert("user has no ranked games");
					}
				}
			}
		})
	});
});

function fillCanvas(data){
	$("#set").append('<canvas id="myCanvas" class="itemset">Your Browser sucks</canvas>');
	sizeCanvas();
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	width = $("#myCanvas").width();
	for (block in data.blocks){
		for (item in data.blocks[block].items){
			drawItem(block,item,data.blocks[block].items[item].id,width)
		}

	}
}

function sizeCanvas(){
	var canvas = document.getElementById("myCanvas");
	if ($(window).width()<$(window).height()){
		canvas.width = $(window).width()*0.4;
		canvas.height = $(window).width()*0.6;
		console.log("höher als breit")
	}else{
		canvas.width = $(window).height()*0.5222;
		canvas.height = $(window).height()*0.8;
		$("#myCanvas").css("margin-bottom","10vh");
		console.log("breiter als hoch")
	}
	$("#myCanvas").css("margin-right",$(window).width()/4 - $("#myCanvas").width()/2);
}

function giveDload(data){
	var howFast = 'Open the ZIP Archive with your extracter of choice. Then copy the League Of Legends folder in your Riot Games installation folder <b>NEXT TO</b> the existing LoL Folder.'
	var howSlow = 'Click the copy button. Open Riot Games &rarr;LeagueOfLegends &rarr;config &rarr;Champions &rarr;*Champion* &rarr; Recommended. There you have to create a JSON file.(right click <b>&rarr;</b> new <b>&rarr;</b> textfile <b>&rarr;</b> paste the copied string and save as something.json).'
	var content = '<p class="setOption" id="dLoad">do it fast</p><p class="setOption" id="copy">do it pussy</p><button id="downloadSet">Download</button><textarea readonly wrap="off" id="itemSetString">'+JSON.stringify(data,null,"\t")+'</textarea><button id="copyText">Copy</button><p id="where">Where should I put these things</p><p class="dLoadHow"style="clear:left">'+howFast+'</p><p class="dLoadHow">'+howSlow+'</p>'
	$("#set").append('<div class="download">'+content+'</div>');
	
	
	
	
	$("#copyText").click(function(){
		$("#itemSetString").select()
		 try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'coppied' : 'not coppied';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }
	})
}