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
app.use(express.static(path.join(__dirname, '.')));

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

// Create a config endpoint to provide credentials to the frontend
app.get('/api/config', (req, res) => {
  try {
    // Only send what the frontend needs
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY
    });
  } catch (err) {
    console.error('Config endpoint error:', err);
    res.status(500).json({ error: 'Server error fetching config' });
  }
});

// Add endpoint to handle waitlist entries with duplicate checking
app.post('/api/waitlist', async (req, res) => {
  // Add request timeout handling
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Database operation timed out'));
    }, 5000); // 5 second timeout
  });

  try {
    const { name, email, school, linkedin } = req.body;
    
    if (!name || !email || !school) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('Processing waitlist entry for:', email);
    
    // Race the database operation against the timeout
    const dbPromise = (async () => {
      // Check if the email already exists
      const { data: existingData, error: checkError } = await supabase
        .from('waitlist')
        .select('*')
        .eq('email', email)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected for new emails
        console.error('Error checking existing email:', checkError);
        return res.status(500).json({ error: 'Database error', details: checkError });
      }
      
      let result;
      
      if (existingData) {
        // Email exists, update the record instead
        const { data: updateData, error: updateError } = await supabase
          .from('waitlist')
          .update({ name, school, linkedin, updated_at: new Date() })
          .eq('email', email)
          .select();
        
        if (updateError) {
          console.error('Error updating record:', updateError);
          return res.status(500).json({ error: 'Failed to update record', details: updateError });
        }
        
        result = updateData;
        console.log('Updated existing record for:', email);
      } else {
        // New email, insert a new record
        const { data: insertData, error: insertError } = await supabase
          .from('waitlist')
          .insert([{ 
            name,
            email,
            school,
            linkedin,
            created_at: new Date()
          }])
          .select();
        
        if (insertError) {
          console.error('Error inserting record:', insertError);
          return res.status(500).json({ error: 'Failed to insert record', details: insertError });
        }
        
        result = insertData;
        console.log('Inserted new record for:', email);
      }
      
      return res.json({ success: true, data: result });
    })();
    
    // Race the database operation against the timeout
    await Promise.race([dbPromise, timeoutPromise]);
    
  } catch (err) {
    if (!res.headersSent) {
      if (err.message === 'Database operation timed out') {
        console.error('Waitlist timeout:', err);
        return res.status(503).json({ error: 'Request timed out. Please try again.' });
      }
      console.error('Waitlist error:', err);
      return res.status(500).json({ error: 'Server error processing waitlist request', details: String(err) });
    }
  }
});

