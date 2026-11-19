export type LangCode = 'en' | 'hi' | 'mr';

export interface UrlFinding {
  url: string;
  flags: string[];
}

export interface ScamAnalysisResult {
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  engineLabel: string;
  isBaseline: true;
  suspiciousTerms: string[];
  urlFindings: UrlFinding[];
  warningSigns: Record<LangCode, string[]>;
  recommendedAction: Record<LangCode, string>;
  safetyDisclaimer: Record<LangCode, string>;
  neverOpenedUrlNotice: boolean;
}

interface WeightedPattern {
  pattern: RegExp;
  label: string;
  weight: number;
  category: 'urgency' | 'credential' | 'financial_lure' | 'impersonation' | 'remote_access';
}

const WEIGHTED_PATTERNS: WeightedPattern[] = [
  { pattern: /\b(kyc\s*(pending|expired|update|suspended|blocked|verify))\b/i, label: 'KYC update / suspension threat', weight: 28, category: 'impersonation' },
  { pattern: /\b(account\s*(will\s*be\s*)?(blocked|suspended|frozen|closed|deactivated))\b/i, label: 'Account block threat', weight: 26, category: 'urgency' },
  { pattern: /\b(share|send|enter|verify|tell)\s*(your\s*)?(otp|pin|cvv|mpin|upi\s*pin)\b/i, label: 'Request for OTP / PIN / CVV', weight: 40, category: 'credential' },
  { pattern: /\b(otp|one\s*time\s*password|cvv|mpin|atm\s*pin)\b/i, label: 'Sensitive OTP / PIN reference', weight: 18, category: 'credential' },
  { pattern: /\b(won|winner|lottery|prize|jackpot|crore|lakh\s*won|lucky\s*draw|kbc)\b/i, label: 'Unsolicited lottery or prize claim', weight: 32, category: 'financial_lure' },
  { pattern: /\b(processing\s*fee|registration\s*fee|claim\s*charges|tax\s*fee|unlock\s*fee)\b/i, label: 'Advance fee requested to claim reward', weight: 28, category: 'financial_lure' },
  { pattern: /\b(anydesk|teamviewer|quicksupport|rustdesk|screen\s*share)\b/i, label: 'Remote screen-sharing app request', weight: 36, category: 'remote_access' },
  { pattern: /\b(urgent|immediately|within\s*\d+\s*(hours?|mins?|minutes?)|act\s*now|today\s*only|last\s*chance)\b/i, label: 'Artificial time pressure / urgency', weight: 18, category: 'urgency' },
  { pattern: /\b(click\s*(here|this|below|the\s*link)|tap\s*link|open\s*link)\b/i, label: 'Pressure to click an external link', weight: 16, category: 'urgency' },
  { pattern: /\b(pan\s*card|aadhaar|aadhar|sim\s*block|electricity\s*bill\s*disconnect|power\s*cut)\b/i, label: 'PAN / Aadhaar / utility disconnection threat', weight: 24, category: 'impersonation' },
  { pattern: /\b(refund|cashback|reward\s*points\s*expir|credit\s*limit\s*increase)\b/i, label: 'Fake refund or expiring reward lure', weight: 18, category: 'financial_lure' },
  { pattern: /\b(customer\s*care|helpline\s*number|bank\s*officer|rbi|income\s*tax|police\s*case|digital\s*arrest)\b/i, label: 'Authority or customer-care impersonation', weight: 22, category: 'impersonation' },
  { pattern: /\b(upi\s*collect|approve\s*request|enter\s*upi\s*pin\s*to\s*receive)\b/i, label: 'UPI collect-request trick (PIN is never needed to receive money)', weight: 35, category: 'credential' },
  { pattern: /(ओटीपी|केवाईसी|खाता\s*बंद|लॉटरी|इनाम|तुरंत|लिंक\s*पर\s*क्लिक)/i, label: 'Hindi scam urgency / credential keywords', weight: 28, category: 'impersonation' },
  { pattern: /(ओटीपी|केवायसी|खाते\s*बंद|लॉटरी|बक्षीस|त्वरित|लिंकवर\s*क्लिक)/i, label: 'Marathi scam urgency / credential keywords', weight: 28, category: 'impersonation' },
];

const SHORTENER_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc',
]);

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.icu', '.buzz', '.click', '.loan', '.work'];

