/* =======================================================================
   WASHEEJ — public site script
   Content is expressed as plain data objects (SERVICES, CONTENT) on
   purpose: this is the shape a future /api/public/* response will take,
   so switching to server-fetched content later is a data-source swap,
   not a template rewrite.
   ======================================================================= */

const SERVICES = [
  {
    id: 'bots',
    title: { ar: 'بوتات تيليجرام', en: 'Telegram Bots' },
    desc: {
      ar: 'أدوات وأتمتة مخصصة داخل تيليجرام: إدارة مجتمع، استقبال طلبات، أو تسهيل مهمة متكررة.',
      en: 'Custom tools and automation inside Telegram — community management, request intake, or a repetitive task made simpler.'
    },
    price: 5000,
    currency: 'DA'
  },
  {
    id: 'web',
    title: { ar: 'مواقع وتطبيقات ويب', en: 'Websites & Web Apps' },
    desc: {
      ar: 'واجهات وصفحات مبنية خصيصًا لفكرتك، بأداء جيد وبنية واضحة تدعم النمو لاحقًا.',
      en: 'Interfaces and pages built specifically for your idea, with solid performance and a structure that can grow later.'
    },
    price: 15000,
    currency: 'DA'
  },
  {
    id: 'video',
    title: { ar: 'مقاطع مرئية', en: 'Video & Motion' },
    desc: {
      ar: 'مونتاج وموشن جرافيك لعرض فكرتك أو مشروعك بشكل واضح ومباشر.',
      en: 'Editing and motion graphics to present your idea or project clearly.'
    },
    price: 5000,
    currency: 'DA'
  }
];

const ADDONS = [
  { id: 'hosting', price: 4000, label: { ar: 'استضافة واسم نطاق', en: 'Hosting & domain' } },
  { id: 'express', price: 2000, label: { ar: 'تسليم سريع (24–48 ساعة)', en: 'Express delivery (24–48h)' } },
  { id: 'support', price: 2000, label: { ar: 'دعم فني وتعديلات ممتدة', en: 'Extended support & edits' } }
];

const EXCHANGE_RATES = { DZD: 1, SAR: 0.028, USD: 0.0075, EUR: 0.0068, USDT: 0.0075 };
const CURRENCY_SYMBOLS = { DZD: 'DA', SAR: 'SAR', USD: '$', EUR: '€', USDT: 'USDT' };

/* Payment details preserved exactly as they exist today — not invented,
   not altered. Redesigned only in presentation (step-based, copyable). */
const PAYMENT = {
  local: {
    ccp: '0028372494',
    cle: '30',
    rip: '00799999002837249430'
  },
  crypto: {
    network: 'USDT / TRX — Tron (TRC20)',
    address: 'TMEizSVGg3tsrw1HLYkGfMWMrSGWm5RN7X'
  }
};

