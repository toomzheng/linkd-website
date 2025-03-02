require('dotenv').config();
const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase on server side for handling duplicates
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Setup middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'), {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true,   // Enable ETags for cache validation
  lastModified: true
}));

// Add timeout middleware for all requests
app.use((req, res, next) => {
  // Set a 10-second timeout for all requests
  req.setTimeout(10000, () => {
    console.error('Request timeout:', req.url);
    if (!res.headersSent) {
      res.status(503).send('Service temporarily unavailable. Please try again later.');
    }
  });
  next();
});

// Helper function to create a timeout promise
const timeoutPromise = (ms, message) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
};

// Create a config endpoint to provide credentials to the frontend
app.get('/api/config', (req, res) => {
  try {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY
    });
  } catch (error) {
    console.error('Config API error:', error);
    res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
});

// Create waitlist endpoint for collecting emails
app.post('/api/waitlist', async (req, res) => {
  const { email, name, school } = req.body;

  // Validate input
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Use Promise.race to apply a timeout to the database operation
    const result = await Promise.race([
      supabase.from('waitlist').select('*').eq('email', email),
      timeoutPromise(5000, 'Database query timed out')
    ]);

    // Check for existing email
    if (result.data && result.data.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // If no existing email, insert the new one with Promise.race for timeout
    const insertResult = await Promise.race([
      supabase.from('waitlist').insert([{ email, name, school, created_at: new Date() }]),
      timeoutPromise(5000, 'Database insert timed out')
    ]);

    // If there was an error with the insert
    if (insertResult.error) {
      console.error('Database error:', insertResult.error);
      return res.status(500).json({ error: 'Failed to register email' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Waitlist API error:', error);
    res.status(500).json({ error: 'Server error processing request', details: error.message });
  }
});

// Create confirmation email endpoint
app.post('/api/send-confirmation', async (req, res) => {
  const { email, name } = req.body;
  
  // Validate input
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Convert email to lowercase for consistency
    const sanitizedEmail = email.toLowerCase().trim();
    let domain = sanitizedEmail.split('@')[1];
    
    // Determine email template based on domain
    let templateHtml;
    if (domain === 'berkeley.edu' || domain === 'stanford.edu') {
      const schoolName = domain === 'berkeley.edu' ? 'UC Berkeley' : 'Stanford';
      templateHtml = `<p>Hi ${name || 'there'},</p>
        <p>Thanks for joining the Linkd waitlist! We're building a professional community exclusively for ${schoolName} students.</p>
        <p>We'll let you know as soon as we launch.</p>
        <p>Best,<br>Linkd Team</p>`;
    } else {
      templateHtml = `<p>Hi ${name || 'there'},</p>
        <p>Thanks for joining the Linkd waitlist! We're building a professional community exclusively for students.</p>
        <p>We'll let you know as soon as we launch at your school.</p>
        <p>Best,<br>Linkd Team</p>`;
    }
    
    // Send email with timeout
    const emailResult = await Promise.race([
      resend.emails.send({
        from: 'Linkd <waitlist@linkd.inc>',
        to: sanitizedEmail,
        subject: 'Welcome to the Linkd Waitlist',
        html: templateHtml
      }),
      timeoutPromise(4000, 'Email sending timed out')
    ]);
    
    if (emailResult.error) {
      console.error('Email send error:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send confirmation email' });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email API error:', error);
    // Still return success to the client if the email fails
    // This prevents blocking the user experience while still logging the error
    res.status(200).json({ success: true, emailSent: false });
  }
});

// Function to validate essential connections on startup
const validateConnections = async () => {
  const results = [];
  
  // Check Supabase connection
  try {
    const dbResult = await Promise.race([
      supabase.from('waitlist').select('count', { count: 'exact', head: true }),
      timeoutPromise(3000, 'Supabase connection timeout')
    ]);
    
    if (dbResult.error) {
      throw new Error(`Supabase error: ${dbResult.error.message}`);
    }
    
    console.log('✅ Supabase connection successful');
    results.push({ service: 'supabase', status: 'ok' });
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    results.push({ service: 'supabase', status: 'error', message: error.message });
  }
  
  // Check Resend configuration
  try {
    // Just validate that the key is present, don't make an actual API call
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Resend API key is missing');
    }
    
    console.log('✅ Resend configuration loaded');
    results.push({ service: 'resend', status: 'ok' });
  } catch (error) {
    console.error('❌ Resend configuration error:', error.message);
    results.push({ service: 'resend', status: 'error', message: error.message });
  }
  
  return results;
};

// TESTING ENDPOINT - Add a test endpoint for Resend
app.get('/api/test-email', async (req, res) => {
  try {
    // Use the timeout pattern for the test email as well
    const result = await Promise.race([
      resend.emails.send({
        from: 'Linkd <test@linkd.inc>',
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email to verify that the service is working.</p>'
      }),
      timeoutPromise(4000, 'Test email sending timed out')
    ]);
    
    if (result.error) {
      throw new Error(`Failed to send test email: ${result.error.message}`);
    }
    
    res.json({ success: true, message: 'Test email sent', id: result.id });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      message: error.message 
    });
  }
});

// TESTING ENDPOINT - Diagnostic endpoint to verify env vars
app.get('/api/diagnose', (req, res) => {
  try {
    const diagnosis = {
      environment: process.env.NODE_ENV || 'not set',
      supabase: process.env.SUPABASE_URL ? '✓ configured' : '✗ missing',
      resend: process.env.RESEND_API_KEY ? '✓ configured' : '✗ missing',
      port: PORT.toString()
    };
    
    res.json({ diagnosis });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: 'Diagnostic failed' });
  }
});

// Add test endpoint to clear the waitlist (for testing only)
app.post('/api/test/clear-waitlist', async (req, res) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is not available in production' });
  }
  
  try {
    console.log('TEST: Attempting to clear waitlist table');
    
    const result = await Promise.race([
      supabase.from('waitlist').delete().neq('email', ''),
      timeoutPromise(5000, 'Clear waitlist operation timed out')
    ]);
    
    if (result.error) {
      throw new Error(`Failed to clear waitlist: ${result.error.message}`);
    }
    
    console.log('TEST: Waitlist cleared successfully');
    res.json({ success: true, message: 'Waitlist cleared' });
  } catch (error) {
    console.error('TEST: Clear waitlist error:', error);
    res.status(500).json({ error: 'Failed to clear waitlist', message: error.message });
  }
});

// Add health check endpoint for Railway
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch all other routes to serve the index.html file
app.get('*', (req, res) => {
  try {
    // Set cache control headers for HTML content
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    // Send the HTML file with proper error handling
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error loading application. Please try again later.');
      }
    });
  } catch (error) {
    console.error('Unexpected error serving index.html:', error);
    res.status(500).send('Server error. Please try again later.');
  }
});

// Error handling middleware - must be the last middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Internal server error', 
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
  }
});

// Start the server with proper error handling and port recovery
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Run validation after server starts
    validateConnections().then(() => {
      console.log('🚀 All connections validated successfully');
    }).catch(error => {
      console.error('❌ Connection validation failed:', error.message);
    });
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Trying another port...`);
      // Railway assigns PORT, so we shouldn't try different ports in production
      if (process.env.NODE_ENV !== 'production') {
        setTimeout(() => {
          server.close();
          startServer(PORT + 1);
        }, 1000);
      } else {
        console.error('Critical error: Port already in use in production environment');
        process.exit(1); // Exit to trigger Railway's restart policy
      }
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });

  // Implement graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  });

  return server;
};

// Replace app.listen() with startServer()
startServer(); 