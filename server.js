require('dotenv').config();
const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase with service role key for admin operations
// This bypasses RLS policies for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY, 
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

// For client use only - safer with limited permissions
const clientSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Parse JSON body
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Create a config endpoint to provide credentials to the frontend
app.get('/api/config', (req, res) => {
  try {
    // Only send what the frontend needs - NEVER send service key to client
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY
    });
  } catch (err) {
    console.error('Error serving config:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add endpoint to handle waitlist entries with duplicate checking
app.post('/api/waitlist', async (req, res) => {
  try {
    const { name, email, school, linkedin } = req.body;
    
    // Basic input validation
    if (!name || !email || !school) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Additional security measures
    const sanitizedInput = {
      name: name.slice(0, 100), // Limit length
      email: email.slice(0, 100).toLowerCase(), // Normalize and limit
      school: school.slice(0, 100),
      linkedin: linkedin ? linkedin.slice(0, 200) : ''
    };
    
    // Original email without any suffix
    const originalEmail = sanitizedInput.email;
    let finalEmail = originalEmail;
    let insertSuccess = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10; // Safety limit
    
    // Try to insert with modified email if needed
    while (!insertSuccess && attempts < MAX_ATTEMPTS) {
      try {
        // Try to insert the record
        const { data, error } = await supabase
          .from('waitlist')
          .insert([{
            name: sanitizedInput.name,
            email: finalEmail,
            school: sanitizedInput.school,
            linkedin: sanitizedInput.linkedin
          }]);
        
        if (error) {
          // If it's a duplicate email error
          if (error.code === '23505') {
            // Increment counter and try again with modified email
            attempts++;
            
            // Check how many entries already exist with similar email pattern
            const { data: existingCount, error: countError } = await supabase
              .from('waitlist')
              .select('email')
              .ilike('email', `${originalEmail.split('@')[0]}%@${originalEmail.split('@')[1]}`);
            
            if (countError) {
              console.error('Error counting existing emails:', countError);
              return res.status(500).json({ error: 'Server error counting existing emails' });
            }
            
            // Create a new email with a number suffix before the @ symbol
            const emailParts = originalEmail.split('@');
            finalEmail = `${emailParts[0]}${existingCount.length}@${emailParts[1]}`;
            
            continue; // Try again with the new email
          } else {
            // Some other error occurred
            console.error('Insert error:', error);
            return res.status(500).json({ error: 'Server error creating record' });
          }
        }
        
        // If we got here, insertion was successful
        insertSuccess = true;
      } catch (insertErr) {
        console.error('Error during insert attempt:', insertErr);
        return res.status(500).json({ error: 'Server error during insert' });
      }
    }
    
    if (!insertSuccess) {
      return res.status(500).json({ error: 'Failed to insert after multiple attempts' });
    }
    
    // Return the email that was actually used (may have been modified)
    return res.status(200).json({ 
      success: true, 
      email: finalEmail,
      modified: finalEmail !== originalEmail 
    });
  } catch (err) {
    console.error('Waitlist error:', err);
    return res.status(500).json({ error: 'Server error processing request' });
  }
});

// Add endpoint to send confirmation emails
app.post('/api/send-confirmation', async (req, res) => {
  try {
    const { name, email, school } = req.body;
    
    if (!name || !email || !school) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Extract the first name
    const firstName = name.split(' ')[0];
    
    console.log('Attempting to send email to:', email);
    
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
        
        console.log('Email successfully sent using fallback domain to:', email);
        return res.json({ success: true, message: 'Confirmation email sent (fallback)' });
      } catch (fallbackError) {
        console.error('Both email sending attempts failed:', fallbackError);
        return res.status(500).json({ 
          error: 'Failed to send email', 
          details: fallbackError,
          message: 'Unable to send confirmation email after multiple attempts'
        });
      }
    }
  } catch (err) {
    console.error('Server error details:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
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

// Test endpoint to check Supabase connection and waitlist table
app.get('/api/test-supabase', async (req, res) => {
  try {
    console.log('Testing Supabase connection');
    
    // Check if we can connect to Supabase
    const { data: tableList, error: tableError } = await supabase
      .from('waitlist')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('Supabase test error:', tableError);
      return res.status(500).json({ 
        error: 'Failed to connect to Supabase', 
        details: tableError 
      });
    }
    
    // Try to get the table structure
    const tableInfo = {
      url: process.env.SUPABASE_URL,
      keyPrefix: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 5) + '...' : 'Not set',
      tableExists: true,
      sampleData: tableList,
      message: 'Successfully connected to Supabase and found the waitlist table'
    };
    
    return res.json(tableInfo);
  } catch (err) {
    console.error('Supabase test error:', err);
    return res.status(500).json({ 
      error: 'Error testing Supabase connection', 
      details: String(err),
      stack: err.stack 
    });
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

// Handle all other routes by sending index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 