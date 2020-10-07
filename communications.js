var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");

var userData=[],webPages=[],points=[];
var i,j,k,pointsAwarded,webPageId=0,connectedUsers=0,nameWithoutExtension,splitNameWithoutExtension=[],numPoints,webpagesSent=0,webPageDate,currentUsername;
var splitKeyword=[],webpageData=[];
var usernameExists=false,passwordExists=false,login=false,userExists=false,fileExist=false;
const programFiles =["register.html","login.html","web.html","update.html"];
const port = process.env.PORT || 3000

app.get('/', function (req, res) {
	
	if(connectedUsers<50){
		
		res.sendfile("register.html");
	}
	
	else if(connectedUsers>=50){
		res.send("Too many connected users");
	}
});

app.get('/:file',function(req,res){
	
	
	if(connectedUsers<50){
		
		if(programFiles.includes(req.params.file)){
		
			if(req.params.file == 'register.html'){
				res.sendfile("register.html");
			}
		
			else if(req.params.file == 'login.html'){
				res.sendfile("login.html");
			}
		
			else if(req.params.file == 'web.html'){
				res.sendfile("web.html");
			}
		
			else if(req.params.file == 'update.html'){
				res.sendfile("update.html");
			}
		
		
		}
	
		else if(!programFiles.includes(req.params.file)){
		
			for(i=0;i<=webPages.length-1;i++){
			
				if(webPages[i].name == req.params.file){
					fileExist=true;
				
				}
			
			}
		
			if(fileExist){
				res.sendfile(req.params.file);
			}
		
			else if(!fileExist){
				res.send("File does not exist");
			}
		
			fileExist=false;
		}
	}
	
	else if(connectedUsers>=50){
		res.send("Too many connected users");
	}
});




