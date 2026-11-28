DELETE FROM public.sections WHERE key='shopping_test_probe';
INSERT INTO public.sections(key,title_ar,title_en) VALUES
('shopping_login_title','مرحباً بعودتك','Welcome back'),
('shopping_login_welcome','سجّل الدخول إلى حسابك في جولد سنترز.','Sign in to your Gold Centers account.'),
('shopping_register_title','أنشئ حسابك الآن','Create your account'),
('shopping_register_welcome','انضم إلى GOLD CENTERS واستمتع بتجربة احترافية في عالم المعادن الثمينة.','Join GOLD CENTERS for a professional precious-metals experience.'),
('shopping_full_name','الاسم بالكامل','Full name'),
('shopping_phone','رقم الهاتف','Phone number'),
('shopping_country_code','مفتاح الدولة','Country code'),
('shopping_terms_agree','أوافق على الشروط والأحكام وسياسة الخصوصية','I agree to the terms and privacy policy'),
('shopping_terms_required','يجب الموافقة على الشروط والأحكام للمتابعة.','You must accept the terms to continue.'),
('shopping_name_invalid','يرجى إدخال الاسم بالكامل.','Please enter your full name.'),
('shopping_email_invalid','يرجى إدخال بريد إلكتروني صحيح.','Please enter a valid email address.'),
('shopping_phone_invalid','رقم الهاتف غير صحيح لهذه الدولة.','This phone number is not valid for the selected country.'),
('shopping_strength_weak','قوة كلمة المرور: ضعيفة','Password strength: weak'),
('shopping_strength_medium','قوة كلمة المرور: متوسطة','Password strength: medium'),
('shopping_strength_strong','قوة كلمة المرور: قوية','Password strength: strong'),
('shopping_verify_title','تحقق من بريدك الإلكتروني','Verify your email'),
('shopping_verify_body','أرسلنا رسالة تحقق إلى بريدك الإلكتروني. افتح الرابط في الرسالة لتفعيل حسابك.','We sent a verification email. Open the link in it to activate your account.'),
('shopping_verify_resend','إعادة إرسال رسالة التحقق','Resend verification email'),
('shopping_verify_resent','تمت إعادة إرسال رسالة التحقق.','Verification email sent again.'),
('shopping_forgot_title','نسيت كلمة المرور؟','Forgot your password?'),
('shopping_forgot_welcome','أدخل بريدك وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.','Enter your email and we will send you a reset link.')
ON CONFLICT (key) DO NOTHING;