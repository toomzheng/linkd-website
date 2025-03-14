'use client';

import React, { useState } from 'react';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    linkedin: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkRateLimit = () => {
    try {
      // Get stored submissions
      const storedSubmissions = localStorage.getItem('formSubmissions');
      let submissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];
      
      // Clean up old entries (older than 1 hour)
      const now = Date.now();
      const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
      submissions = submissions.filter((timestamp: number) => now - timestamp < RATE_LIMIT_WINDOW);
      
      // Check if user has exceeded limit
      const RATE_LIMIT = 1; // max submissions per hour
      if (submissions.length >= RATE_LIMIT) {
        const oldestSubmission = submissions[0];
        const resetTime = new Date(oldestSubmission + RATE_LIMIT_WINDOW);
        const minutesUntilReset = Math.ceil((resetTime.getTime() - now) / (60 * 1000));
        
        return {
          allowed: false,
          message: `You already signed up! Please try again in about ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}.`
        };
      }
      
      // Update submissions
      submissions.push(now);
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      
      return { allowed: true, message: '' };
    } catch (e) {
      console.error('Rate limit check error:', e);
      // If localStorage fails, still allow submission
      return { allowed: true, message: '' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('Submitting...');
    setMessageType('');
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      setMessage(rateLimitCheck.message || 'Rate limit reached. Please try again later.');
      setMessageType('error');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`Thanks! You've registered with ${formData.email}. We'll be in touch to launch at ${formData.school}.`);
        setMessageType('success');
        setFormData({
          name: '',
          email: '',
          school: '',
          linkedin: ''
        });
      } else {
        setMessage(result.error || 'Something went wrong. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to connect to server. Please try again later.');
      setMessageType('error');
      console.error('Form submission error:', error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="signup-section mt-[0.85rem] mb-[1.75rem]">
      <p className="font-medium"><b>Want this at your school?</b> Most signups is next and UCLA is in the lead.</p>
      <form className="signup-form flex flex-col gap-[5px] mt-[0.6rem]" onSubmit={handleSubmit}>
        <div className="form-row flex gap-[6px] sm:flex-row flex-col">
          <input 
            type="text" 
            id="name" 
            name="name" 
            placeholder="Full name" 
            required
            value={formData.name}
            onChange={handleChange}
            className="flex-1 p-[8px_9px] border border-black/40 rounded font-[var(--font-family)] text-[0.85rem] bg-white transition-colors focus:outline-none focus:border-[#0075ff] h-[23px] font-medium"
          />
          <input 
            type="email" 
            id="email" 
            name="email" 
            placeholder="School email (.edu preferred)" 
            required
            value={formData.email}
            onChange={handleChange}
            className="flex-1 p-[8px_9px] border border-black/40 rounded font-[var(--font-family)] text-[0.85rem] bg-white transition-colors focus:outline-none focus:border-[#0075ff] h-[23px] font-medium"
          />
        </div>
        <div className="form-row flex gap-[6px] sm:flex-row flex-col">
          <input 
            type="text" 
            id="school" 
            name="school" 
            placeholder="University/College name" 
            required
            value={formData.school}
            onChange={handleChange}
            className="flex-1 p-[8px_9px] border border-black/40 rounded font-[var(--font-family)] text-[0.85rem] bg-white transition-colors focus:outline-none focus:border-[#0075ff] h-[23px] font-medium"
          />
          <input 
            type="text" 
            id="linkedin" 
            name="linkedin" 
            placeholder="LinkedIn URL (optional)"
            value={formData.linkedin}
            onChange={handleChange}
            className="flex-1 p-[8px_9px] border border-black/40 rounded font-[var(--font-family)] text-[0.85rem] bg-white transition-colors focus:outline-none focus:border-[#0075ff] h-[23px] font-medium"
          />
        </div>
        <button 
          type="submit" 
          className="submit-button self-start mt-[2px] p-[3px_9px] bg-white text-[#1a1a1a] border-[1.5px] border-[#1a1a1a] rounded font-[var(--font-family)] text-[0.8rem] cursor-pointer transition-all hover:bg-black/5 font-semibold"
          disabled={isSubmitting}
        >
          Submit Request
        </button>
      </form>
      <p 
        className={`form-message mt-[0.4rem] text-[0.85rem] font-medium`}
        style={{
          color: messageType === 'success' ? '#15803d' : messageType === 'error' ? '#b91c1c' : 'inherit'
        }}
      >
        {message}
      </p>
    </div>
  );
};

export default SignupForm;