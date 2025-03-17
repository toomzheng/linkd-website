import SchoolsList from './components/SchoolsList';
import SignupForm from './components/SignupForm';
import CopyEmail from './components/CopyEmail';
import InvestorLink from './components/InvestorLink';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="container max-w-[700px] mx-auto p-[2rem_0.8rem_0.5rem]">
      <main>
        <h1 className="flex items-center gap-2">
          <div className="w-[28px] h-[28px] relative">
            <Image 
              src="/favicon.ico" 
              alt="Linkd Logo" 
              fill
              sizes="28px"
              priority
              className="object-contain" 
            />
          </div>
          Linkd Inc.<span className="blinking-cursor">_</span>
        </h1>
        <div className="flex justify-between items-center mt-[0.4rem] mb-[-0.5rem]">
          <p className="date font-medium m-0">March 10, 2025</p>
          <div className="flex gap-3 items-center mr-[10px]">
            <a href="https://www.linkedin.com/company/linkd-inc" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile for Linkd Inc" className="text-[#1a1a1a] hover:opacity-70 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
              </svg>
            </a>
            <a href="https://x.com/uselinkd" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter) profile for Linkd Inc" className="text-[#1a1a1a] hover:opacity-70 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="black" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
            </a>
          </div>
        </div>
        <p className="announcement text-[0.93rem] font-medium mt-0">
          <em>update: we are backed by <span className="highlight-yc"><a href="https://www.ycombinator.com/" target="_blank" rel="noopener noreferrer"><u><b>Y Combinator</b></u></a></span> (X25) and <span className="cory"><a href="https://corylevy.com/" target="_blank" rel="noopener noreferrer"><u><b>Cory Levy</b></u></a></span> for our pre-seed.</em>
        </p>
        
        <h2>How do you discover people?</h2>
        
        <p className="font-medium">We&apos;re here to find out.</p>
        
        <p className="font-medium">Our team is building the world&apos;s first search algorithm designed around human interactions. Social networks should be centered on our <em>experiences</em>.</p>
        
        <p className="font-medium">It&apos;s called <b>Linkd.</b></p>

        <p className="announcement font-medium">
          <em>&gt; If you&apos;re a <u>company</u> interested in people search for social platforms, recruiting, or leads, please directly contact us below.</em>
        </p>
        
        <h2>About alumni.</h2>
        <p className="font-medium">We&apos;ve began experimenting with this new medium by working with one of the most powerful forms of connections: <b>Alumni Networks.</b> Begin by searching for people who&apos;ve experienced your education.</p>
        <p className="font-medium">Links to try out our current beta schools:</p>
        
        <SchoolsList />

        <SignupForm />
        
        <p className="signature mb-[1.4rem] mt-[0.6rem] font-medium">
          - <a href="https://www.linkedin.com/in/eric-mao/" target="_blank" rel="noopener noreferrer" className="name-link hover:opacity-70"><b>Eric</b></a> &amp; <a href="https://tomzheng.dev" target="_blank" rel="noopener noreferrer" className="name-link hover:opacity-70"><b>Tom</b></a>
        </p>
        
        <p className="mb-[0.5rem] font-medium">
          business & general: <CopyEmail email="founders@linkd.inc"><b>founders@linkd.inc</b></CopyEmail>
        </p>
        
        <InvestorLink />
      </main>
    </div>
  );
}
