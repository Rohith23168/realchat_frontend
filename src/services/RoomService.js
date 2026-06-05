import axios from "axios";

import { baseURL } from "../config/AxiosHelper";

const BASE_URL = `${baseURL}/api/v1/rooms`;


// CREATE ROOM (FIXED)

export const createRoomApi = async (roomId, userName) => {
    try {
        const res = await axios.post(BASE_URL, {
            roomId,
            userName,
            messages: [],
        });

        return res.data;
    } catch (error) {
        console.log("Create Room Error:", error);
        throw error;
    }
};


// JOIN ROOM
export const joinChatApi = async (roomId) => {
    try {
        const res = await axios.get(`${BASE_URL}/${roomId}`);
        return res.data;
    } catch (error) {
        console.log("Join Room Error:", error);
        throw error;
    }
};


// GET MESSAGES
export const getMessagess = async (roomId) => {
    try {
        const res = await axios.get(`${BASE_URL}/${roomId}/messages`);
        return res.data;
    } catch (error) {
        console.log("Get Messages Error:", error);
        throw error;
    }
};