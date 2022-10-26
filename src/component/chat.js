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
    let Sock = new SockJS("http://localhost:8080/myws");
    stompClient = over(Sock);
    stompClient.connect({ username: user.username }, onConnected, onError);
    getAllUsers();
  };
  const getAllUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:8080/getAllUser");
      setUsers(response.data);
      console.log(users);
    } catch (err) {
      setErr(err.message);
      setShowTable(false);
    } finally {
      setIsLoading(false);

      console.log("Users are", users);
    }
  };

  function showUserList() {
    getAllUsers();
    setShowTable(true);
  }

  useEffect(() => {
    getAllUsers();
  }, []);

  const changeStatus = () => {
    axios
      .get("http://localhost:8080/changeStatus/?name=" + user.username)
      .then((res, err) => {
        console.log(res.data);
        setUser({ ...user, state: res.data.state });
      });
  };
  const sendPublicMessage = () => {
    console.log("here is name", user.sessionName);
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
    console.log("user is", user);
    stompClient.subscribe("/user/topic/public", onPublicMessageReceived, {
      name: user.username,
    });
  };
  const onError = (err) => {
    console.log(err);
  };
  const onPublicMessageReceived = (message) => {
    console.log("<<<<<<<<<<<<", user);
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
            {" "}
            <button onClick={showUserList}>Show User List</button>
            {isLoading && <h2>Loading...</h2>}
            {showTable ? (
              <div className="showTable">
                <table>
                  <tr>
                    <th>Name</th>
                  </tr>
                  {users.map((val, key) => {
                    return (
                      <tr key={key}>
                        <td>{val.username}</td>
                      </tr>
                    );
                  })}
                </table>
              </div>
            ) : (
              <div></div>
            )}
          </div>
          <div>
            {" "}
            <button onClick={changeStatus}>changeMystatus</button>
            {user.state === "DoNotDisturb" && (
              <h3> {user.username} is set as "Do not disturb"</h3>
            )}
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
