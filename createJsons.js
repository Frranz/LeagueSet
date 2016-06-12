// Script for ChampById and IdByChamp
sum = {
  		"byId":{},
       	"byName":{}
      }

for (i = 0; i < Object.keys(e.data).length; i++) {
    sum.byId[e.data[Object.keys(e.data)[i]].id] = e.data[Object.keys(e.data)[i]].key;
    sum.byName[e.data[Object.keys(e.data)[i]].key] = e.data[Object.keys(e.data)[i]].id
}

JSON.stringify(sum)

// item by Name

f = {}

for (id in e.data){
	f[e.data[id].name]=id
}

JSON.stringify(f)