require("dotenv").config();
const express = require("express");
const app = express();
const server=require('http').createServer(app)
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dbConnect = require("./database");
const router = require("./routes");


const ACTIONS = require('./actions');

const io=require('socket.io')(server,{ cors:{
	origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
	methods:['GET','POST'],
}})

app.use(cookieParser());
app.use(
	cors({
		credentials: true,
		origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
	})
);
app.use(express.json({limit:'8mb'}));

app.use("/storage", express.static("storage"));

dbConnect();

app.use(router);

app.get("/", (req, res) => {
	res.send("Welcome to voice chat api");
});

const PORT = process.env.PORT || 5000;

// if(process.env.NODE_ENV==="production"){
// 	app.use(express.static(path.join(__dirname,"/audioroom_frontend/build")));

// 	app.get('*',(req,res)=>{
// 		res.sendFile(path.resolve(__dirname,"audioroom_frontend","build","index.html"))
// 	});
// }else{
// 	app.get("/", (req, res) => {
// 		res.send("Welcome to voice chat api");
// 	});
// }


const socketUserMapping={}


//SOCKETS LOGIC
io.on('connection',(socket)=>{
	console.log('new connection',socket.id)
	socket.on(ACTIONS.JOIN,({roomId,user})=>{
		socketUserMapping[socket.id]=user;

		const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
		clients.forEach(clientId=>{
			io.to(clientId).emit(ACTIONS.ADD_PEER,{
			peerId:socket.id,
			createOffer:false, //we will create offer
			user
			})
		
			socket.emit(ACTIONS.ADD_PEER,{
			peerId:clientId,
			createOffer:true,
			user:socketUserMapping[clientId]
		})

	})
		socket.join(roomId)
		//console.log(clients)
	})
	


	//Handling relay ice
	socket.on(ACTIONS.RELAY_ICE,({
		peerId,
		icecandidate
	})=>{
		io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
            peerId: socket.id,
            icecandidate,
        });
	})

	//handling relay sdp

	//client to server using relay and server to client using the actions names
	socket.on(ACTIONS.RELAY_SDP,({
		peerId,
		sessionDescription
	})=>{
		io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
            peerId: socket.id,
            sessionDescription,
        });
	})

	
//mute unmute
socket.on(ACTIONS.MUTE,({roomId,userId})=>{
	//console.log('mute',userId)
	const clients=Array.from(io.sockets.adapter.rooms.get(roomId)||[]);

	clients.forEach(clientId=>{
		io.to(clientId).emit(ACTIONS.MUTE,{
			peerId:socket.id,
			userId,
		})
	})
})

socket.on(ACTIONS.UNMUTE,({roomId,userId})=>{
	//console.log('unmute',userId)
	const clients=Array.from(io.sockets.adapter.rooms.get(roomId)||[]);

	clients.forEach(clientId=>{
		io.to(clientId).emit(ACTIONS.UNMUTE,{
			peerId:socket.id,
			userId,
		})
	})
	
})

//leave room
const leaveRoom = () => {
	const { rooms } = socket;
	//console.log('leaving', rooms);
	// console.log('socketUserMap', socketUserMap);
	Array.from(rooms).forEach((roomId) => {
		const clients = Array.from(
			io.sockets.adapter.rooms.get(roomId) || []
		);
		clients.forEach((clientId) => {
			io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
				peerId: socket.id,
				userId: socketUserMapping[socket.id]?.id,
			});

			socket.emit(ACTIONS.REMOVE_PEER, {
				peerId: clientId,
				userId: socketUserMapping[clientId]?.id, //new feature of js for checking
			});

			socket.leave(roomId);
		});
	});

	delete socketUserMapping[socket.id];

	//console.log('map', socketUserMap);
};
socket.on(ACTIONS.LEAVE, leaveRoom);
socket.on('disconnecting',leaveRoom);//disconnect means it will trigger adter ot disconnects but we are using disconnecting before we disconnect
});
server.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});

