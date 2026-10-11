async page=>{
  const root='http://127.0.0.1:5180',fixture='http://127.0.0.1:55435',failures=[],passed=[];
  let loseContact=false,loseStaff=false;const contacts=[],staffMutations=[];
  await page.unroute('**/*.supabase.co/**');
  await page.route('**/*.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());let body=req.postData()??undefined;
    if(url.pathname.endsWith('/auth/v1/token')&&body){const payload=JSON.parse(body);if(payload.refresh_token){payload.email=payload.refresh_token.replace('fixture-','')+'@example.test';body=JSON.stringify(payload)}}
    const response=await page.request.fetch(fixture+url.pathname+url.search,{method:req.method(),headers:req.headers(),data:body});
    if(url.pathname.endsWith('/rpc/submit_contact')){
      contacts.push(JSON.parse(req.postData()).p_request);
      if(loseContact){loseContact=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'FIXTURE_LOST_RESPONSE',message:'Response lost after commit'})});return}
    }
    if(url.pathname.endsWith('/rpc/staff_save_menu')){
      staffMutations.push(JSON.parse(req.postData()).p_request);
      if(loseStaff){loseStaff=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'FIXTURE_LOST_RESPONSE',message:'Response lost after commit'})});return}
    }
    await route.fulfill({response});
  });
  async function setup(kind){
    await page.request.post(fixture+'/__fixture/control',{data:{reset:true}});
    await page.goto(root);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload();
    await page.goto(root+'/auth');await page.getByLabel('Email address').fill(kind+'@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('link',{name:'My orders',exact:true,includeHidden:true}).waitFor({state:'attached'});
  }
  async function check(name,run){try{await run();passed.push(name)}catch(error){failures.push(name+': '+error.message)}}
  async function refocus(){await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabase.ts');const result=await supabase.auth.refreshSession();if(result.error)throw result.error});await page.waitForTimeout(700)}
  await check('checkout edits survive same-user refocus',async()=>{
    await setup('a');await page.goto(root+'/menu');await page.getByRole('button',{name:'Add to order +'}).first().click();await page.goto(root+'/checkout');await page.getByLabel('Recipient name').fill('Edited Recipient');await page.getByLabel('Mobile number',{exact:true}).fill('09123456789');await refocus();
    if(await page.getByLabel('Recipient name').inputValue()!=='Edited Recipient')throw Error('Recipient edit was overwritten');
  });
  await check('staff editor survives same-user refocus',async()=>{
    await setup('staff');await page.goto(root+'/staff/menu');await page.getByRole('button',{name:'Edit dish'}).first().click();await page.getByLabel('Name',{exact:true}).fill('Unsent edited dish');await refocus();
    if(!await page.getByRole('dialog').isVisible())throw Error('Editor was unmounted');
    if(await page.getByLabel('Name',{exact:true}).inputValue()!=='Unsent edited dish')throw Error('Unsaved edit lost');
  });
  await check('profile draft survives same-user refresh',async()=>{
    await setup('a');await page.goto(root+'/profile');await page.getByLabel('Full name',{exact:true}).fill('Unsaved Profile');await refocus();
    if(await page.getByLabel('Full name',{exact:true}).inputValue()!=='Unsaved Profile')throw Error('Profile edit overwritten');
  });
  await check('staff lost-save retry preserves UUID across session refresh',async()=>{
    await setup('staff');await page.goto(root+'/staff/menu');await page.getByRole('button',{name:'Edit dish'}).first().click();await page.getByLabel('Price (PHP)').fill('1600');staffMutations.length=0;loseStaff=true;await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByRole('dialog').getByRole('alert').filter({hasText:'Retry the exact action'}).waitFor();await refocus();
    if(!await page.getByRole('dialog').isVisible()||!await page.getByLabel('Price (PHP)').isDisabled())throw Error('Pending mutation lost its lock');
    await page.getByRole('button',{name:'Retry same save',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
    if(staffMutations.length!==2||JSON.stringify(staffMutations[0])!==JSON.stringify(staffMutations[1]))throw Error('Staff retry changed action UUID or payload');
  });
  await check('contact ambiguous response locks exact retry',async()=>{
    await setup('a');await page.goto(root);await page.getByLabel('Your name').fill('Synthetic Contact');await page.getByLabel('Mobile number',{exact:true}).fill('09123456789');await page.getByLabel('Message',{exact:true}).fill('Synthetic contact response loss regression.');
    loseContact=true;contacts.length=0;await page.getByRole('button',{name:'Send message →'}).click();await page.getByRole('alert').waitFor();
    if(!await page.getByLabel('Your name').isDisabled())throw Error('Ambiguous message remains editable');
    await page.getByRole('button',{name:'Retry same message'}).click();await page.getByRole('status').filter({hasText:'Your message is saved.'}).waitFor();
    if(contacts.length!==2||JSON.stringify(contacts[0])!==JSON.stringify(contacts[1]))throw Error('Retry changed payload or UUID');
  });
  await check('contact accepts the optional empty mobile number',async()=>{
    await setup('a');await page.goto(root);await page.getByLabel('Your name').fill('Synthetic Contact');await page.getByLabel('Message',{exact:true}).fill('Synthetic message without an optional phone.');
    if(await page.getByLabel('Mobile number',{exact:true}).evaluate(input=>input.required))throw Error('Optional phone is required');
    await page.getByRole('button',{name:'Send message →'}).click();await page.getByRole('status').filter({hasText:'Your message is saved.'}).waitFor();
  });
  await check('address edit discards an in-flight quote',async()=>{
    await setup('a');await page.goto(root+'/menu');await page.getByRole('button',{name:'Add to order +'}).first().click();await page.goto(root+'/checkout');await page.getByRole('button',{name:'Delivery',exact:true}).click();await page.getByLabel('Complete delivery address').fill('Synthetic old address, Metro Manila');await page.getByLabel('Latitude',{exact:true}).fill('14.62');await page.getByLabel('Longitude',{exact:true}).fill('120.99');await page.request.post(fixture+'/__fixture/control',{data:{routeDelay:1200}});await page.getByRole('button',{name:'Confirm pin & estimate delivery'}).click();await page.getByLabel('Complete delivery address').fill('Synthetic changed address, Metro Manila');await page.waitForTimeout(1500);
    if(await page.getByText('3.50 km by road').count())throw Error('Quote reappeared for old address');
  });
  if(failures.length)throw Error(JSON.stringify({failures,passed}));return {passed,failures};
}
