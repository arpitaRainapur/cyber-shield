import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { hashPassword } from './security.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'cybershield.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface TutorialSeed {
  slug: string;
  category: string;
  order_index: number;
  image_url: string;
  title_en: string;
  title_hi: string;
  title_mr: string;
  summary_en: string;
  summary_hi: string;
  summary_mr: string;
  script_en: string;
  script_hi: string;
  script_mr: string;
  tips_json: string;
  quiz_json: string;
}

const TUTORIAL_SEEDS: TutorialSeed[] = [
  {
    slug: 'kyc-fraud',
    category: 'Banking Safety',
    order_index: 1,
    image_url: '/src/assets/images/tutorial_kyc_fraud_1795006492146.jpg',
    title_en: 'Spotting Fake KYC Update Messages',
    title_hi: 'नकली KYC अपडेट संदेशों की पहचान',
    title_mr: 'बनावट KYC अपडेट संदेश ओळखणे',
    summary_en: 'Learn why banks never threaten to block your account via an SMS link or ask you to update KYC over a phone call.',
    summary_hi: 'जानें कि बैंक कभी भी SMS लिंक से खाता बंद करने की धमकी नहीं देते और न ही फोन पर KYC मांगते हैं।',
    summary_mr: 'बँक कधीही SMS लिंकद्वारे खाते बंद करण्याची धमकी देत नाही किंवा फोनवर KYC मागत नाही, हे जाणून घ्या.',
    script_en: 'Scammers often send an urgent text saying your bank KYC has expired and your account will be blocked tonight. They include a link or a helpline number. Remember: real banks never ask you to update KYC by tapping an SMS link. Always visit your bank branch or use the official bank website directly.',
    script_hi: 'ठग अक्सर एक जरूरी संदेश भेजते हैं कि आपका बैंक KYC समाप्त हो गया है और आज रात आपका खाता बंद हो जाएगा। वे एक लिंक या नंबर देते हैं। याद रखें: असली बैंक कभी SMS लिंक से KYC अपडेट नहीं कराते। हमेशा अपनी बैंक शाखा जाएं या आधिकारिक वेबसाइट का उपयोग करें।',
    script_mr: 'फसवणूक करणारे अनेकदा घाईचा संदेश पाठवतात की तुमचे बँक KYC संपले आहे आणि आज रात्री खाते बंद होईल. ते एक लिंक किंवा नंबर देतात. लक्षात ठेवा: खरी बँक कधीही SMS लिंकवरून KYC अपडेट करत नाही. नेहमी बँकेच्या शाखेत जा किंवा अधिकृत वेबसाइट वापरा.',
    tips_json: JSON.stringify({
      en: [
        'Banks never ask for KYC updates through WhatsApp or SMS links.',
        'Ignore messages threatening immediate account suspension within 24 hours.',
        'When in doubt, visit your nearest bank branch in person.'
      ],
      hi: [
        'बैंक कभी भी व्हाट्सएप या SMS लिंक से KYC अपडेट नहीं मांगते।',
        '24 घंटे में खाता बंद होने की धमकी देने वाले संदेशों को अनदेखा करें।',
        'संदेह होने पर हमेशा अपनी नजदीकी बैंक शाखा में जाएं।'
      ],
      mr: [
        'बँका कधीही WhatsApp किंवा SMS लिंकद्वारे KYC अपडेट मागत नाहीत.',
        '२४ तासांत खाते बंद करण्याची धमकी देणाऱ्या संदेशांकडे दुर्लक्ष करा.',
        'शंका आल्यास नेहमी जवळच्या बँक शाखेत जाऊन खात्री करा.'
      ]
    }),
    quiz_json: JSON.stringify([
      {
        id: 'kyc-q1',
        question: {
          en: 'You get an SMS saying "Update KYC in 2 hours or your account will be blocked" with a link. What should you do?',
          hi: 'आपको SMS मिला "2 घंटे में KYC अपडेट करें वरना खाता बंद होगा" और साथ में एक लिंक है। आप क्या करेंगे?',
          mr: 'तुम्हाला "२ तासांत KYC अपडेट करा नाहीतर खाते बंद होईल" असा SMS लिंकसह आला. तुम्ही काय कराल?'
        },
        options: {
          en: ['Tap the link quickly to save the account', 'Ignore the link and check directly with your bank branch', 'Reply with your Aadhaar number'],
          hi: ['खाता बचाने के लिए तुरंत लिंक पर क्लिक करें', 'लिंक अनदेखा करें और सीधे बैंक शाखा से जांच करें', 'अपना आधार नंबर भेजें'],
          mr: ['खाते वाचवण्यासाठी लगेच लिंकवर क्लिक करा', 'लिंककडे दुर्लक्ष करा आणि थेट बँकेच्या शाखेत चौकशी करा', 'तुमचा आधार नंबर पाठवा']
        },
        correctIndex: 1
      },
      {
        id: 'kyc-q2',
        question: {
          en: 'How do legitimate banks handle KYC verification?',
          hi: 'असली बैंक KYC सत्यापन कैसे करते हैं?',
          mr: 'खरी बँक KYC पडताळणी कशी करते?'
        },
        options: {
          en: ['Through official branch visits or verified official bank portals', 'By calling and asking for your ATM PIN', 'By asking you to install AnyDesk'],
          hi: ['आधिकारिक बैंक शाखा या सत्यापित बैंक पोर्टल के माध्यम से', 'कॉल करके ATM पिन पूछकर', 'AnyDesk ऐप इंस्टॉल कराकर'],
          mr: ['अधिकृत बँक शाखा किंवा सत्यापित बँक पोर्टलद्वारे', 'कॉल करून ATM पिन विचारून', 'AnyDesk अ‍ॅप इंस्टॉल करायला लावून']
        },
        correctIndex: 0
      }
    ])
  },
  {
    slug: 'otp-scams',
    category: 'Code Protection',
    order_index: 2,
    image_url: '/src/assets/images/tutorial_otp_scam_1795006492134.jpg',
    title_en: 'Understanding OTP & PIN Scams',
    title_hi: 'OTP और PIN धोखाधड़ी को समझना',
    title_mr: 'OTP आणि PIN फसवणूक समजून घेणे',
    summary_en: 'An OTP is like the key to your house safe. Never read it out loud to anyone on the phone, even if they claim to be from your bank.',
    summary_hi: 'OTP आपके घर की तिजोरी की चाबी जैसा है। फोन पर किसी को भी OTP न बताएं, चाहे वह खुद को बैंक अधिकारी बताए।',
    summary_mr: 'OTP ही तुमच्या तिजोरीची चावी आहे. फोनवर कोणालाही OTP सांगू नका, जरी समोरचा व्यक्ती बँकेतून बोलत असल्याचे सांगत असला तरी.',
    script_en: 'A One-Time Password, or OTP, is strictly for you to approve a payment or login. No bank employee, police officer, or delivery agent ever needs your OTP to cancel a transaction or send you money. Also remember: you never need to enter your UPI PIN to receive money.',
    script_hi: 'वन-टाइम पासवर्ड यानी OTP केवल आपके भुगतान या लॉगिन की अनुमति देने के लिए होता है। किसी भी बैंक कर्मचारी, पुलिस या डिलीवरी वाले को पैसे भेजने या शिकायत रद्द करने के लिए आपके OTP की जरूरत नहीं होती। पैसे प्राप्त करने के लिए कभी भी UPI पिन नहीं डालना पड़ता।',
    script_mr: 'वन-टाइम पासवर्ड म्हणजेच OTP फक्त तुम्हाला पेमेंट किंवा लॉगिन मंजूर करण्यासाठी असतो. पैसे पाठवण्यासाठी किंवा तक्रार रद्द करण्यासाठी कोणत्याही बँक कर्मचाऱ्याला तुमच्या OTP ची गरज नसते. तसेच पैसे मिळवण्यासाठी कधीही UPI पिन टाकावा लागत नाही.',
    tips_json: JSON.stringify({
      en: [
        'Never share OTP, ATM PIN, CVV, or UPI PIN with anyone on phone or WhatsApp.',
        'Receiving money never requires entering your UPI PIN or scanning a QR code.',
        'Hang up immediately if a caller asks for a 4-digit or 6-digit code.'
      ],
      hi: [
        'फोन या व्हाट्सएप पर किसी को भी OTP, ATM पिन, CVV या UPI पिन न बताएं।',
        'पैसे प्राप्त करने के लिए कभी भी UPI पिन डालने या QR कोड स्कैन करने की जरूरत नहीं होती।',
        'यदि कोई कॉलर 4 या 6 अंकों का कोड मांगे, तो तुरंत फोन काट दें।'
      ],
      mr: [
        'फोन किंवा WhatsApp वर कोणालाही OTP, ATM पिन, CVV किंवा UPI पिन सांगू नका.',
        'पैसे मिळवण्यासाठी कधीही UPI पिन टाकण्याची किंवा QR कोड स्कॅन करण्याची गरज नसते.',
        'कॉल करणारी व्यक्ती ४ किंवा ६ अंकी कोड मागत असेल तर ताबडतोब कॉल कट करा.'
      ]
    }),
    quiz_json: JSON.stringify([
      {
        id: 'otp-q1',
        question: {
          en: 'Someone sends you a QR code and says "Scan this and enter your UPI PIN to receive ₹5,000". Is this safe?',
          hi: 'कोई आपको QR कोड भेजकर कहता है "₹5,000 प्राप्त करने के लिए इसे स्कैन करें और UPI पिन डालें"। क्या यह सुरक्षित है?',
          mr: 'कोणीतरी तुम्हाला QR कोड पाठवून म्हणते "₹५,००० मिळवण्यासाठी हे स्कॅन करा आणि UPI पिन टाका". हे सुरक्षित आहे का?'
        },
        options: {
          en: ['Yes, that is how money arrives', 'No — entering a UPI PIN only sends money OUT of your account', 'Only if the caller sounds polite'],
          hi: ['हां, पैसे ऐसे ही आते हैं', 'नहीं — UPI पिन डालने से पैसे आपके खाते से बाहर जाते हैं', 'केवल तभी जब कॉलर विनम्र बात करे'],
          mr: ['होय, पैसे असेच येतात', 'नाही — UPI पिन टाकल्यास पैसे तुमच्या खात्यातून बाहेर जातात', 'फक्त कॉल करणारा नम्र बोलत असेल तर']
        },
        correctIndex: 1
      },
      {
        id: 'otp-q2',
        question: {
          en: 'Who is allowed to ask for your bank OTP over a phone call?',
          hi: 'फोन कॉल पर आपसे बैंक OTP पूछने का अधिकार किसे है?',
          mr: 'फोन कॉलवर तुमच्या बँकेचा OTP विचारण्याचा अधिकार कोणाला आहे?'
        },
        options: {
          en: ['Your bank branch manager', 'Customer care support', 'Nobody — never share an OTP with anyone'],
          hi: ['आपके बैंक मैनेजर', 'कस्टमर केयर', 'कोई नहीं — किसी को भी OTP न बताएं'],
          mr: ['तुमच्या बँकेचे मॅनेजर', 'कस्टमर केअर', 'कोणालाही नाही — OTP कोणालाही सांगू नका']
        },
        correctIndex: 2
      }
    ])
  },
  {
    slug: 'lottery-fraud',
    category: 'Prize & Offer Scams',
    order_index: 3,
    image_url: '/src/assets/images/tutorial_lottery_fraud_1795006492091.jpg',
    title_en: 'Avoiding Fake Lottery & Prize Traps',
    title_hi: 'नकली लॉटरी और इनाम के जाल से बचाव',
    title_mr: 'बनावट लॉटरी आणि बक्षिसाच्या सापळ्यापासून बचाव',
    summary_en: 'You cannot win a lottery you never entered. Fraudsters ask for small "processing fees" or "tax" before vanishing with your money.',
    summary_hi: 'जिस लॉटरी में आपने हिस्सा ही नहीं लिया, उसे आप जीत नहीं सकते। ठग इनाम देने से पहले छोटी "प्रोसेसिंग फीस" मांगते हैं।',
    summary_mr: 'ज्या लॉटरीत तुम्ही भागच घेतला नाही, ती तुम्ही जिंकू शकत नाही. फसवणूक करणारे बक्षीस देण्याआधी थोडी "प्रोसेसिंग फी" मागतात.',
    script_en: 'If a WhatsApp message or phone call congratulates you on winning 25 lakh rupees, a car, or a lucky draw you never joined, it is a trap. Scammers ask you to pay a small registration fee, GST, or courier charge first. Never pay money to receive a prize.',
    script_hi: 'यदि कोई व्हाट्सएप संदेश या कॉल आपको 25 लाख रुपये, कार या लकी ड्रॉ जीतने की बधाई देता है जिसमें आपने कभी भाग नहीं लिया, तो यह एक जाल है। ठग आपसे पहले छोटी फीस, GST या कूरियर शुल्क मांगते हैं। इनाम पाने के लिए कभी पैसे न दें।',
    script_mr: 'तुम्ही कधीही भाग न घेतलेल्या २५ लाख रुपयांच्या बक्षिसाचे, कारचे किंवा लकी ड्रॉचे अभिनंदन करणारा मेसेज आल्यास तो एक सापळा आहे. फसवणूक करणारे आधी नोंदणी शुल्क किंवा टॅक्स भरायला सांगतात. बक्षीस मिळवण्यासाठी कधीही पैसे देऊ नका.',
    tips_json: JSON.stringify({
      en: [
        'Genuine prizes never require you to pay a fee or tax upfront via UPI.',
        'Be suspicious of celebrity photos or fake government stamps on WhatsApp prize images.',
        'Block unknown numbers sending lottery or gift-voucher messages.'
      ],
      hi: [
        'असली इनाम के लिए कभी भी पहले से UPI द्वारा शुल्क या टैक्स नहीं मांगा जाता।',
        'व्हाट्सएप इनाम की तस्वीरों पर मशहूर हस्तियों या सरकारी मुहर पर भरोसा न करें।',
        'लॉटरी या गिफ्ट संदेश भेजने वाले अनजान नंबरों को ब्लॉक करें।'
      ],
      mr: [
        'खऱ्या बक्षिसासाठी कधीही आधी UPI ने फी किंवा टॅक्स भरावा लागत नाही.',
        'WhatsApp बक्षिसाच्या फोटोंवरील सेलिब्रिटींचे फोटो किंवा सरकारी शिक्क्यांवर विश्वास ठेवू नका.',
        'लॉटरी किंवा गिफ्ट मेसेज पाठवणारे अनोळखी नंबर ब्लॉक करा.'
      ]
    }),
    quiz_json: JSON.stringify([
      {
        id: 'lot-q1',
        question: {
          en: 'A WhatsApp message says you won ₹25 Lakh and asks for ₹2,500 processing fee to release the prize. What is this?',
          hi: 'एक व्हाट्सएप संदेश कहता है कि आपने ₹25 लाख जीते हैं और ₹2,500 प्रोसेसिंग फीस मांगी जा रही है। यह क्या है?',
          mr: 'एक WhatsApp मेसेज म्हणतो तुम्ही ₹२५ लाख जिंकले आहेत आणि रक्कम मिळवण्यासाठी ₹२,५०० फी मागतो. हे काय आहे?'
        },
        options: {
          en: ['A real government prize', 'A lottery scam — block and delete it', 'A small safe bank charge'],
          hi: ['एक असली सरकारी इनाम', 'एक लॉटरी घोटाला — इसे ब्लॉक करें और हटा दें', 'एक छोटा सुरक्षित बैंक शुल्क'],
          mr: ['खरे सरकारी बक्षीस', 'लॉटरी फसवणूक — नंबर ब्लॉक करून मेसेज डिलीट करा', 'बँकेचे छोटे सुरक्षित शुल्क']
        },
        correctIndex: 1
      },
      {
        id: 'lot-q2',
        question: {
          en: 'What is the golden rule for unexpected lottery or lucky draw messages?',
          hi: 'अचानक आने वाले लॉटरी या लकी ड्रॉ संदेशों के लिए सुनहरा नियम क्या है?',
          mr: 'अचानक येणाऱ्या लॉटरी किंवा लकी ड्रॉ मेसेजसाठी सुवर्ण नियम कोणता?'
        },
        options: {
          en: ['You cannot win a contest you never entered', 'Pay once to check if it is real', 'Share your bank passbook photo'],
          hi: ['जिस प्रतियोगिता में आपने भाग नहीं लिया, उसे आप जीत नहीं सकते', 'असली है या नहीं जांचने के लिए एक बार पैसे दें', 'अपनी बैंक पासबुक की फोटो भेजें'],
          mr: ['तुम्ही कधीही भाग न घेतलेली स्पर्धा तुम्ही जिंकू शकत नाही', 'खरे आहे का तपासण्यासाठी एकदा पैसे देऊन पहा', 'बँक पासबुकचा फोटो पाठवा']
        },
        correctIndex: 0
      }
    ])
  },
  {
    slug: 'fake-support',
    category: 'Call Safety',
    order_index: 4,
    image_url: '/src/assets/images/tutorial_otp_scam_1795006492134.jpg',
    title_en: 'Fake Customer-Care & Screen-Share Calls',
    title_hi: 'नकली कस्टमर-केयर और स्क्रीन-शेयरिंग कॉल',
    title_mr: 'बनावट कस्टमर-केअर आणि स्क्रीन-शेअरिंग कॉल्स',
    summary_en: 'Scammers place fake helpline numbers on search engines and ask you to download apps like AnyDesk or TeamViewer.',
    summary_hi: 'ठग इंटरनेट पर नकली हेल्पलाइन नंबर डालते हैं और फिर AnyDesk या TeamViewer जैसे ऐप डाउनलोड करने को कहते हैं।',
    summary_mr: 'फसवणूक करणारे इंटरनेटवर बनावट हेल्पलाइन नंबर टाकतात आणि नंतर AnyDesk किंवा TeamViewer अ‍ॅप्स डाउनलोड करायला सांगतात.',
    script_en: 'When looking for a bank or pension helpline number, never trust the first phone number shown in random web ads. Scammers impersonate support staff and ask you to install screen-sharing apps like AnyDesk or QuickSupport. Once installed, they can see your screen and steal your savings.',
    script_hi: 'जब भी बैंक या पेंशन हेल्पलाइन नंबर खोजें, तो इंटरनेट विज्ञापनों में दिखने वाले पहले नंबर पर भरोसा न करें। ठग कस्टमर-केयर बनकर आपसे AnyDesk या QuickSupport ऐप डाउनलोड करवाते हैं, जिससे वे आपके फोन की स्क्रीन देख सकते हैं और पैसे चुरा सकते हैं।',
    script_mr: 'बँक किंवा पेन्शन हेल्पलाइन नंबर शोधताना इंटरनेटवरील पहिल्याच जाहिरातीतील नंबरवर विश्वास ठेवू नका. फसवणूक करणारे कर्मचारी असल्याचे भासवून AnyDesk किंवा QuickSupport अ‍ॅप डाउनलोड करायला लावतात, ज्यामुळे त्यांना तुमच्या फोनची स्क्रीन दिसते आणि ते पैसे चोरू शकतात.',
    tips_json: JSON.stringify({
      en: [
        'Only use customer-care numbers printed on your bank passbook or debit card.',
        'Never install AnyDesk, TeamViewer, or QuickSupport on a caller’s instruction.',
        'Hang up if someone rushes you or tells you not to tell family members.'
      ],
      hi: [
        'केवल अपनी बैंक पासबुक या डेबिट कार्ड के पीछे छपे हेल्पलाइन नंबर का उपयोग करें।',
        'किसी कॉलर के कहने पर कभी भी AnyDesk, TeamViewer या QuickSupport इंस्टॉल न करें।',
        'यदि कोई आपको परिवार से छिपाने को कहे या जल्दी करे, तो तुरंत कॉल काट दें।'
      ],
      mr: [
        'फक्त तुमच्या बँक पासबुकवर किंवा डेबिट कार्डच्या मागे छापलेला हेल्पलाइन नंबर वापरा.',
        'कोणाच्याही सांगण्यावरून कधीही AnyDesk, TeamViewer किंवा QuickSupport इन्स्टॉल करू नका.',
        'जर कोणी कुटुंबाला सांगू नका असे म्हणत असेल किंवा घाई करत असेल, तर लगेच फोन ठेवा.'
      ]
    }),
    quiz_json: JSON.stringify([
      {
        id: 'sup-q1',
        question: {
          en: 'A support caller asks you to install "AnyDesk" to fix a failed pension or electricity payment. What should you do?',
          hi: 'एक कॉलर कहता है कि आपका रुका हुआ भुगतान ठीक करने के लिए "AnyDesk" ऐप डाउनलोड करें। आपको क्या करना चाहिए?',
          mr: 'कस्टमर केअरमधून बोलत असल्याचे सांगून कोणीतरी तुम्हाला "AnyDesk" अ‍ॅप डाउनलोड करायला सांगते. तुम्ही काय कराल?'
        },
        options: {
          en: ['Install it and read the 9-digit code', 'Refuse and hang up immediately — it gives them control of your phone', 'Give them your debit card photo instead'],
          hi: ['ऐप डाउनलोड करें और 9 अंकों का कोड बताएं', 'मना करें और तुरंत फोन काट दें — इससे उन्हें आपके फोन का नियंत्रण मिल जाता है', 'इसके बजाय डेबिट कार्ड की फोटो भेजें'],
          mr: ['अ‍ॅप डाउनलोड करून ९ अंकी कोड सांगा', 'नकार द्या आणि लगेच फोन ठेवा — यामुळे त्यांना तुमच्या फोनचा ताबा मिळतो', 'त्याऐवजी डेबिट कार्डचा फोटो पाठवा']
        },
        correctIndex: 1
      },
      {
        id: 'sup-q2',
        question: {
          en: 'Where is the safest place to find your bank’s real customer-care number?',
          hi: 'अपने बैंक का असली कस्टमर-केयर नंबर खोजने की सबसे सुरक्षित जगह कौन सी है?',
          mr: 'तुमच्या बँकेचा खरा कस्टमर-केअर नंबर शोधण्यासाठी सर्वात सुरक्षित जागा कोणती?'
        },
        options: {
          en: ['Printed on the back of your debit card or inside your official passbook', 'In a forwarded WhatsApp message', 'In a random sponsored link'],
          hi: ['आपके डेबिट कार्ड के पीछे या आपकी आधिकारिक बैंक पासबुक में', 'किसी व्हाट्सएप फॉरवर्ड संदेश में', 'किसी अनजान विज्ञापन लिंक में'],
          mr: ['तुमच्या डेबिट कार्डच्या मागे किंवा अधिकृत पासबुकवर', 'फॉरवर्ड केलेल्या WhatsApp मेसेजमध्ये', 'कोणत्याही जाहिरातीच्या लिंकवर']
        },
        correctIndex: 0
      }
    ])
  },
  {
    slug: 'suspicious-links',
    category: 'Link Hygiene',
    order_index: 5,
    image_url: '/src/assets/images/tutorial_suspicious_links_1795006493660.jpg',
    title_en: 'Checking Suspicious Links Before Tapping',
    title_hi: 'क्लिक करने से पहले संदिग्ध लिंक की जांच',
    title_mr: 'क्लिक करण्यापूर्वी संशयास्पद लिंक तपासणे',
    summary_en: 'Spot lookalike website spellings, shortened links, and fake bank URLs before ever tapping your screen.',
    summary_hi: 'स्क्रीन पर क्लिक करने से पहले नकली वेबसाइट स्पेलिंग, छोटे लिंक और धोखाधड़ी वाले URL को पहचानें।',
    summary_mr: 'स्क्रीनवर टॅप करण्यापूर्वी बनावट वेबसाइटचे स्पेलिंग, शॉर्ट लिंक आणि फसवे URL ओळखा.',
    script_en: 'Fraudsters create website links that look almost like real banks, such as "sbi-kyc-update.xyz" or shortened links like "bit.ly". Always pause before tapping. Check if the website ends with the bank’s real official name, or paste the link text into CyberShield’s Scam Checker first.',
    script_hi: 'ठग ऐसे लिंक बनाते हैं जो असली बैंक जैसे दिखते हैं, जैसे "sbi-kyc-update.xyz" या छोटे लिंक जैसे "bit.ly"। हमेशा क्लिक करने से पहले रुकें। देखें कि वेबसाइट का असली नाम सही है या नहीं, या पहले CyberShield के स्कैम चेकर में जांचें।',
    script_mr: 'फसवणूक करणारे खऱ्या बँकेसारखे दिसणारे बनावट लिंक तयार करतात, जसे की "sbi-kyc-update.xyz" किंवा "bit.ly". टॅप करण्यापूर्वी नेहमी थांबा. वेबसाइटचे अधिकृत नाव तपासा किंवा आधी CyberShield च्या स्कॅम चेकरमध्ये मजकूर तपासा.',
    tips_json: JSON.stringify({
      en: [
        'Watch out for extra words or hyphens around bank names (like "hdfc-verify-now.xyz").',
        'Avoid tapping shortened URLs from unknown contacts.',
        'Use the CyberShield Checker to inspect suspicious message text without opening the link.'
      ],
      hi: [
        'बैंक के नाम के साथ जुड़े अतिरिक्त शब्दों या डैश से सावधान रहें (जैसे "hdfc-verify-now.xyz")।',
        'अनजान नंबर से आए छोटे (shortened) लिंक पर क्लिक न करें।',
        'लिंक खोले बिना संदेश की जांच के लिए CyberShield स्कैम चेकर का उपयोग करें।'
      ],
      mr: [
        'बँकेच्या नावाभोवती असलेले अतिरिक्त शब्द किंवा हायफन तपासा (उदा. "hdfc-verify-now.xyz").',
        'अनोळखी व्यक्तीने पाठवलेल्या शॉर्ट लिंकवर क्लिक करू नका.',
        'लिंक न उघडता तपासणी करण्यासाठी CyberShield स्कॅम चेकरचा वापर करा.'
      ]
    }),
    quiz_json: JSON.stringify([
      {
        id: 'lnk-q1',
        question: {
          en: 'Which of these links looks suspicious and should NOT be tapped?',
          hi: 'इनमें से कौन सा लिंक संदिग्ध दिखता है जिस पर क्लिक नहीं करना चाहिए?',
          mr: 'यापैकी कोणती लिंक संशयास्पद दिसते ज्यावर क्लिक करू नये?'
        },
        options: {
          en: ['http://sbi-kyc-verify-urgent.xyz/login', 'Visiting your bank branch in person', 'Calling the number printed on your debit card'],
          hi: ['http://sbi-kyc-verify-urgent.xyz/login', 'स्वयं बैंक शाखा जाना', 'अपने डेबिट कार्ड पर छपे नंबर पर कॉल करना'],
          mr: ['http://sbi-kyc-verify-urgent.xyz/login', 'प्रत्यक्ष बँक शाखेत जाणे', 'डेबिट कार्डवर छापलेल्या नंबरवर कॉल करणे']
        },
        correctIndex: 0
      },
      {
        id: 'lnk-q2',
        question: {
          en: 'Why are shortened links (like bit.ly) risky in unknown SMS messages?',
          hi: 'अनजान SMS में छोटे लिंक (जैसे bit.ly) जोखिम भरे क्यों होते हैं?',
          mr: 'अनोळखी SMS मधील शॉर्ट लिंक (जसे bit.ly) धोकादायक का असतात?'
        },
        options: {
          en: ['They hide the real destination website address until you open it', 'They charge extra mobile data', 'They make the screen brighter'],
          hi: ['वे असली वेबसाइट का पता तब तक छिपाते हैं जब तक आप उसे खोलते नहीं', 'उनसे अधिक मोबाइल डेटा खर्च होता है', 'वे स्क्रीन की रोशनी बढ़ा देते हैं'],
          mr: ['तुम्ही उघडेपर्यंत ते खऱ्या वेबसाइटचा पत्ता लपवून ठेवतात', 'त्यामुळे जास्त मोबाइल डेटा वापरला जातो', 'त्यामुळे स्क्रीन चमकते']
        },
        correctIndex: 0
      }
    ])
  }
];

