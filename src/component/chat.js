import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import axios from "axios";

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
  const online = "Online"
  const doNotDisturb = "DoNotDisturb"
  const BASE_URL = "http://localhost:8080/"
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState({ users: [] });
  const [showTable, setShowTable] = useState(false);
  const [err, setErr] = useState("");
  const [publicChats, setpublicChats] = useState([]);

  const register = (event) => {
    setUser({ ...user, username: event.target.value });
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
      .get(BASE_URL+"changeStatus/?name=" + user.username)
      .then((res, err) => {
        // console.log(res.data);
        setUser({ ...user, state: res.data.state });
      });
    let chatMessage = {
      senderName: user.username,
      message: "My status is "+ user.state,
      status: "MESSAGE",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
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
    if (user.state === online) {
      let messageData = JSON.parse(message.body);
      publicChats.push(messageData);
      setpublicChats([...publicChats]);
    }

    console.log(publicChats);
  };

  function sendMessageButton(disabled){
    return (
      <div>
      <input
        type="text"
        value={user.message}
        onChange={handleMessage} 
        disabled = {disabled}
      />
      <button onClick={sendPublicMessage} disabled={disabled}>Send</button>
    </div>)
  }
  return (
    <div>
      {user.connected ? (
        <div className="connected">
          <h1> User: { user.username.toUpperCase()}</h1> 
          {user.state === online && <h4> You are Online </h4>}
          {user.state === doNotDisturb && <h4> Do Not Disturb mode is ON</h4>}
          <div>
            {publicChats.map((chat) => (
              <li>
                {chat.senderName}:{chat.message}
              </li>
            ))}
            {user.state ===online && sendMessageButton(false)} 
            {user.state === doNotDisturb && sendMessageButton(true)}
          </div>
          <br />
          <div>
            {showTable && <button onClick={hideUserList}> Hide User List</button>}
            {!showTable && <button onClick={showUserList}>Show User List</button>}
            {isLoading && <h2>Loading...</h2>}
            {showTable && 
              <div className="showTable">
                <table>
                  <tbody>
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
                  </tbody>
                  
                </table> 
              </div>
            }
          </div>
          <br />
          <div>
            {user.state === online && <button onClick={changeStatus}>Set to Do Not Disturb</button>}
            {user.state === doNotDisturb && <button onClick={changeStatus}>Set me Online</button>}
          </div>
        </div>
      ) : (
        <div className="register">
          <input value={user.username} onChange={register} placeholder="Enter username"/>
          <button onClick={registerUser}>join</button>
        </div>
      )}
    </div>
  );
}
