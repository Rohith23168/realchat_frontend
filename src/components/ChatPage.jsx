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

  const [audioUrl, setAudioUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, navigate]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await getMessagess(roomId);
        setMessages(data || []);
      } catch (error) {
        console.error("LOAD ERROR:", error);
      }
    };

    if (connected && roomId) {
      loadMessages();
    }
  }, [connected, roomId]);

  useEffect(() => {
    if (!connected || !roomId) return;

    const socket = new SockJS(
        `${import.meta.env.VITE_BACKEND_URL}/chat`
    );

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (msg) => console.log(msg),
    });

    client.onConnect = () => {
      console.log("WEBSOCKET CONNECTED");

      client.subscribe(`/topic/room/${roomId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, receivedMessage]);
      });
    };

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
    };
  }, [roomId, connected]);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const currentUrl = previewUrl;

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    setFiles(selectedFiles);

    setInput("");
    setFiles([]);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);

    setAudioBlob(null);
    setRecordingTime(0);

    if (selectedFiles.length > 0) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setPreviewUrl(url);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunks.current, {
          type: "audio/webm",
        });

        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();

      setRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error(error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();

    setRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const deleteMessage = async (id) => {
    try {
      await fetch(`${baseURL}/api/v1/messages/${id}`, {
        method: "DELETE",
      });

      setMessages((prev) =>
          prev.filter((m) => m.id !== id)
      );
    } catch (error) {
      console.error(error);
    }
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

    audio.onended = () => {
      setPlayingAudio(null);
    };
  };

  const leaveRoom = () => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    navigate("/");
  };

  const sendMessage = async () => {
    const client = stompClient.current;

    if (!client || !client.connected) {
      setTimeout(() => {
        sendMessage();
      }, 1000);
      return;
    }

    try {
      let imageUrls = [];
      let audioUrl = "";

      for (let f of files) {
        const res = await uploadImage(f);

        const url =
            res?.imageUrl ||
            res?.data?.imageUrl ||
            res;

        imageUrls.push(url);
      }

      if (audioBlob) {
        const file = new File([audioBlob], "voice.webm", {
          type: "audio/webm",
        });

        const res = await uploadImage(file);

        audioUrl =
            res?.imageUrl ||
            res?.data?.imageUrl ||
            res;
      }

      if (!input.trim() && imageUrls.length === 0 && !audioUrl) {
        return;
      }

      const message = {
        sender: currentUser,
        content: input,
        roomId: roomId,
        imageUrl:
            imageUrls.length > 0 && typeof imageUrls[0] === "string"
                ? imageUrls[0]
                : null,
        audioUrl: audioUrl || null,
      };

      client.publish({
        destination: "/app/sendMessage",
        body: JSON.stringify(message),
      });

      setInput("");
      setFiles([]);
      setPreviewUrl(null);
      setAudioBlob(null);
      setRecordingTime(0);

    } catch (err) {
      console.log("SEND ERROR:", err);
    }
  };

  return (
      <div className="flex flex-col h-screen bg-black text-white">

        <div className="bg-gray-900 p-3 flex justify-between items-center border-b border-gray-700">
          <div>
            <h2 className="font-bold text-lg">Room: {roomId}</h2>
            <p className="text-xs text-gray-400">User: {currentUser}</p>
          </div>

          <button onClick={leaveRoom} className="bg-red-600 px-4 py-2 rounded text-sm">
            Leave Room
          </button>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 pb-56 max-w-4xl mx-auto w-full">

          {messages.map((msg, index) => (
              <div key={msg.id || index} className="p-3 rounded-xl mb-3 max-w-md w-fit bg-gray-800">

                <div className="flex justify-between items-center">
                  <div className="font-bold">{msg.sender}</div>
                  <button
                      className="text-red-400 text-sm"
                      onClick={() => deleteMessage(msg.id)}
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-1">{msg.content}</div>

                {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="chat" className="mt-2 rounded max-w-xs" />
                )}

                {msg.audioUrl && (
                    <div className="mt-2 bg-green-700 rounded-xl p-3 flex items-center gap-3 max-w-sm">
                      <button
                          onClick={() => playVoice(msg.audioUrl, msg.id)}
                          className="bg-white text-black rounded-full w-10 h-10"
                      >
                        {playingAudio === msg.id ? "⏸" : "▶"}
                      </button>
                    </div>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  {msg.timeStamp ? timeAgo(msg.timeStamp) : ""}
                </div>

              </div>
          ))}
        </div>

        {/* ✅ FIXED IMAGE PREVIEW */}
        {previewUrl && (
            <div className="p-2 bg-gray-800 flex justify-start">
              <img
                  src={previewUrl}
                  alt="preview"
                  className="max-w-xs rounded max-h-40 object-cover"
              />
            </div>
        )}

        {/* VOICE PREVIEW */}
        {audioUrl && (
            <div className="p-2 bg-gray-800 flex items-center gap-3">
              <audio controls src={audioUrl}></audio>
              🎤 {recordingTime}s
            </div>
        )}

        {/* INPUT BAR (unchanged) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700">
          <div className="max-w-4xl mx-auto flex items-center gap-2 px-3 py-3 h-16">

            <input type="file" hidden ref={inputRef} onChange={handleFileChange} />

            <button onClick={() => inputRef.current?.click()}>
              <FiPaperclip size={20} />
            </button>

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-full bg-gray-700 outline-none text-sm"
            />

            <button onClick={sendMessage}>
              <MdSend />
            </button>

          </div>
        </div>

      </div>
  );
};

export default ChatPage;