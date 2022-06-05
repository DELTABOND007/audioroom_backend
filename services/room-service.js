const RoomModel = require("../models/room-model");

class RoomService {
	async create(data) {
		const { topic, roomType, ownerId } = data;

		const room = await RoomModel.create({
			topic,
			roomType,
			ownerId,
			speakers: [ownerId],
		});

		return room;
	}

	async getAllRooms(typesArr) {
		const rooms = await RoomModel.find({ roomType: { $in: typesArr } })
			.populate("speakers")
			.populate("ownerId")
			.exec();

		return rooms;
	}

	async getRoom(roomId){
		const room=await RoomModel.findOne({_id:roomId});
		return room;
	}
}

module.exports = new RoomService();