const DICT = {
  ar: {
    navServices: 'الخدمات', navLab: 'وشيج لاب', navFaq: 'الأسئلة الشائعة', navRequest: 'أرسل فكرتك',
    heroTitle: 'من الفكرة إلى شيء يمكن بناؤه',
    heroBody: 'قد تكون فكرتك غير واضحة بعد، أو مبعثرة، أو صعبة الشرح. نفهمها أولًا، ثم نحدّد ما يمكن تنفيذه فعلًا.',
    heroPrimary: 'ابدأ بفكرتك', heroSecondary: 'تصفح الخدمات',
    processTitle: 'كيف نعمل', processLede: 'ليست كل فكرة تحتاج خدمة جاهزة من القائمة. نمرّ معًا بهذا المسار قبل تحديد ما سيُبنى فعلًا.',
    whyTitle: 'لماذا وشيج',
    why1t: 'الفهم قبل الحل', why1d: 'نناقش الفكرة ونستوعبها أولًا، قبل اقتراح أي حل تقني.',
    why2t: 'حسب الفكرة، لا حسب القالب', why2d: 'نبني الحل وفق ما تحتاجه فعلًا، لا وفق قالب جاهز مسبقًا.',
    why3t: 'بنية واضحة', why3d: 'بنية تقنية مرتبة، سهلة الفهم والصيانة والتوسّع لاحقًا.',
    why4t: 'تواصل بعد التسليم', why4d: 'نبقى على تواصل بعد التسليم لمعالجة الملاحظات والتعديلات الضرورية.',
    servicesTitle: 'الخدمات', servicesLede: 'نقطة انطلاق إذا كنت تعرف ما تحتاجه بالفعل.',
    priceFrom: 'ابتداءً من', requestBtn: 'اطلب هذه الخدمة',
    labTitle: 'وشيج لاب', labLede: 'مساحة للتجارب والمشاريع الذاتية، منفصلة عن أعمال العملاء.',
    labTag: 'تجربة ذاتية', labEntryTitle: 'هذا الموقع',
    labEntryDesc: 'الموقع الذي تتصفحه الآن جزء من هذا المشروع نفسه — من الهوية البصرية إلى بنية البيانات وواجهة الإدارة. نعتبره أول تجربة حقيقية لأسلوب وشيج في العمل، لا مثالًا افتراضيًا.',
    faqTitle: 'الأسئلة الشائعة',
    faqQ1: 'كيف تُحدَّد التكلفة النهائية؟', faqA1: 'تعتمد على حجم الفكرة والميزات المطلوبة والوقت اللازم للتنفيذ. الأسعار المذكورة أسعار ابتدائية، تُؤكَّد بعد مناقشة تفاصيل المشروع.',
    faqQ2: 'هل تُوفَّر استضافة واسم نطاق؟', faqA2: 'نعم، كخدمة إضافية عند الحاجة، أو يمكن ربط المشروع باستضافتك الخاصة إن وُجدت.',
    faqQ3: 'ما طرق الدفع المتاحة؟', faqA3: 'التحويل المحلي داخل الجزائر (CCP)، والعملات الرقمية (USDT). التفاصيل الكاملة تظهر عند إرسال الطلب.',
    faqQ4: 'هل يمكن طلب تعديلات بعد التسليم؟', faqA4: 'نعم، ضمن فترة دعم فني بعد التسليم، وباتفاق منفصل لأي تعديلات أوسع لاحقًا.',
    faqQ5: 'هل يعني إرسال الطلب أنه مقبول تلقائيًا؟', faqA5: 'لا. كل طلب يُراجَع يدويًا قبل الموافقة عليه أو البدء في تنفيذه، وسنتواصل معك بعد المراجعة.',
    reqBandTitle: 'عندك فكرة؟', reqBandBody: 'أرسلها كما هي، حتى إن لم تكن واضحة تمامًا بعد. نراجعها من جهتنا.',
    reqBandCta: 'أرسل فكرتك',
    footerRights: 'جميع الحقوق محفوظة.',
    systemClosed: 'استقبال الطلبات متوقف مؤقتًا حاليًا. يُرجى المحاولة لاحقًا.',
    modalTitle: 'أرسل فكرتك أو اطلب خدمة',
    notSure: 'لست متأكدًا من الخدمة المناسبة',
    draftFound: 'استعدنا بيانات طلب سابق لم يُرسَل بعد.', draftClear: 'مسح والبدء من جديد',
    modeSeat: 'حجز مقعد مبدئي', modeFull: 'تأكيد الدفع',
    formName: 'الاسم الكامل', formEmail: 'البريد الإلكتروني', formPhone: 'رقم الهاتف',
    formService: 'الخدمة المطلوبة', formIdea: 'تفاصيل الفكرة',
    addonsLabel: 'إضافات اختيارية',
    payTitle: 'طريقة الدفع', payLocal: 'تحويل محلي (الجزائر)', payCrypto: 'عملات رقمية',
    payCcp: 'رقم CCP', payCle: 'المفتاح', payRip: 'RIP', payNetwork: 'الشبكة', payAddress: 'المحفظة',
    payNote: 'يُرجى إرفاق لقطة شاشة أو رقم الحوالة لتأكيد الطلب بعد الدفع.',
    copy: 'نسخ', copied: 'تم النسخ',
    refLabel: 'رقم الحوالة أو رقم مرجعي', receiptLabel: 'أو أرفق صورة الإيصال',
    currencyLabel: 'عرض السعر بعملة أخرى',
    receiptBase: 'السعر الأساسي', receiptExtras: 'الإضافات', receiptTotal: 'الإجمالي التقديري',
    scopeText: 'أؤكد أن هذا الطلب لا يتعارض مع نطاق عمل وشيج.',
    submit: 'إرسال الطلب', sending: 'جارٍ الإرسال…',
    success: 'وصلت الفكرة. الحالة الآن: قيد المراجعة. سنتواصل معك بعد المراجعة.',
    error: 'تعذّر إرسال الطلب. تحقق من الاتصال وحاول مرة أخرى.',
    closedNow: 'مغلق مؤقتًا'
  },
  en: {
    navServices: 'Services', navLab: 'WASHEEJ Lab', navFaq: 'FAQ', navRequest: 'Send your idea',
    heroTitle: 'From an idea to something buildable',
    heroBody: 'Your idea might not be clear yet — or it\u2019s scattered, or hard to explain. We understand it first, then work out what can actually be built.',
    heroPrimary: 'Start with your idea', heroSecondary: 'Browse services',
    processTitle: 'How we work', processLede: 'Not every idea needs a service picked off a list. This is the path we take together before deciding what actually gets built.',
    whyTitle: 'Why WASHEEJ',
    why1t: 'Understanding before solutions', why1d: 'We discuss and understand the idea first, before proposing any technical solution.',
    why2t: 'Built for the idea, not a template', why2d: 'The solution is shaped by what you actually need, not a pre-made template.',
    why3t: 'Clear structure', why3d: 'A clean technical structure that\u2019s easy to understand, maintain, and extend later.',
    why4t: 'Support after delivery', why4d: 'We stay reachable after delivery to handle feedback and necessary fixes.',
    servicesTitle: 'Services', servicesLede: 'A starting point if you already know what you need.',
    priceFrom: 'starting at', requestBtn: 'Request this service',
    labTitle: 'WASHEEJ Lab', labLede: 'A space for self-initiated projects and experiments, separate from client work.',
    labTag: 'self-initiated', labEntryTitle: 'This website',
    labEntryDesc: 'The site you\u2019re on is part of this same project — the visual identity, the data structure, and the admin interface. We consider it the first real example of how WASHEEJ works, not a hypothetical one.',
    faqTitle: 'Frequently asked questions',
    faqQ1: 'How is the final cost decided?', faqA1: 'It depends on the size of the idea, the features needed, and the time required. Listed prices are starting points, confirmed after discussing project details.',
    faqQ2: 'Do you provide hosting and a domain?', faqA2: 'Yes, as an add-on when needed, or the project can be connected to your own hosting if you have one.',
    faqQ3: 'What payment methods are available?', faqA3: 'Local transfer within Algeria (CCP), and USDT. Full details are shown when you submit a request.',
    faqQ4: 'Can I request changes after delivery?', faqA4: 'Yes, within a support window after delivery, and by separate agreement for any larger changes later.',
    faqQ5: 'Does sending a request mean it\u2019s automatically accepted?', faqA5: 'No. Every request is reviewed manually before it\u2019s approved or started, and we\u2019ll follow up after that review.',
    reqBandTitle: 'Have an idea?', reqBandBody: 'Send it as it is, even if it isn\u2019t fully clear yet. We\u2019ll take it from there.',
    reqBandCta: 'Send your idea',
    footerRights: 'All rights reserved.',
    systemClosed: 'Requests are temporarily closed. Please check back later.',
    modalTitle: 'Send your idea or request a service',
    notSure: 'Not sure which service fits',
    draftFound: 'We restored a previous unsent request.', draftClear: 'Clear and start over',
    modeSeat: 'Reserve a spot', modeFull: 'Confirm payment',
    formName: 'Full name', formEmail: 'Email', formPhone: 'Phone number',
    formService: 'Requested service', formIdea: 'Idea details',
    addonsLabel: 'Optional add-ons',
    payTitle: 'Payment method', payLocal: 'Local transfer (Algeria)', payCrypto: 'Crypto',
    payCcp: 'CCP number', payCle: 'Key (Cl\u00e9)', payRip: 'RIP', payNetwork: 'Network', payAddress: 'Wallet',
    payNote: 'Please attach a screenshot or reference number to confirm the request after paying.',
    copy: 'Copy', copied: 'Copied',
    refLabel: 'Transfer/reference number', receiptLabel: 'Or attach a receipt image',
    currencyLabel: 'Show price in another currency',
    receiptBase: 'Base price', receiptExtras: 'Add-ons', receiptTotal: 'Estimated total',
    scopeText: 'I confirm this request falls within WASHEEJ\u2019s work scope.',
    submit: 'Submit request', sending: 'Sending\u2026',
    success: 'Your idea is in. Status: under review. We\u2019ll follow up after reviewing it.',
    error: 'Couldn\u2019t send the request. Check your connection and try again.',
    closedNow: 'Closed for now'
  }
};

