/**
 * Robust Devanagari to Roman (Hinglish) transliteration utility.
 * Guarantees that any accidental Devanagari characters in auto/hinglish mode
 * are converted cleanly to phonetic English alphabet (A-Z).
 */

const VOWEL_MAP: Record<string, string> = {
  'अ': 'a',
  'आ': 'aa',
  'इ': 'i',
  'ई': 'ee',
  'उ': 'u',
  'ऊ': 'oo',
  'ऋ': 'ri',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au',
  'अं': 'an',
  'अः': 'ah',
};

const MATRA_MAP: Record<string, string> = {
  'ा': 'a',
  'ि': 'i',
  'ी': 'ee',
  'ु': 'u',
  'ू': 'oo',
  'ृ': 'ri',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
  'ं': 'n',
  'ँ': 'n',
  'ः': 'h',
};

const CONSONANT_MAP: Record<string, string> = {
  'क': 'k',
  'ख': 'kh',
  'ग': 'g',
  'घ': 'gh',
  'ङ': 'ng',
  'च': 'ch',
  'छ': 'chh',
  'ज': 'j',
  'झ': 'jh',
  'ञ': 'ny',
  'ट': 't',
  'ठ': 'th',
  'ड': 'd',
  'ढ': 'dh',
  'ण': 'n',
  'त': 't',
  'थ': 'th',
  'द': 'd',
  'ध': 'dh',
  'न': 'n',
  'प': 'p',
  'फ': 'ph',
  'ब': 'b',
  'भ': 'bh',
  'म': 'm',
  'य': 'y',
  'र': 'r',
  'ल': 'l',
  'व': 'v',
  'श': 'sh',
  'ष': 'sh',
  'स': 's',
  'ह': 'h',
  'क़': 'q',
  'ख़': 'kh',
  'ग़': 'gh',
  'ज़': 'z',
  'ड़': 'r',
  'ढ़': 'rh',
  'फ़': 'f',
  'क्ष': 'ksh',
  'त्र': 'tr',
  'ज्ञ': 'gya',
};

// Common whole-word overrides for natural-sounding social Hinglish
const WORD_OVERRIDES: Record<string, string> = {
  'है': 'hai',
  'हैं': 'hain',
  'हो': 'ho',
  'हु': 'hu',
  'हूँ': 'hoon',
  'था': 'tha',
  'थी': 'thi',
  'थे': 'the',
  'का': 'ka',
  'की': 'ki',
  'के': 'ke',
  'को': 'ko',
  'में': 'mein',
  'से': 'se',
  'पर': 'par',
  'और': 'aur',
  'या': 'ya',
  'तो': 'toh',
  'भी': 'bhi',
  'ही': 'hi',
  'ने': 'ne',
  'यह': 'yeh',
  'ये': 'ye',
  'वह': 'woh',
  'वो': 'wo',
  'क्या': 'kya',
  'क्यों': 'kyun',
  'कहाँ': 'kahan',
  'कैसे': 'kaise',
  'कब': 'kab',
  'जब': 'jab',
  'अब': 'ab',
  'तब': 'tab',
  'सब': 'sab',
  'सबसे': 'sabse',
  'मेरा': 'mera',
  'मेरी': 'meri',
  'मेरे': 'mere',
  'तुम': 'tum',
  'तुम्हारा': 'tumhara',
  'तुम्हारी': 'tumhari',
  'तुम्हारे': 'tumhare',
  'आप': 'aap',
  'आपका': 'aapka',
  'आपकी': 'aapki',
  'आपके': 'aapke',
  'हम': 'hum',
  'हमारा': 'hamara',
  'हमारी': 'hamari',
  'हमारे': 'hamare',
  'बहुत': 'bahut',
  'नहीं': 'nahi',
  'ना': 'na',
  'कर': 'kar',
  'करना': 'karna',
  'करते': 'karte',
  'करती': 'karti',
  'करता': 'karta',
  'सकते': 'sakte',
  'सकती': 'sakti',
  'सकता': 'sakta',
  'सकूं': 'sakun',
  'रहा': 'raha',
  'रही': 'rahi',
  'रहे': 'rahe',
  'गया': 'gaya',
  'गई': 'gayi',
  'गए': 'gaye',
  'जाता': 'jaata',
  'जाती': 'jaati',
  'जाते': 'jaate',
  'दी': 'di',
  'दिया': 'diya',
  'दिए': 'diye',
  'ले': 'le',
  'लिया': 'liya',
  'लिए': 'liye',
  'बात': 'baat',
  'काम': 'kaam',
  'दिन': 'din',
  'रात': 'raat',
  'समय': 'samay',
  'लोग': 'log',
  'अगर': 'agar',
  'लेकिन': 'lekin',
  'सिर्फ': 'sirf',
  'सिर्फ़': 'sirf',
  'यहाँ': 'yahan',
  'वहाँ': 'wahan',
  'डैशबोर्ड': 'dashboard',
  'वर्कफ़्लो': 'workflow',
  'वर्कफ्लो': 'workflow',
};

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