export function initDatabaseSchemaAndSeed(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr')),
      encrypted_recovery_note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_name TEXT NOT NULL CHECK (role_name IN ('senior', 'caregiver')),
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, role_name)
    );

    CREATE TABLE IF NOT EXISTS tutorials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      title_mr TEXT NOT NULL,
      summary_en TEXT NOT NULL,
      summary_hi TEXT NOT NULL,
      summary_mr TEXT NOT NULL,
      script_en TEXT NOT NULL,
      script_hi TEXT NOT NULL,
      script_mr TEXT NOT NULL,
      tips_json TEXT NOT NULL,
      quiz_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tutorial_id INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      voice_listened INTEGER NOT NULL DEFAULT 0,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (tutorial_id) REFERENCES tutorials(id) ON DELETE CASCADE,
      UNIQUE (user_id, tutorial_id)
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tutorial_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (tutorial_id) REFERENCES tutorials(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS simulation_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scenario_id TEXT NOT NULL,
      selected_option_id TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS caregiver_consent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senior_user_id INTEGER NOT NULL,
      caregiver_user_id INTEGER,
      caregiver_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'revoked')),
      consent_code TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senior_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (caregiver_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS scam_check_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      input_type TEXT NOT NULL,
      content_excerpt TEXT NOT NULL,
      risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
      risk_score INTEGER NOT NULL,
      matched_patterns_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_sim_user ON simulation_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_consent_senior ON caregiver_consent(senior_user_id);
    CREATE INDEX IF NOT EXISTS idx_consent_caregiver ON caregiver_consent(caregiver_user_id);
  `);

  const upsertTutorial = db.prepare(`
    INSERT INTO tutorials (
      slug, category, order_index, image_url,
      title_en, title_hi, title_mr,
      summary_en, summary_hi, summary_mr,
      script_en, script_hi, script_mr,
      tips_json, quiz_json
    ) VALUES (
      @slug, @category, @order_index, @image_url,
      @title_en, @title_hi, @title_mr,
      @summary_en, @summary_hi, @summary_mr,
      @script_en, @script_hi, @script_mr,
      @tips_json, @quiz_json
    )
    ON CONFLICT(slug) DO UPDATE SET
      category = excluded.category,
      order_index = excluded.order_index,
      image_url = excluded.image_url,
      title_en = excluded.title_en,
      title_hi = excluded.title_hi,
      title_mr = excluded.title_mr,
      summary_en = excluded.summary_en,
      summary_hi = excluded.summary_hi,
      summary_mr = excluded.summary_mr,
      script_en = excluded.script_en,
      script_hi = excluded.script_hi,
      script_mr = excluded.script_mr,
      tips_json = excluded.tips_json,
      quiz_json = excluded.quiz_json
  `);

  const insertMany = db.transaction((items: TutorialSeed[]) => {
    for (const item of items) {
      upsertTutorial.run(item);
    }
  });
  insertMany(TUTORIAL_SEEDS);
}

export async function ensureDemoUsersSeeded(): Promise<void> {
  const existingSenior = db.prepare('SELECT id FROM users WHERE email = ?').get('asha.sharma@example.com') as { id: number } | undefined;
  const existingCaregiver = db.prepare('SELECT id FROM users WHERE email = ?').get('rohan.sharma@example.com') as { id: number } | undefined;

  let seniorId = existingSenior?.id;
  let caregiverId = existingCaregiver?.id;

  if (!seniorId) {
    const hash = await hashPassword('SafeSenior@2026');
    const info = db.prepare(
      'INSERT INTO users (full_name, email, password_hash, preferred_language) VALUES (?, ?, ?, ?)'
    ).run('Asha Sharma', 'asha.sharma@example.com', hash, 'hi');
    seniorId = Number(info.lastInsertRowid);
    db.prepare('INSERT INTO user_roles (user_id, role_name) VALUES (?, ?)').run(seniorId, 'senior');

    // Seed initial educational progress for demo senior
    db.prepare(
      'INSERT OR IGNORE INTO learning_progress (user_id, tutorial_id, completed, voice_listened, completed_at) VALUES (?, 1, 1, 1, CURRENT_TIMESTAMP)'
    ).run(seniorId);
    db.prepare(
      'INSERT OR IGNORE INTO learning_progress (user_id, tutorial_id, completed, voice_listened, completed_at) VALUES (?, 2, 1, 1, CURRENT_TIMESTAMP)'
    ).run(seniorId);
    db.prepare(
      'INSERT INTO quiz_results (user_id, tutorial_id, score, total_questions) VALUES (?, 1, 2, 2)'
    ).run(seniorId);
    db.prepare(
      'INSERT INTO quiz_results (user_id, tutorial_id, score, total_questions) VALUES (?, 2, 2, 2)'
    ).run(seniorId);
    db.prepare(
      'INSERT INTO simulation_results (user_id, scenario_id, selected_option_id, is_correct) VALUES (?, ?, ?, ?)'
    ).run(seniorId, 'sim-kyc-sms', 'opt-ignore-branch', 1);
  }

  if (!caregiverId) {
    const hash = await hashPassword('SafeCare@2026');
    const info = db.prepare(
      'INSERT INTO users (full_name, email, password_hash, preferred_language) VALUES (?, ?, ?, ?)'
    ).run('Rohan Sharma', 'rohan.sharma@example.com', hash, 'en');
    caregiverId = Number(info.lastInsertRowid);
    db.prepare('INSERT INTO user_roles (user_id, role_name) VALUES (?, ?)').run(caregiverId, 'caregiver');
  }

  if (seniorId && caregiverId) {
    const existingConsent = db.prepare(
      'SELECT id FROM caregiver_consent WHERE senior_user_id = ? AND caregiver_email = ?'
    ).get(seniorId, 'rohan.sharma@example.com');

    if (!existingConsent) {
      db.prepare(
        `INSERT INTO caregiver_consent (senior_user_id, caregiver_user_id, caregiver_email, status, consent_code)
         VALUES (?, ?, ?, 'granted', 'SAFE26')`
      ).run(seniorId, caregiverId, 'rohan.sharma@example.com');
    }
  }
}
