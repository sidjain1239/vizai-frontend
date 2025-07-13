"use client"
import React from 'react'
import styles from './page.module.css'
import Link from 'next/link'
const Page = () => {
  return (
    <div>
      <Link href="/auth" className={styles.link}>
        <h1 className={styles.title}>login</h1>
      </Link>
      <h1>Get srated</h1>
    </div>
  )
}

export default Page