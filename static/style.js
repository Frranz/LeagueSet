$(window).ready(function(){
	
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
	
	// FIX INPUT HEIGHT
	setTimeout(function(){
		$(".search").css("height",$(".search").height()+"px");
	},20)
	
});

$(window).resize(function(){
    
	if($(window).width()<435){
		$("#summonerInput").attr("placeholder","Summoner");
	}else{
		$("#summonerInput").attr("placeholder","Enter Summoner");
	}
    
    alignFooter();
	
    try{
		sizeCanvas();
		fillCanvas(itemset);
	}catch(e){} 
});

function alignFooter(){
	if ($(".bgimg").height()+$("#divider").height()+$("#set").height()+$(".fusser").height()>$(window).height()){
		$(".fusser").css("position","unset");
	}else{
		$(".fusser").css("position","absolute");
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
	}else{
		canvas.width = $(window).height()*0.5222;
		canvas.height = $(window).height()*0.8;	
	}
	$("#myCanvas").css("margin-right",$(window).width()/4 - $("#myCanvas").width()/2);
}