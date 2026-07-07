# 💬 Real-Time Chat Application

A full-stack real-time messaging application that enables users to communicate instantly through WebSockets. The application supports bidirectional communication, multiple chat rooms, user authentication, and persistent message storage using MySQL.

## 🚀 Live Demo

**Live Application:** https://realchat-frontend-kohl.vercel.app/

## 📌 Features

- 💬 Real-time one-to-one and group messaging
- ⚡ Instant bidirectional communication using WebSocket
- 📡 STOMP messaging protocol for structured message routing
- 🔄 SockJS fallback support for browser compatibility
- 👥 Multiple chat rooms
- 🟢 Online user presence
- 🔐 User authentication
- 💾 Persistent message storage
- 📱 Responsive user interface

---

## 🛠️ Tech Stack

### Backend
- Java
- Spring Boot
- Spring WebSocket
- STOMP
- SockJS

### Frontend
- React.js
- JavaScript / TypeScript
- HTML5
- CSS3

### Database
- MySQL

### Tools
- Git
- GitHub
- Maven
- Vercel

---

## 🏗️ System Architecture

```
+----------------------+
|     React Client     |
+----------+-----------+
           |
           | WebSocket / SockJS
           |
+----------v-----------+
|  Spring Boot Server  |
|     STOMP Broker     |
+----------+-----------+
           |
           |
+----------v-----------+
|       MySQL          |
+----------------------+
```

---

## ✨ Key Highlights

- Developed a full-duplex messaging system using WebSocket for real-time communication.
- Implemented the STOMP protocol over WebSocket to provide structured and scalable message routing.
- Optimized WebSocket connections to reduce latency and improve message delivery speed.
- Designed a normalized MySQL database schema for users, chat rooms, messages, and timestamps.
- Built REST APIs for authentication and user management.
- Created a responsive React-based frontend for a seamless user experience.

---

## 📂 Database Design

The application stores:

- User information
- Chat rooms
- Messages
- Message timestamps
- User-room relationships

---



Example:

- Login Page
- Chat Dashboard
- Chat Room
- Message Window

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Rohithrgowda23/realchat_frontend.git
```

---

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📈 Future Enhancements

- 🔔 Push notifications
- 😊 Emoji support
- 📎 File and image sharing
- 🎥 Audio and video calling
- ✔️ Message read receipts
- ✍️ Typing indicators
- 🌙 Dark mode
- 🔍 Message search
- 🔐 End-to-end encryption

---

## 📚 What I Learned

This project strengthened my understanding of:

- WebSocket communication
- Spring Boot WebSocket
- STOMP messaging protocol
- SockJS fallback mechanism
- React state management
- REST API development
- MySQL database design
- Real-time application architecture

---

## 👨‍💻 Author

**Rohith R Gowda**

GitHub: https://github.com/Rohithrgowda23



## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub.
