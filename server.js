//useless comment

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
			res.send('<h1>File not found</h1><p>We are sorry, but this file is not on the server.<br><br>Itemsets are deleted 60 seconds after you click the champion you want your itemset for. <br>To still get it just <b>go back and refresh the page</b><br><br></p>');
			console.log(err)
		}
	});
});

app.use('/riot.txt',function(req,res){
	res.sendFile(__dirname+"/static/riot.txt")
})

app.get(/^\/$|\/sets.*/, function (req, res) {
	console.log(req.originalUrl)
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/google1effa2b7f9a7e0a5.html', function (req, res) {
	res.sendFile(path.join(__dirname + '/google1effa2b7f9a7e0a5.html'));
});
// MAIN HANDLER
app.get(/\/content\/[^\/]+\/[^\/]*$/, function(req,res){
	
	var reg = req.originalUrl.substring(1).split("/")[1];
	var name = req.originalUrl.substring(1).split("/")[2];
	
	console.log(name+" from "+reg)
	
	getSumId(reg,name,function(ret){
		// wenn kein error
		if(!ret.error){
			console.log("Summoner ID = " + id);
			urlMatches = 'https://'+reg+'.api.pvp.net/api/lol/'+reg+'/v1.3/stats/by-summoner/'+id+'/ranked?season=SEASON2016&api_key=';
						
			riotApiQueue.push(urlMatches ,function(returnObj){
				
				if (returnObj.response.statusCode==200){
					data = JSON.parse(returnObj.body);
					
					if (data.totalGames!=0){
						possibleSets(data,name,function(sugList){
							//return sugList
							res.header(200);
							res.send(sugList);
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
			res.writeHead(ret.error);
			res.write("sum");
			res.send();
		}
	})
});

app.get(/\/content\/[^\/]+\/[^\/]+\/[^\/]+\/?[^\/]*$/,function(req,res){
		prepareSet(req,res);
})


const port = Number(process.env.PORT||3000)
app.listen(port, function () {
  console.log('ich hoeree...');
  console.log(process.env.PORT);
});

// MANAGE API REQUESTS
const api_key = '';

var riotApiQueue = new Queue(api_key);

function Queue(api_key){
	
	this.api_key = api_key;
	
	this.pause = false;
	
	var diese = this;
	
	this.push = function(url,callback){
		
		var options = {
				url:url+api_key,
				timeout:5000,
				agent:false
		};
		
        if(!diese.pause){
            
            request(options,function(error,response,body){
            	if (response){
	                if(response.statusCode!=429){
	                	callback({error:error, response:response, body:body});
	
	                }else{
	                	
	                	console.log("2 much");
	                	
	                    if (response.headers["retry-after"]){
	
	                        diese.pause=true;
	                        
	                        setTimeout(function(){
	
	                            diese.pause=false;
	                            diese.push(url,callback);
	
	                        }, response.headers["retry-after"]*1000);
	                    }else{
	                    	diese.push(url,callback);
	                    }
	                }
            	}else{
            		diese.push(url,callback);
            	}
            });
        }else{
            
            setTimeout(function(){
                diese.push(url,callback);
                console.log("wait for queue")
            },200);
            
        }
	}
}

// Functions

function possibleSets(data,name,done){
	
	var champions = {};
	var giveBack = {"suggested":[],"name":name};
	
	for (i=0;i<data.champions.length;i+=1){
		
		if(data.champions[i].stats.totalSessionsPlayed>=10 && data.champions[i].id != 0){
			giveBack.suggested.push(champIDs.byId[data.champions[i].id]);
		}
		
	}
//callback
	done(giveBack)
}

function prepareSet(req,res){
	
//	var [asdf,reg,name,champion,amount] = req.originalUrl.substring(1).split("/");
	
	var reg = req.originalUrl.substring(1).split("/")[1];
	var name = req.originalUrl.substring(1).split("/")[2];
	var champion = req.originalUrl.substring(1).split("/")[3];
	var amount = req.originalUrl.substring(1).split("/")[4];
	
	if(!amount) amount=10;
	
	console.log("einmal "+name+"'s "+ champion+" zum mitnehmen bitte");
	
	getSumId(reg,name,function(ret){
		if (!ret.error){
			urlMatchlist = 'https://'+reg+'.api.pvp.net/api/lol/'+reg+'/v2.2/matchlist/by-summoner/'+ret.id+'?championIds='+champIDs.byName[champion]+'&rankedQueues=TEAM_BUILDER_DRAFT_RANKED_5x5&seasons=SEASON2016&beginIndex=0&endIndex='+amount+'&api_key=';
			riotApiQueue.push(urlMatchlist,function(returnObj){
				if(returnObj.response.statusCode==200){
					data = JSON.parse(returnObj.body);
						
					var matches = new Array();
					for(i=0;i<data.matches.length;i+=1){
						matches.push({id:data.matches[i].matchId,reg:data.matches[i].region});
					}
					
					createSet(matches,champion,name,res);
				}else{
					console.log(returnObj.response.statusCode+" @ Matchlist")
					res.writeHead(returnObj.response.statusCode);
					res.write("matchlist");
					res.send();
				}
			})
		}else{
			console.log("summoner not found")
			res.writeHead(ret.error);
			res.write("summoner")
			res.send();
		}
	})
	
	
	
	
}

function createSet(matches,champion,name,res){
	var items = {
			"start":{},
			"earlyB":{},
			"finItems":{}
		}
var gamesAn = 0;
for (k=0;k<matches.length;k+=1){
var reg = matches[k].reg
urlMatch = 'https://'+reg.toLowerCase()+'.api.pvp.net/api/lol/'+reg.toLowerCase()+'/v2.2/match/'+matches[k].id+'?includeTimeline=true&api_key=';
riotApiQueue.push(urlMatch ,function(returnObj){
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
            	if(itemData.data[data.timeline.frames[1].events[i].itemId]!=undefined){
                	if(startSet.indexOf(itemData.data[data.timeline.frames[1].events[i].itemId].name)==-1){
                		startSet.push(itemData.data[data.timeline.frames[1].events[i].itemId].name);
                	}	
            	}else{
            		console.log("old item found");
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
        
		}else{
			console.log("no timeline");
        }
		}else{
			console.log("error ev: "+returnObj.response.statusCode);
		}
	}else{
		console.log("stupid error"+JSON.stringify(returnObj))
	}
	if (gamesAn==matches.length){

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
		
		// PREPARE SETS
		var itemSet={
				"title":name+"'s "+champion+" from league-set(dot)herokuapp(dot)com",
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
		createZip(itemSet,champion,name,function(setName){
			console.log(setName)
			res.send({itemset:itemSet,zipcode:setName});
		});
	}
})
}
}

function getSumId(reg,name,next){
	
	urlSumId = 'https://'+reg+'.api.pvp.net/api/lol/'+reg+'/v1.4/summoner/by-name/' + name + '?api_key=';
	
	console.log(urlSumId);
	
	riotApiQueue.push(urlSumId, function(returnObj){
		if (returnObj.response!=undefined){
			if (returnObj.response.statusCode==200){
				data = JSON.parse(returnObj.body);
				id = data[Object.keys(data)[0]].id;
				next({id:id});
			}else{
				console.log(returnObj.response.statusCode+" at getSumId");
				next({error:returnObj.response.statusCode});
			}
		}else{
			console.log(JSON.stringify(returnObj));
		}
	})
}

function createZip(itemSet,champion,name,next){
	var dirName = Math.random()*100000000000000000;
	var gapless = name.replace(new RegExp(' ','g'),'_');
	fs.mkdir(__dirname+"/temp/zip_this/"+dirName,function(){
		fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends",function(){
			fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config",function(){
				fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config/Champions",function(){
					fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config/Champions/"+champion,function(){
						fs.mkdir(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config/Champions/"+champion+"/Recommended",function(){
							// DIRS CREATED - MAKE JSON
							fs.writeFile(__dirname+"/temp/zip_this/"+dirName+"/League of Legends/Config/Champions/"+champion+"/Recommended/"+name+"s_"+champion+".json",JSON.stringify(itemSet,null,"\t"),function(){
								//ZIP IT
									//DEFINE SHIT
								var output = fs.createWriteStream(__dirname+'/temp/zip_here/'+gapless+'s_'+champion+'_league-set.zip');
								var archive = archiver('zip');
	
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
									if(err){
										console.log(err)
									}
								})
								next(gapless+'s_'+champion+'_league-set.zip');
								setTimeout(function(){
									fs.unlink(__dirname+"/temp/zip_here/"+gapless+'s_'+champion+'_league-set.zip',function(err){
										console.log(!err?name+"s "+champion+".zip deleted":err);
									});
								},60000)
							})
						})
					})
				})
			})
		})
	})
	
}


//pls rework

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
