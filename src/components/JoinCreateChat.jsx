import React, { useState } from "react";
import chatIcon from "../assets/chat.png";
import toast from "react-hot-toast";
import { createRoomApi, joinChatApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";

const JoinCreateChat = () => {
  const [detail, setDetail] = useState({
    roomId: "",
    userName: "",
  });

  const { setRoomId, setCurrentUser, setConnected } = useChatContext();
  const navigate = useNavigate();

  function handleFormInputChange(event) {
    setDetail({
      ...detail,
      [event.target.name]: event.target.value,
    });
  }

  function validateForm() {
    if (detail.roomId === "" || detail.userName === "") {
      toast.error("Invalid Input !!");
      return false;
    }
    return true;
  }

  // CLEAN ROOM ID FUNCTION
  const cleanRoomId = (id) => {
    return id.replace(/[^a-zA-Z0-9_-]/g, "").trim();
  };

  async function joinChat() {
    if (!validateForm()) return;

    const roomId = cleanRoomId(detail.roomId);

    try {
      const room = await joinChatApi(roomId);

      toast.success("joined..");
      setCurrentUser(detail.userName);
      setRoomId(room.roomId);
      setConnected(true);
      navigate("/chat");
    } catch (error) {
      if (error.response?.status == 400) {
        toast.error(error.response.data);
      } else {
        toast.error("Error in joining room");
      }
      console.log(error);
    }
  }

  // FIXED CREATE ROOM
  async function createRoom() {
    if (!validateForm()) return;

    const cleanRoomId = detail.roomId.replace(/[^a-zA-Z0-9_-]/g, "").trim();

    try {
      const response = await createRoomApi(
          cleanRoomId,
          detail.userName
      );

      toast.success("Room Created Successfully !!");

      setCurrentUser(detail.userName);
      setRoomId(response.roomId);
      setConnected(true);

      navigate("/chat");

    } catch (error) {
      console.log(error);

      toast.error(
          error.response?.data || error.message || "Error in creating room"
      );
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="p-10 dark:border-gray-700 border w-full flex flex-col gap-5 max-w-md rounded dark:bg-gray-900 shadow">

          <div>
            <img src={chatIcon} className="w-24 mx-auto" />
          </div>

          <h1 className="text-2xl font-semibold text-center ">
            Join Room / Create Room ..
          </h1>

          {/* NAME */}
          <div>
            <label className="block font-medium mb-2">Your name</label>
            <input
                onChange={handleFormInputChange}
                value={detail.userName}
                type="text"
                name="userName"
                className="w-full dark:bg-gray-600 px-4 py-2 border rounded-full"
            />
          </div>

          {/* ROOM ID */}
          <div>
            <label className="block font-medium mb-2">
              Room ID / New Room ID
            </label>
            <input
                onChange={handleFormInputChange}
                value={detail.roomId}
                type="text"
                name="roomId"
                className="w-full dark:bg-gray-600 px-4 py-2 border rounded-full"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-center gap-2 mt-4">
            <button
                onClick={joinChat}
                className="px-3 py-2 dark:bg-blue-500 rounded-full"
            >
              Join Room
            </button>

            <button
                onClick={createRoom}
                className="px-3 py-2 dark:bg-orange-500 rounded-full"
            >
              Create Room
            </button>
          </div>

        </div>
      </div>
  );
};

export default JoinCreateChat;