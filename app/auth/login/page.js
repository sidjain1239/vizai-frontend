"use client"
import React, { useState } from 'react'
import styles from './Login.module.css'

import axios from 'axios'
import { useForm } from "react-hook-form";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [Success, setSuccess] = useState()
  const [Error, setError] = useState()
  const router = useRouter()
  const [IsSubmitting, setIsSubmitting] = useState(false)
  const onSubmit = (data) => {
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    axios.post("/api/auth/login", data)
      .then((response) => {
        setSuccess(response.data.message)
        setIsSubmitting(false)
        const id=response.data.user._id
        localStorage.setItem('userId', id);
        router.push('/home')
      })
      .catch((error) => {
        setError(error.response.data.error)
        setIsSubmitting(false)
  });}
      return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <h1>Login</h1>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                 
                    <input
                        type="email"
                        className={styles.input}
                        placeholder="Your email"
                        {...register("email", {
                            required: { value: true, message: "This field is required" },
                        })}
                    />
                    {errors.email && <div className={styles.error}>{errors.email.message}</div>}

                        <input
                            type={showPassword ? "text" : "password"}
                            className={styles.input}
                            placeholder="Enter Password"
                            {...register("password", {
                                required: { value: true, message: "This field is required" },
                                minLength: { value: 8, message: "Minimum 8 characters are required" },
                            })}
                        />
                    {errors.password && <div className={styles.error}>{errors.password.message}</div>}

                   
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)}
                            /> Show Password
                        </label>


                        {IsSubmitting ? <div className={styles.loader}></div>:
                    <input type="submit" className={styles.submitBtn} />}
                    {Success && <div className={styles.successBig}>{Success}</div>}
                    {Error && <div className={styles.errorBig}>{Error}</div>}
                    
                </form>
<div className=' text-gray-500 font-bold mt-2.5'>OR</div>

                <p className={styles.signupOption}>
                  Not having an account? <Link href="/auth/signup">Create Account</Link>
                </p>
            </div>
        </div>
    )
}

export default Login