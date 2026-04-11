import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { signIn, parseIdToken } from '../utils/cognitoAuth';
export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/notes';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setError('');
    try {
      const tokens = await signIn(email, password);
      const userInfo = parseIdToken(tokens.idToken);
      await login({
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email
      });
      navigate(from, {
        replace: true
      });
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.');
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.5
        }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-teal-200 mx-auto mb-6 transform rotate-3">
            N
          </div>
          <h1 className="text-3xl font-serif text-slate-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-500">Sign in to continue to NotesApp</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                placeholder="hello@example.com"
                required />
              
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1 mr-1">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <a
                href="#"
                className="text-xs font-medium text-teal-600 hover:text-teal-500">
                
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                placeholder="••••••••"
                required />
              
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-2xl shadow-md shadow-teal-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-8">
            
            {isSubmitting ?
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :

            <>
                Sign In
                <ArrowRight size={20} />
              </>
            }
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-teal-600 hover:text-teal-500">
              
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>);

}