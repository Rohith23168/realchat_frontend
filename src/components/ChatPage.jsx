import { useEffect, useRef, useState } from "react";
import { MdSend, MdStop } from "react-icons/md";
import { FiPaperclip } from "react-icons/fi";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import EmojiPicker from "emoji-picker-react";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import { baseURL } from "../config/AxiosHelper";
import { getMessagess } from "../services/RoomService";
import { uploadImage } from "../services/FileService";
import { timeAgo } from "../config/helper";

const ChatPage = () => {
  const { roomId, currentUser, connected } = useChatContext();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const stompClient = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // redirect
  useEffect(() => {
    if (!connected) navigate("/");
  }, [connected, navigate]);

  // load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await getMessagess(roomId);
        setMessages(data || []);
      } catch (e) {
        console.error(e);
      }
    };

    if (connected && roomId) loadMessages();
  }, [connected, roomId]);

  // websocket
  useEffect(() => {
    if (!connected || !roomId) return;

    const socket = new SockJS(`${import.meta.env.VITE_BACKEND_URL}/chat`);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (msg) => console.log(msg),
    });

    client.onConnect = () => {
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        const received = JSON.parse(message.body);
        setMessages((prev) => [...prev, received]);
      });
    };

    client.activate();
    stompClient.current = client;

    return () => client.deactivate();
  }, [roomId, connected]);

  // auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      setAudioBlob(blob);
    };

    mediaRecorderRef.current.start();
    setRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime((p) => p + 1);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const sendMessage = async () => {
    const client = stompClient.current;
    if (!client?.connected) return;

    let imageUrls = [];
    let audioUrl = "";

    for (let f of files) {
      const url = await uploadImage(f);
      imageUrls.push(url);
    }

    if (audioBlob) {
      const file = new File([audioBlob], "voice.webm", {
        type: "audio/webm",
      });

      audioUrl = await uploadImage(file);
    }

    if (!input.trim() && imageUrls.length === 0 && !audioUrl) return;

    const message = {
      sender: currentUser,
      content: input,
      roomId,
      imageUrl: imageUrls[0] || null,
      audioUrl: audioUrl || null,
    };

    client.publish({
      destination: "/app/sendMessage",
      body: JSON.stringify(message),
    });

    setInput("");
    setFiles([]);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const playVoice = (url, id) => {
    if (audioRef.current && playingAudio === id) {
      audioRef.current.pause();
      setPlayingAudio(null);
      return;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudio(id);

    audio.play();

    audio.onended = () => setPlayingAudio(null);
  };

  const deleteMessage = async (id) => {
    await fetch(`${baseURL}/api/v1/messages/${id}`, {
      method: "DELETE",
    });

    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
      <div className="flex flex-col h-screen bg-black text-white">

        {/* HEADER */}
        <div className="bg-gray-900 p-3 flex justify-between">
          <div>
            <h2>Room: {roomId}</h2>
            <p>User: {currentUser}</p>
          </div>
        </div>

        {/* CHAT */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 pb-24">

          {messages.map((msg, index) => (
              <div
                  key={msg.id || index}
                  className={`p-3 mb-3 rounded max-w-md ${
                      msg.sender === currentUser ? "bg-green-700 ml-auto" : "bg-gray-800"
                  }`}
              >
                <div className="flex justify-between">
                  <b>{msg.sender}</b>
                  <button onClick={() => deleteMessage(msg.id)}>Delete</button>
                </div>

                <div>{msg.content}</div>

                {(msg.imageUrl || msg.fileUrl) && (
                    <img
                        src={msg.imageUrl || msg.fileUrl}
                        className="mt-2 max-w-xs rounded"
                    />
                )}

                {(msg.audioUrl || msg.fileUrl) && (
                    <audio controls className="mt-2">
                      <source src={msg.audioUrl || msg.fileUrl} />
                    </audio>
                )}

                {msg.audioUrl && (
                    <button onClick={() => playVoice(msg.audioUrl, msg.id)}>
                      {playingAudio === msg.id ? "⏸" : "▶"} Voice
                    </button>
                )}

                <div className="text-xs text-gray-400">
                  {msg.timeStamp ? timeAgo(msg.timeStamp) : ""}
                </div>
              </div>
          ))}

        </div>

        {/* INPUT */}
        <div className="fixed bottom-0 w-full bg-gray-900 p-2 flex gap-2">

          <input type="file" hidden ref={inputRef} onChange={handleFileChange} />

          <button onClick={() => inputRef.current.click()}>
            📎
          </button>

          <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-gray-700 px-3 rounded"
          />

          {!recording ? (
              <button onClick={startRecording}>🎤</button>
          ) : (
              <button onClick={stopRecording}>
                <MdStop />
              </button>
          )}

          <button onClick={sendMessage}>
            <MdSend />
          </button>

          <button onClick={() => setShowEmoji(!showEmoji)}>
            😊
          </button>
        </div>

        {audioBlob && (
            <div className="p-2 bg-gray-800">
              Voice: {recordingTime}s
            </div>
        )}

        {showEmoji && (
            <EmojiPicker
                onEmojiClick={(e) =>
                    setInput((prev) => prev + e.emoji)
                }
            />
        )}
      </div>
  );
};

export default ChatPage;