const BRAND_TOKENS = ['sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'paytm', 'phonepe', 'gpay', 'upi', 'npci', 'rbi', 'aadhaar', 'uidai', 'epfo'];
const OFFICIAL_DOMAINS = new Set([
  'onlinesbi.sbi', 'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'axisbank.com',
  'kotak.com', 'pnbindia.in', 'bankofbaroda.in', 'paytm.com', 'phonepe.com',
  'rbi.org.in', 'uidai.gov.in', 'cybercrime.gov.in', 'npci.org.in',
]);

function extractUrlsAsText(text: string): string[] {
  const regex = /\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi;
  const matches = text.match(regex) || [];
  // Also handle bare domain-like inputs if user pasted a single URL without protocol
  const trimmed = text.trim();
  if (matches.length === 0 && !trimmed.includes(' ') && /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(trimmed)) {
    return [`http://${trimmed}`];
  }
  return Array.from(new Set(matches));
}

function inspectUrlLexically(rawUrl: string): { finding: UrlFinding; scoreDelta: number; categorySignals: string[] } {
  const flags: string[] = [];
  const categorySignals: string[] = [];
  let scoreDelta = 0;

  let normalized = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(normalized);
  } catch {
    flags.push('Malformed or obfuscated URL syntax');
    return { finding: { url: rawUrl, flags }, scoreDelta: 22, categorySignals: ['url_obfuscation'] };
  }

  const host = parsed.hostname.toLowerCase();
  const fullLower = normalized.toLowerCase();

  if (rawUrl.toLowerCase().startsWith('http://')) {
    flags.push('Uses unencrypted http:// instead of https://');
    scoreDelta += 14;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    flags.push('Uses raw IP address instead of an official organization domain');
    scoreDelta += 34;
    categorySignals.push('ip_host');
  }

  if (parsed.username || parsed.password || rawUrl.includes('@')) {
    flags.push('Contains "@" symbol which can disguise the real destination website');
    scoreDelta += 32;
    categorySignals.push('at_obfuscation');
  }

  if (SHORTENER_DOMAINS.has(host)) {
    flags.push(`Uses a link shortener (${host}) that hides the final destination`);
    scoreDelta += 24;
    categorySignals.push('shortener');
  }

  if (SUSPICIOUS_TLDS.some((tld) => host.endsWith(tld))) {
    flags.push('Uses an unusual top-level domain often abused in temporary phishing sites');
    scoreDelta += 24;
    categorySignals.push('suspicious_tld');
  }

  if (host.includes('xn--')) {
    flags.push('Uses Punycode (xn--) characters that can imitate familiar letters');
    scoreDelta += 28;
  }

  const parts = host.split('.');
  if (parts.length >= 4) {
    flags.push('Contains unusually many subdomains');
    scoreDelta += 16;
  }

  if ((host.match(/-/g) || []).length >= 2) {
    flags.push('Domain name contains multiple hyphens (common in lookalike banking links)');
    scoreDelta += 18;
  }

  const mentionsBrand = BRAND_TOKENS.some((brand) => fullLower.includes(brand));
  const isKnownOfficial = OFFICIAL_DOMAINS.has(host) || Array.from(OFFICIAL_DOMAINS).some((d) => host.endsWith(`.${d}`));
  if (mentionsBrand && !isKnownOfficial) {
    flags.push('Mentions a bank/payment/government name on an unrecognized domain');
    scoreDelta += 34;
    categorySignals.push('lookalike_brand');
  }

  if (/(kyc|verify|update|login|secure|reward|claim|refund|block)/i.test(parsed.pathname + parsed.search)) {
    flags.push('Web link path contains urgent action keywords (verify/kyc/claim/block)');
    scoreDelta += 14;
  }

  return {
    finding: { url: rawUrl, flags },
    scoreDelta,
    categorySignals,
  };
}

