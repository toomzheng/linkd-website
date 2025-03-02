require('dotenv').config();
const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

// Add endpoint to send confirmation emails
app.post('/api/send-confirmation', async (req, res) => {
  try {
    const { name, email, school } = req.body;
    
    if (!name || !email || !school) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Extract the first name
    const firstName = name.split(' ')[0];
    
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
      console.error('Email error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.json({ success: true, message: 'Confirmation email sent' });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Handle all other routes by sending index.html
app.get('*', (req, res) => {
  if (req.path !== '/api/config') {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 