let lang = localStorage.getItem('washeej_lang') || 'ar';
let paymentMode = 'seat';
let payMethod = 'local';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function t(key) { return DICT[lang][key] ?? key; }

function applyLanguage() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (DICT[lang][key] !== undefined) el.textContent = t(key);
  });
  $('#langToggle span').textContent = lang === 'ar' ? 'EN' : 'AR';
  renderServices();
  renderFaq();
  updateReceipt();
  checkSystemState();
}

function toggleLanguage() {
  lang = lang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('washeej_lang', lang);
  applyLanguage();
}

/* ---------- services ---------- */

function renderServices() {
  const list = $('#servicesList');
  if (!list) return;
  list.innerHTML = '';
  SERVICES.forEach(svc => {
    const row = document.createElement('div');
    row.className = 'service-row';
    row.innerHTML = `
      <div class="service-main">
        <h3>${svc.title[lang]}</h3>
        <p>${svc.desc[lang]}</p>
      </div>
      <div class="service-meta">
        <div class="service-price">${t('priceFrom')} <strong>${svc.price}</strong> <span class="unit">${svc.currency}</span></div>
        <button class="btn btn-ghost" data-service="${svc.id}">${t('requestBtn')}</button>
      </div>`;
    list.appendChild(row);
  });
  $$('#servicesList [data-service]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-service')));
  });

  const select = $('#formService');
  if (select) {
    const current = select.value;
    select.innerHTML = `<option value="unsure">${t('notSure')}</option>` +
      SERVICES.map(s => `<option value="${s.id}">${s.title[lang]} — ${t('priceFrom')} ${s.price} ${s.currency}</option>`).join('');
    if (current) select.value = current;
  }
}