/**
 * Checks whether a string contains any Devanagari characters.
 */
export function hasDevanagari(text: string): boolean {
  return DEVANAGARI_REGEX.test(text);
}

/**
 * Transliterates a single Devanagari word into phonetic Latin Hinglish.
 */
function transliterateDevanagariWord(word: string): string {
  // Strip punctuation for lookup
  const cleanWord = word.trim().replace(/[.,!?;:()"'।]/g, '');
  if (WORD_OVERRIDES[cleanWord]) {
    return word.replace(cleanWord, WORD_OVERRIDES[cleanWord]);
  }

  let result = '';
  const len = word.length;
  let i = 0;

  while (i < len) {
    const ch = word[i];
    const next = i + 1 < len ? word[i + 1] : '';

    // Check two-char compounds with nukta like क़, ज़, फ़, ड़
    const compound = ch + next;
    if (CONSONANT_MAP[compound]) {
      result += CONSONANT_MAP[compound];
      i += 2;
      // If next is halant, skip inherent vowel
      if (i < len && word[i] === '्') {
        i++;
      } else if (i < len && MATRA_MAP[word[i]]) {
        result += MATRA_MAP[word[i]];
        i++;
      } else if (i < len && CONSONANT_MAP[word[i]]) {
        result += 'a';
      }
      continue;
    }

    if (VOWEL_MAP[ch]) {
      result += VOWEL_MAP[ch];
      i++;
      continue;
    }

    if (CONSONANT_MAP[ch]) {
      result += CONSONANT_MAP[ch];
      i++;
      // If followed by halant, no vowel
      if (i < len && word[i] === '्') {
        i++;
      } else if (i < len && MATRA_MAP[word[i]]) {
        result += MATRA_MAP[word[i]];
        i++;
      } else if (i < len && (CONSONANT_MAP[word[i]] || VOWEL_MAP[word[i]])) {
        result += 'a';
      }
      continue;
    }

    if (MATRA_MAP[ch]) {
      result += MATRA_MAP[ch];
      i++;
      continue;
    }

    // Pass through punctuation, numbers, Latin characters
    if (ch === '।') {
      result += '.';
    } else if (ch !== '्') {
      result += ch;
    }
    i++;
  }

  return result;
}

/**
 * Ensures text is converted to clean Hinglish (Latin alphabet)
 * if it contains Devanagari characters.
 */
export function sanitizeToHinglish(text: string): string {
  if (!text || !hasDevanagari(text)) return text;

  // Split into words preserving whitespace and punctuation
  return text
    .split(/(\s+)/)
    .map(token => {
      if (!hasDevanagari(token)) return token;
      return transliterateDevanagariWord(token);
    })
    .join('');
}
