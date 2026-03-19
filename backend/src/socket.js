import Message from "./models/Message.js";

export const initializeSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("A user connected via WebSocket:", socket.id);

        // A user can join a Club Group Room (e.g. "club_12345") 
        // or a Direct Message Room (e.g. "dm_userA_userB" where IDs are sorted alphabetically to be consistent)
        socket.on("join_room", (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        socket.on("send_message", async (data) => {
            try {
                // Create and persist the message in MongoDB
                const message = await Message.create({
                    sender: data.sender,
                    receiver: data.receiver || null,
                    clubGroup: data.clubGroup || null,
                    teamGroup: data.teamGroup || null,
                    tournamentGroup: data.tournamentGroup || null,
                    text: data.text || "",
                    fileUrl: data.fileUrl || null,
                    fileType: data.fileType || null
                });

                // Populate sender details so the frontend has names and avatars instantly
                const populatedMessage = await Message.findById(message._id).populate("sender", "name profilePic");

                // Broadcast it to everyone in the room (including the sender to confirm delivery)
                io.to(data.room).emit("receive_message", populatedMessage);
            } catch (err) {
                console.error("Realtime Message save error:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("WebSocket Disconnected:", socket.id);
        });
    });
};
