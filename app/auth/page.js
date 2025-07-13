"use client"
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Page = () => {
    const router = useRouter()

    useEffect(() => {
        const user = localStorage.getItem('userId')
        if (user) {
            router.push('/home')
        } else {
            router.push('/auth/signup')
        }
    }, [router])

    return (
        <div>Authentification Page</div>
    )
}

export default Page