export type LangCode = 'en' | 'hi' | 'mr';

export interface SimulationOption {
  id: string;
  label: Record<LangCode, string>;
}

export interface SimulationScenario {
  id: string;
  channel: 'SMS' | 'Phone Call' | 'WhatsApp' | 'Email';
  senderLabel: Record<LangCode, string>;
  title: Record<LangCode, string>;
  messageBody: Record<LangCode, string>;
  options: SimulationOption[];
  correctOptionId: string;
  explanation: Record<LangCode, string>;
  warningSigns: Record<LangCode, string[]>;
  recommendedAction: Record<LangCode, string>;
}

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'sim-kyc-sms',
    channel: 'SMS',
    senderLabel: {
      en: 'VK-BNKALT (Unknown Sender)',
      hi: 'VK-BNKALT (अनजान नंबर)',
      mr: 'VK-BNKALT (अनोळखी नंबर)',
    },
    title: {
      en: 'Scenario 1: Urgent Bank KYC Suspension SMS',
      hi: 'परिस्थिति 1: बैंक KYC बंद होने का जरूरी SMS',
      mr: 'प्रसंग १: बँक KYC बंद होण्याचा घाईचा SMS',
    },
    messageBody: {
      en: 'Dear Customer, Your State Bank KYC has expired today. Your account will be BLOCKED at 9:00 PM. Update PAN immediately at http://sbi-kyc-help.xyz or call 98XXXXXX12.',
      hi: 'प्रिय ग्राहक, आपका बैंक KYC आज समाप्त हो गया है। रात 9:00 बजे आपका खाता बंद कर दिया जाएगा। तुरंत PAN अपडेट करें: http://sbi-kyc-help.xyz या कॉल करें 98XXXXXX12।',
      mr: 'प्रिय ग्राहक, तुमचे बँक KYC आज संपले आहे. रात्री ९:०० वाजता तुमचे खाते बंद होईल. लगेच PAN अपडेट करा: http://sbi-kyc-help.xyz किंवा कॉल करा 98XXXXXX12.',
    },
    options: [
      {
        id: 'opt-tap-link',
        label: {
          en: 'Tap the link and enter my PAN & debit card details',
          hi: 'लिंक पर क्लिक करें और PAN व कार्ड की जानकारी भरें',
          mr: 'लिंकवर क्लिक करून PAN आणि कार्डची माहिती भरा',
        },
      },
      {
        id: 'opt-call-number',
        label: {
          en: 'Call the mobile number written inside the SMS',
          hi: 'SMS में लिखे मोबाइल नंबर पर कॉल करें',
          mr: 'SMS मधील मोबाइल नंबरवर कॉल करा',
        },
      },
      {
        id: 'opt-ignore-branch',
        label: {
          en: 'Ignore the link, delete the SMS, and check at the bank branch',
          hi: 'लिंक अनदेखा करें, संदेश हटाएं और अपनी बैंक शाखा से जांच करें',
          mr: 'लिंककडे दुर्लक्ष करा, मेसेज डिलीट करा आणि बँक शाखेत खात्री करा',
        },
      },
    ],
    correctOptionId: 'opt-ignore-branch',
    explanation: {
      en: 'Banks never threaten to block accounts tonight via an unknown ".xyz" link or a personal 10-digit mobile number. Visiting your branch or using the official helpline on your passbook keeps your savings completely safe.',
      hi: 'बैंक कभी भी ".xyz" जैसे अनजान लिंक या 10 अंकों के निजी मोबाइल नंबर से खाता बंद करने की धमकी नहीं देते। अपनी बैंक शाखा जाना या पासबुक पर छपे नंबर पर बात करना सबसे सुरक्षित है।',
      mr: 'बँक कधीही ".xyz" सारख्या अनोळखी लिंकद्वारे किंवा १० अंकी वैयक्तिक मोबाइल नंबरवरून खाते बंद करण्याची धमकी देत नाही. थेट शाखेत जाणे किंवा पासबुकवरील नंबरवर संपर्क साधणे सर्वात सुरक्षित आहे.',
    },
    warningSigns: {
      en: [
        'Artificial panic ("BLOCKED at 9:00 PM") designed to stop you from thinking calmly',
        'Suspicious fake domain ending in ".xyz" instead of the bank’s official domain',
        'A random 10-digit mobile number listed as bank support',
      ],
      hi: [
        'तुरंत घबराहट पैदा करना ("रात 9 बजे खाता बंद") ताकि आप बिना सोचे कदम उठाएं',
        'बैंक की असली वेबसाइट के बजाय ".xyz" वाला नकली लिंक',
        'सहायता के लिए एक अनजान निजी मोबाइल नंबर दिया होना',
      ],
      mr: [
        'लगेच भीती निर्माण करणे ("रात्री ९ वाजता खाते बंद") जेणेकरून तुम्ही विचार करू नये',
        'बँकेच्या खऱ्या वेबसाइटऐवजी ".xyz" असलेली बनावट लिंक',
        'मदतीसाठी अनोळखी वैयक्तिक मोबाइल नंबर देणे',
      ],
    },
    recommendedAction: {
      en: 'Never tap KYC links in SMS or WhatsApp. Delete the message and verify directly at your bank branch.',
      hi: 'SMS या व्हाट्सएप में आए KYC लिंक पर कभी क्लिक न करें। संदेश हटाएं और सीधे बैंक शाखा में जांच करें।',
      mr: 'SMS किंवा WhatsApp मधील KYC लिंकवर कधीही क्लिक करू नका. मेसेज डिलीट करा आणि थेट बँकेत खात्री करा.',
    },
  },
  {
    id: 'sim-otp-call',
    channel: 'Phone Call',
    senderLabel: {
      en: 'Unknown Caller (+91 91XXXXXX45)',
      hi: 'अनजान कॉलर (+91 91XXXXXX45)',
      mr: 'अनोळखी कॉलर (+91 91XXXXXX45)',
    },
    title: {
      en: 'Scenario 2: Caller Requesting OTP to Cancel a Debit',
      hi: 'परिस्थिति 2: पैसे कटने से रोकने के लिए OTP मांगने वाला कॉल',
      mr: 'प्रसंग २: पैसे कट होणे थांबवण्यासाठी OTP मागणारा कॉल',
    },
    messageBody: {
      en: '"Namaste, I am calling from the Bank Fraud Department. Someone tried to withdraw ₹18,000 from your pension account. Please read out the 6-digit OTP you just received so I can cancel this transaction immediately."',
      hi: '"नमस्ते, मैं बैंक फ्रॉड विभाग से बोल रहा हूं। किसी ने आपके पेंशन खाते से ₹18,000 निकालने की कोशिश की है। कृपया अभी आया 6 अंकों का OTP बताएं ताकि मैं इसे तुरंत रोक सकूं।"',
      mr: '"नमस्कार, मी बँकेच्या फ्रॉड विभागातून बोलत आहे. कोणीतरी तुमच्या पेन्शन खात्यातून ₹१८,००० काढण्याचा प्रयत्न करत आहे. व्यवहार थांबवण्यासाठी आताच आलेला ६ अंकी OTP सांगा."',
    },
    options: [
      {
        id: 'opt-read-otp',
        label: {
          en: 'Read the 6-digit OTP quickly to stop the fraud',
          hi: 'धोखाधड़ी रोकने के लिए जल्दी से 6 अंकों का OTP बता दें',
          mr: 'फसवणूक थांबवण्यासाठी लगेच ६ अंकी OTP सांगा',
        },
      },
      {
        id: 'opt-hang-up',
        label: {
          en: 'Hang up immediately without sharing any code, then call the bank’s official helpline',
          hi: 'बिना कोई कोड बताए तुरंत फोन काटें और बैंक के आधिकारिक नंबर पर कॉल करें',
          mr: 'कोणताही कोड न सांगता लगेच फोन ठेवा आणि बँकेच्या अधिकृत नंबरवर कॉल करा',
        },
      },
      {
        id: 'opt-share-last4',
        label: {
          en: 'Share only my ATM card number instead of the OTP',
          hi: 'OTP के बजाय केवल अपना ATM कार्ड नंबर बता दें',
          mr: 'OTP ऐवजी फक्त माझा ATM कार्ड नंबर सांगा',
        },
      },
    ],
    correctOptionId: 'opt-hang-up',
    explanation: {
      en: 'Bank fraud teams NEVER ask for an OTP to cancel a transaction. In fact, reading the OTP out loud is what allows the scammer to steal the ₹18,000!',
      hi: 'बैंक का कोई भी अधिकारी लेनदेन रोकने के लिए OTP नहीं मांगता। असल में आपका OTP सुनकर ही ठग आपके खाते से ₹18,000 निकाल लेगा!',
      mr: 'बँकेचा कोणताही अधिकारी व्यवहार रद्द करण्यासाठी OTP मागत नाही. उलट तुम्ही OTP सांगितल्यामुळेच फसवणूक करणारा तुमच्या खात्यातून ₹१८,००० काढू शकेल!',
    },
    warningSigns: {
      en: [
        'Caller uses fear ("₹18,000 withdrawal from pension") to create urgency',
        'Asks you to read an incoming 6-digit OTP aloud',
        'Calls from an unverified personal mobile number',
      ],
      hi: [
        'डर दिखाना ("पेंशन से ₹18,000 निकल रहे हैं") ताकि आप घबरा जाएं',
        'फोन पर आया 6 अंकों का OTP पूछना',
        'एक अनजान मोबाइल नंबर से कॉल आना',
      ],
      mr: [
        'भीती दाखवणे ("पेन्शनमधून ₹१८,००० जात आहेत") जेणेकरून तुम्ही घाबरावे',
        'आलेला ६ अंकी OTP वाचून दाखवायला सांगणे',
        'अनोळखी मोबाइल नंबरवरून कॉल येणे',
      ],
    },
    recommendedAction: {
      en: 'End the call immediately. Never share OTPs, card numbers, or PINs. Call your bank using the number on your passbook.',
      hi: 'तुरंत कॉल काट दें। कभी भी OTP, कार्ड नंबर या पिन न बताएं। अपनी पासबुक पर लिखे नंबर पर बैंक से संपर्क करें।',
      mr: 'ताबडतोब कॉल कट करा. कधीही OTP, कार्ड नंबर किंवा पिन सांगू नका. पासबुकवरील अधिकृत नंबरवर बँकेशी बोला.',
    },
  },
  {
    id: 'sim-lottery-wa',
    channel: 'WhatsApp',
    senderLabel: {
      en: 'Unknown International Number (+44 77XXXXXX09)',
      hi: 'अनजान विदेशी नंबर (+44 77XXXXXX09)',
      mr: 'अनोळखी परदेशी नंबर (+44 77XXXXXX09)',
    },
    title: {
      en: 'Scenario 3: WhatsApp Lucky Draw Prize Message',
      hi: 'परिस्थिति 3: व्हाट्सएप पर लकी ड्रॉ इनाम का संदेश',
      mr: 'प्रसंग ३: WhatsApp वर लकी ड्रॉ बक्षिसाचा मेसेज',
    },
    messageBody: {
      en: 'CONGRATULATIONS! Your mobile number won ₹25,00,000 in the Grand Senior Citizen Lucky Draw! To release your prize money today, pay a refundable ₹2,499 GST & processing fee via UPI.',
      hi: 'बधाई हो! आपके मोबाइल नंबर ने लकी ड्रॉ में ₹25,00,000 जीते हैं! आज ही इनाम पाने के लिए UPI से ₹2,499 GST और प्रोसेसिंग शुल्क जमा करें।',
      mr: 'अभिनंदन! तुमच्या मोबाइल नंबरला लकी ड्रॉमध्ये ₹२५,००,००० चे बक्षीस लागले आहे! रक्कम आजच मिळवण्यासाठी UPI द्वारे ₹२,४९९ प्रोसेसिंग फी भरा.',
    },
    options: [
      {
        id: 'opt-pay-fee',
        label: {
          en: 'Pay ₹2,499 now because ₹25 Lakh is a huge reward',
          hi: '₹2,499 भेज दें क्योंकि ₹25 लाख बहुत बड़ा इनाम है',
          mr: '₹२,४९९ भरा कारण ₹२५ लाख खूप मोठे बक्षीस आहे',
        },
      },
      {
        id: 'opt-send-id',
        label: {
          en: 'Send a photo of my Aadhaar and bank passbook to claim',
          hi: 'इनाम लेने के लिए अपने आधार और बैंक पासबुक की फोटो भेजें',
          mr: 'बक्षिसासाठी माझ्या आधार आणि पासबुकचा फोटो पाठवा',
        },
      },
      {
        id: 'opt-block-report',
        label: {
          en: 'Do not reply or pay; block the sender and delete the message',
          hi: 'जवाब न दें और पैसे न भेजें; नंबर को ब्लॉक करें और संदेश हटा दें',
          mr: 'उत्तर देऊ नका आणि पैसे पाठवू नका; नंबर ब्लॉक करून मेसेज डिलीट करा',
        },
      },
    ],
    correctOptionId: 'opt-block-report',
    explanation: {
      en: 'You cannot win a contest you never entered, and real prizes never ask you to pay money upfront. Sending ₹2,499 only leads to scammers demanding more fees.',
      hi: 'जिस लॉटरी में आपने हिस्सा नहीं लिया, उसे आप नहीं जीत सकते। असली इनाम के लिए कभी पहले पैसे नहीं देने पड़ते। ₹2,499 देने के बाद ठग और पैसे मांगेंगे।',
      mr: 'तुम्ही भाग न घेतलेली स्पर्धा तुम्ही जिंकू शकत नाही आणि खऱ्या बक्षिसासाठी आधी पैसे भरावे लागत नाहीत. ₹२,४९९ भरल्यानंतर फसवणूक करणारे आणखी पैसे मागतात.',
    },
    warningSigns: {
      en: [
        'Unexpected prize from a contest you never joined',
        'Demands an upfront "GST / processing fee" via UPI',
        'Sent from an unknown foreign WhatsApp number',
      ],
      hi: [
        'बिना हिस्सा लिए अचानक बड़ा इनाम निकलने का दावा',
        'इनाम के बदले पहले से "GST या प्रोसेसिंग फीस" मांगना',
        'अनजान विदेशी नंबर से व्हाट्सएप संदेश आना',
      ],
      mr: [
        'सहभाग न घेताच अचानक मोठे बक्षीस लागल्याचा दावा',
        'बक्षिसासाठी आधी "GST किंवा प्रोसेसिंग फी" मागणे',
        'अनोळखी परदेशी WhatsApp नंबरवरून मेसेज येणे',
      ],
    },
    recommendedAction: {
      en: 'Never pay fees to receive a prize and never send ID photos to unknown numbers. Block the contact immediately.',
      hi: 'इनाम पाने के लिए कभी कोई शुल्क न दें और अनजान नंबर पर पहचान पत्र न भेजें। नंबर तुरंत ब्लॉक करें।',
      mr: 'बक्षीस मिळवण्यासाठी कधीही फी भरू नका आणि अनोळखी नंबरवर कागदपत्रांचे फोटो पाठवू नका. नंबर लगेच ब्लॉक करा.',
    },
  },
  {
    id: 'sim-screenshare',
    channel: 'Phone Call',
    senderLabel: {
      en: 'Fake Pension / Electricity Support',
      hi: 'नकली पेंशन / बिजली सहायता कॉल',
      mr: 'बनावट पेन्शन / वीज बिल मदत कॉल',
    },
    title: {
      en: 'Scenario 4: Support Caller Asking to Install Screen-Sharing App',
      hi: 'परिस्थिति 4: स्क्रीन-शेयरिंग ऐप डाउनलोड कराने वाला फर्जी कॉल',
      mr: 'प्रसंग ४: स्क्रीन-शेअरिंग अ‍ॅप डाउनलोड करायला सांगणारा बनावट कॉल',
    },
    messageBody: {
      en: '"Sir/Madam, your electricity bill refund of ₹1,450 is stuck. Please download AnyDesk from the Play Store and tell me the 9-digit code shown on your screen so we can deposit the refund."',
      hi: '"सर/मैडम, आपका ₹1,450 का बिजली बिल रिफंड अटका हुआ है। कृपया Play Store से AnyDesk डाउनलोड करें और स्क्रीन पर दिख रहा 9 अंकों का कोड बताएं ताकि हम पैसे भेज सकें।"',
      mr: '"सर/मॅडम, तुमचा ₹१,४५० चा वीज बिल रिफंड अडकला आहे. कृपया Play Store वरून AnyDesk डाउनलोड करा आणि स्क्रीनवरील ९ अंकी कोड सांगा."',
    },
    options: [
      {
        id: 'opt-install-anydesk',
        label: {
          en: 'Download AnyDesk and share the 9-digit code to get the refund',
          hi: 'रिफंड पाने के लिए AnyDesk डाउनलोड करें और 9 अंकों का कोड बताएं',
          mr: 'रिफंड मिळवण्यासाठी AnyDesk डाउनलोड करून ९ अंकी कोड सांगा',
        },
      },
      {
        id: 'opt-refuse-hangup',
        label: {
          en: 'Refuse to install any remote app and hang up immediately',
          hi: 'कोई भी रिमोट ऐप इंस्टॉल करने से मना करें और तुरंत फोन काट दें',
          mr: 'कोणतेही रिमोट अ‍ॅप इन्स्टॉल करण्यास नकार द्या आणि लगेच फोन ठेवा',
        },
      },
      {
        id: 'opt-open-bank-app',
        label: {
          en: 'Open my banking app while staying on the call with them',
          hi: 'कॉल पर रहते हुए अपना बैंकिंग ऐप खोलें',
          mr: 'कॉल चालू असतानाच माझे बँकिंग अ‍ॅप उघडा',
        },
      },
    ],
    correctOptionId: 'opt-refuse-hangup',
    explanation: {
      en: 'Apps like AnyDesk or TeamViewer let a stranger see everything on your phone screen — including your OTPs and banking apps. Legitimate refunds never require remote screen sharing.',
      hi: 'AnyDesk या TeamViewer जैसे ऐप से सामने वाला आपके फोन की पूरी स्क्रीन देख सकता है — जिसमें आपके OTP और बैंक ऐप भी शामिल हैं। असली रिफंड के लिए कभी ऐसे ऐप नहीं लगते।',
      mr: 'AnyDesk किंवा TeamViewer सारख्या अ‍ॅपमुळे अनोळखी व्यक्तीला तुमच्या फोनची संपूर्ण स्क्रीन दिसते — ज्यात तुमचे OTP आणि बँक अ‍ॅपही असतात. खऱ्या रिफंडसाठी असे अ‍ॅप कधीही लागत नाही.',
    },
    warningSigns: {
      en: [
        'Caller asks you to install a remote screen-sharing app (AnyDesk / TeamViewer / QuickSupport)',
        'Uses a small "refund" lure to make you lower your guard',
        'Asks for the 9-digit screen-control code',
      ],
      hi: [
        'रिमोट स्क्रीन-शेयरिंग ऐप (AnyDesk / TeamViewer) डाउनलोड करने को कहना',
        'छोटे से रिफंड का लालच देकर भरोसा जीतना',
        'स्क्रीन नियंत्रण के लिए 9 अंकों का कोड मांगना',
      ],
      mr: [
        'स्क्रीन-शेअरिंग अ‍ॅप (AnyDesk / TeamViewer) इन्स्टॉल करायला सांगणे',
        'लहानशा रिफंडचे आमिष दाखवून विश्वास संपादन करणे',
        'स्क्रीन नियंत्रणासाठी ९ अंकी कोड मागणे',
      ],
    },
    recommendedAction: {
      en: 'Never install screen-sharing apps on a stranger’s request. Hang up and check bill status only on your official utility portal.',
      hi: 'किसी अनजान कॉलर के कहने पर कभी स्क्रीन-शेयरिंग ऐप इंस्टॉल न करें। फोन काटें और केवल आधिकारिक बिल पोर्टल पर जांच करें।',
      mr: 'अनोळखी व्यक्तीच्या सांगण्यावरून कधीही स्क्रीन-शेअरिंग अ‍ॅप इन्स्टॉल करू नका. फोन ठेवा आणि अधिकृत पोर्टलवरच खात्री करा.',
    },
  },
  {
    id: 'sim-shortlink-bill',
    channel: 'SMS',
    senderLabel: {
      en: '+91 84XXXXXX71',
      hi: '+91 84XXXXXX71',
      mr: '+91 84XXXXXX71',
    },
    title: {
      en: 'Scenario 5: Power Disconnection Warning with Short Link',
      hi: 'परिस्थिति 5: बिजली कटने की चेतावनी और छोटा लिंक',
      mr: 'प्रसंग ५: वीज कनेक्शन तोडण्याची धमकी आणि शॉर्ट लिंक',
    },
    messageBody: {
      en: 'ALERT: Your home electricity connection will be disconnected tonight at 10:30 PM because last month bill was not updated. Pay ₹12 immediately via http://bit.ly/pay-bill-now24 to avoid cut.',
      hi: 'चेतावनी: पिछले महीने का बिल अपडेट न होने के कारण आज रात 10:30 बजे आपकी बिजली काट दी जाएगी। कटौती से बचने के लिए अभी http://bit.ly/pay-bill-now24 पर ₹12 का भुगतान करें।',
      mr: 'सावधान: मागील महिन्याचे बिल अपडेट नसल्यामुळे आज रात्री १०:३० वाजता तुमची वीज जोडणी तोडली जाईल. वीज वाचवण्यासाठी लगेच http://bit.ly/pay-bill-now24 वर ₹१२ भरा.',
    },
    options: [
      {
        id: 'opt-pay-12',
        label: {
          en: 'Tap the bit.ly link and pay ₹12 quickly since it is a tiny amount',
          hi: '₹12 बहुत छोटी रकम है, इसलिए जल्दी से bit.ly लिंक पर भुगतान कर दें',
          mr: '₹१२ ही खूप छोटी रक्कम आहे, म्हणून लगेच bit.ly लिंकवर पैसे भरा',
        },
      },
      {
        id: 'opt-check-official',
        label: {
          en: 'Do not tap the shortened link; check your official electricity bill receipt or call a family member',
          hi: 'छोटे लिंक पर क्लिक न करें; अपनी असली बिजली रसीद जांचें या परिवार के किसी सदस्य से पूछें',
          mr: 'शॉर्ट लिंकवर क्लिक करू नका; तुमचे अधिकृत वीज बिल तपासा किंवा कुटुंबातील सदस्याशी बोला',
        },
      },
      {
        id: 'opt-reply-meter',
        label: {
          en: 'Reply with your consumer number and bank card details',
          hi: 'अपना कंज्यूमर नंबर और बैंक कार्ड विवरण भेजकर जवाब दें',
          mr: 'तुमचा ग्राहक क्रमांक आणि बँक कार्डची माहिती पाठवून उत्तर द्या',
        },
      },
    ],
    correctOptionId: 'opt-check-official',
    explanation: {
      en: 'Even a ₹12 payment link is a classic trap! The fake page steals your card/UPI credentials or installs malware. Shortened links hide the real destination website.',
      hi: '₹12 का यह लिंक भी एक बड़ा जाल है! नकली पेज आपके कार्ड या UPI की जानकारी चुरा लेता है। छोटे लिंक असली वेबसाइट का पता छिपाने के लिए उपयोग किए जाते हैं।',
      mr: '₹१२ भरण्याची ही लिंकसुद्धा एक मोठा सापळा आहे! बनावट वेबसाइट तुमच्या कार्ड किंवा UPI ची माहिती चोरते. खरा पत्ता लपवण्यासाठी शॉर्ट लिंक वापरले जातात.',
    },
    warningSigns: {
      en: [
        'Sent from a personal 10-digit mobile number instead of an official electricity board ID',
        'Uses a shortened "bit.ly" URL that hides the true destination',
        'Threatens sudden disconnection tonight unless you pay a tiny amount right away',
      ],
      hi: [
        'आधिकारिक बिजली बोर्ड के बजाय एक सामान्य 10 अंकों के नंबर से आना',
        'असली पता छिपाने वाला छोटा "bit.ly" लिंक',
        'अचानक रात को बिजली काटने की धमकी देकर तुरंत छोटे भुगतान का दबाव',
      ],
      mr: [
        'अधिकृत वीज मंडळाऐवजी सामान्य १० अंकी नंबरवरून मेसेज येणे',
        'खरी वेबसाइट लपवणारी "bit.ly" शॉर्ट लिंक',
        'आज रात्री वीज तोडण्याची भीती दाखवून लगेच छोटी रक्कम भरण्यास सांगणे',
      ],
    },
    recommendedAction: {
      en: 'Never tap shortened payment links in unexpected SMS messages. Check your bill using your official paper bill or verified utility office.',
      hi: 'अनचाहे SMS में दिए गए छोटे भुगतान लिंक पर कभी क्लिक न करें। हमेशा अपने असली बिल या आधिकारिक कार्यालय से जांच करें।',
      mr: 'अनोळखी SMS मधील शॉर्ट पेमेंट लिंकवर कधीही क्लिक करू नका. नेहमी तुमच्या अधिकृत बिलावर किंवा कार्यालयात खात्री करा.',
    },
  },
];
