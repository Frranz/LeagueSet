const express = require('express');
const path = require('path');
const request = require('request');
const bodyParser = require('body-parser');
const async = require('async');
const rmdir = require('rimraf');
const fs = require('fs');
const archiver = require('archiver');
const app = express();
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.static('static'));

app.use('/download', function(req,res){
	console.log("download pls: "+req.url)
	fs.access(__dirname+"/temp/zip_here"+req.url,fs.F_OK,function(err){
		if (!err){
			res.download(__dirname+"/temp/zip_here"+req.url);
		}else{
			res.send('<h1>File not found</h1><p>We are sorry, but this file is not on the server.<br><br>Itemsets are deleted 60 seconds after you click the champion you want your itemset for. <br>To still get it just go back and reselect your champion <a href="" onclick="window.history.back()">go back</a><br><br></p>');
			console.log(err)
		}
	});
});

app.use('/riot.txt',function(req,res){
	res.sendFile(__dirname+"/static/riot.txt")
})

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

// MAIN HANDLER
app.post("/getData", function(req,res){
	var name = req.body.name;
	var reg = req.body.region;
	urlSummonerID = 'https://'+reg+'.api.pvp.net/api/lol/'+reg+'/v1.4/summoner/by-name/' + name + '?api_key=' + api_key;
	riotApiQueue.push({url:urlSummonerID}, function(returnObj){
		if (returnObj.response.statusCode==200){
		data = JSON.parse(returnObj.body);
		id = data[Object.keys(data)[0]].id;
		console.log("Summoner ID = " + id);
		
		urlMatches = 'https://'+reg+'.api.pvp.net/api/lol/'+reg+'/v2.2/matchlist/by-summoner/'+id+'?rankedQueues=TEAM_BUILDER_DRAFT_RANKED_5x5,RANKED_SOLO_5x5&seasons=SEASON2016&api_key='+api_key;
		console.log(urlMatches);
		riotApiQueue.push({url:urlMatches} ,function(returnObj){
			if (returnObj.response.statusCode==200){
				data = JSON.parse(returnObj.body);
				if (data.totalGames!=0){
					possibleSets(data,function(sugList){
						//return sugList
						res.header(200);
						res.send({"sugList":sugList,"matches":data});
						})
				}else{
					console.log("sucky")
					res.writeHead(607);
					res.send();
				}
			}else{
				console.log("errorMatches:" + returnObj.response.statusCode);
				res.writeHead(returnObj.response.statusCode);
				res.write("ranked");
				res.send();
			}
		});
		
		}else{
			console.log(returnObj.response.statusCode);
			res.writeHead(returnObj.response.statusCode);
			res.write("sum");
			res.send();
		}
	});
	
	
	
});

app.post("/getSet",function(req,res){
		createSet(req,res);
})


var port = Number(process.env.PORT||3000)
app.listen(port, function () {
  console.log('Listening on port 8081!');
});

// MANAGE API REQUESTS
const api_key = 'RGAPI-A784BBB0-5BA3-4164-9521-4E8D5D58697C';
const numberCallsCalls = 3000;
const timeCalls = 10000;
var currentCalls = 0;
var queueLength = 0;

/**
 * Interval for 10s API limit
 */
setInterval(function() {
	currentCalls = 0;
	riotApiQueue.resume();
}, timeCalls);

/**
 * Worker queue, processing API requests
 */
var riotApiQueue = async.queue(function(task,next){
	currentCalls++;
		
	/** Processing */
	getData(task.url, function(data){
		next(data);
	});
	
	/** Stopping if API limit is reached */
	if(currentCalls==numberCallsCalls){
		riotApiQueue.pause();
	}
	
}, 10);

/**
 * Function that requests Data
 * @param url - Url to query
 * @param callback - callback
 */
function getData(url, callback){
	var options = {
			url:url,
			timeout: 5000,
			agent: false
	};
	request(options,function(error,response,body){
		callback({error:error, response:response, body:body});
	})
}

// Functions

