'use client'
// This must be a client component because we use hooks, 
// form state, and browser events

import { useState } from 'react'
import { signIn } from 'next-auth/react'
// signIn is NextAuth's built-in function — handles the whole 
// login process including setting the session cookie

import { useRouter } from 'next/navigation'
// useRouter lets us redirect programmatically after login

import Link from 'next/link'
import { useForm } from 'react-hook-form'
// useForm manages our form state, validation, and errors
// so we don't need useState for each input field

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // register — connects an input to react-hook-form
  // handleSubmit — wraps our submit function with validation
  // formState.errors — contains validation errors per field
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    // data contains { email, password } from the form
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      // 'credentials' matches the provider name in lib/auth.js
      email: data.email,
      password: data.password,
      redirect: false,
      // redirect: false means NextAuth won't auto-redirect
      // we want to handle the redirect ourselves based on role
    })

    setLoading(false)

    if (result?.error) {
      // result.error contains the message from throw new Error() 
      // in our authorize() function
      setError(result.error)
      return
    }

    // Login succeeded — fetch the session to get the role
    // then redirect to the right place
    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()

    if (session?.user?.role === 'subscriber') {
      router.push('/reader')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Show error from NextAuth authorize() */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              // register connects this input to react-hook-form
              // the string 'email' is the field name
              // the object is validation rules
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
              className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 ${
                errors.email ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="you@example.com"
            />
            {/* Show validation error if exists */}
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 ${
                errors.password ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {/* Show loading state while waiting for NextAuth */}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-gray-900 font-medium hover:underline">
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}