export function analyzeScamText(rawText: string, inputType: string = 'message'): ScamAnalysisResult {
  const text = rawText.trim();
  let score = 0;
  const suspiciousTerms: string[] = [];
  const categories = new Set<string>();

  for (const item of WEIGHTED_PATTERNS) {
    const match = text.match(item.pattern);
    if (match) {
      score += item.weight;
      suspiciousTerms.push(`${item.label} ("${match[0]}")`);
      categories.add(item.category);
    }
  }

  // Check for phone numbers paired with urgency/impersonation
  if (/(?:\+91[\s-]?)?[6-9]\d{9}/.test(text) && (categories.has('urgency') || categories.has('impersonation'))) {
    score += 12;
    suspiciousTerms.push('Unverified mobile number paired with urgent request');
  }

  const urls = extractUrlsAsText(text);
  const urlFindings: UrlFinding[] = [];
  for (const url of urls) {
    const { finding, scoreDelta, categorySignals } = inspectUrlLexically(url);
    score += scoreDelta;
    if (finding.flags.length > 0) {
      urlFindings.push(finding);
      categorySignals.forEach((c) => categories.add(c));
    } else {
      urlFindings.push({
        url,
        flags: ['No obvious lexical anomalies detected, but CyberShield never visits external URLs — treat unknown links with caution.'],
      });
    }
  }

  // Clamp 0..100
  const riskScore = Math.max(0, Math.min(100, score));
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (riskScore >= 45) {
    riskLevel = 'High';
  } else if (riskScore >= 18) {
    riskLevel = 'Medium';
  }

  const hasUrl = urls.length > 0 || inputType === 'url';

  const warningSignsEn: string[] = [];
  const warningSignsHi: string[] = [];
  const warningSignsMr: string[] = [];

  if (categories.has('credential')) {
    warningSignsEn.push('It asks for or pressures you around an OTP, PIN, CVV, or UPI approval. Real banks NEVER ask for these.');
    warningSignsHi.push('इसमें OTP, PIN, CVV या UPI पिन के बारे में पूछा जा रहा है। असली बैंक कभी भी यह जानकारी नहीं मांगते।');
    warningSignsMr.push('यामध्ये OTP, PIN, CVV किंवा UPI पिन मागितला जात आहे. खरी बँक कधीही अशी माहिती मागत नाही.');
  }
  if (categories.has('urgency') || categories.has('impersonation')) {
    warningSignsEn.push('It creates fear or urgency (account blocking, KYC expiry, or utility disconnection) to rush you into acting without checking.');
    warningSignsHi.push('यह आपको डराने या जल्दीबाज़ी कराने की कोशिश कर रहा है (जैसे खाता बंद होना या KYC समाप्त होना) ताकि आप बिना सोचे कदम उठाएं।');
    warningSignsMr.push('घाई किंवा भीती दाखवून (जसे खाते बंद होणे किंवा KYC कालबाह्य होणे) तुम्हाला विचार न करता पाऊल उचलण्यास भाग पाडले जात आहे.');
  }
  if (categories.has('financial_lure')) {
    warningSignsEn.push('It promises unexpected prize money, lottery winnings, or refunds — especially if it asks for a fee first.');
    warningSignsHi.push('इसमें बिना किसी कारण के इनाम, लॉटरी या रिफंड का लालच दिया गया है — यह एक सामान्य धोखाधड़ी का तरीका है।');
    warningSignsMr.push('अपेक्षेपेक्षा जास्त बक्षीस, लॉटरी किंवा रिफंडचे आमिष दाखवले जात आहे — ही फसवणुकीची सामान्य पद्धत आहे.');
  }
  if (categories.has('remote_access')) {
    warningSignsEn.push('It mentions a screen-sharing app (like AnyDesk or TeamViewer) which lets strangers control your phone.');
    warningSignsHi.push('इसमें स्क्रीन-शेयरिंग ऐप (जैसे AnyDesk या TeamViewer) डाउनलोड करने को कहा गया है, जिससे ठग आपका फोन देख और चला सकते हैं।');
    warningSignsMr.push('यात स्क्रीन-शेअरिंग अ‍ॅप (जसे AnyDesk किंवा TeamViewer) वापरण्यास सांगितले आहे, ज्यामुळे फसवणूक करणारे तुमचा फोन नियंत्रित करू शकतात.');
  }
  if (urlFindings.some((u) => u.flags.length > 0 && !u.flags[0].startsWith('No obvious'))) {
    warningSignsEn.push('The web link shows deceptive text patterns (such as a shortened link, unusual domain, or lookalike bank name).');
    warningSignsHi.push('दिए गए वेब लिंक में संदिग्ध संकेत हैं (जैसे छोटा किया गया लिंक, अजीब वेबसाइट नाम, या नकली बैंक नाम)।');
    warningSignsMr.push('दिलेल्या वेब लिंकमध्ये संशयास्पद चिन्हे आहेत (जसे शॉर्ट लिंक, विचित्र डोमेन किंवा बँकेचे बनावट नाव).');
  }

  if (warningSignsEn.length === 0) {
    warningSignsEn.push(
      hasUrl
        ? 'No strong scam keywords were found in the text, but a pattern check alone cannot guarantee any web link is safe.'
        : 'No strong scam phrases from our baseline dictionary were detected, though you should always verify unknown senders independently.'
    );
    warningSignsHi.push(
      hasUrl
        ? 'पाठ में कोई स्पष्ट ठगी शब्द नहीं मिला, लेकिन केवल पैटर्न जांच से किसी लिंक के सुरक्षित होने की गारंटी नहीं दी जा सकती।'
        : 'हमारी शुरुआती सूची के कोई स्पष्ट ठगी शब्द नहीं मिले, फिर भी अनजान भेजने वाले की पुष्टि हमेशा अलग से करें।'
    );
    warningSignsMr.push(
      hasUrl
        ? 'मजकुरात स्पष्ट फसवणुकीचे शब्द आढळले नाहीत, पण केवळ पॅटर्न तपासणीवरून कोणतीही लिंक सुरक्षित असल्याची हमी देता येत नाही.'
        : 'आमच्या प्राथमिक यादीतील स्पष्ट फसवणुकीचे शब्द सापडले नाहीत, तरीही अनोळखी संदेश पाठवणाऱ्याची खात्री नेहमी स्वतंत्रपणे करा.'
    );
  }

  const recommendedAction: Record<LangCode, string> =
    riskLevel === 'High'
      ? {
          en: 'Do NOT tap any link, do NOT call any number inside this message, and never share an OTP or PIN. Delete or block the sender, and call your bank directly using the number on the back of your card.',
          hi: 'किसी भी लिंक पर क्लिक न करें, संदेश में दिए गए नंबर पर कॉल न करें, और कभी भी OTP या PIN साझा न करें। संदेश हटाएं और अपने बैंक के आधिकारिक नंबर पर ही बात करें।',
          mr: 'कोणत्याही लिंकवर क्लिक करू नका, मेसेजमधील नंबरवर कॉल करू नका आणि कधीही OTP किंवा PIN शेअर करू नका. मेसेज डिलीट करा आणि बँकेच्या अधिकृत नंबरवरच संपर्क साधा.',
        }
      : riskLevel === 'Medium'
      ? {
          en: 'Pause and verify before taking action. Contact your bank branch or a trusted family member directly instead of replying to this message.',
          hi: 'कोई भी कदम उठाने से पहले रुकें और जांचें। इस संदेश का जवाब देने के बजाय सीधे अपनी बैंक शाखा या परिवार के किसी विश्वसनीय सदस्य से पूछें।',
          mr: 'कोणतीही कृती करण्यापूर्वी थांबा आणि खात्री करा. या मेसेजला उत्तर देण्याऐवजी थेट तुमच्या बँकेच्या शाखेशी किंवा कुटुंबातील विश्वासू व्यक्तीशी बोला.',
        }
      : {
          en: 'Remain cautious with unknown senders. Never share OTPs, passwords, or PINs, and avoid opening unexpected links.',
          hi: 'अनोखे या अनजान संदेशों से सावधान रहें। कभी भी OTP, पासवर्ड या PIN साझा न करें और अनचाहे लिंक न खोलें।',
          mr: 'अनोळखी संदेशांबाबत सावध राहा. कधीही OTP, पासवर्ड किंवा PIN शेअर करू नका आणि अनपेक्षित लिंक उघडू नका.',
        };

  const safetyDisclaimer: Record<LangCode, string> = {
    en: 'CyberShield analyzes text patterns locally and NEVER visits or opens submitted links. A Low risk score does NOT prove a URL or message is safe.',
    hi: 'CyberShield केवल संदेश के शब्दों और लिंक के रूप की जांच करता है और कभी भी किसी लिंक को खोलता नहीं है। कम जोखिम का मतलब यह नहीं है कि लिंक पूरी तरह सुरक्षित है।',
    mr: 'CyberShield केवळ मजकूर आणि लिंकच्या रचनेची तपासणी करते आणि कोणतीही लिंक उघडत नाही. कमी धोका दिसला तरी लिंक पूर्णपणे सुरक्षित आहे असे समजू नये.',
  };

  return {
    riskLevel,
    riskScore,
    engineLabel: 'Explainable NLP & Pattern Baseline (Text-Only Inspection)',
    isBaseline: true,
    suspiciousTerms,
    urlFindings,
    warningSigns: {
      en: warningSignsEn,
      hi: warningSignsHi,
      mr: warningSignsMr,
    },
    recommendedAction,
    safetyDisclaimer,
    neverOpenedUrlNotice: hasUrl,
  };
}