function possibleSets(data,done){
	var champions = {};
	var giveBack = {"suggested":[],"not":[]};
	for (i=0;i<data.matches.length;i++){
		if (champions[data.matches[i].champion]==undefined){
			champions[data.matches[i].champion]=1
		}else{
			champions[data.matches[i].champion]+=1
		}
	}
	for (i=0;i<Object.keys(champions).length;i++){
		if(champions[Object.keys(champions)[i]]>=10){
			giveBack.suggested.push(champIDs.byId[Object.keys(champions)[i]])
		}else{
			giveBack.not.push(champIDs.byId[Object.keys(champions)[i]])
		}
	}
//return giveBack to client
	done(giveBack)
}


// pls rework

var champIDs;
request({url:"https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion?api_key="+api_key},function(error,response,body){
	if (response.statusCode==200){
		sum = {
		  		"byId":{},
		       	"byName":{}
		      };
		body = JSON.parse(body);
		for (i = 0; i < Object.keys(body.data).length; i++) {
		    sum.byId[body.data[Object.keys(body.data)[i]].id] = body.data[Object.keys(body.data)[i]].key;
		    sum.byName[body.data[Object.keys(body.data)[i]].key] = body.data[Object.keys(body.data)[i]].id;
		}
		champIDs = sum;
		console.log("got champIDs")
	}else{
		console.log("error @ champIDs: "+error)
	}
})

var itemByName;
request({url:"https://global.api.pvp.net/api/lol/static-data/euw/v1.2/item?api_key="+api_key},function(error,response,body){
	if (response.statusCode==200){
		f = {}
		body = JSON.parse(body);
		for (id in body.data){
			f[body.data[id].name]=id
		}
		
		itemByName = f;
		console.log("got itemByName");
	}else{
		console.log("error @ itemByName: "+error)
	}
})

var itemData;
request({url:"https://global.api.pvp.net/api/lol/static-data/euw/v1.2/item?itemListData=depth,into,groups&api_key="+api_key},function(error,response,body){
	if (response.statusCode==200){
		console.log("got ItemData")
		itemData = JSON.parse(body);
		
	}else{
		console.log("error @ itemData: "+JSON.stringify(response))
	}

})

