// broadcast-email.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration
const DRY_RUN = false; // Set to false when ready to actually send
const SCHEDULED_HOURS = 9.5; // Schedule for 24 hours from now

async function scheduleWaitlistBroadcast() {
  try {
    console.log(`Running in ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'} mode`);
    
    // 1. Fetch all waitlist entries from Supabase
    console.log('Fetching waitlist entries...');
    const { data: waitlistEntries, error } = await supabase
      .from('waitlist')
      .select('email, name, school')
      .order('created_at', { ascending: true });
    
    if (error) throw new Error(`Failed to fetch waitlist: ${error.message}`);
    console.log(`Retrieved ${waitlistEntries.length} waitlist entries`);
    
    // 2. Format recipients with personalization data
    const recipients = waitlistEntries.map(entry => {
      // Extract first name
      const firstName = entry.name ? entry.name.split(' ')[0] : 'there';
      
      return {
        email: entry.email.split('|')[0], // Remove any suffixes from email
        data: {
          firstName: firstName,
          name: entry.name || 'there',
          school: entry.school || 'your school'
        }
      };
    });
    
    // 3. Create HTML template with personalization variables
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Linkd Update: We've Launched at UC Berkeley!</title>
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
            margin: 0;
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
            color: #1a1a1a;
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
            color: #1a1a1a;
          }
          .cory {
            color: #246BFF;
            font-weight: 500;
          }
          .schools-list {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            text-align: left;
            margin: 0.85rem 0;
            padding: 0;
            color: #1a1a1a;
          }
          .footer-text {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 0.8rem; 
            color: #666;
            margin-top: 1.5rem;
            border-top: 1px solid #eee;
            padding-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p>Hi {{data.firstName}}!</p>
          
          <p>Thank you for your request to bring Linkd to {{data.school}}!</p>
          
          <p>We're excited to announce that we've recently launched at <strong>UC Berkeley</strong>. Check it out here: <a href="https://berkeley.uselinkd.com/" target="_blank">berkeley.uselinkd.com</a></p>
          
          <p>We're currently working on scaling our systems to deploy to as many schools as possible, and we'll be in contact about the launch at {{data.school}} soon.</p>
          
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
          
          <p>Special thanks to <a href="https://corylevy.com/" target="_blank" rel="noopener noreferrer" class="cory"><u><b>Cory Levy</b></u></a> and the Z Fellows team!</p>
          
          <p class="footer-text">
            This email was sent to {{email}} because you signed up for the Linkd waitlist.
            <br><a href="https://uselinkd.com/unsubscribe?email={{email}}" target="_blank">Unsubscribe</a>
          </p>
        </div>
      </body>
      </html>
    `;
    
    // 4. Set the scheduled time
    const scheduledTime = new Date(Date.now() + SCHEDULED_HOURS * 60 * 60 * 1000).toISOString();
    console.log(`Email would be scheduled for: ${scheduledTime}`);
    
    if (DRY_RUN) {
      // In dry run mode, just log what would happen
      console.log(`DRY RUN: Would send to ${recipients.length} recipients`);
      console.log('First 3 recipients:');
      console.log(JSON.stringify(recipients.slice(0, 3), null, 2));
      
      // Preview the template with the first recipient's data
      if (recipients.length > 0) {
        console.log('\nEmail preview for first recipient:');
        const firstRecipient = recipients[0];
        console.log(`- Email: ${firstRecipient.email}`);
        console.log(`- Name: ${firstRecipient.data.name}`);
        console.log(`- School: ${firstRecipient.data.school}`);
      }
      
      console.log('\nTo test with actual email previews, run the test-broadcast.js script');
      return { success: true, message: 'Dry run completed' };
    }
    
    // 5. Schedule the broadcast email (only runs when DRY_RUN is false)
    console.log('Scheduling broadcast email...');
    
    // For large lists, we need to send in batches
    const BATCH_SIZE = 50; // Resend recommends smaller batches
    const totalRecipients = recipients.length;
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`Sending to ${totalRecipients} recipients in batches of ${BATCH_SIZE}...`);
    
    // Process in batches
    for (let i = 0; i < totalRecipients; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} recipients)...`);
      
      try {
        // Send individual emails with personalization
        const promises = batch.map(recipient => {
          return resend.emails.send({
            from: 'Linkd <founders@waitlist.linkd.inc>',
            to: recipient.email,
            subject: "Linkd Update: We've Launched at UC Berkeley!",
            html: htmlTemplate.replace(/\{\{data\.firstName\}\}/g, recipient.data.firstName)
                             .replace(/\{\{data\.school\}\}/g, recipient.data.school)
                             .replace(/\{\{email\}\}/g, recipient.email),
            scheduled_for: scheduledTime
          });
        });
        
        // Wait for all emails in this batch to be sent
        const results = await Promise.allSettled(promises);
        
        // Count successes and failures
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
            console.error('Error sending to a recipient:', result.reason);
          }
        });
        
        console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1} processed. Progress: ${i + batch.length}/${totalRecipients}`);
        
        // Add a small delay between batches to avoid rate limits
        if (i + BATCH_SIZE < totalRecipients) {
          console.log('Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (batchError) {
        console.error(`Error processing batch ${Math.floor(i/BATCH_SIZE) + 1}:`, batchError);
        errorCount += batch.length;
      }
    }
    
    console.log(`Email scheduling completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.warn(`Warning: ${errorCount} emails failed to schedule.`);
    }
    
    return { 
      success: true, 
      totalProcessed: totalRecipients,
      successCount,
      errorCount
    };
    
  } catch (error) {
    console.error('Error scheduling broadcast:', error);
    return { success: false, error: error.message };
  }
}

// Run the function
scheduleWaitlistBroadcast()
  .then(result => {
    if (result.success) {
      console.log('Operation completed successfully');
    } else {
      console.error('Operation failed:', result.error);
      process.exit(1);
    }
  }); 