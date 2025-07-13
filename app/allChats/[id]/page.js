"use client"
import React, { useEffect, useState } from 'react'

import { useParams } from 'next/navigation';
import axios from 'axios';
const page = () => {
    const { id } = useParams();
    const [Chat, setChat] = useState()
    useEffect(() => {
        const storedChatIds = sessionStorage.getItem("allChatIds");
        const user = localStorage.getItem('userId');
        if (!storedChatIds) {
             axios.post('/api/userDetails', { id: user })
                .then(res => {

                    if (res.data.userDetail) {
                        

                        console.log("User details fetched successfully:", res.data.userDetail.chats);
                        const chatIds = res.data.userDetail.chats.map(chat => chat.id);
                        sessionStorage.setItem('allChatIds', JSON.stringify(chatIds));
                    } else {
                        console.error("User not found");
                        router.push('/auth/signup');
                    }
                })
                .catch(err => {
                    console.error("Error fetching user details:", err);
                    router.push('/auth/signup');
                });
        } else {
            const allChatIds = JSON.parse(storedChatIds);
            if (!allChatIds.includes(id)) {
                alert("You do not belong to this chat");
                return;
            }
                 axios.post('/api/messages/get-messages', { id })
                .then(res => {
                    console.log("Messages fetched successfully:", res.data);
                    setChat(res.data);
                })
                .catch(err => {
                    console.error("Error fetching messages:", err);
                });
        }}, [id]);
        console.log("Chat ID:", id);
      
  return (
    <div>
        <h1>{Chat&&(
            <>
            {Chat.title}
            <img src={Chat.image} alt="" />
            {Chat.messages.map((message, index) => (
                <div key={index}>
                    {message.type === 'image' &&(
                        <img src={`data:image/jpeg;base64,${message.content}`} alt="Chat Image" />
                    )
                     }
                    <p><strong>{message.type}:</strong> {message.content}</p>
                </div>
            ))}
            </>)}</h1>
    </div>
  )
}

export default page