"""Reproducible optimized catalogue import; never edits the supplied archives."""
from pathlib import Path
import json,re,uuid,unicodedata,difflib
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'.inputs/source/CC104-finalproj-main'
DESIGN=ROOT/'.inputs/design/design-directions/assets'
OUT=ROOT/'public/assets'; OUT.mkdir(parents=True,exist_ok=True)
NS=uuid.UUID('d135a686-3b80-42be-8d01-a599d843bc45')
def slug(text):
    return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode().lower()).strip('-')
def dump(path,value):
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assets=[];mapping=[]
def optimize(source,name,width):
    image=ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    image.thumbnail((width,width),Image.Resampling.LANCZOS)
    target=OUT/(name+'.webp');image.save(target,'WEBP',quality=83,method=6)
    assets.append(dict(source=str(source.relative_to(ROOT/'.inputs')).replace('\\','/'),output='/assets/'+target.name,width=image.width,height=image.height,bytes=target.stat().st_size))
    return '/assets/'+target.name
categories=[dict(id=str(uuid.uuid5(NS,'category:'+name)),slug=slug(name),name=name,active=True,sortOrder=i,version=1) for i,name in enumerate(['Starters','Mains','Vegetables','Desserts','Drinks'])]
rows=re.findall(r"id:\s*(\d+),\s*name:\s*'([^']+)',\s*image:\s*'([^']+)',\s*price:\s*(\d+)", (SOURCE/'cart.js').read_text(encoding='utf-8'))
products=[];seen=set();files=list(SOURCE.glob('*.png'))
for old_id,name,image,price in rows:
    key=slug(name)
    if key in seen:
        mapping.append(f'- Duplicate source ID {old_id}: {name}; merged with existing dish.');continue
    seen.add(key)
    if int(old_id)<=7: category='Starters'
    elif int(old_id)>=26: category='Drinks'
    elif name in ['Mocha Mud Pie','CRÈME BRULÉE']: category='Desserts'
    elif any(term in name for term in ['Artichauts','Vegetables','Ratatouille','Endives']):category='Vegetables'
    else:category='Mains'
    source=SOURCE/image
    if not source.exists():
        source=max(files,key=lambda f:difflib.SequenceMatcher(None,slug(f.stem),slug(Path(image).stem)).ratio())
        score=difflib.SequenceMatcher(None,slug(source.stem),slug(Path(image).stem)).ratio()
        if score<.8:raise ValueError('Unresolved asset '+image)
        mapping.append(f'- ZIP filename encoding resolved: {image} → {source.name} (similarity {score:.2f}).')
    url=optimize(source,key+'-960',960);optimize(source,key+'-480',480)
    display=name.replace('l_Orange',"l’Orange")
    products.append(dict(id=str(uuid.uuid5(NS,'product:'+key)),categoryId=next(c['id'] for c in categories if c['name']==category),slug=key,name=display,description='A selection from our '+category.lower()+' menu.',imageUrl=url,priceCentavos=int(price)*100,active=True,version=1))
    mapping.append(f'- Source ID {old_id}: {display} → `{key}`; PHP {price}; {category}.')
for source in sorted(DESIGN.glob('*.jpg')):optimize(source,'editorial-'+source.stem,1920 if 'dining' in source.stem else 1200)
manifest=dict(categories=categories,products=products)
dump(ROOT/'src/features/catalog/seed-manifest.json',manifest);dump(OUT/'manifest.json',assets)
def sqlvalue(v):
    if isinstance(v,bool):return 'true' if v else 'false'
    if isinstance(v,int):return str(v)
    return "'"+v.replace("'","''")+"'"
sql=['-- Deterministic original catalogue. No synthetic orders or customer records.']
for table,records,columns,keys in [('categories',categories,['id','slug','name','active','sort_order','version'],['id','slug','name','active','sortOrder','version']),('products',products,['id','category_id','slug','name','description','image_url','price_centavos','active','version'],['id','categoryId','slug','name','description','imageUrl','priceCentavos','active','version'])]:
    for record in records:sql.append('insert into public.'+table+' ('+','.join(columns)+') values ('+','.join(sqlvalue(record[k]) for k in keys)+') on conflict (id) do nothing;')
(ROOT/'supabase').mkdir(exist_ok=True);(ROOT/'supabase/seed.sql').write_text('\n'.join(sql)+'\n',encoding='utf-8')
(ROOT/'docs/source-mapping.md').write_text('# Source and asset mapping\n\n25 unique dishes retained from 29 cart entries. Repeated dishes merged; the two distinct ID28 drinks receive distinct deterministic UUIDs. Original numeric prices interpreted in PHP as approved. No additional dishes/ingredients invented. Original archives remain untouched and excluded from web/APK. Categories classify the existing dishes. Photos are from the owner-supplied archives; the preview’s editorial photos are reused. Source journal copy remains attributed to the original project, including its mixed French/Italian descriptions.\n\n'+ '\n'.join(mapping)+'\n',encoding='utf-8')
print(f'Imported {len(products)} products, {len(categories)} categories, {len(assets)} images; {sum(a["bytes"] for a in assets)/1024/1024:.2f} MB.')
