// test-broadcast.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Mock data instead of actual database query
const mockWaitlistEntries = [
  { email: 'test1@example.com', name: 'John Doe', school: 'Stanford' },
  { email: 'test2@example.com', name: 'Jane Smith', school: 'Yale' },
  { email: 'test3@example.com', name: null, school: null }
];

// Email template with personalization variables
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Linkd is now at UC Berkeley!</title>
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
    
    <p>We're currently working on scaling our systems to deploy to as many schools as possible, and we'll be in contact about the launch at {{data.school}}.</p>
    
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

function testBroadcast() {
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, 'email-previews');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Format recipients with personalization data
  const recipients = mockWaitlistEntries.map(entry => {
    // Extract first name
    const firstName = entry.name ? entry.name.split(' ')[0] : 'there';
    
    return {
      email: entry.email,
      data: {
        firstName: firstName,
        name: entry.name || 'there',
        school: entry.school || 'your school'
      }
    };
  });
  
  console.log(`Would send to ${recipients.length} recipients`);
  console.log('Generating preview files...');
  
  // Generate preview for each recipient
  recipients.forEach((recipient, index) => {
    // Replace template variables
    let personalizedHtml = htmlTemplate
      .replace(/\{\{data\.firstName\}\}/g, recipient.data.firstName)
      .replace(/\{\{data\.name\}\}/g, recipient.data.name)
      .replace(/\{\{data\.school\}\}/g, recipient.data.school)
      .replace(/\{\{email\}\}/g, recipient.email);
    
    // Save preview to file
    const previewPath = path.join(outputDir, `preview-${index+1}-${recipient.email.split('@')[0]}.html`);
    fs.writeFileSync(previewPath, personalizedHtml);
    
    console.log(`Preview for ${recipient.email} saved to ${previewPath}`);
  });
  
  console.log('\nTest completed. Open the preview files in your browser to check the email appearance.');
  console.log(`Preview files are located in: ${outputDir}`);
}

// Run the test
testBroadcast(); 