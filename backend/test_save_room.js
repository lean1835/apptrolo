const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://qlnhatro_db:qlnhatro@cluster0.djxgear.mongodb.net/nhatro_db';

// Define mini schema to test mongoose directly
const RoomSchema = new mongoose.Schema({
  name: String,
  price: Number,
  ep: { type: Number, default: 0 },
  wp: { type: Number, default: 0 },
  lodge: mongoose.Schema.Types.ObjectId,
});

const RoomModel = mongoose.model('TestRoom', RoomSchema, 'rooms');

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const newRoom = new RoomModel({
    name: 'Test Room Initial Index 999',
    price: 1500000,
    ep: 1,
    wp: 1,
    lodge: new mongoose.Types.ObjectId("6a26bd081481b122cb7adda7"),
  });

  const saved = await newRoom.save();
  console.log('Saved room direct:', JSON.stringify(saved, null, 2));

  await RoomModel.deleteOne({ _id: saved._id });
  console.log('Deleted test room');

  await mongoose.disconnect();
}

run().catch(console.error);
