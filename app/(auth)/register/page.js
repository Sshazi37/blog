'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
// After registering we immediately sign the user in
// so they don't have to log in manually right after registering

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  // watch('password') watches the live value of the password field
  // so we can compare it against the confirm password field
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    // Step 1 — Call our register API to create the user
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      // API returned an error (duplicate email, validation etc)
      setError(result.error)
      setLoading(false)
      return
    }

    // Step 2 — Auto login after successful registration
    // User just created their account, no need to make them login again
    const loginResult = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (loginResult?.error) {
      // Registration worked but login failed — rare, send to login page
      router.push('/login')
      return
    }

    // New subscribers go to reader dashboard
    router.push('/reader')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Join to track your reading progress
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
              className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 ${
                errors.name ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Shahzaib"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  // validate is a custom validation function
                  // it receives the field value and must return
                  // true (pass) or an error message string (fail)
                  value === password || 'Passwords do not match',
              })}
              className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}