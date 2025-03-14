import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Initialize Resend email client
const resend = new Resend(process.env.RESEND_API_KEY || '');

// Helper function to create a timeout promise
const timeoutPromise = (ms: number, message: string) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
};

export async function POST(request: NextRequest) {
  try {
    const { email, name, school, linkedin } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

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
        similarEmailsResult.data.forEach((entry: any) => {
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
      return NextResponse.json({ error: 'Failed to register email' }, { status: 500 });
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
            <p>We've received your request to bring Linkd to ${schoolName}. We'll keep you updated on our progress.</p>
            
            <p>In the meantime, check out our latest release at <a href="https://stanford.uselinkd.com/" target="_blank">Stanford</a> and try searching for anything that interests you.</p>
            
            <p>Our search algorithm is designed to help you discover people through shared experiences - we'd love to hear what you think! Please feel free to reply to this email with feedback.</p>
            
            <div class="schools-list">
              <a href="https://upenn-frontend-production.up.railway.app/"><u>upenn</u></a> | 
              <a href="https://utoronto.uselinkd.com/"><u>utoronto</u></a> | 
              <a href="https://columbia.uselinkd.com/"><u>columbia</u></a> | 
              <a href="https://yale.uselinkd.com/"><u>yale</u></a> |
              <a href="https://stanford.uselinkd.com/"><u>stanford</u></a> |
              <a href="https://berkeley.uselinkd.com/"><u>berkeley</u></a>
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
        subject: `Thanks for your interest in Linkd for ${schoolName}, ${firstName}!`,
        html: emailHtml,
      });
      
      console.log('Confirmation email sent:', emailData.id);
    } catch (emailError) {
      // Don't fail the registration if email sending fails
      console.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({ 
      success: true,
      modified,
      email: emailToInsert
    });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 