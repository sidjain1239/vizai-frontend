"use client";
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import axios from 'axios';


const AllChats = () => {
    const router = useRouter()
    const [userDetails, setUserDetails] = useState()
    const [Chats, setChats] = useState()

    useEffect(() => {
        const user = localStorage.getItem('userId');
        console.log("User ID from localStorage:", user);

        if (user) {
            axios.post('/api/userDetails', { id: user })
                .then(res => {

                    if (res.data.userDetail) {
                        setUserDetails(res.data.userDetail);

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
            router.push('/auth/signup');
        }
    }, [router]);
    return (
        <>
        <div>AllChats</div>
        {userDetails && userDetails.chats.length > 0 && (
            <div>
                {userDetails.chats.map((chat, index) => (
                    <div key={index} onClick={() => router.push(`/allChats/${chat.id}`)}>
                        <h3>{chat.title}</h3>
                       
                    </div>
                ))}
            </div>
        ) }
        </>
    )
}

export default AllChats
