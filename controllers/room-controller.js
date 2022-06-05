const roomService = require("../services/room-service");
const RoomDto = require("../dtos/room-dto");

class RoomController {
	async createRoom(req, res) {
		//room creation logic
		const { topic, roomType } = req.body;

		if (!topic || !roomType) {
			return res.status(400).json({
				message: "all fields are required",
			});
		}

		const room = await roomService.create({
			topic,
			roomType,
			ownerId: req.user._id,
		});

		res.json({
			room: new RoomDto(room),
		});
	}

	async index(req, res) {
		const rooms = await roomService.getAllRooms(["open"]);

		const allRooms = rooms.map((room) => new RoomDto(room));

		res.json({
			allRooms
		});
	}

	async show(req,res){
		const room = await roomService.getRoom(req.params.roomId);

		res.json({
			room
		});
	}
}

module.exports = new RoomController();
