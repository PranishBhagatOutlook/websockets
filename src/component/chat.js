import React, { useState,use} from "react";
import SockJS from 'sockjs-client';
import {over} from 'stompjs';
import axios from 'axios';
var stompClient = null;
export default function ChatRoom() {

    const[user,setUser]= useState({
        "username":"",
        "sendername":"",
        "connected":false,
        "message":"",
        "sessionName":"",
        "state":""

    })
    const[publicChats,setpublicChats]= useState([])

    const register=(event)=>{
        const {value} = event.target
        setUser({...user,"username":value})
    }

    const handleMessage=(event)=>{
        const {value} = event.target
        setUser({...user,"message":value})
    }


    const registerUser=()=>{
        let Sock = new SockJS("http://localhost:8080/myws");
        stompClient = over(Sock);
        stompClient.connect({"username":user.username},onConnected,onError);
    }
    const getAllList=()=>{
        axios.get("http://localhost:8080/getAllUser").then((res,err)=>{
          console.log(res.data)
        })
    }
    const changeStatus=()=>{
        axios.get("http://localhost:8080/changeStatus/?name="+user.username).then((res,err)=>{
            console.log(res.data)
            setUser({...user,"state":res.data.state})
        })
    }
    const sendPublicMessage =()=>{
        console.log("here is name",user.sessionName)
        if(stompClient){
            let chatMessage={
                senderName:user.username,
                message:user.message,
                status:'MESSAGE'
            }
            stompClient.send('/app/message',{},JSON.stringify(chatMessage));
            setUser({...user,"message":""})
        }

    }
    const onConnected=(message)=>{
        user.state="Online"
        setUser({...user,"connected": true,"sessionName":message.headers["user-name"]})
        console.log("user is",user)
        stompClient.subscribe('/user/topic/public',onPublicMessageReceived,{"name":user.username})

    }
    const onError=(err)=>{
        console.log(err)
    }
    const onPublicMessageReceived =(message)=>{
        console.log("<<<<<<<<<<<<",user)
        if(user.state==="Online"){
            let messageData = JSON.parse(message.body)
            publicChats.push(messageData);
            setpublicChats([...publicChats])
        }

        console.log(publicChats)

    }
    // return(
    //     <div>
    //         {user.connected?
    //         <div className="connected">
    //             <h1>Welcome to chatroom</h1>
    //             {user.state==="Online"?
    //                 <div>
    //             {publicChats.map((chat)=>(
    //                 <li>{chat.senderName}:{chat.message}</li>
    //             ))}
    //                     <div>
    //                         <input type="text" value={user.message} onChange={handleMessage}/>
    //                         <button onClick={sendPublicMessage}>send</button>
    //                     </div>
    //                 </div>
    //
    //                 :
    //                 <div> I am offline</div>}
    //             <div> <button onClick={getAllList}>getUser</button></div>
    //             <div> <button onClick={changeStatus}>changeMystatus</button></div>
    //         </div>
    //         :
    //         <div className="register">
    //         <input value={user.username} onChange={register}/>
    //             <button onClick={registerUser}>join</button>
    //         </div>}
    //     </div>
    // )
    return(
        <div>
            {user.connected?
                <div className="connected">
                    <h1>Welcome to chatroom</h1>

                        <div>
                            {publicChats.map((chat)=>(
                                <li>{chat.senderName}:{chat.message}</li>
                            ))}
                            <div>
                                <input type="text" value={user.message} onChange={handleMessage}/>
                                <button onClick={sendPublicMessage}>send</button>
                            </div>
                        </div>


                    <div> <button onClick={getAllList}>getUser</button></div>
                    <div> <button onClick={changeStatus}>changeMystatus</button></div>
                </div>
                :
                <div className="register">
                    <input value={user.username} onChange={register}/>
                    <button onClick={registerUser}>join</button>
                </div>}
        </div>
    )
}