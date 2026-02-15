
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';

export const FirebaseLogin: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification State
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // App.tsx handles the redirect via onAuthStateChanged
      // Google accounts are emailVerified: true by default, so they pass the check in App.tsx
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled.");
      } else {
        setError("Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth); // Sign out immediately to enforce verification step
        
        setPendingEmail(email);
        setVerificationSent(true);
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check verification status
        if (!userCredential.user.emailVerified) {
             await signOut(auth); // Block access
             setPendingEmail(email);
             setVerificationSent(true);
        }
        // If verified, App.tsx handles the redirect via onAuthStateChanged
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      
      // Exact error messages as requested
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Email or password is incorrect");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("User already exists. Please sign in");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cannabis-900/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md bg-dark-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500 text-center">
            <div className="flex justify-center mb-6">
                 <div className="w-20 h-20 bg-cannabis-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <Mail className="w-10 h-10 text-cannabis-500" />
                 </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">Verify Your Email</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
                We have sent you a verification email to <span className="text-white font-bold">{pendingEmail}</span>.
                <br/><br/>
                Please verify it and log in to access the Billionaire Level.
            </p>

            <Button fullWidth size="lg" onClick={() => setVerificationSent(false)}>
                Back to Login
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
       {/* Background decoration */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cannabis-900/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-dark-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 flex items-center justify-center relative group">
            <Logo className="w-full h-full drop-shadow-2xl relative z-10" />
            <div className="absolute inset-0 bg-cannabis-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2">Billionaire Level</h1>
        <p className="text-center text-gray-400 mb-8 text-sm">
          {isSignUp ? "Create your exclusive account." : "Sign in to access the platform."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Email Address</label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vip@example.com"
                    className="w-full bg-dark-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-cannabis-500 focus:ring-1 focus:ring-cannabis-500 outline-none transition-all placeholder:text-gray-600"
                />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-dark-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-cannabis-500 focus:ring-1 focus:ring-cannabis-500 outline-none transition-all placeholder:text-gray-600"
                />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex flex-col gap-1 text-red-400 text-sm">
                <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> Error
                </div>
                <div>{error}</div>
            </div>
          )}

          <Button fullWidth size="lg" type="submit" disabled={loading} className="mt-2">
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </Button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="px-3 bg-dark-900 text-gray-500">Or continue with</span>
            </div>
        </div>

        <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 text-dark-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
        </button>

        <div className="mt-6 text-center">
            <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-sm text-gray-500 hover:text-white transition-colors"
            >
                {isSignUp ? "Already a member? " : "New here? "}
                <span className="text-cannabis-400 font-bold">{isSignUp ? "Login" : "Sign Up"}</span>
            </button>
        </div>
      </div>

      <div className="mt-8 text-gray-600 text-xs z-10 flex items-center gap-2">
        <ShieldCheck className="w-3 h-3" /> Secured by Firebase Auth
      </div>
    </div>
  );
};
