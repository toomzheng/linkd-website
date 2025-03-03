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
      const firstName = name ? name.split(' ')[0] : 'there';
      const userEmail = baseEmail; // Use the original email without any suffix
      const schoolName = school || 'your school';
      
      // Create HTML email content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thanks for your interest in Linkd</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
              color: #1a1a1a;
              line-height: 1.5;
            }
            .container {
              padding: 1.5rem;
              margin: 0; /* Remove auto margins */
            }
            h2 {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              font-weight: 600;
              font-size: 1.8rem;
              margin: 0 0 0.4rem 0;
              color: #000;
              text-align: left;
            }
            p {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0.66rem 0;
              font-size: 1rem;
              text-align: left;
              color: #1a1a1a; /* Change to black instead of purple */
            }
            a {
              color: #0075ff;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            .signature {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin-top: 1.5rem;
              margin-bottom: 0.5rem;
              text-align: left;
              color: #1a1a1a; /* Change to black instead of purple */
            }
            .schools-list {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              text-align: left;
              margin: 0.85rem 0;
              padding: 0;
              color: #1a1a1a; /* Change to black instead of purple */
            }
            .footer-text {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              font-size: 0.8rem; 
              color: #666;
              margin-top: 1.5rem;
              border-top: 1px solid #eee;
              padding-top: 1rem;
            }
            /* School colors */
            .school-upenn {
              background: linear-gradient(to right, #990000 50%, #011F5B 50%);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent !important;
              font-weight: 600;
              text-decoration-color: #990000;
            }
            .school-upenn u {
              text-decoration: underline;
              text-decoration-color: inherit;
            }
            .school-utoronto {
              color: #013482 !important; /* Dark blue */
              font-weight: 600;
            }
            .school-stanford {
              color: #8C1515 !important; /* Cardinal red */
              font-weight: 600;
            }
            .school-columbia {
              color: #75AADB !important; /* Light blue */
              font-weight: 600;
            }
            .school-yale {
              color: #254d94 !important; /* Yale blue */
              font-weight: 600;
            }
            .school-berkeley {
              background: linear-gradient(to right, #003262 50%, #FDB515 50%); /* Blue and Gold */
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent !important;
              font-weight: 600;
              text-decoration-color: #003262;
            }
            .school-berkeley u {
              text-decoration: underline;
              text-decoration-color: inherit;
            }
            @media (max-width: 600px) {
              .container {
                padding: 1.5rem;
              }
              h2 {
                font-size: 1.6rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Thanks for your interest in Linkd, ${firstName}!</h2>
            
            <p>We've received your request to bring Linkd to ${schoolName}. We'll keep you updated on our progress.</p>
            
            <p>In the meantime, check out our latest release at <a href="https://stanford.uselinkd.com/" target="_blank">Stanford</a> and try searching for anything that interests you.</p>
            
            <p>Our search algorithm is designed to help you discover people through shared experiences - we'd love to hear what you think! Please feel free to reply to this email with feedback.</p>
            
            <div class="schools-list">
              <a href="https://upenn-frontend-production.up.railway.app/" class="school-upenn"><u>upenn</u></a> | 
              <a href="https://utoronto.uselinkd.com/" class="school-utoronto"><u>utoronto</u></a> | 
              <a href="https://columbia.uselinkd.com/" class="school-columbia"><u>columbia</u></a> | 
              <a href="https://yale.uselinkd.com/" class="school-yale"><u>yale</u></a> |
              <a href="https://stanford.uselinkd.com/" class="school-stanford"><u>stanford</u></a> |
              <span class="school-berkeley"><u>berkeley</u></span><i>(next!)</i>
            </div>
            
            <p class="signature">- <a href="https://www.linkedin.com/in/eric-mao/" target="_blank" rel="noopener noreferrer">Eric</a> & 
                <a href="https://www.linkedin.com/in/toomzheng/" target="_blank" rel="noopener noreferrer">Tom</a></p>
            
            <p class="footer-text">
              This email was sent to ${userEmail} because you signed up for the Linkd waitlist.
            </p>
          </div>
        </body>
        </html>
      `;
      
      const emailData = await resend.emails.send({
        from: 'Linkd <founders@waitlist.linkd.inc>',
        to: userEmail,
        subject: `Your request for ${schoolName}`,
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
    const firstName = name ? name.split(' ')[0] : 'there';
    const schoolName = school || 'Test University';
    
    // Create test email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email from Linkd</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
            color: #1a1a1a;
            line-height: 1.5;
          }
          .container {
            padding: 1.5rem;
            margin: 0; /* Remove auto margins */
          }
          .test-banner { 
            background-color: #ffeb3b; 
            padding: 10px; 
            text-align: center;
            margin-bottom: 20px;
            border-radius: 4px;
            font-weight: bold;
          }
          h2 {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-weight: 600;
            font-size: 1.8rem;
            margin: 0 0 0.4rem 0;
            color: #000;
            text-align: left;
          }
          p {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0.66rem 0;
            font-size: 1rem;
            text-align: left;
            color: #1a1a1a; /* Change to black instead of purple */
          }
          a {
            color: #0075ff;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .signature {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
            text-align: left;
            color: #1a1a1a; /* Change to black instead of purple */
          }
          .schools-list {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            text-align: left;
            margin: 0.85rem 0;
            padding: 0;
            color: #1a1a1a; /* Change to black instead of purple */
          }
          .footer-text {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 0.8rem; 
            color: #666;
            margin-top: 1.5rem;
          }
          /* School colors */
          .school-upenn {
            background: linear-gradient(to right, #990000 50%, #011F5B 50%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent !important;
            font-weight: 600;
            text-decoration-color: #990000;
          }
          .school-upenn u {
            text-decoration: underline;
            text-decoration-color: inherit;
          }
          .school-utoronto {
            color: #013482 !important; /* Dark blue */
            font-weight: 600;
          }
          .school-stanford {
            color: #8C1515 !important; /* Cardinal red */
            font-weight: 600;
          }
          .school-columbia {
            color: #75AADB !important; /* Light blue */
            font-weight: 600;
          }
          .school-yale {
            color: #254d94 !important; /* Yale blue */
            font-weight: 600;
          }
          .school-berkeley {
            background: linear-gradient(to right, #003262 50%, #FDB515 50%); /* Blue and Gold */
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent !important;
            font-weight: 600;
            text-decoration-color: #003262;
          }
          .school-berkeley u {
            text-decoration: underline;
            text-decoration-color: inherit;
          }
          @media (max-width: 600px) {
            .container {
              padding: 1.5rem;
            }
            h2 {
              font-size: 1.6rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="test-banner">TEST EMAIL - PLEASE IGNORE</div>
          
          <h2>Thanks for your interest in Linkd, ${firstName}!</h2>
          
          <p>We've received your request to bring Linkd to ${schoolName}. We'll keep you updated on our progress.</p>
          
          <p>In the meantime, check out our latest release at <a href="https://stanford.uselinkd.com/" target="_blank">Stanford</a> and try searching for anything that interests you.</p>
          
          <p>Our search algorithm is designed to help you discover people through shared experiences - we'd love to hear what you think! Please feel free to reply to this email with feedback or questions.</p>
          
          <div class="schools-list">
            <a href="https://upenn-frontend-production.up.railway.app/" class="school-upenn"><u>upenn</u></a> | 
            <a href="https://utoronto.uselinkd.com/" class="school-utoronto"><u>utoronto</u></a> | 
            <a href="https://columbia.uselinkd.com/" class="school-columbia"><u>columbia</u></a> | 
            <a href="https://yale.uselinkd.com/" class="school-yale"><u>yale</u></a> |
            <a href="https://stanford.uselinkd.com/" class="school-stanford"><u>stanford</u></a> |
            <span class="school-berkeley"><u>berkeley</u></span><i>(next!)</i>
          </div>
          
          <p class="signature">- Eric & Tom</p>
          
          <p class="footer-text">
            Test completed at: ${new Date().toISOString()}
          </p>
        </div>
      </body>
      </html>
    `;
    
    const emailData = await resend.emails.send({
      from: 'Linkd Test <founders@waitlist.linkd.inc>',
      to: email,
      subject: `Your request for ${schoolName}`,
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