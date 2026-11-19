import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  PhoneCall,
  PhoneOff,
  ShieldAlert,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { pickLocalized, tr } from '../i18n/translations';
import { updateUserPrivateProfile } from '../services/firestoreData';
import { speakText, stopSpeech } from '../services/voice';
import { AuthUser, LangCode } from '../types';

interface EmergencyPageProps {
  lang: LangCode;
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
}

const EMERGENCY_STEPS: Record<string, Array<{ num: string; title: string; detail: string }>> = {
  en: [
    {
      num: '01',
      title: 'Call National Cybercrime Helpline 1930 Immediately',
      detail: 'Dial 1930 as soon as possible (ideally within the golden hour) to report unauthorized bank or UPI transfers.',
    },
    {
      num: '02',
      title: 'Freeze Your Bank Account, Card, or UPI',
      detail: 'Call your bank’s official customer-care number printed on your debit card or passbook and ask them to block your card/UPI.',
    },
    {
      num: '03',
      title: 'File an Official Complaint on cybercrime.gov.in',
      detail: 'Submit the transaction reference number, screenshots of SMS/WhatsApp chats, and caller phone number on the official portal.',
    },
    {
      num: '04',
      title: 'Do Not Delete Messages or Call Logs',
      detail: 'Keep SMS screenshots, bank transaction IDs, and unknown caller numbers safe as evidence for police and bank verification.',
    },
    {
      num: '05',
      title: 'Inform a Trusted Family Member',
      detail: 'Tell your son, daughter, or trusted relative right away so they can help you contact the bank calmly.',
    },
  ],
  kn: [
    {
      num: '01',
      title: 'ತಕ್ಷಣ ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಕ್ರೈಮ್ ಸಹಾಯವಾಣಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ',
      detail: 'ಅನಧಿಕೃತ ಬ್ಯಾಂಕ್ ಅಥವಾ UPI ಹಣ ವರ್ಗಾವಣೆಯನ್ನು ವರದಿ ಮಾಡಲು ಸಾಧ್ಯವಾದಷ್ಟು ಬೇಗ 1930 ಗೆ ಕರೆ ಮಾಡಿ.',
    },
    {
      num: '02',
      title: 'ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ, ಕಾರ್ಡ್ ಅಥವಾ UPI ಬ್ಲಾಕ್ ಮಾಡಿ',
      detail: 'ನಿಮ್ಮ ಡೆಬಿಟ್ ಕಾರ್ಡ್ ಅಥವಾ ಪಾಸ್‌ಬುಕ್‌ನಲ್ಲಿರುವ ಅಧಿಕೃತ ಬ್ಯಾಂಕ್ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ ಕಾರ್ಡ್/UPI ನಿಲ್ಲಿಸಿ.',
    },
    {
      num: '03',
      title: 'cybercrime.gov.in ನಲ್ಲಿ ಅಧಿಕೃತ ದೂರು ದಾಖಲಿಸಿ',
      detail: 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ವಹಿವಾಟು ಸಂಖ್ಯೆ, SMS/WhatsApp ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಮತ್ತು ಕರೆ ಸಂಖ್ಯೆಯನ್ನು ಸಲ್ಲಿಸಿ.',
    },
    {
      num: '04',
      title: 'ಸಂದೇಶಗಳು ಮತ್ತು ಕರೆ ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಬೇಡಿ',
      detail: 'ಪೊಲೀಸ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪರಿಶೀಲನೆಗಾಗಿ SMS ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳು ಮತ್ತು ವಹಿವಾಟು ID ಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿಡಿ.',
    },
    {
      num: '05',
      title: 'ಕುಟುಂಬದ ವಿಶ್ವಾಸಾರ್ಹ ಸದಸ್ಯರಿಗೆ ತಿಳಿಸಿ',
      detail: 'ನಿಮ್ಮ ಮಗ, ಮಗಳು ಅಥವಾ ವಿಶ್ವಾಸಾರ್ಹ ಸಂಬಂಧಿಕರಿಗೆ ತಕ್ಷಣ ತಿಳಿಸಿ.',
    },
  ],
  hi: [
    {
      num: '01',
      title: 'तुरंत राष्ट्रीय साइबर अपराध हेल्पलाइन 1930 पर कॉल करें',
      detail: 'बिना अनुमति बैंक या UPI से पैसे कटने पर जितनी जल्दी हो सके 1930 पर कॉल करके शिकायत दर्ज कराएं।',
    },
    {
      num: '02',
      title: 'अपना बैंक खाता, कार्ड या UPI ब्लॉक कराएं',
      detail: 'अपने डेबिट कार्ड या पासबुक पर छपे आधिकारिक बैंक नंबर पर कॉल करके तुरंत कार्ड और नेटबैंकिंग बंद कराएं।',
    },
    {
      num: '03',
      title: 'cybercrime.gov.in पर आधिकारिक रिपोर्ट दर्ज करें',
      detail: 'आधिकारिक सरकारी पोर्टल पर लेनदेन नंबर, SMS/व्हाट्सएप स्क्रीनशॉट और संदिग्ध नंबर की जानकारी दर्ज करें।',
    },
    {
      num: '04',
      title: 'संदेश और कॉल रिकॉर्ड न हटाएं',
      detail: 'बैंक और पुलिस जांच के लिए SMS के स्क्रीनशॉट, ट्रांजेक्शन ID और कॉलर नंबर सुरक्षित रखें।',
    },
    {
      num: '05',
      title: 'परिवार के किसी विश्वसनीय सदस्य को तुरंत बताएं',
      detail: 'अपने बेटे, बेटी या विश्वसनीय रिश्तेदार को तुरंत जानकारी दें ताकि वे बैंक से बात करने में आपकी मदद कर सकें।',
    },
  ],
  mr: [
    {
      num: '01',
      title: 'तात्काळ राष्ट्रीय सायबर गुन्हे हेल्पलाइन 1930 वर कॉल करा',
      detail: 'परवानगीशिवाय बँक किंवा UPI मधून पैसे गेल्यास लवकरात लवकर 1930 वर कॉल करून तक्रार नोंदवा.',
    },
    {
      num: '02',
      title: 'तुमचे बँक खाते, कार्ड किंवा UPI ब्लॉक करा',
      detail: 'डेबिट कार्ड किंवा पासबुकवर दिलेल्या अधिकृत बँक नंबरवर कॉल करून लगेच कार्ड आणि UPI सेवा बंद करा.',
    },
    {
      num: '03',
      title: 'cybercrime.gov.in वर अधिकृत तक्रार नोंदवा',
      detail: 'अधिकृत सरकारी पोर्टलवर व्यवहार क्रमांक, SMS/WhatsApp स्क्रीनशॉट आणि संशयास्पद नंबरची माहिती भरा.',
    },
    {
      num: '04',
      title: 'मेसेज आणि कॉल लॉग डिलीट करू नका',
      detail: 'बँक आणि पोलिस तपासासाठी SMS चे स्क्रीनशॉट, व्यवहार क्रमांक आणि अनोळखी नंबर जपून ठेवा.',
    },
    {
      num: '05',
      title: 'कुटुंबातील विश्वासू व्यक्तीला लगेच कळवा',
      detail: 'तुमचा मुलगा, मुलगी किंवा जवळच्या नातेवाईकाला लगेच सांगा जेणेकरून ते बँकेशी बोलण्यास मदत करू शकतील.',
    },
  ],
};