function createSet(req,res){
	var champion = req.body.champion;
	var matches = req.body.matches;
	console.log("champion: "+champion);
	var items = {
					"start":{},
					"earlyB":{},
					"finItems":{}
				}
	var gamesFound = 0;
	var gamesAn = 0;
	for (k=0;k<matches.matches.length;k++){
		if (matches.matches[k].champion==champIDs.byName[champion] && gamesFound<10){
			gamesFound+=1;
			var reg = matches.matches[k].region
			urlMatch = 'https://'+reg.toLowerCase()+'.api.pvp.net/api/lol/'+reg.toLowerCase()+'/v2.2/match/'+matches.matches[k].matchId+'?includeTimeline=true&api_key='+api_key;
			riotApiQueue.push({url:urlMatch} ,function(returnObj){
				gamesAn +=1;
				if (returnObj.response!=undefined){
				if (returnObj.response.statusCode==200){
					if (JSON.parse(returnObj.body).timeline!=undefined){
					data = JSON.parse(returnObj.body);
					console.log("gotgame"+data.matchId);
					
					//get Participant ID
					var pID;
					
		            for (j=0;j<data.participants.length;j++){
		                if (data.participants[j].championId==champIDs.byName[champion]){
		                    pID = data.participants[j].participantId;
		                }
		            }
	
					//get Start Items
		            var startSet=[];

                    for (i=0;i<data.timeline.frames[1].events.length;i++){
                        if (data.timeline.frames[1].events[i].participantId==pID && data.timeline.frames[1].events[i].eventType=="ITEM_PURCHASED"){
                        	if(startSet.indexOf(itemData.data[data.timeline.frames[1].events[i].itemId].name)==-1){
                        		startSet.push(itemData.data[data.timeline.frames[1].events[i].itemId].name);
                        	}
                        }
                    }
                    
		            //GET EARLYB
		            var earlyBset =[];
		            for (i=2;i<data.timeline.frames.length;i++){
		            	if (data.timeline.frames[i].events!=undefined){
			                for (j=0;j<data.timeline.frames[i].events.length;j++){
			                    if (data.timeline.frames[i].events[j].participantId==pID && data.timeline.frames[i].events[j].eventType=="ITEM_PURCHASED"){
			                    	if (itemData.data[data.timeline.frames[i].events[j].itemId]!=undefined){
			                    		if(itemData.data[data.timeline.frames[i].events[j].itemId].into!=undefined && itemData.data[data.timeline.frames[i].events[j].itemId].depth>1){
			                    	        if(earlyBset.length<2 && itemData.data[data.timeline.frames[i].events[j].itemId].group!=undefined){
			                    	        	if (earlyBset.length<2 && itemData.data[data.timeline.frames[i].events[j].itemId].group.indexOf("Boot")==-1){
			                    	        		earlyBset.push(itemData.data[data.timeline.frames[i].events[j].itemId].name);
			                    	        	}
			                    	        }else if(earlyBset.length<2){
			                    	        	earlyBset.push(itemData.data[data.timeline.frames[i].events[j].itemId].name);
			                    	        }
			                    		}                  		
			                    	}
			                    }
			                }
		                }
		            }
		            // CHECK SET START
		            var startAdded=false;
	                for (p=0;p<Object.keys(items.start).length;p++){
	                    if(items.start[Object.keys(items.start)[p]].items.indexOf(startSet[0])>-1 && items.start[Object.keys(items.start)[p]].items.indexOf(startSet[0])>-1){
	                        items.start[Object.keys(items.start)[p]].used+=1;
	                        startAdded=true;
	                        break;
	                    }
	                }
	                //NEW
	                if (!startAdded){
	                    items.start[Object.keys(items.start).length+1]={
	                            "used":1,
	                            "items":startSet
	                    }
	                }
		            
		            
		            // CHECK SET EARLY  
		            var earlyAdded=false;
	                for (p=0;p<Object.keys(items.earlyB).length;p++){
	                    if(items.earlyB[Object.keys(items.earlyB)[p]].items.indexOf(earlyBset[0])>-1 && items.earlyB[Object.keys(items.earlyB)[p]].items.indexOf(earlyBset[0])>-1){
	                        items.earlyB[Object.keys(items.earlyB)[p]].used+=1;
	                        earlyAdded=true;
	                        break;
	                    }
	                }
	                //NEW
	                if (!earlyAdded){
	                    items.earlyB[Object.keys(items.earlyB).length+1]={
	                            "used":1,
	                            "items":earlyBset
	                    }
	                }
	                
	                // GET finItems
	                for (p=0;p<6;p++){
	                	if (data.participants[pID-1].stats["item"+p]!=undefined&&data.participants[pID-1].stats["item"+p]!=0){
	                		if(itemData.data[data.participants[pID-1].stats["item"+p]]!=undefined){
		                		if((itemData.data[data.participants[pID-1].stats["item"+p]].into==undefined&&itemData.data[data.participants[pID-1].stats["item"+p]].depth>1&&itemData.data[data.participants[pID-1].stats["item"+p]].group==undefined) ||itemData.data[data.participants[pID-1].stats["item"+p]].group=="BootsUpgrades"){
			                		if (items.finItems[itemData.data[data.participants[pID-1].stats["item"+p]].name]==undefined){
			                			items.finItems[itemData.data[data.participants[pID-1].stats["item"+p]].name]=1;
			                		}else{
			                			items.finItems[itemData.data[data.participants[pID-1].stats["item"+p]].name]+=1;
			                		}
		                		}
	                		}
	                	}
	                }
		            //CHECK IF LAST RUN
					}else{
						console.log("no timeline");
	                }
					}else{
						console.log("error ev: "+returnObj.response.statusCode);
						console.log(returnObj.response.request.uri.href)
					}
				}else{
					console.log("stupid error"+JSON.stringify(returnObj))
				}
				if (gamesAn==10){

					var startSorted=new Array();
					var earlySorted=new Array();
					var finSorted= new Array();
					
					for (start in items.start){
						startSorted.push(items.start[start].used);
					}
					for (early in items.earlyB){
						earlySorted.push(items.earlyB[early].used);
					}
					for (fin in items.finItems){
						finSorted.push(items.finItems[fin]);
					}
					//SORT
					startSorted = Object.keys(items.start).sort(function(a,b){return -items.start[a].used+items.start[b].used});
					earlySorted = Object.keys(items.earlyB).sort(function(a,b){return -items.earlyB[a].used+items.earlyB[b].used});
					finSorted = Object.keys(items.finItems).sort(function(a,b){return -items.finItems[a]+items.finItems[b]});
					
					console.log(JSON.stringify(items));
					console.log(JSON.stringify(startSorted)+"|"+JSON.stringify(earlySorted)+"|"+JSON.stringify(finSorted));
					
					// PREPARE SETS
					var itemSet={
							"title":"Best "+champion+" ever",
							"type":"custom",
							"map":"any",
							"mode":"any",
							"priority":true,
							"sort":0,
							"blocks":[
							          {
							        	  "type":"Best Start Items",
							        	  "items":[]
							          },
							          {
							        	  "type":"Early Buys",
							        	  "items":[]
							          },
							          {
							        	  "type":"Core Items",
							        	  "items":[]
							          },
							          {
							        	  "type":"Situational Items",
							        	  "items":[]
							          },
							          {
							        	  "type":"Useful",
							        	  "items":[
							        	           {"id":"2043"},
							        	           {"id":"3340"},
							        	           {"id":"3341"},
							        	           {"id":"3363"},
							        	           {"id":"3364"}
							        	           ]
							          }
							          ]
					}
					// START ITEMS
					for (set in items.start[startSorted[0]].items){
						itemSet.blocks[0].items.push(
								{
									"id":itemByName[items.start[startSorted[0]].items[set]],
									"count":1
								}
						)
					}
					// EARLY ITEMS
					for (set in items.earlyB[earlySorted[0]].items){
						itemSet.blocks[1].items.push(
									{
										"id":itemByName[items.earlyB[earlySorted[0]].items[set]],
										"count":1
									}
						)
					}
					
					// 	CORE ITEMS
					for (i=0;i<3;i++){
						itemSet.blocks[2].items.push(
									{
										"id":itemByName[finSorted[i]],
										"count":1
									}
						)
					}
					
					// SITUATIONAL ITEMS
					for (i=3;i<7 && finSorted[i]!=undefined;i++){
						itemSet.blocks[3].items.push(
									{
										"id":itemByName[finSorted[i]],
										"count":1
									}
						)
					}
					console.log(JSON.stringify(itemSet));
					createZip(itemSet,champion,function(num){
						console.log(num)
						res.send({itemset:itemSet,zipcode:num});
					});
				}
			})
		}
	}
}

