'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Eye, EyeOff, X, AlertCircle, Loader2 } from 'lucide-react'

type ValidationError = {
  field: string
  message: string
}

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    acceptTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Calculate password strength
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength('weak')
      return
    }

    let strength = 0
    if (formData.password.length >= 8) strength++
    if (formData.password.length >= 12) strength++
    if (/[a-z]/.test(formData.password)) strength++
    if (/[A-Z]/.test(formData.password)) strength++
    if (/[0-9]/.test(formData.password)) strength++
    if (/[^a-zA-Z0-9]/.test(formData.password)) strength++

    if (strength <= 2) setPasswordStrength('weak')
    else if (strength <= 3) setPasswordStrength('fair')
    else if (strength <= 4) setPasswordStrength('good')
    else setPasswordStrength('strong')
  }, [formData.password])

  // Real-time validation
  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 100) return 'Name is too long'
        return null
      case 'email':
        if (!value.trim()) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address'
        return null
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter'
        if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter'
        if (!/[0-9]/.test(value)) return 'Password must contain a number'
        return null
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== formData.password) return 'Passwords do not match'
        return null
      case 'companyName':
        if (value.trim().length > 100) return 'Company name is too long'
        return null
      default:
        return null
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = formData[field as keyof typeof formData] as string
    const error = validateField(field, value)
    if (error) {
      setErrors((prev) => {
        const filtered = prev.filter((e) => e.field !== field)
        return [...filtered, { field, message: error }]
      })
    } else {
      setErrors((prev) => prev.filter((e) => e.field !== field))
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (touched[field]) {
      const error = validateField(field, typeof value === 'string' ? value : '')
      if (error) {
        setErrors((prev) => {
          const filtered = prev.filter((e) => e.field !== field)
          return [...filtered, { field, message: error }]
        })
      } else {
        setErrors((prev) => prev.filter((e) => e.field !== field))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = []
    
    // Validate all fields
    Object.keys(formData).forEach((key) => {
      if (key === 'acceptTerms') return
      const value = formData[key as keyof typeof formData] as string
      const error = validateField(key, value)
      if (error) {
        newErrors.push({ field: key, message: error })
      }
    })

    // Check terms acceptance
    if (!formData.acceptTerms) {
      newErrors.push({ field: 'acceptTerms', message: 'You must accept the terms and conditions' })
    }

    // Check password match
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
    }

    setErrors(newErrors)
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      companyName: true,
      acceptTerms: true,
    })

    return newErrors.length === 0
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500'
      case 'fair': return 'bg-orange-500'
      case 'good': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
    }
  }

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return 'Weak'
      case 'fair': return 'Fair'
      case 'good': return 'Good'
      case 'strong': return 'Strong'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccess(false)
    setEmailSent(false)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            company_name: formData.companyName.trim() || undefined,
          },
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/login`
              : undefined,
        },
      })

      if (signUpError) {
        // Handle specific Supabase errors
        let errorMessage = signUpError.message
        
        if (signUpError.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (signUpError.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.'
        } else if (signUpError.message.includes('Password')) {
          errorMessage = 'Password does not meet requirements.'
        }

        setErrors([{ field: 'email', message: errorMessage }])
        setLoading(false)
        return
      }

      // Success - check if email confirmation is required
      if (!data.session) {
        // Email confirmation required
        setEmailSent(true)
        setSuccess(true)
        setLoading(false)
        
        // Auto-redirect after showing success message
        setTimeout(() => {
          router.push('/auth/login?message=Please check your email to confirm your account')
        }, 3000)
        return
      }

      // Session created immediately (email confirmation disabled)
      try {
        await fetch('/api/auth/ensure-profile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        })
      } catch (err) {
        console.error('Failed to ensure user profile after signup:', err)
      }

      setSuccess(true)
      setLoading(false)
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: any) {
      setErrors([{ field: 'email', message: err.message || 'An unexpected error occurred. Please try again.' }])
      setLoading(false)
    }
  }

  const getFieldError = (field: string): string | null => {
    return errors.find((e) => e.field === field)?.message || null
  }

  const hasError = (field: string): boolean => {
    return touched[field] && !!getFieldError(field)
  }

  if (success && emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/95 shadow-2xl shadow-primary/10 p-8 space-y-6 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-green-500/20 text-green-500 h-16 w-16 mx-auto">
            <Check className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation link to <strong>{formData.email}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Click the link in the email to activate your account. You'll be redirected to sign in shortly.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Go to sign in
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/95 shadow-2xl shadow-primary/10 p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-amber-400 text-black h-11 w-11 shadow-soft mb-2">
            <span className="text-lg font-extrabold">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your AwareHub account</h1>
          <p className="text-sm text-muted-foreground">
            Start designing and launching internal awareness campaigns.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="fullName"
                type="text"
                placeholder="Jordan Lee"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                className={hasError('fullName') ? 'border-destructive focus-visible:ring-destructive' : ''}
                autoComplete="name"
                disabled={loading}
              />
              {touched.fullName && !hasError('fullName') && formData.fullName && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {hasError('fullName') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('fullName')}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Work email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={hasError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
                disabled={loading}
              />
              {touched.email && !hasError('email') && formData.email && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {hasError('email') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('email')}
              </p>
            )}
          </div>

          {/* Company Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium">
              Company name <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Acme Corporation"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              onBlur={() => handleBlur('companyName')}
              className={hasError('companyName') ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={loading}
            />
            {hasError('companyName') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('companyName')}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={hasError('password') ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password strength:</span>
                  <span className={`font-medium ${
                    passwordStrength === 'weak' ? 'text-red-500' :
                    passwordStrength === 'fair' ? 'text-orange-500' :
                    passwordStrength === 'good' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{
                      width: passwordStrength === 'weak' ? '25%' :
                             passwordStrength === 'fair' ? '50%' :
                             passwordStrength === 'good' ? '75%' : '100%'
                    }}
                  />
                </div>
              </div>
            )}
            {hasError('password') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('password')}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, and a number
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={hasError('confirmPassword') ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {touched.confirmPassword && !hasError('confirmPassword') && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <Check className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {hasError('confirmPassword') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('confirmPassword')}
              </p>
            )}
          </div>

          {/* Terms Acceptance */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                disabled={loading}
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </Link>
                <span className="text-destructive">*</span>
              </span>
            </label>
            {hasError('acceptTerms') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('acceptTerms')}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <div className="text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