const GUIDES: Record<string, Array<{ title: string; body: string; icon: typeof ShieldCheck }>> = {
  en: [
    {
      title: 'Bank & UPI Safety',
      body: 'Use only official banking apps. Never scan a QR code or enter your UPI PIN to receive money — PIN is only for sending money.',
      icon: ShieldCheck,
    },
    {
      title: 'OTP Safety Rule',
      body: 'An OTP is a private key for your money. No genuine bank officer, RBI staff, or police caller will ever ask for your OTP, CVV, or ATM PIN.',
      icon: Lock,
    },
    {
      title: 'Password Safety',
      body: 'Use a unique password of 8+ characters with letters and numbers. Never write your banking PIN inside phone notes or share it on WhatsApp.',
      icon: KeyRound,
    },
    {
      title: 'Fake Call Awareness',
      body: 'Hang up immediately if a caller threatens "digital arrest", KYC block, or asks you to install AnyDesk/TeamViewer.',
      icon: PhoneOff,
    },
  ],
  kn: [
    {
      title: 'ಬ್ಯಾಂಕ್ ಮತ್ತು UPI ಸುರಕ್ಷತೆ',
      body: 'ಅಧಿಕೃತ ಬ್ಯಾಂಕ್ ಅಪ್ಲಿಕೇಶನ್‌ಗಳನ್ನು ಮಾತ್ರ ಬಳಸಿ. ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಡಿ ಅಥವಾ UPI ಪಿನ್ ಹಾಕಬೇಡಿ.',
      icon: ShieldCheck,
    },
    {
      title: 'OTP ಸುರಕ್ಷತಾ ನಿಯಮ',
      body: 'OTP ನಿಮ್ಮ ಹಣದ ಖಾಸಗಿ ಕೀಲಿಕೈಯಾಗಿದೆ. ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಅಧಿಕಾರಿ ಅಥವಾ ಪೊಲೀಸರು ಎಂದಿಗೂ OTP, CVV ಅಥವಾ ATM ಪಿನ್ ಕೇಳುವುದಿಲ್ಲ.',
      icon: Lock,
    },
    {
      title: 'ಪಾಸ್‌ವರ್ಡ್ ಸುರಕ್ಷತೆ',
      body: 'ಅಕ್ಷರ ಮತ್ತು ಸಂಖ್ಯೆಗಳಿರುವ 8+ ಅಕ್ಷರಗಳ ಬಲವಾದ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ. ಬ್ಯಾಂಕ್ ಪಿನ್ ಅನ್ನು WhatsApp ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.',
      icon: KeyRound,
    },
    {
      title: 'ನಕಲಿ ಕರೆ ಜಾಗೃತಿ',
      body: '"ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್" ಅಥವಾ KYC ಬ್ಲಾಕ್ ಬೆದರಿಕೆ ಹಾಕಿದರೆ ಅಥವಾ AnyDesk ಅಳವಡಿಸಲು ಹೇಳಿದರೆ ತಕ್ಷಣ ಕರೆ ಕಡಿತಗೊಳಿಸಿ.',
      icon: PhoneOff,
    },
  ],
  hi: [
    {
      title: 'बैंक और UPI सुरक्षा',
      body: 'केवल आधिकारिक बैंक ऐप उपयोग करें। पैसे प्राप्त करने के लिए कभी भी QR कोड स्कैन न करें और न ही UPI पिन डालें।',
      icon: ShieldCheck,
    },
    {
      title: 'OTP सुरक्षा नियम',
      body: 'OTP आपके पैसों की निजी चाबी है। कोई भी असली बैंक अधिकारी, RBI या पुलिस कभी भी आपका OTP, CVV या ATM पिन नहीं मांगता।',
      icon: Lock,
    },
    {
      title: 'पासवर्ड सुरक्षा',
      body: 'अक्षरों और अंकों वाला 8+ अक्षरों का मजबूत पासवर्ड रखें। अपना बैंकिंग पिन फोन के नोट्स या व्हाट्सएप में कभी न लिखें।',
      icon: KeyRound,
    },
    {
      title: 'नकली कॉल से सावधानी',
      body: 'यदि कोई कॉलर "डिजिटल अरेस्ट", KYC ब्लॉक की धमकी दे या AnyDesk/TeamViewer डाउनलोड करने को कहे, तो तुरंत कॉल काट दें।',
      icon: PhoneOff,
    },
  ],
  mr: [
    {
      title: 'बँक आणि UPI सुरक्षा',
      body: 'फक्त अधिकृत बँक अ‍ॅप वापरा. पैसे मिळवण्यासाठी कधीही QR कोड स्कॅन करू नका किंवा UPI पिन टाकू नका.',
      icon: ShieldCheck,
    },
    {
      title: 'OTP सुरक्षा नियम',
      body: 'OTP ही तुमच्या पैशांची खाजगी चावी आहे. कोणताही खरा बँक अधिकारी, RBI किंवा पोलिस कधीही तुमचा OTP, CVV किंवा ATM पिन मागत नाही.',
      icon: Lock,
    },
    {
      title: 'पासवर्ड सुरक्षा',
      body: 'अक्षरे आणि अंक असलेला किमान ८ अक्षरांचा मजबूत पासवर्ड ठेवा. बँकिंग पिन कधीही फोनच्या नोट्समध्ये किंवा WhatsApp वर लिहू नका.',
      icon: KeyRound,
    },
    {
      title: 'बनावट कॉल्सपासून सावधगिरी',
      body: 'कोणी कॉलर "डिजिटल अरेस्ट" किंवा KYC बंद करण्याची भीती दाखवत असेल किंवा AnyDesk डाउनलोड करायला सांगत असेल, तर लगेच कॉल बंद करा.',
      icon: PhoneOff,
    },
  ],
};

