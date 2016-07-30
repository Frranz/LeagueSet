$(window).resize(function(){
    
	if($(window).width()<435){
		$("#summonerInput").attr("placeholder","Summoner");
	}else{
		$("#summonerInput").attr("placeholder","Enter Summoner");
	}
    
    alignFooter();
	
    try{
		sizeCanvas();
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
		console.log("höher als breit");	
	}else{
		canvas.width = $(window).height()*0.5222;
		canvas.height = $(window).height()*0.8;
		console.log("breiter als hoch");		
	}
	$("#myCanvas").css("margin-right",$(window).width()/4 - $("#myCanvas").width()/2);
}