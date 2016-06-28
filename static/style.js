$(window).resize(function(){
	if($(window).width()<435){
		$("#summonerInput").attr("placeholder","Summoner");
	}else{
		$("#summonerInput").attr("placeholder","Enter Summoner");
	}
});