/* ---------- faq ---------- */

const FAQ_KEYS = [['faqQ1','faqA1'],['faqQ2','faqA2'],['faqQ3','faqA3'],['faqQ4','faqA4'],['faqQ5','faqA5']];

function renderFaq() {
  const list = $('#faqList');
  if (!list) return;
  const openIndex = $$('#faqList .faq-item').findIndex(el => el.classList.contains('open'));
  list.innerHTML = '';
  FAQ_KEYS.forEach(([qKey, aKey], i) => {
    const item = document.createElement('div');
    item.className = 'faq-item' + (i === openIndex ? ' open' : '');
    item.innerHTML = `
      <button class="faq-q" aria-expanded="${i === openIndex}">
        <span>${t(qKey)}</span><span class="sign">${i === openIndex ? '\u2212' : '+'}</span>
      </button>
      <div class="faq-a"><p>${t(aKey)}</p></div>`;
    item.querySelector('.faq-q').addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      $$('.faq-item', list).forEach(el => { el.classList.remove('open'); el.querySelector('.sign').textContent = '+'; el.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); });
      if (willOpen) {
        item.classList.add('open');
        item.querySelector('.sign').textContent = '\u2212';
        item.querySelector('.faq-q').setAttribute('aria-expanded', 'true');
      }
    });
    list.appendChild(item);
  });
}

/* ---------- addons + receipt ---------- */

