async page=>{
 const results=[];
 for(const [width,height] of [[1440,900],[768,1024],[390,844],[360,800]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5180/');await page.getByRole('heading',{name:'Make an evening of every meal.'}).waitFor();await page.locator('.landing-hero>img').evaluate(img=>img.decode());
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Landing overflow ${width}`);
  await page.screenshot({path:`outputs/audit/landing-${width}.png`,fullPage:true});
  await page.getByRole('link',{name:'Discover the menu →',exact:true}).click();await page.getByRole('heading',{name:'Find your favourite.'}).waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Menu overflow ${width}`);
  await page.goto('http://127.0.0.1:5180/cart');await page.getByRole('heading',{name:'Your order.',exact:true}).waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Cart overflow ${width}`);
  results.push({width,landing:true,menu:true,cart:true});
 }return results;
}