function createZip(itemSet,champion,next){
	var dirName = Math.random()*100000000000000000;
	fs.mkdir(__dirname+"/temp/zip_this/"+dirName,function(){
		fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends",function(){
			fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config",function(){
				fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config/Champions",function(){
					fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config/Champions/"+champion,function(){
						// DIRS CREATED - MAKE JSON
						fs.writeFile(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config/Champions/"+champion+"/Best Build ever.json",JSON.stringify(itemSet,null,"\t"),function(){
							//ZIP IT
								//DEFINE SHIT
							var output = fs.createWriteStream(__dirname+'/temp/zip_here/'+dirName+'.zip');
							var archive = archiver('zip');

							output.on('close', function () {
							    console.log(dirName+" has been saved");
							});

							archive.on('error', function(err){
							    throw err;
							});

							archive.pipe(output);
							archive.bulk([
							    { expand: true,cwd: "temp/zip_this/"+dirName,src:['**/*']}
							]);
							archive.finalize();
							//DELETE IT
							rmdir(__dirname+"/temp/zip_this/"+dirName,function(err){
								console.log((err!=undefined)?dirName+"deleted":err);
							})
							next(dirName);
							setTimeout(function(){
								fs.unlink(__dirname+"/temp/zip_here/"+dirName+".zip",function(){
									console.log(dirName+".zip deleted")
								});
							},60000)
						})
						
					})
				})
			})
		})
	})
	
}
