create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first signed-up user becomes admin
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_first_admin();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at = now(); return new; end $$;

create table public.site_settings (
  id int primary key default 1 check (id=1),
  site_name_ar text not null default 'دار السبائك', site_name_en text not null default 'Aurum House',
  logo_url text, whatsapp_number text not null default '201000000000',
  phone text default '+20 100 000 0000', email text default 'info@example.com',
  address_ar text default 'القاهرة، مصر', address_en text default 'Cairo, Egypt',
  facebook text, instagram text, youtube text, tiktok text,
  gold_usd numeric not null default 4079.56, silver_usd numeric not null default 57.43,
  years_experience int not null default 90,
  popup_enabled boolean not null default true,
  popup_title_ar text default 'تحقق من منتجك بسهولة', popup_title_en text default 'Verify your product easily',
  popup_link text default '#', popup_button_ar text default 'افتح الرابط', popup_button_en text default 'Open link',
  app_link text default '#',
  updated_at timestamptz not null default now()
);
insert into public.site_settings(id) values (1);

create table public.slides (id uuid primary key default gen_random_uuid(), title_ar text not null default '', title_en text not null default '', body_ar text default '', body_en text default '', button_ar text default '', button_en text default '', link text default '#', image_url text, sort int not null default 0, active boolean not null default true, created_at timestamptz not null default now());

create table public.metal_prices (id uuid primary key default gen_random_uuid(), name_ar text not null, name_en text not null, sell numeric not null default 0, buy numeric not null default 0, sort int not null default 0, updated_at timestamptz not null default now());
create trigger mp_touch before update on public.metal_prices for each row execute function public.touch_updated_at();

create table public.price_history (id uuid primary key default gen_random_uuid(), day date not null unique, usd numeric not null, egp numeric not null);

create table public.sections (key text primary key, title_ar text default '', title_en text default '', body_ar text default '', body_en text default '', image_url text);

create table public.services (id uuid primary key default gen_random_uuid(), title_ar text not null, title_en text not null, body_ar text default '', body_en text default '', image_url text, sort int not null default 0);

create table public.products (id uuid primary key default gen_random_uuid(), name_ar text not null, name_en text not null, description_ar text default '', description_en text default '', price numeric, image_url text, active boolean not null default true, sort int not null default 0, created_at timestamptz not null default now());

create table public.posts (id uuid primary key default gen_random_uuid(), kind text not null default 'blog' check (kind in ('blog','news')), slug text not null unique, title_ar text not null, title_en text not null, excerpt_ar text default '', excerpt_en text default '', body_ar text default '', body_en text default '', image_url text, published boolean not null default true, created_at timestamptz not null default now());

create table public.contact_messages (id uuid primary key default gen_random_uuid(), name text not null check (char_length(name) between 1 and 120), email text not null check (char_length(email) between 3 and 200), phone text check (char_length(phone) <= 40), message text not null check (char_length(message) between 1 and 3000), created_at timestamptz not null default now());

do $$ declare t text; begin
  foreach t in array array['site_settings','slides','metal_prices','price_history','sections','services','products'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

grant select on public.posts to anon, authenticated; grant insert, update, delete on public.posts to authenticated; grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "read published" on public.posts for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.posts for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

grant insert on public.contact_messages to anon, authenticated; grant select, delete on public.contact_messages to authenticated; grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "anyone send" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "admin read" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- storage policies for 'media' bucket
create policy "media public read" on storage.objects for select using (bucket_id='media');
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id='media' and public.has_role(auth.uid(),'admin'));
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id='media' and public.has_role(auth.uid(),'admin'));
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id='media' and public.has_role(auth.uid(),'admin'));

-- seed
insert into public.slides(title_ar,title_en,body_ar,body_en,button_ar,button_en,link,sort) values
('عقود من الريادة في المعادن الثمينة','Decades of leadership in precious metals','خبرة طويلة في تجارة وتكرير الذهب والفضة بأعلى معايير الجودة.','A long legacy in gold and silver trading and refining with the highest quality standards.','تعرف على قصتنا','Our story','/about',1),
('بريق يدوم','A shine that lasts','تصاميم ذهبية مختارة تصلك حتى باب بيتك.','Curated gold designs delivered to your door.','تسوق الآن','Shop now','/products',2),
('خدمات حصرية للشركات','Exclusive corporate services','هدايا، سبائك مخصصة، وتنويع المحافظ الاستثمارية.','Gifting, custom bullion and portfolio diversification.','اعرف المزيد','Learn more','/services',3),
('حلول للأعمال','Built for business','نخدم شركاءنا من تجار الجملة والتجزئة والشركات.','Serving wholesalers, retailers and corporates.','استكشف','Explore','/services',4);

insert into public.metal_prices(name_ar,name_en,sell,buy,sort) values
('جنيه ذهب','Gold Pound',50172,49454,1),('ذهب عيار 21','21K Gold',6223,6162.3,2),('ذهب عيار 24','24K Gold',7111.18,7041.73,3),
('سبيكة 5 جرام','5 Gram Ingot',35863,35326,4),('سبيكة 10 جرام','10 Gram Ingot',71727,70652,5),('سبيكة 20 جرام','20 Gram Ingot',143373,141304,6),
('أوقية ذهب','Gold Ounce',222905,219749,7),('سبيكة 50 جرام','50 Gram Ingot',357859,352836,8),('سبيكة 100 جرام','100 Gram Ingot',715717,705671,9);

