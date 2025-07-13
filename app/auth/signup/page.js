"use client";
import React, { useState } from 'react'  // ...existing code...
import styles from './Signup.module.css'
import axios from 'axios'
import { useForm } from "react-hook-form";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Signup = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [authData, setauthData] = useState()
    const router = useRouter()
    const [Otp, setOtp] = useState()
    const [Success, setSuccess] = useState()
    const [Error, setError] = useState()
    const [Form, setForm] = useState(1)
    const [IsSubmitting, setIsSubmitting] = useState(false)
    const onSubmit = (data) => {
        setError(null)
        setSuccess(null)
        setIsSubmitting(true)
        axios.post("/api/auth/signup/EmailOtp", data)
            .then((response) => {

                setSuccess(response.data.message)
                setOtp(response.data.otp)
                setauthData(data)
                setIsSubmitting(false)
                setForm(2)

            })
            .catch((error) => {

                setError(error.response.data.error)
                setIsSubmitting(false)

            });
    };

    // changed code: use a single state for toggling the password visibility
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={styles.signupContainer}>
            <div className={styles.signupBox}>
                <h1>Create Account</h1>
                {Form === 1 &&
                    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Your name"
                            {...register("name", {
                                required: { value: true, message: "This field is required" },
                            })}
                        />
                        {errors.name && <div className={styles.error}>{errors.name.message}</div>}

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

                        <input
                            type={showPassword ? "text" : "password"}
                            className={styles.input}
                            placeholder="Confirm Password"
                            {...register("confirmPassword", {
                                required: { value: true, message: "This field is required" },
                                validate: (value) => value === watch("password") || "The passwords do not match",
                            })}
                        />
                        {errors.confirmPassword && <div className={styles.error}>{errors.confirmPassword.message}</div>}


                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)}
                            /> Show Password
                        </label>

                        {IsSubmitting ? <div className={styles.loader}></div> :
                            <input type="submit" className={styles.submitBtn} />}
                        {Success && <div className={styles.successBig}>{Success}</div>}
                        {Error && <div className={styles.errorBig}>{Error}</div>}

                    </form>
                }
                {Form === 2 &&
                    <form onSubmit={handleSubmit((data) => {
                        setError(null)
                        setSuccess(null)
                        setIsSubmitting(true)
                        const otp = data.otp
                        if (otp === Otp) {
                            axios.post("/api/auth/signup", authData)
                                .then((response) => {
                                    setSuccess(response.data.message)
                                    setIsSubmitting(false)
                                    const id = response.data.id
                                    localStorage.setItem('userId', id);
                                    router.push('/home')
                                })
                                .catch((error) => {
                                    setError(error.response.data.error)
                                    setIsSubmitting(false)
                                });
                        } else {
                            setError("Invalid OTP")
                            setIsSubmitting(false)
                        }
                    })} className={styles.form}>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Enter OTP"
                            {...register("otp", {
                                required: { value: true, message: "This field is required" },
                            })}
                        />
                        {errors.otp && <div className={styles.error}>{errors.otp.message}</div>}
                        {IsSubmitting ? <div className={styles.loader}></div> :
                            <input type="submit" className={styles.submitBtn} />}
                        {Success && <div className={styles.successBig}>{Success}</div>}
                        {Error && <div className={styles.errorBig}>{Error}</div>}
                    </form>
                }
                <div className=' text-gray-500 font-bold mt-2.5'>OR</div>

                <p className={styles.loginOption}>
                    Already have an account? <Link href="/auth/login">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default Signup