// Add endpoint to send confirmation emails
app.post('/api/send-confirmation', async (req, res) => {
  // Create a timeout for email sending operations
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Email operation timed out'));
    }, 4000); // 4 second timeout
  });

  try {
    const { name, email, school } = req.body;
    
    if (!name || !email || !school) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Extract the first name
    const firstName = name.split(' ')[0];
    
    console.log('Attempting to send email to:', email);
    
    // Create a promise to handle the email sending logic
    const emailPromise = (async () => {
      // Try with the branded domain first, fallback to a verified Resend domain
      try {
        const { data, error } = await resend.emails.send({
          from: 'Linkd <founders@linkd.inc>',
          to: email,
          subject: `Your request for ${school}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Thanks for your interest in Linkd, ${firstName}!</h2>
              <p>We've received your request to bring Linkd to ${school}. We'll keep you updated on our progress.</p>
              <p>In the meantime, check out our latest release at <a href="https://stanford.uselinkd.com/" target="_blank">Stanford</a> and try searching for anything that interests you.</p>
              <p>Our search algorithm is designed to help you discover people through shared experiences - we'd love to hear what you think! Please feel free to reply to this email with feedback.</p>
              <br>
              <p>- Eric & Tom</p>
            </div>
          `
        });

        if (error) {
          throw error;
        }
        
        console.log('Email successfully sent to:', email);
        return res.json({ success: true, message: 'Confirmation email sent' });
      } catch (emailError) {
        console.error('Email sending failed with primary domain, trying fallback:', emailError);
        
        // Fallback to onresend.com domain which is always verified
        try {
          const { data, error } = await resend.emails.send({
            from: 'Linkd <linkd@onresend.com>', 
            to: email,
            subject: `Your request for ${school}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Thanks for your interest in Linkd, ${firstName}!</h2>
                <p>We've received your request to bring Linkd to ${school}. We'll keep you updated on our progress.</p>
                <p>In the meantime, check out our latest release at <a href="https://stanford.uselinkd.com/" target="_blank">Stanford</a> and try searching for anything that interests you.</p>
                <p>Our search algorithm is designed to help you discover people through shared experiences - we'd love to hear what you think! Please feel free to reply to this email with feedback.</p>
                <br>
                <p>- Eric & Tom</p>
              </div>
            `
          });
          
          if (error) {
            throw error;
          }
          
          console.log('Email successfully sent to:', email, 'using fallback domain');
          return res.json({ success: true, message: 'Confirmation email sent' });
        } catch (fallbackError) {
          console.error('Fallback email sending also failed:', fallbackError);
          throw fallbackError;
        }
      }
    })();
    
    // Race the email sending operation against the timeout
    await Promise.race([emailPromise, timeoutPromise]);
    
  } catch (err) {
    if (!res.headersSent) {
      if (err.message === 'Email operation timed out') {
        console.error('Email sending timeout:', err);
        return res.status(503).json({ 
          error: 'Email service temporarily unavailable', 
          message: 'Your submission was received, but the confirmation email timed out. Please check your inbox later.'
        });
      }
      console.error('Email confirmation error:', err);
      return res.status(500).json({ 
        error: 'Failed to send confirmation email',
        message: 'Your submission was received, but we encountered an issue sending the confirmation. Please check your inbox later.',
        details: String(err)
      });
    }
  }
});

// Add a test endpoint for Resend
app.get('/api/test-email', async (req, res) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Linkd <founders@linkd.inc>',
      to: 'founders@linkd.inc', // Send to yourself for testing
      subject: 'Test from Railway Deployment',
      html: '<p>This is a test email from Railway deployment</p>'
    });
    
    if (error) {
      console.error('Test email error:', error);
      return res.status(500).json({ error: error });
    }
    
    return res.json({ success: true, data: data });
  } catch (err) {
    console.error('Test email error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Diagnostic endpoint to verify environment variables (remove in production)
app.get('/api/diagnose', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL ? 'Set (length: ' + process.env.SUPABASE_URL.length + ')' : 'Not set',
    supabaseKey: process.env.SUPABASE_ANON_KEY ? 'Set (starts with: ' + process.env.SUPABASE_ANON_KEY.substring(0, 5) + '...)' : 'Not set',
    resendKey: process.env.RESEND_API_KEY ? 'Set (length: ' + process.env.RESEND_API_KEY.length + ')' : 'Not set',
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'Not set'
  });
});

// Add a health check endpoint for Railway
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle all other routes by sending index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Add graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Function to validate essential connections on startup
const validateConnections = async () => {
  const checks = [];
  
  // Validate Supabase connection
  try {
    const { data, error } = await supabase.from('waitlist').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    checks.push({ service: 'Supabase', status: 'connected' });
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    checks.push({ service: 'Supabase', status: 'error', error: err.message });
  }
  
  // Validate Resend connection
  try {
    // Just check if the API key is configured
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    if (resend) {
      console.log('✅ Resend configuration loaded');
      checks.push({ service: 'Resend', status: 'configured' });
    }
  } catch (err) {
    console.error('❌ Resend configuration error:', err.message);
    checks.push({ service: 'Resend', status: 'error', error: err.message });
  }
  
  return checks;
};

// Modify the server startup code to include error handling and timeout
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Validate connections on startup
  try {
    const connectionChecks = await validateConnections();
    const hasErrors = connectionChecks.some(check => check.status === 'error');
    
    if (hasErrors) {
      console.warn('⚠️  Server started with connection issues. Some functionality may be limited.');
    } else {
      console.log('🚀 All connections validated successfully');
    }
  } catch (err) {
    console.error('Error during connection validation:', err);
  }
});

// Add timeout to server (prevents hanging connections)
server.timeout = 10000; // 10 seconds timeout

// Add error handling for the server
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying to recover...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 1000);
  } else {
    console.error('Server error:', error);
  }
}); 