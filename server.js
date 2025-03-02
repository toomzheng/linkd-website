require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const app = express();
let PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : 3001;

// Initialize Supabase on server side for handling duplicates
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Resend email client
const resend = new Resend(process.env.RESEND_API_KEY);

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
  const { email, name, school, linkedin } = req.body;

  // Validate input
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check for existing emails with the same base part (before any pipe character)
    const baseEmail = email.split('|')[0]; // Get the base email part
    
    // Use Promise.race to apply a timeout to the database operation
    const result = await Promise.race([
      supabase.from('waitlist').select('*').eq('email', baseEmail),
      timeoutPromise(5000, 'Database query timed out')
    ]);

    let emailToInsert = email;
    let modified = false;

    // If there's an existing entry with the same base email, add a unique suffix
    if (result.data && result.data.length > 0) {
      // Get all emails that start with this base email to determine the next number
      const similarEmailsResult = await Promise.race([
        supabase.from('waitlist').select('email').like('email', `${baseEmail}|%`),
        timeoutPromise(5000, 'Similar emails query timed out')
      ]);
      
      let maxNum = 0;
      if (similarEmailsResult.data && similarEmailsResult.data.length > 0) {
        // Find the highest number suffix used so far
        similarEmailsResult.data.forEach(entry => {
          const parts = entry.email.split('|');
          if (parts.length > 1) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
      }
      
      // Use the next number in sequence
      emailToInsert = `${baseEmail}|${maxNum + 1}`;
      modified = true;
    }

    // Insert the email (either original or with suffix)
    const insertResult = await Promise.race([
      supabase.from('waitlist').insert([{ 
        email: emailToInsert, 
        name, 
        school, 
        created_at: new Date() 
      }]),
      timeoutPromise(5000, 'Database insert timed out')
    ]);

    // If there was an error with the insert
    if (insertResult.error) {
      console.error('Database error:', insertResult.error);
      return res.status(500).json({ error: 'Failed to register email' });
    }

    // Send confirmation email via Resend
    try {
      const userName = name || 'there';
      const userEmail = baseEmail; // Use the original email without any suffix
      const schoolName = school || 'your school';
      
      // Create HTML email content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Linkd Waitlist</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.5;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .header {
              margin-bottom: 25px;
              text-align: center;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
              text-align: center;
              padding-top: 15px;
              border-top: 1px solid #eeeeee;
            }
            h1 {
              color: #000;
              font-size: 24px;
              margin-bottom: 15px;
            }
            p {
              margin-bottom: 15px;
            }
            .highlight {
              color: #FF6601;
              font-weight: bold;
            }
            .button {
              display: inline-block;
              background-color: #FF6601;
              color: white;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 5px;
              font-weight: bold;
              margin: 15px 0;
            }
            .schools {
              text-align: center;
              margin: 20px 0;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 5px;
            }
            .schools a {
              color: #FF6601;
              text-decoration: none;
              padding: 0 8px;
            }
            .schools a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to <span class="highlight">Linkd</span>!</h1>
            </div>
            
            <p>Hi ${userName},</p>
            
            <p>Thank you for joining the Linkd waitlist! We're excited to have you on board.</p>
            
            <p>We've registered your interest in bringing Linkd to <strong>${schoolName}</strong>. We'll keep you updated on our progress and let you know as soon as we're ready to launch at your school.</p>
            
            <p>In the meantime, feel free to check out our existing school communities:</p>
            
            <div class="schools">
              <a href="https://upenn-frontend-production.up.railway.app/">UPenn</a> | 
              <a href="https://utoronto.uselinkd.com/">UToronto</a> | 
              <a href="https://stanford.uselinkd.com/">Stanford</a> | 
              <a href="https://columbia.uselinkd.com/">Columbia</a> | 
              <a href="https://yale.uselinkd.com/">Yale</a>
            </div>
            
            <p>If you have any questions or feedback, please don't hesitate to reach out to us at <a href="mailto:founders@linkd.inc">founders@linkd.inc</a>.</p>
            
            <p>Best regards,<br>Eric & Tom<br>Linkd Team</p>
            
            <div class="footer">
              <p>This email was sent to ${userEmail} because you signed up for the Linkd waitlist.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const emailData = await resend.emails.send({
        from: 'Linkd Waitlist <founders@waitlist.linkd.inc>',
        to: userEmail,
        subject: `Welcome to Linkd's Waitlist, ${userName}!`,
        html: emailHtml,
      });
      
      console.log('Confirmation email sent:', emailData.id);
    } catch (emailError) {
      // Don't fail the registration if email sending fails
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(200).json({ 
      success: true,
      modified,
      email: emailToInsert
    });
  } catch (error) {
    console.error('Waitlist API error:', error);
    res.status(500).json({ error: 'Server error processing request', details: error.message });
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
  
  // Check Resend connection
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Resend API key is not configured');
    }

    // We don't need to send an actual email, just check if Resend is initialized properly
    console.log('✅ Resend API configured successfully');
    results.push({ service: 'resend', status: 'ok' });
  } catch (error) {
    console.error('❌ Resend configuration error:', error.message);
    results.push({ service: 'resend', status: 'error', message: error.message });
  }
  
  return results;
};

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

// Add test endpoint to test email functionality
app.post('/api/test/send-email', async (req, res) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is not available in production' });
  }
  
  const { email, name, school } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required for testing' });
  }
  
  try {
    console.log('TEST: Attempting to send test email to', email);
    
    const userName = name || 'Test User';
    const schoolName = school || 'Test University';
    
    // Create test email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email from Linkd</title>
        <style>
          body { font-family: sans-serif; }
          .test-banner { 
            background-color: #ffeb3b; 
            padding: 10px; 
            text-align: center;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="test-banner">TEST EMAIL - PLEASE IGNORE</div>
        <p>Hello ${userName},</p>
        <p>This is a test email from Linkd for ${schoolName}.</p>
        <p>If you're seeing this, the email functionality is working correctly!</p>
        <p>Test completed at: ${new Date().toISOString()}</p>
      </body>
      </html>
    `;
    
    const emailData = await resend.emails.send({
      from: 'Linkd Test <founders@waitlist.linkd.inc>',
      to: email,
      subject: `Linkd Test Email`,
      html: emailHtml,
    });
    
    console.log('TEST: Email sent successfully with ID:', emailData.id);
    res.json({ 
      success: true, 
      message: 'Test email sent',
      emailId: emailData.id
    });
  } catch (error) {
    console.error('TEST: Email sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      message: error.message 
    });
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
const startServer = (port = PORT) => {
  // Use the provided port or fall back to the global PORT
  const serverPort = port;
  
  const server = app.listen(serverPort, () => {
    console.log(`Server running on port ${serverPort}`);
    // Update the global PORT to match what we're actually using
    PORT = serverPort;
    
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
      console.error(`Port ${serverPort} is already in use. Trying to recover...`);
      // Railway assigns PORT, so we shouldn't try different ports in production
      if (process.env.NODE_ENV !== 'production') {
        setTimeout(() => {
          server.close();
          // In development, if 3001 is taken, try 3002, 3003, etc.
          const nextPort = serverPort + 1;
          console.log(`Development mode: Attempting to use port ${nextPort} instead...`);
          startServer(nextPort);
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
console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);
startServer(); 