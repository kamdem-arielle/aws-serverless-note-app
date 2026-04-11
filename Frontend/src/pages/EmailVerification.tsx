import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { confirmRegistration, resendConfirmationCode } from '../utils/cognitoAuth';
export function EmailVerification() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';
  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      // Focus next empty input or last input
      const nextEmptyIndex = newCode.findIndex((c) => c === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
      return;
    }
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    // Move to next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (
  index: number,
  e: React.KeyboardEvent<HTMLInputElement>) =>
  {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    setIsVerifying(true);
    setError('');
    try {
      await confirmRegistration(email, fullCode);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/signin');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setIsVerifying(false);
    }
  };
  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (code.every((digit) => digit !== '') && !isVerifying && !isSuccess) {
      handleVerify();
    }
  }, [code]);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 text-center">
        
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
          {isSuccess ?
          <motion.div
            initial={{
              scale: 0
            }}
            animate={{
              scale: 1
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}>
            
              <CheckCircle2 size={40} className="text-teal-500" />
            </motion.div> :

          <MailOpen size={40} className="text-teal-500" />
          }
        </div>

        <h1 className="text-2xl font-serif text-slate-800 mb-2">
          {isSuccess ? 'Email Verified!' : 'Check your email'}
        </h1>
        <p className="text-slate-500 mb-8">
          {isSuccess ?
          'Preparing your workspace...' :

          <>
              We've sent a 6-digit verification code to{' '}
              <span className="font-medium text-slate-800">{email}</span>
            </>
          }
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {!isSuccess &&
        <>
            <div className="flex justify-center gap-2 sm:gap-3 mb-8">
              {code.map((digit, index) =>
            <input
              key={index}
              ref={(el) => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
              disabled={isVerifying} />

            )}
            </div>

            <button
            onClick={handleVerify}
            disabled={isVerifying || code.some((d) => d === '')}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-2xl shadow-md shadow-teal-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100">
            
              {isVerifying ?
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :

            <>
                  Verify Email
                  <ArrowRight size={20} />
                </>
            }
            </button>

            <p className="mt-6 text-sm text-slate-500">
              Didn't receive the code?{' '}
              <button
                onClick={async () => {
                  try {
                    setError('');
                    await resendConfirmationCode(email);
                  } catch (err: any) {
                    setError(err.message || 'Failed to resend code.');
                  }
                }}
                className="font-semibold text-teal-600 hover:text-teal-500">
                Resend
              </button>
            </p>
          </>
        }
      </motion.div>
    </div>);

}