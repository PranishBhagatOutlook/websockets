import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import axios from "axios";
import ChatAppService from "../service/chatapp.service";



var stompClient = null;
export default function ChatRoom() {
  const [user, setUser] = useState({
    username: "",
    sendername: "",
    connected: false,
    message: "",
    sessionName: "",
    state: "",
  });
  const BASE_URL = "http://localhost:8080/"
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState({ users: [] });
  const [showTable, setShowTable] = useState(false);
  const [err, setErr] = useState("");
  const [publicChats, setpublicChats] = useState([]);

  const register = (event) => {
    const { value } = event.target;
    setUser({ ...user, username: value });
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUser({ ...user, message: value });
  };

  const registerUser = () => {
    let Sock = new SockJS(BASE_URL+"myws");
    stompClient = over(Sock);
    stompClient.connect({ username: user.username }, onConnected, onError);
    getAllUsers();
  };
  const getAllUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(BASE_URL+"getAllUser");
      setUsers(response.data);
    } catch (err) {
      setErr(err.message);
      setShowTable(false);
    } finally {
      setIsLoading(false);
    }
  };

  function showUserList() {
    getAllUsers();
    setShowTable(true);
  }

  function hideUserList() {
    setShowTable(false);
  }

  useEffect(() => {
    getAllUsers();
  }, []);

  const changeStatus = () => {
    axios
      .get("http://localhost:8080/changeStatus/?name=" + user.username)
      .then((res, err) => {
        // console.log(res.data);
        setUser({ ...user, state: res.data.state });
      });
  };
  const sendPublicMessage = () => {
    // console.log("here is name", user.sessionName);
    if (stompClient) {
      let chatMessage = {
        senderName: user.username,
        message: user.message,
        status: "MESSAGE",
      };
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUser({ ...user, message: "" });
    }
  };
  const onConnected = (message) => {
    user.state = "Online";
    setUser({
      ...user,
      connected: true,
      sessionName: message.headers["user-name"],
    });
    // console.log("user is", user);
    stompClient.subscribe("/user/topic/public", onPublicMessageReceived, {
      name: user.username,
    });
  };
  const onError = (err) => {
    console.log(err);
  };
  const onPublicMessageReceived = (message) => {
    // console.log("<<<<<<<<<<<<", user);
    if (user.state === "Online") {
      let messageData = JSON.parse(message.body);
      publicChats.push(messageData);
      setpublicChats([...publicChats]);
    }

    console.log(publicChats);
  };

  return (
    <div>
      {user.connected ? (
        <div className="connected">
          <h1>Welcome {user.username.toUpperCase()}</h1>
          {user.state === "Online" && <h4> You are Online </h4>}
          {user.state === "DoNotDisturb" && <h4> Do Not Disturb mode is ON</h4>}
          <div>
            {publicChats.map((chat) => (
              <li>
                {chat.senderName}:{chat.message}
              </li>
            ))}
            <div>
              <input
                type="text"
                value={user.message}
                onChange={handleMessage}
              />
              <button onClick={sendPublicMessage}>send</button>
            </div>
          </div>
          <div>
            <br /> <button onClick={showUserList}>Show User List</button>
            {isLoading && <h2>Loading...</h2>}
            {showTable ? (
              <div className="showTable">
                <table>
                  <tr>
                    <th>Username</th>
                    <th>State</th>
                  </tr>
                  {users.map((val, key) => {
                    return (
                      <tr key={key}>
                        <td>{val.username}</td>
                        <td>{val.state}</td>
                      </tr>
                    );
                  })}
                </table>
                <button onClick={hideUserList}> Hide</button>
              </div>
            ) : (
              <div></div>
            )}
          </div>
          <br />
          <div>
            {" "}
            {user.state === "Online" && <button onClick={changeStatus}>Set to Do Not Disturb</button>}
            {user.state === "DoNotDisturb" && <button onClick={changeStatus}>Set me Online</button>}
            
            
          </div>
        </div>
      ) : (
        <div className="register">
          <input value={user.username} onChange={register} />
          <button onClick={registerUser}>join</button>
        </div>
      )}
    </div>
  );
}
