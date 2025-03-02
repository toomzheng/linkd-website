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

// Parse JSON body
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Create a config endpoint to provide credentials to the frontend
app.get('/api/config', (req, res) => {
  // Only send what the frontend needs
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY
  });
});

// Add endpoint to handle waitlist entries with duplicate checking
app.post('/api/waitlist', async (req, res) => {
  try {
    const { name, email, school, linkedin } = req.body;
    
    if (!name || !email || !school) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('Processing waitlist entry for:', email);
    console.log('Supabase client initialized with URL:', process.env.SUPABASE_URL);
    
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
  } catch (err) {
    console.error('Waitlist error:', err);
    return res.status(500).json({ error: 'Server error processing waitlist request', details: String(err) });
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