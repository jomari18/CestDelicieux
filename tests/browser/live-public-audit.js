async page => {
  const failures=[],errors=[];
  await page.unroute('**/*.supabase.co/**');
  await page.context().setOffline(false);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('requestfailed',request=>{if(request.url().includes('.supabase.co'))failures.push(request.failure()?.errorText)});
  await page.goto('http://127.0.0.1:5180/');
  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
  await page.reload();await page.emulateMedia({reducedMotion:'no-preference'});
  for(const [width,height] of [[1440,900],[390,844]]){
    await page.setViewportSize({width,height});
    await page.goto('http://127.0.0.1:5180/');
    await page.getByRole('heading',{name:'Make an evening of every meal.'}).waitFor();
    await page.locator('img').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode()}});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Live landing overflow');
    await page.screenshot({path:`outputs/audit/live-landing-${width}.png`,fullPage:true});
    await page.goto('http://127.0.0.1:5180/menu');
    await page.getByRole('button',{name:'Add to order +'}).first().waitFor();
    if(await page.getByRole('button',{name:'Add to order +'}).count()!==25)throw Error('Expected 25 live menu items');
    await page.screenshot({path:`outputs/audit/live-menu-${width}.png`,fullPage:true});
  }
  await page.context().setOffline(true);
  await page.getByRole('status').filter({hasText:/offline/i}).waitFor();
  await page.context().setOffline(false);
  if(errors.length||failures.length)throw Error(JSON.stringify({errors,failures}));
  await page.goto('http://127.0.0.1:5180/');
  return {realHostedPublicRead:true,products:25,hostedWrites:0,checks:['live public menu','desktop/mobile images','no overflow','offline banner'],errors,failures};
}