insert into public.price_history(day,usd,egp)
select d::date, round((2000 + (extract(epoch from d - (current_date - interval '5 years'))/86400) * 1.15 + sin(extract(epoch from d)/2000000)*120)::numeric,2),
 round(((2000 + (extract(epoch from d - (current_date - interval '5 years'))/86400) * 1.15) * (15.7 + (extract(epoch from d - (current_date - interval '5 years'))/86400)*0.018) / 31.1 * 0.875)::numeric,2)
from generate_series(current_date - interval '5 years', current_date, interval '7 days') d;

insert into public.sections(key,title_ar,title_en,body_ar,body_en) values
('about','من نحن','About us','منذ تأسيسنا ونحن نقود سوق الذهب والمعادن الثمينة، مع واحدة من أكبر مصافي الذهب في المنطقة.','Since our founding we have led the gold and precious metals market, operating one of the largest refineries in the region.'),
('history','تاريخنا','Our history','بدأت رحلتنا بورشة صغيرة وتحولت إلى مؤسسة رائدة تخدم آلاف العملاء.','Our journey began with a small workshop and grew into a leading institution serving thousands.'),
('chairman','رسالة رئيس مجلس الإدارة','Chairman message','نؤمن أن الذهب ليس مجرد معدن، بل ثقة تنتقل من جيل إلى جيل.','We believe gold is more than a metal — it is trust passed from one generation to the next.'),
('vision','رؤيتنا','Our vision','أن نكون الخيار الأول للادخار الآمن في الذهب في المنطقة.','To be the region''s first choice for secure gold savings.'),
('mission','رسالتنا','Our mission','تقديم منتجات ذهب موثوقة بشفافية كاملة في التسعير.','Deliver trusted gold products with full pricing transparency.'),
('values','قيمنا','Our values','الفخر، النزاهة، الجودة، والابتكار.','Pride, integrity, quality and innovation.'),
('app','حمّل تطبيقنا','Download our app','تابع الأسعار واشترِ واحتفظ بمدخراتك من هاتفك.','Track prices, buy and store your savings from your phone.');

insert into public.services(title_ar,title_en,body_ar,body_en,sort) values
('خدمات الشركات','Corporate services','هدايا الشركات، سبائك بشعارك، وتنويع المحافظ.','Corporate gifting, branded bullion and portfolio diversification.',1),
('خدمات الجملة','Wholesale services','توريد السبائك والمشغولات لتجار الجملة والتجزئة.','Bullion and jewelry supply for wholesalers and retailers.',2),
('خدمات التكرير','Refinery services','تكرير الذهب والفضة بأحدث التقنيات ومعايير دولية.','Gold and silver refining with modern technology and international standards.',3);

insert into public.products(name_ar,name_en,description_ar,description_en,sort) values
('جنيه ذهب عيار 21 - 8 جرام','21K Gold Pound - 8 g','جنيه ذهب بتصميم إسلامي.','Gold pound with an Islamic design.',1),
('سبيكة أوقية عيار 24 - 31.1 جرام','24K Gold Ounce - 31.1 g','سبيكة أوقية معتمدة.','Certified ounce bar.',2),
('سبيكة فرعونية عيار 24 - 100 جرام','24K Pharaonic Ingot - 100 g','سبيكة بتصميم فرعوني.','Ingot with a pharaonic design.',3),
('سبيكة بيضاوية عيار 24 - 10 جرام','24K Oval Ingot - 10 g','سبيكة بيضاوية أنيقة.','Elegant oval ingot.',4),
('ملعقة مولود ذهب عيار 24 - 5 جرام','24K New Born Gold Spoon - 5 g','هدية مثالية للمواليد.','A perfect newborn gift.',5),
('دلاية برج ذهب عيار 21','21K Zodiac Pendant','دلاية بتصميم الأبراج.','Zodiac design pendant.',6);

insert into public.posts(kind,slug,title_ar,title_en,excerpt_ar,excerpt_en,body_ar,body_en) values
('blog','silver-portfolio','5 أسباب لإضافة الفضة لمحفظتك','5 reasons to add silver to your portfolio','لماذا تعد الفضة خيارًا ذكيًا للتنويع؟','Why silver is a smart diversification choice.','الفضة معدن ثمين بسعر في المتناول، وتستخدم في الصناعة، وتحمي من التضخم...','Silver is an accessible precious metal, used in industry and a hedge against inflation...'),
('blog','gold-zakat-guide','دليلك لحساب زكاة الذهب','Your guide to calculating gold zakat','كيف تحسب زكاة ذهبك بخطوات بسيطة.','How to calculate zakat on your gold in simple steps.','نصاب الذهب 85 جرامًا من عيار 24، والزكاة 2.5% من القيمة إذا حال عليها الحول...','The gold nisab is 85 g of 24K; zakat is 2.5% of the value after one lunar year...'),
('news','gold-rises-dollar-weakens','الذهب يرتفع مع ضعف الدولار','Gold rises as the dollar weakens','ارتفاع أسعار الذهب وسط ترقب قرارات الفائدة.','Gold prices climb as markets await rate decisions.','شهدت أسعار الذهب ارتفاعًا ملحوظًا اليوم...','Gold prices rose notably today...'),
('news','silver-gains','الفضة تحقق مكاسب ملحوظة','Silver posts notable gains','الفضة تواصل الصعود.','Silver keeps climbing.','حققت الفضة مكاسب قوية خلال الأسبوع...','Silver posted strong gains this week...');