export function EmergencyPage({ lang, user, onUserUpdated }: EmergencyPageProps) {
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [recoveryNote, setRecoveryNote] = useState(user.recoveryNote || '');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedMsg, setNoteSavedMsg] = useState('');

  useEffect(() => {
    setRecoveryNote(user.recoveryNote || '');
    return () => stopSpeech();
  }, [user]);

  const handleCopyPortal = async () => {
    try {
      await navigator.clipboard.writeText('https://cybercrime.gov.in/');
      setCopiedPortal(true);
      setTimeout(() => setCopiedPortal(false), 2500);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const handleSaveRecoveryNote = async (e: FormEvent) => {
    e.preventDefault();
    setSavingNote(true);
    setNoteSavedMsg('');
    try {
      const trimmed = recoveryNote.trim();
      await updateUserPrivateProfile(user.uid, {
        email: user.email,
        mobileNumber: user.mobileNumber,
        emergencyContactNote: trimmed,
      });
      onUserUpdated({ ...user, recoveryNote: trimmed });
      setNoteSavedMsg('Private emergency family reminder saved.');
    } finally {
      setSavingNote(false);
    }
  };

  const steps = pickLocalized(EMERGENCY_STEPS, lang) || EMERGENCY_STEPS.en;
  const guides = pickLocalized(GUIDES, lang) || GUIDES.en;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">{tr(lang, 'cardEmergencyTitle')}</h1>
        <p className="text-base text-slate-600">{tr(lang, 'cardEmergencyDesc')}</p>
      </div>

      {/* Prominent Emergency Action Banner */}
      <section className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-700 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-rose-900">India Official Cybercrime Emergency Support</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                Helpline: 1930
              </h2>
              <p className="text-base text-slate-700">
                Available 24×7 across India for reporting financial cyber fraud.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              speakText(
                steps.map((s) => `${s.title}. ${s.detail}`).join(' '),
                lang,
                user.speechRate || 0.84
              )
            }
            className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            <span>Listen to Emergency Steps</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href="tel:1930"
            className="inline-flex items-center gap-2.5 px-6 py-4 text-lg font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors"
          >
            <PhoneCall className="w-5 h-5" aria-hidden="true" />
            <span>Call Helpline 1930</span>
          </a>

          <a
            href="https://cybercrime.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-4 text-base font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
          >
            <span>Open cybercrime.gov.in</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={handleCopyPortal}
            className="inline-flex items-center gap-2 px-4 py-4 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer"
          >
            {copiedPortal ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPortal ? 'Portal URL Copied' : 'Copy Portal Link'}</span>
          </button>
        </div>
      </section>

      {/* 5 Immediate Steps */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Steps to Take After Suspected Financial Fraud</h2>
        <div className="divide-y divide-slate-200">
          {steps.map((step) => (
            <div key={step.num} className="py-5 first:pt-0 last:pb-0 flex items-start gap-5">
              <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums shrink-0 pt-0.5">
                {step.num}
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="text-base text-slate-600 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Safety Guidance Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {guides.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.title} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{g.title}</h3>
              </div>
              <p className="text-base text-slate-600 leading-relaxed">{g.body}</p>
            </div>
          );
        })}
      </section>

      {/* Private Family Emergency Reminder */}
      <section className="bg-sky-50/70 border border-sky-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Trusted Family Contact Reminder (Private)</h2>
          <p className="text-sm text-slate-700">
            Save the name and phone number of a trusted relative or bank branch to call in an emergency. Never store bank PINs, passwords, or OTPs here.
          </p>
        </div>
        <form onSubmit={handleSaveRecoveryNote} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={recoveryNote}
            onChange={(e) => setRecoveryNote(e.target.value)}
            maxLength={250}
            placeholder="e.g. Call Rohan Sharma (+91-98XXX-XXXXX) before approving any bank request"
            className="flex-1 px-4 py-3 text-base bg-white border border-slate-300 rounded-xl focus:border-sky-700"
          />
          <button
            type="submit"
            disabled={savingNote}
            className="px-6 py-3 text-base font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-xl cursor-pointer whitespace-nowrap"
          >
            {savingNote ? 'Saving...' : 'Save Reminder'}
          </button>
        </form>
        {noteSavedMsg && <p className="text-sm font-semibold text-emerald-800">{noteSavedMsg}</p>}
      </section>
    </div>
  );
}
