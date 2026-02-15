
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
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
