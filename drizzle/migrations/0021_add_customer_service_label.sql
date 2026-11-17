insert into public.sections(key,title_ar,title_en,body_ar,body_en) values
('customer_service','خدمة العملاء','Customer Service','للاستفسار وخدمة العملاء فقط — طلبات الشراء تتم من أرقام الطلبات المعتادة.','For inquiries and customer service only — purchase orders go through the usual order numbers.')
on conflict (key) do nothing;