function renderAddons() {
  const box = $('#addonsBox');
  if (!box) return;
  box.innerHTML = ADDONS.map(a => `
    <label class="addon-row">
      <input type="checkbox" data-addon="${a.id}" data-price="${a.price}">
      <span>${a.label[lang]} (+${a.price} DA)</span>
    </label>`).join('');
  $$('#addonsBox input').forEach(cb => cb.addEventListener('change', () => { updateReceipt(); saveDraft(); }));
}

function selectedAddons() {
  return $$('#addonsBox input:checked').map(cb => cb.getAttribute('data-addon'));
}

function updateReceipt() {
  const select = $('#formService');
  const svc = SERVICES.find(s => s.id === select?.value);
  const base = svc ? svc.price : 0;
  const extras = $$('#addonsBox input:checked').reduce((sum, cb) => sum + Number(cb.getAttribute('data-price')), 0);
  const totalDZD = base + extras;
  const currencySel = $('#currencySelect');
  const currency = currencySel ? currencySel.value : 'DZD';
  const rate = EXCHANGE_RATES[currency] ?? 1;
  const converted = (totalDZD * rate).toFixed(currency === 'DZD' ? 0 : 2);

  if ($('#receiptBase')) $('#receiptBase').textContent = `${base} DA`;
  if ($('#receiptExtras')) $('#receiptExtras').textContent = `${extras} DA`;
  if ($('#receiptTotal')) $('#receiptTotal').textContent = `${converted} ${CURRENCY_SYMBOLS[currency] ?? currency}`;
}

/* ---------- payment method blocks ---------- */

function renderPayment() {
  const local = $('#payLocalBlock');
  const crypto = $('#payCryptoBlock');
  if (!local || !crypto) return;
  local.style.display = payMethod === 'local' ? 'block' : 'none';
  crypto.style.display = payMethod === 'crypto' ? 'block' : 'none';
  $$('.pay-method-toggle button').forEach(b => b.classList.toggle('active', b.dataset.method === payMethod));
}

function setPayMethod(method) {
  payMethod = method;
  renderPayment();
}

function copyValue(value, btn) {
  const done = () => {
    const original = btn.textContent;
    btn.textContent = t('copied');
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(done).catch(done);
  } else {
    done();
  }
}

/* ---------- payment mode (seat vs full) ---------- */

