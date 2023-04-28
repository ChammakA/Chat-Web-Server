package com.example.webchatserver;


import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import org.json.JSONObject;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.HashMap;
import java.time.Instant;

/**
 * This class represents a web socket server, a new connection is created and it receives a roomID as a parameter
 * **/
@ServerEndpoint(value="/ws/{roomID}")
public class ChatServer {

    // contains a static List of ChatRoom used to control the existing rooms and their users
    private static Map<String, ChatRoom> rooms = new HashMap<String, ChatRoom>();
    private static Map<String, String> usernames = new HashMap<String, String>();

    @OnOpen
    public void open(@PathParam("roomID") String roomID, Session session) throws IOException, EncodeException
    {
            ChatRoom currentRoom = null;
            String userID = session.getId();
            for (ChatRoom room : rooms.values()) {
                String tempRoomID = room.getCode();
                if (roomID.equals(tempRoomID)) {
                    currentRoom = room;
                    break;
                }
            }
            if (currentRoom == null)
                currentRoom = new ChatRoom(roomID, userID);
            rooms.put(session.getId(), currentRoom);

            String chatHistory = currentRoom.getChatHistory();
            if (!chatHistory.equals("")) {
                session.getBasicRemote().sendText(chatHistory);
            }

            sendMessage("{Server}: Welcome to the chat room. Please state your username to begin.", session, "chat");
        }

    @OnClose
    public void close(Session session) throws IOException, EncodeException
    {
        String userID = session.getId();
        ChatRoom chatRoom = rooms.get(userID);

        chatRoom.removeUser(userID);
        rooms.remove(userID);
        String username;
        if (usernames.containsKey(userID)) {
            username = usernames.get(userID);
            usernames.remove(userID);
            broadcastMessage("{Server}: " + username + " has left the chat room.", session, false, "chat");
        }
    }

    @OnMessage
    public void handleMessage(String comm, Session session) throws IOException, EncodeException
    {
        // example getting unique userID that sent this message
        String userID = session.getId();

        // handle the messages
        JSONObject jsonmsg = new JSONObject(comm);
        String type = (String) jsonmsg.get("type");
        String message = (String) jsonmsg.get("message");
        message = boldText(message);

        type = type.toLowerCase();
        switch(type) {
            case "chat":
                if (!usernames.containsKey(userID)) {
                    usernames.put(userID, message);
                    ChatRoom currentRoom = rooms.get(userID);
                    currentRoom.setUserName(userID, message);
                    sendMessage("{Server}: Welcome, " + message +".", session, "chat");
                    broadcastMessage("{Server}: " + message + " has joined the chat room.", session, true, "chat");
                } else {
                    String username = usernames.get(userID);
                    broadcastMessage("(" + username + "): " + message, session, false, "chat");
                }
                break;
            case "image":
                broadcastMessage(message, session, false, "image");
                break;
        }
    }

    private void sendMessage(String message, Session session, String type) throws IOException
    {
        LocalDateTime ldt = LocalDateTime.ofInstant(Instant.now(), ZoneId.systemDefault());
        String timestamp = ldt.getHour() + ":" + (ldt.getMinute() < 10 ? "0" : "") + ldt.getMinute();
        if (type.equals("chat"))
            message = "[" + timestamp + "] " + message;

        session.getBasicRemote().sendText("{\"type\": \"" + type + "\", \"message\": \"" + message + "\"}");
    }

    private void broadcastMessage(String message, Session session, boolean hideFromSelf, String type) throws IOException
    {
        String userID = session.getId(); // my id
        ChatRoom chatRoom = rooms.get(userID); // my room

        LocalDateTime ldt = LocalDateTime.ofInstant(Instant.now(), ZoneId.systemDefault());
        String timestamp = ldt.getHour() + ":" + (ldt.getMinute() < 10 ? '0' + ldt.getMinute() : ldt.getMinute());

        String usernamesInRoom = "[";


        int totalUsers = usernames.size();
        int roomUsers = 0;
        for (Session peer: session.getOpenSessions()) {
            if (peer.getId().equals(userID) && hideFromSelf) // if we don't want to show the message to the sender, early continue
                continue;

            if (rooms.get(peer.getId()).equals(chatRoom)) {
                roomUsers++;
                sendMessage(message, peer, type);
                

                usernamesInRoom += "\"" + usernames.get(peer.getId()) + "\", ";
            }
        }
        if (type.equals("chat"))
            message = "[" + timestamp + "] " + message;
        chatRoom.addToChatHistory(message); // log to chat history

        usernamesInRoom = usernamesInRoom.substring(0, usernamesInRoom.length() - 2);
        usernamesInRoom += "]";

        session.getBasicRemote().sendText("{\"type\": \"usercount\", \"message\": \"[" + totalUsers + ", " + roomUsers + "]\", \"usernames\": " + usernamesInRoom + "}");
    }
    private static String boldText(String txt) {
        String regex = "\\*([^*]+)\\*";
        String replace = "<b>$1<\b>";
        return txt.replaceAll(regex,replace);
    }
}