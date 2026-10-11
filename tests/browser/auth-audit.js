async page => {
 await page.setViewportSize({width:1440,height:900});await page.goto('http://127.0.0.1:5180/auth');
 await page.getByRole('heading',{name:'Welcome back.'}).waitFor();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Desktop overflow');
 await page.screenshot({path:'outputs/audit/auth-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'outputs/audit/auth-mobile.png',fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('navigation',{name:'Main navigation'}).waitFor({state:'visible'});
 await page.getByRole('button',{name:'Close navigation'}).click();
 await page.goto('http://127.0.0.1:5180/auth?mode=register');
 await page.getByLabel('Full name',{exact:true}).fill('Synthetic User');await page.getByLabel('Email address').fill('synthetic@example.test');
 await page.getByLabel('Password',{exact:true}).fill('Testing123!');await page.getByLabel('Confirm password').fill('Different123!');await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Passwords do not match'}).waitFor();
 await page.screenshot({path:'outputs/audit/register-mobile.png',fullPage:true});
 await page.goto('http://127.0.0.1:5180/verify');await page.getByRole('heading',{name:'Verify your email.'}).waitFor();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Verification overflow');
 return {desktop:'1440x900',mobile:'390x844',checks:['no overflow','navigation','registration mismatch','verification view']};
}