function setPaymentMode(mode) {
  paymentMode = mode;
  $$('.mode-toggle button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  const showFull = mode === 'full';
  $('#paymentZone').style.display = showFull ? 'block' : 'none';
  $('#refGroup').style.display = showFull ? 'block' : 'none';
  saveDraft();
}

/* ---------- modal open/close ---------- */

function openModal(serviceId = 'unsure') {
  if (localStorage.getItem('washeej_system_locked') === 'true') return;
  $('#formService').value = serviceId;
  $('#requestModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateReceipt();
}

function closeModal() {
  $('#requestModal').classList.remove('open');
  document.body.style.overflow = '';
}

/* ---------- draft persistence ---------- */

function saveDraft() {
  const draft = {
    name: $('#formName').value, email: $('#formEmail').value, phone: $('#formPhone').value,
    service: $('#formService').value, idea: $('#formIdea').value,
    addons: selectedAddons(), paymentMode, currency: $('#currencySelect').value,
    ref: $('#formRef').value
  };
  localStorage.setItem('washeej_form_draft', JSON.stringify(draft));
}

function loadDraft() {
  const raw = localStorage.getItem('washeej_form_draft');
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    let has = false;
    if (d.name) { $('#formName').value = d.name; has = true; }
    if (d.email) { $('#formEmail').value = d.email; has = true; }
    if (d.phone) { $('#formPhone').value = d.phone; has = true; }
    if (d.service) $('#formService').value = d.service;
    if (d.idea) { $('#formIdea').value = d.idea; has = true; }
    if (d.currency) $('#currencySelect').value = d.currency;
    if (d.ref) $('#formRef').value = d.ref;
    if (Array.isArray(d.addons)) {
      d.addons.forEach(id => {
        const cb = $(`#addonsBox input[data-addon="${id}"]`);
        if (cb) cb.checked = true;
      });
    }
    if (d.paymentMode) setPaymentMode(d.paymentMode);
    if (has) $('#draftBanner').classList.add('show');
  } catch (e) { /* ignore malformed draft */ }
}

function clearDraft() {
  localStorage.removeItem('washeej_form_draft');
  $('#requestForm').reset();
  $$('#addonsBox input').forEach(cb => cb.checked = false);
  $('#draftBanner').classList.remove('show');
  setPaymentMode('seat');
  updateReceipt();
}

/* ---------- system lock ---------- */

function checkSystemState() {
  const locked = localStorage.getItem('washeej_system_locked') === 'true';
  const banner = $('#systemBanner');
  if (banner) banner.style.display = locked ? 'block' : 'none';
  $$('[data-service]').forEach(btn => { btn.disabled = locked; if (locked) btn.textContent = t('closedNow'); });
}

/* ---------- submit ---------- */

function handleSubmit(event) {
  event.preventDefault();
  const submitBtn = $('#submitBtn');
  const feedback = $('#formFeedback');
  submitBtn.disabled = true;
  feedback.className = 'form-feedback pending';
  feedback.textContent = t('sending');

  const svc = SERVICES.find(s => s.id === $('#formService').value);
  const serviceLabel = svc ? svc.title[lang] : t('notSure');
  const addonLabels = selectedAddons().map(id => {
    const a = ADDONS.find(x => x.id === id);
    return a ? a.label[lang] : id;
  });

  const payload = {
    name: $('#formName').value,
    email: $('#formEmail').value,
    phone: $('#formPhone').value,
    service: serviceLabel,
    idea: $('#formIdea').value + (addonLabels.length ? `\n${t('addonsLabel')}: ${addonLabels.join(', ')}` : ''),
    paymentMode,
    ref: $('#formRef').value || '—',
    finalDue: $('#receiptTotal').textContent,
    scopeConfirmed: $('#scopeCheck').checked
  };

  const send = () => {
    fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          feedback.className = 'form-feedback success';
          feedback.textContent = t('success');
          clearDraft();
          setTimeout(() => { closeModal(); feedback.className = 'form-feedback'; feedback.textContent = ''; }, 3500);
        } else {
          throw new Error(data.message || 'error');
        }
      })
      .catch(() => {
        feedback.className = 'form-feedback error';
        feedback.textContent = t('error');
      })
      .finally(() => { submitBtn.disabled = false; });
  };

  const fileInput = $('#formReceiptFile');
  if (fileInput?.files?.length) {
    const reader = new FileReader();
    reader.onload = e => {
      payload.receiptFileBase64 = e.target.result;
      payload.receiptFileName = fileInput.files[0].name;
      send();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    send();
  }
}

/* ---------- init ---------- */

document.addEventListener('DOMContentLoaded', () => {
  renderAddons();
  applyLanguage();
  loadDraft();
  setPaymentMode(paymentMode);
  setPayMethod(payMethod);

  $('#langToggle').addEventListener('click', toggleLanguage);
  $('#navToggle').addEventListener('click', () => $('.site-nav').classList.toggle('menu-open'));
  $$('.js-open-modal').forEach(el => el.addEventListener('click', () => openModal('unsure')));
  $('#modalClose').addEventListener('click', closeModal);
  $('#requestModal').addEventListener('click', e => { if (e.target.id === 'requestModal') closeModal(); });
  $('#requestForm').addEventListener('submit', handleSubmit);
  $$('.mode-toggle button').forEach(b => b.addEventListener('click', () => setPaymentMode(b.dataset.mode)));
  $$('.pay-method-toggle button').forEach(b => b.addEventListener('click', () => setPayMethod(b.dataset.method)));
  $$('.copy-btn').forEach(b => b.addEventListener('click', () => copyValue(b.dataset.value, b)));
  $('#formService').addEventListener('change', () => { updateReceipt(); saveDraft(); });
  $('#currencySelect').addEventListener('change', () => { updateReceipt(); saveDraft(); });
  ['formName', 'formEmail', 'formPhone', 'formIdea', 'formRef'].forEach(id => {
    $('#' + id).addEventListener('input', saveDraft);
  });
  $('#draftClearBtn').addEventListener('click', clearDraft);

  requestAnimationFrame(() => $('.hero-inner').classList.add('is-visible'));
});