// if connection is recieved through socket check for data being sent 
io.on('connection', function(socket) {
	
	connectedUsers++;
	
	socket.on("disconnect",function(){
		connectedUsers--;
	});
	
	socket.on("validateRegisterInfo",function(data){
		
		usernameExists=false;
		passwordExists=false;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == data.username){
				usernameExists=true;
			}
			if(userData[i].password == data.password){
				passwordExists=true;
			}
		}
		
		socket.emit("isRegisterInfoNew",{usernameStatus:usernameExists,passwordStatus:passwordExists});

	});
	
	socket.on("register",function(data){
		userData.push({username:data.username,password:data.password});

	});
	
	socket.on("validateLoginInfo",function(data){
		
		login=false;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.username && userData[i].password==data.password){
				login=true;
			}
		}
		
		socket.emit("login",login);
	});
	
	socket.on("checkUsername",function(username){
		
		registered=false;
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==username){
				registered=true;
			}
		}
		
		socket.emit("usernameRegistered",registered);
	});
	
	
	socket.on("update",function(data){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username==data.oldUsername && userData[i].password==data.oldPassword){
				userData[i].username=data.newUsername;
				userData[i].password=data.newPassword;
			}
		}
	});

	
	socket.on("getWebPages",function(){
		
		for(i=0;i<=webPages.length-1;i++){

			io.sockets.emit("getWebPage",webPages[i]);

		}
	});
	
	socket.on("getKeywordWebPages",function(keyword){
		
		webpageData=[];
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			nameWithoutExtension=webPages[i].name.slice(0,webPages[i].name.length-5);
			
			for(j=0,k=0;j<=keyword.length-1 && k<=nameWithoutExtension.length-1;j++,k++){
				
				if(nameWithoutExtension[k] == keyword[j]){
					pointsAwarded++;
				}
				
			}
			
			

			webpageData.push({name:webPages[i].name,points:pointsAwarded});
		}
		
		
		
		splitKeyword=keyword.split(" ");
		
		for(i=0;i<=webPages.length-1;i++){
			
			pointsAwarded=0;
			splitNameWithoutExtension=webpageData[i].name.slice(0,webpageData[i].name.length-5).split(" ");
			
			for(j=0,k=0;j<=splitKeyword.length-1 && k<=splitNameWithoutExtension.length-1;j++,k++){
				
				if(splitNameWithoutExtension.includes(splitKeyword[j])){
					pointsAwarded+=splitKeyword[j].length;
				}
				
				if(splitNameWithoutExtension[k] == splitKeyword[j]){
					pointsAwarded+=splitKeyword[j].length;
				}
				
				
			}
			
			webpageData[i].points+=pointsAwarded;
		}
		
		
		
		for(numPoints=1000;numPoints>=0;numPoints--){
			
			
			for(i=0;i<=webpageData.length-1;i++){
				
				if(webpageData[i].points == numPoints){
					socket.emit("getKeywordWebPage",webPages[i]);
				}
			}
		}
		
	});
	
	
	
	socket.on("webPageViewed",function(file){
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].name == file){
				
				webPages[i].views++;
			}
			
		}
	});
	
	
	socket.on("getMostPopularWebPages",function(){
		
		points=[];
		webpageData=[];
		
		for(i=0;i<=webPages.length-1;i++){
			
			webpageData.push({webpage:webPages[i],views:webPages[i].views,sent:false});
			points.push(webPages[i].views);
			
		}
		
		points.sort(function(a, b){return b - a});
		
		webpagesSent=0;
		
		for(i=0;i<=points.length-1;i++){
			for(j=0;j<=webpageData.length-1;j++){
					
				if(points[i] == webpageData[j].views && webpagesSent <=10 && !webpageData[j].sent){
					socket.emit("getMostPopularWebPage",webpageData[j].webpage);
					
					webpageData[j].sent=true;
					webpagesSent++;
					
				}
			}
		}
	});
	
	socket.on("doesFileExist",function(fileName){
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].name == fileName && !webPages[i].deleted){
				fileExist=true;
				
			}
			
		}
		
		if(programFiles.includes(fileName)){
			fileExist=true;
		}
		
		socket.emit("fileExist",fileExist);
		
		fileExist=false;
	});
	
	socket.on("getUserWebPages",function(username){
		
		for(i=0;i<=userData.length-1;i++){
			
			if(userData[i].username == username){
				userExists=true;
				
			}
		}
		
		if(userExists){
			
			for(i=0;i<=webPages.length-1;i++){

				socket.emit("getWebPage",webPages[i]);

			}
		}
		
		else if(!userExists){
			
			socket.emit("userNotExist",username);
			
		}
		
		userExists=false;
		
	});
	
	socket.on("sendWebPage",function(data){
			
			fs.writeFile(data.name, data.code, function (err) {
				
			});
			
			webPages.push({username:data.username,image:data.image,name:data.name,code:data.code,message:data.message,comments:"",views:0,date:data.date,id:webPageId,deleted:false});
			io.sockets.emit("getWebPage",{username:data.username,image:data.image,name:data.name,code:data.code,message:data.message,comments:"",views:0,date:data.date,id:webPageId,deleted:false});
			webPageId++;
			
			
	});
	
	socket.on("sendComments",function(file){
		
		for(i=0;i<=webPages.length-1;i++){
			if(webPages[i].name == file){
				socket.emit("getComments",webPages[i].comments);
			}
		}
	});
	
	socket.on("addComment",function(data){
		for(i=0;i<=webPages.length-1;i++){
			if(webPages[i].name == data.file){
				webPages[i].comments+=data.username+":"+data.comment+"~"+"~";
			}
		}
	});
	
	socket.on("getRecentlyUploadedWebPages",function(){
		
		webpageData=[];
		points=[];
		
		for(i=0;i<=webPages.length-1;i++){
			
			numPoints=0;
			
			webPageDate = new Date(webPages[i].date);
			
			numPoints+=webPageDate.getFullYear()*8760;
			numPoints+=webPageDate.getMonth()*730;
			numPoints+=webPageDate.getHours();
			numPoints+=webPageDate.getMinutes()*1/60;
			numPoints+=webPageDate.getSeconds()*1/3600;
			
			webpageData.push({webpage:webPages[i],points:numPoints,sent:false});
			points.push(numPoints);
		}
		
		points.sort(function(a, b){return b - a});
		
		webpagesSent=0;
		
		for(i=0;i<=points.length-1;i++){
			for(j=0;j<=webpageData.length-1;j++){
					
				if(points[i] == webpageData[j].points && webpagesSent <=10 && !webpageData[j].sent){
					socket.emit("getRecentlyUploadedWebPage",webpageData[j].webpage);
					
					webpageData[j].sent=true;
					webpagesSent++;
					
				}
				
			}
			
		}
	});
	
	
	socket.on("deletePage",function(id){	
		
		for(i=0;i<=webPages.length-1;i++){
			
			if(webPages[i].id==id){
				
				webPages[i].deleted=true;
				
				fs.unlink(webPages[i].name, function (err) {
					
				});
				
				
			}
		}

	});
	
	socket.on("change",function(usernames){
	
		for(i=0;i<=webPages.length-1;i++){

			if(webPages[i].username == usernames.oldUsername){
				webPages[i].username=usernames.newUsername;
			}
		}
		
	});
	
});

	
http.listen(port, function() {
   console.log('listening on localhost'+port);
});